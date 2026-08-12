<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Reporte;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre el crowdsourcing (Fase 3). Lo que importa probar aquí es la regla que
// permite que esto ande en Render free SIN worker ni scheduler: la caducidad se
// evalúa al leer, y los votos de la comunidad extienden o entierran un reporte.
class ReporteApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Cochrane ya existe tras migrar (la migración de Fase 1 la crea para
     * reasignar los lugares antiguos), así que se reutiliza en vez de insertarla.
     */
    private function localidad(array $extra = []): Localidad
    {
        return Localidad::firstOrCreate(
            ['slug' => $extra['slug'] ?? 'cochrane'],
            array_merge([
                'nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539,
                'lng' => -72.5732,
                'orden' => 170,
            ], $extra)
        );
    }

    /** Un reporte nace con la vigencia de su tipo y se atribuye al pueblo cercano. */
    public function test_crea_reporte_con_caducidad_y_localidad(): void
    {
        $this->localidad();

        $r = $this->postJson('/api/reportes', [
            'tipo' => 'peligro',
            'lat' => -47.2545,
            'lng' => -72.5738,
            'comentario' => 'Piedras sueltas en la curva',
            'dispositivo' => 'dispositivo-de-prueba-1',
        ]);

        $r->assertCreated()
            ->assertJsonPath('tipo', 'peligro')
            ->assertJsonPath('localidad', 'cochrane')
            ->assertJsonPath('confirmaciones', 0);

        $reporte = Reporte::first();
        $this->assertEqualsWithDelta(
            now()->addHours(Reporte::VIDA_HORAS['peligro'])->timestamp,
            $reporte->expira_en->timestamp,
            5
        );
        // El id del dispositivo NUNCA se guarda en claro.
        $this->assertSame(hash('sha256', 'dispositivo-de-prueba-1'), $reporte->dispositivo);
        $this->assertNotSame('dispositivo-de-prueba-1', $reporte->dispositivo);
    }

    /**
     * Un reporte hecho fuera de la Carretera Austral se rechaza. Es un caso
     * real, no teórico: probando la app lejos de la ruta el navegador ubica por
     * IP y entraron cuatro reportes desde Santiago, que ensuciaban el conteo del
     * filtro por tramo y no se podían dibujar en ningún mapa de la ruta.
     */
    public function test_rechaza_un_reporte_fuera_de_la_carretera_austral(): void
    {
        $this->localidad();

        $this->postJson('/api/reportes', [
            'tipo' => 'peligro',
            'lat' => -33.4489,   // Santiago, ~1.000 km al norte de la ruta
            'lng' => -70.6693,
            'dispositivo' => 'dispositivo-lejano',
        ])->assertStatus(422)->assertJsonPath('error', 'fuera_de_ruta');

        $this->assertSame(0, Reporte::count());
    }

    /** El tipo tiene que ser uno de los conocidos y el comentario tiene tope. */
    public function test_valida_la_entrada(): void
    {
        $this->postJson('/api/reportes', [
            'tipo' => 'ovni',
            'lat' => -47.2,
            'lng' => -72.5,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422);

        $this->postJson('/api/reportes', [
            'tipo' => 'peligro',
            'lat' => 999,
            'lng' => -72.5,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422);

        $this->postJson('/api/reportes', [
            'tipo' => 'peligro',
            'lat' => -47.2,
            'lng' => -72.5,
            'comentario' => str_repeat('a', 281),
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422);
    }

    /**
     * El reintento de la cola offline no debe duplicar: mismo dispositivo, mismo
     * tipo y casi el mismo punto → devuelve el reporte que ya existe.
     */
    public function test_no_duplica_el_reintento_de_la_cola_offline(): void
    {
        $this->localidad();
        $datos = [
            'tipo' => 'accidente',
            'lat' => -47.2539,
            'lng' => -72.5732,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ];

        $primero = $this->postJson('/api/reportes', $datos)->assertCreated();
        $segundo = $this->postJson('/api/reportes', $datos)->assertOk();

        $this->assertSame($primero->json('id'), $segundo->json('id'));
        $this->assertSame(1, Reporte::count());

        // Otro dispositivo en el mismo punto SÍ crea otro reporte (son dos testigos).
        $this->postJson('/api/reportes', array_merge($datos, ['dispositivo' => 'otro-dispositivo-2']))
            ->assertCreated();
        $this->assertSame(2, Reporte::count());
    }

    /** La API solo sirve lo vigente: lo caducado y lo oculto no viaja a la PWA. */
    public function test_index_solo_devuelve_vigentes(): void
    {
        $loc = $this->localidad();
        $base = ['tipo' => 'peligro', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id];

        $vivo = Reporte::create($base + ['dispositivo' => 'a', 'expira_en' => now()->addHour()]);
        Reporte::create($base + ['dispositivo' => 'b', 'expira_en' => now()->subMinute()]);
        $oculto = Reporte::create($base + ['dispositivo' => 'c', 'expira_en' => now()->addHour()]);
        $oculto->update(['oculto' => true]);

        $r = $this->getJson('/api/reportes')->assertOk();
        $this->assertCount(1, $r->json());
        $this->assertSame($vivo->id, $r->json('0.id'));
    }

    /** Confirmar suma y estira la vigencia; el mismo dispositivo no vota dos veces. */
    public function test_confirmar_extiende_y_no_permite_voto_doble(): void
    {
        $loc = $this->localidad();
        $reporte = Reporte::create([
            'tipo' => 'peligro', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
            'dispositivo' => 'autor', 'expira_en' => now()->addHours(2),
        ]);
        $antes = $reporte->expira_en->timestamp;

        $this->postJson("/api/reportes/{$reporte->id}/voto", [
            'confirma' => true,
            'dispositivo' => 'votante-1',
        ])->assertOk()->assertJsonPath('confirmaciones', 1);

        $reporte->refresh();
        $this->assertSame(
            $antes + Reporte::EXTENSION_HORAS * 3600,
            $reporte->expira_en->timestamp
        );

        // Segundo intento del mismo dispositivo: responde OK pero no vuelve a sumar.
        $this->postJson("/api/reportes/{$reporte->id}/voto", [
            'confirma' => true,
            'dispositivo' => 'votante-1',
        ])->assertOk()->assertJsonPath('confirmaciones', 1);
    }

    /**
     * Confirmar NUNCA acorta un reporte, ni siquiera uno de un tipo RETIRADO.
     *
     * Al recortar el crowdsourcing a tres tipos (ago-2026) los viejos salieron de
     * `VIDA_HORAS`, así que su tope de extensión pasó a ser el mínimo de 24 h. Un
     * `camping` con 72 h por delante que alguien confirma NO puede caer a 24 h:
     * la comunidad enterraría el reporte justo por darle la razón, y encima por
     * un cambio nuestro que el viajero no pidió. Lo que sostiene esto es el
     * `max()` de `votar()`; este test es el que lo vigila.
     */
    public function test_confirmar_no_acorta_un_reporte_de_tipo_retirado(): void
    {
        // Reloj congelado a propósito. Sin esto el test es INESTABLE (~1 de cada
        // 65 corridas): el reporte nace con un `now()` y el controlador recalcula
        // el tope con el SUYO, así que si el POST cae en el segundo siguiente al
        // `create` la igualdad exacta falla. Es ruido de reloj, no un cambio de
        // conducta — pero rompía CI en `main` cada tanto.
        $this->freezeTime();

        $loc = $this->localidad();
        $reporte = Reporte::create([
            'tipo' => 'camping', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
            'dispositivo' => 'autor', 'expira_en' => now()->addHours(72),
        ]);
        $antes = $reporte->expira_en->timestamp;

        $this->postJson("/api/reportes/{$reporte->id}/voto", [
            'confirma' => true,
            'dispositivo' => 'votante-retirado',
        ])->assertOk()->assertJsonPath('confirmaciones', 1);

        // Queda intacto: ni se estira (está sobre el tope) ni se recorta.
        $this->assertSame($antes, $reporte->refresh()->expira_en->timestamp);
    }

    /**
     * Los tres tipos vivos comparten la MISMA vigencia de 24 h, y los retirados
     * ya no se pueden crear. Es la promesa que la app le hace al viajero en la
     * hoja de reportar ("dura 24 horas"), así que no puede depender de que nadie
     * toque la constante sin darse cuenta.
     */
    public function test_los_tres_tipos_vivos_duran_24_horas(): void
    {
        $this->localidad();

        $this->assertSame(['peligro', 'accidente', 'faena'], Reporte::tipos());

        foreach (Reporte::tipos() as $i => $tipo) {
            $this->postJson('/api/reportes', [
                'tipo' => $tipo,
                'lat' => -47.2545,
                'lng' => -72.5738,
                'dispositivo' => "dispositivo-de-prueba-{$i}",
            ])->assertCreated()->assertJsonPath('tipo', $tipo);

            $this->assertSame(24, Reporte::VIDA_HORAS[$tipo]);
        }

        $this->assertEqualsWithDelta(
            now()->addHours(24)->timestamp,
            Reporte::first()->expira_en->timestamp,
            5
        );

        // Un tipo retirado se rechaza como cualquier otro valor desconocido.
        $this->postJson('/api/reportes', [
            'tipo' => 'combustible',
            'lat' => -47.2545,
            'lng' => -72.5738,
            'dispositivo' => 'dispositivo-de-prueba-retirado',
        ])->assertStatus(422);
    }

    /** Tres descartes sin confirmaciones esconden el reporte (y sale del index). */
    public function test_descartes_ocultan_el_reporte(): void
    {
        $loc = $this->localidad();
        $reporte = Reporte::create([
            'tipo' => 'accidente', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
            'dispositivo' => 'autor', 'expira_en' => now()->addHours(5),
        ]);

        foreach (['votante-uno-1', 'votante-dos-2'] as $d) {
            $this->postJson("/api/reportes/{$reporte->id}/voto", ['confirma' => false, 'dispositivo' => $d])
                ->assertOk();
        }
        $this->assertFalse($reporte->fresh()->oculto);

        $this->postJson("/api/reportes/{$reporte->id}/voto", ['confirma' => false, 'dispositivo' => 'votante-tres-3'])
            ->assertOk();

        $this->assertTrue($reporte->fresh()->oculto);
        $this->assertCount(0, $this->getJson('/api/reportes')->json());
    }

    /**
     * Un punto lejos de todo PUEBLO queda sin localidad, pero se guarda igual:
     * es el reporte del camino entre pueblos, la razón de ser de esta función.
     * Ojo con las coordenadas: tienen que estar en el corredor de la ruta. Antes
     * este test usaba Santiago, que ahora rebota por `fuera_de_ruta` — "fuera
     * del radio de un pueblo" y "fuera de la Carretera Austral" son dos cosas
     * distintas, y esa distinción es justo lo que sostiene el filtro por tramo.
     */
    public function test_reporte_fuera_de_radio_queda_sin_localidad(): void
    {
        $this->localidad();

        $this->postJson('/api/reportes', [
            'tipo' => 'faena',
            'lat' => -47.85,   // ~70 km al sur de Cochrane, camino a Tortel
            'lng' => -73.0,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertCreated()->assertJsonPath('localidad', null);
    }
}
