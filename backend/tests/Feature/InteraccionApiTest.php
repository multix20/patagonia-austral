<?php

namespace Tests\Feature;

use App\Models\Interaccion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre la analítica de uso. Lo que importa probar es que el rollup ACUMULA en
// una sola fila por (tipo, referencia, día): esa es la propiedad que hace que la
// tabla no crezca con el tráfico, y la única razón por la que esto cabe en el
// plan gratis.
class InteraccionApiTest extends TestCase
{
    use RefreshDatabase;

    /** Un lote suma, y reenviarlo vuelve a sumar sobre la MISMA fila. */
    public function test_acumula_en_una_fila_por_tipo_referencia_y_dia(): void
    {
        $lote = ['eventos' => [
            ['tipo' => 'ficha', 'ref' => '12', 'n' => 3],
            ['tipo' => 'ficha', 'ref' => '13', 'n' => 1],
            ['tipo' => 'app_abierta', 'ref' => null, 'n' => 2],
        ]];

        $this->postJson('/api/interacciones', $lote)->assertNoContent();
        $this->postJson('/api/interacciones', $lote)->assertNoContent();

        // Dos envíos, tres combinaciones: siguen siendo tres filas.
        $this->assertSame(3, Interaccion::count());
        $this->assertSame(6, Interaccion::where('tipo', 'ficha')->where('referencia', '12')->value('cantidad'));
        $this->assertSame(2, Interaccion::where('tipo', 'ficha')->where('referencia', '13')->value('cantidad'));

        // Sin referencia se guarda como cadena vacía, NO como NULL: en SQL NULL
        // nunca es igual a NULL, así que con NULL el índice único no impediría
        // filas repetidas y 'app_abierta' se duplicaría en cada envío.
        $apertura = Interaccion::where('tipo', 'app_abierta')->get();
        $this->assertCount(1, $apertura);
        $this->assertSame('', $apertura->first()->referencia);
        $this->assertSame(4, $apertura->first()->cantidad);
    }

    /** El día lo pone el servidor: el cliente no puede cargar el contador a otra fecha. */
    public function test_el_dia_lo_pone_el_servidor(): void
    {
        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'llamar', 'ref' => '7', 'n' => 1, 'dia' => '2035-01-01'],
        ]])->assertNoContent();

        $this->assertSame(
            now()->toDateString(),
            Interaccion::first()->dia->toDateString()
        );
    }

    /** Tipo desconocido, cantidad absurda o lote gigante: 422 y nada escrito. */
    public function test_valida_la_entrada(): void
    {
        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'lo-que-sea', 'ref' => 'x', 'n' => 1],
        ]])->assertStatus(422);

        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'ficha', 'ref' => '1', 'n' => Interaccion::MAX_POR_EVENTO + 1],
        ]])->assertStatus(422);

        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'ficha', 'ref' => '1', 'n' => 0],
        ]])->assertStatus(422);

        $this->postJson('/api/interacciones', [
            'eventos' => array_fill(0, 101, ['tipo' => 'ficha', 'ref' => '1', 'n' => 1]),
        ])->assertStatus(422);

        $this->assertSame(0, Interaccion::count());
    }

    /**
     * El origen se guarda CANONIZADO: la zona horaria se reduce a país y la
     * etiqueta de idioma a su forma corta.
     *
     * No es cosmética. La referencia de estos dos tipos es lo único que llega
     * como texto libre del navegador a un endpoint que escribe sin login: si se
     * guardara tal cual, cualquiera podría inventar variantes sin fin y la tabla
     * dejaría de estar acotada por el catálogo, que es la propiedad por la que
     * esto es un rollup y cabe en el plan gratis.
     */
    public function test_el_origen_se_guarda_como_pais_y_la_etiqueta_de_idioma_canonizada(): void
    {
        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'origen_pais', 'ref' => 'America/Santiago', 'n' => 3],
            ['tipo' => 'origen_pais', 'ref' => 'America/Punta_Arenas', 'n' => 1],
            ['tipo' => 'origen_pais', 'ref' => 'Europe/Berlin', 'n' => 2],
            ['tipo' => 'origen_idioma', 'ref' => 'es_AR', 'n' => 1],
            ['tipo' => 'origen_idioma', 'ref' => 'zh-Hans-CN', 'n' => 1],
            ['tipo' => 'origen_idioma', 'ref' => 'EN', 'n' => 1],
        ]])->assertNoContent();

        // Santiago y Punta Arenas son zonas distintas y el MISMO país: se suman
        // en una fila. Ese plegado es justo lo que hace legible el ranking.
        $this->assertSame(4, Interaccion::where('tipo', 'origen_pais')->where('referencia', 'CL')->value('cantidad'));
        $this->assertSame(2, Interaccion::where('tipo', 'origen_pais')->where('referencia', 'DE')->value('cantidad'));

        $idiomas = Interaccion::where('tipo', 'origen_idioma')->pluck('referencia')->sort()->values()->all();
        $this->assertSame(['en', 'es-AR', 'zh-CN'], $idiomas);
    }

    /**
     * Una zona o un idioma que no existen se descartan SIN tumbar el lote.
     *
     * Los dos lados importan: descartarlos evita guardar basura, y no responder
     * 422 evita que un valor raro de un navegador cualquiera haga que la PWA tire
     * a la basura todo el lote (ver el manejo del 422 en analitica.js), que se
     * llevaría por delante fichas y contactos de ese día.
     */
    public function test_descarta_un_origen_que_no_existe_sin_perder_el_resto_del_lote(): void
    {
        $this->postJson('/api/interacciones', ['eventos' => [
            ['tipo' => 'origen_pais', 'ref' => 'Basura/Nada', 'n' => 1],
            ['tipo' => 'origen_pais', 'ref' => 'UTC', 'n' => 1],
            ['tipo' => 'origen_pais', 'ref' => '+05:00', 'n' => 1],
            ['tipo' => 'origen_idioma', 'ref' => 'xq', 'n' => 1],
            // 'und' es como ICU dice "idioma desconocido": tiene nombre, pero no
            // es un origen. Sin excluirlo entraría al ranking como si lo fuera.
            ['tipo' => 'origen_idioma', 'ref' => 'und', 'n' => 1],
            ['tipo' => 'ficha', 'ref' => '12', 'n' => 5],
        ]])->assertNoContent();

        $this->assertSame(0, Interaccion::whereIn('tipo', Interaccion::TIPOS_DE_ORIGEN)->count());
        $this->assertSame(5, Interaccion::where('tipo', 'ficha')->value('cantidad'));
    }

    /** Días distintos son filas distintas: eso es lo que permite ver la evolución. */
    public function test_separa_por_dia(): void
    {
        Interaccion::sumar('ficha', '12', 5, now()->subDay());
        Interaccion::sumar('ficha', '12', 2);

        $this->assertSame(2, Interaccion::where('tipo', 'ficha')->count());
        $this->assertSame(7, (int) Interaccion::where('tipo', 'ficha')->sum('cantidad'));
    }
}
