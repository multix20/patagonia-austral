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
            'tipo' => 'combustible',
            'lat' => -47.2545,
            'lng' => -72.5738,
            'comentario' => 'No hay bencina en la bomba',
            'dispositivo' => 'dispositivo-de-prueba-1',
        ]);

        $r->assertCreated()
            ->assertJsonPath('tipo', 'combustible')
            ->assertJsonPath('localidad', 'cochrane')
            ->assertJsonPath('confirmaciones', 0);

        $reporte = Reporte::first();
        $this->assertEqualsWithDelta(
            now()->addHours(Reporte::VIDA_HORAS['combustible'])->timestamp,
            $reporte->expira_en->timestamp,
            5
        );
        // El id del dispositivo NUNCA se guarda en claro.
        $this->assertSame(hash('sha256', 'dispositivo-de-prueba-1'), $reporte->dispositivo);
        $this->assertNotSame('dispositivo-de-prueba-1', $reporte->dispositivo);
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
            'tipo' => 'camino',
            'lat' => 999,
            'lng' => -72.5,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422);

        $this->postJson('/api/reportes', [
            'tipo' => 'camino',
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
            'tipo' => 'hielo',
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
        $base = ['tipo' => 'camino', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id];

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
            'tipo' => 'ferry', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
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
     * Confirmar NUNCA acorta un reporte de vida larga. El tope de extensión era
     * de 24 h fijas y se aplicaba con un `min()`, así que confirmar una faena
     * (168 h) la dejaba en 24 h: la comunidad enterraba el reporte justo por
     * darle la razón. Es el caso que hace utilizable la temporada de obras del
     * Plan Ruta Austral, por eso tiene test propio.
     */
    public function test_confirmar_no_acorta_un_reporte_de_vida_larga(): void
    {
        $loc = $this->localidad();
        $reporte = Reporte::create([
            'tipo' => 'faena', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
            'dispositivo' => 'autor', 'expira_en' => now()->addHours(Reporte::VIDA_HORAS['faena']),
        ]);
        $antes = $reporte->expira_en->timestamp;

        $this->postJson("/api/reportes/{$reporte->id}/voto", [
            'confirma' => true,
            'dispositivo' => 'votante-faena',
        ])->assertOk()->assertJsonPath('confirmaciones', 1);

        // Recién creado ya está en el tope (una vida entera por delante): la
        // confirmación no puede estirarlo más, pero tampoco recortarlo.
        $this->assertSame($antes, $reporte->refresh()->expira_en->timestamp);

        // Cuando ya le queda poco, la confirmación sí estira.
        $reporte->update(['expira_en' => now()->addHours(5)]);
        $quedaba = $reporte->expira_en->timestamp;
        $this->postJson("/api/reportes/{$reporte->id}/voto", [
            'confirma' => true,
            'dispositivo' => 'votante-faena-2',
        ])->assertOk();

        $this->assertSame(
            $quedaba + Reporte::EXTENSION_HORAS * 3600,
            $reporte->refresh()->expira_en->timestamp
        );
    }

    /** La faena del Plan Ruta Austral es un tipo válido y dura una semana. */
    public function test_faena_es_un_tipo_valido_con_vigencia_de_semana(): void
    {
        $this->localidad();

        $this->postJson('/api/reportes', [
            'tipo' => 'faena',
            'lat' => -47.2545,
            'lng' => -72.5738,
            'comentario' => 'Pare y siga por faena, esperas de 20 min',
            'dispositivo' => 'dispositivo-de-prueba-faena',
        ])->assertCreated()->assertJsonPath('tipo', 'faena');

        $this->assertEqualsWithDelta(
            now()->addHours(168)->timestamp,
            Reporte::first()->expira_en->timestamp,
            5
        );
        // Una faena tiene que durar más que un corte de camino común: si alguien
        // iguala los plazos, este test lo caza.
        $this->assertGreaterThan(Reporte::VIDA_HORAS['camino'], Reporte::VIDA_HORAS['faena']);
    }

    /** Tres descartes sin confirmaciones esconden el reporte (y sale del index). */
    public function test_descartes_ocultan_el_reporte(): void
    {
        $loc = $this->localidad();
        $reporte = Reporte::create([
            'tipo' => 'fauna', 'lat' => -47.25, 'lng' => -72.57, 'localidad_id' => $loc->id,
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

    /** Un punto lejos de todo pueblo queda sin localidad, pero se guarda igual. */
    public function test_reporte_fuera_de_radio_queda_sin_localidad(): void
    {
        $this->localidad();

        $this->postJson('/api/reportes', [
            'tipo' => 'tiempo',
            'lat' => -33.45,   // Santiago: a más de 1.000 km de la ruta
            'lng' => -70.66,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertCreated()->assertJsonPath('localidad', null);
    }
}
