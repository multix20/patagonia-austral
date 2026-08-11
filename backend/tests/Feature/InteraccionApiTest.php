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

    /** Días distintos son filas distintas: eso es lo que permite ver la evolución. */
    public function test_separa_por_dia(): void
    {
        Interaccion::sumar('ficha', '12', 5, now()->subDay());
        Interaccion::sumar('ficha', '12', 2);

        $this->assertSame(2, Interaccion::where('tipo', 'ficha')->count());
        $this->assertSame(7, (int) Interaccion::where('tipo', 'ficha')->sum('cantidad'));
    }
}
