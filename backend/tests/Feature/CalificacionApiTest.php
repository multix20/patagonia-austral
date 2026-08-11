<?php

namespace Tests\Feature;

use App\Models\Calificacion;
use App\Models\Localidad;
use App\Models\Place;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre las calificaciones (Fase 3). Lo que hay que proteger aquí es que el
// promedio DESNORMALIZADO en `places` no se desincronice de las opiniones
// visibles: es el número que la PWA se lleva para verlo sin señal, y si miente
// nadie lo va a notar hasta que sea tarde.
class CalificacionApiTest extends TestCase
{
    use RefreshDatabase;

    private function localidad(): Localidad
    {
        return Localidad::firstOrCreate(
            ['slug' => 'cochrane'],
            [
                'nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539,
                'lng' => -72.5732,
                'orden' => 170,
            ]
        );
    }

    private function ficha(array $extra = []): Place
    {
        return Place::create(array_merge([
            'cat' => 'alojamiento',
            'lat' => -47.25,
            'lng' => -72.57,
            'nombre' => ['es' => 'Cabaña Ventisqueros', 'en' => 'Ventisqueros Cabin'],
            'descripcion' => ['es' => 'x', 'en' => 'x'],
            'como' => ['es' => 'x', 'en' => 'x'],
            'dist' => ['es' => '1 km', 'en' => '1 km'],
            'publicado' => true,
            'localidad_id' => $this->localidad()->id,
        ], $extra));
    }

    /** Calificar guarda la nota, hashea el dispositivo y mueve el promedio. */
    public function test_califica_una_ficha_y_actualiza_el_promedio(): void
    {
        $ficha = $this->ficha();

        // `estrellas` se compara casteado: json_encode(5.0) sale como `5` (sin
        // JSON_PRESERVE_ZERO_FRACTION), así que el promedio llega unas veces
        // entero y otras decimal. A JavaScript le da igual —todos sus números
        // son el mismo tipo—, pero un assertSame estricto se rompería solo.
        $r = $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id,
            'estrellas' => 5,
            'comentario' => 'Impecable, agua caliente y buen desayuno',
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertCreated();
        $this->assertSame(5.0, (float) $r->json('estrellas'));

        $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id,
            'estrellas' => 4,
            'dispositivo' => 'otro-dispositivo-2',
        ])->assertCreated();

        $ficha->refresh();
        $this->assertSame(4.5, $ficha->calificacion_promedio);
        $this->assertSame(2, $ficha->calificaciones_total);

        // El id del dispositivo NUNCA se guarda en claro.
        $guardada = Calificacion::first();
        $this->assertSame(hash('sha256', 'dispositivo-de-prueba-1'), $guardada->dispositivo);
    }

    /**
     * El mismo dispositivo EDITA su calificación en vez de sumar otra. Cubre a
     * quien vuelve al año siguiente y corrige su nota, y hace inofensivo el
     * reintento de la cola offline.
     */
    public function test_el_mismo_dispositivo_edita_su_calificacion(): void
    {
        $ficha = $this->ficha();
        $base = ['place_id' => $ficha->id, 'dispositivo' => 'dispositivo-de-prueba-1'];

        $this->postJson('/api/calificaciones', $base + ['estrellas' => 2])->assertCreated();
        $this->postJson('/api/calificaciones', $base + [
            'estrellas' => 5,
            'comentario' => 'Volví y estaba mucho mejor',
        ])->assertOk();

        $this->assertSame(1, Calificacion::count());
        $ficha->refresh();
        $this->assertSame(5.0, $ficha->calificacion_promedio);
        $this->assertSame(1, $ficha->calificaciones_total);
    }

    /** Ocultar una opinión la saca del promedio: moderar tiene que mover la nota. */
    public function test_ocultar_una_calificacion_recalcula_el_promedio(): void
    {
        $ficha = $this->ficha();

        foreach ([[5, 'a'], [1, 'b']] as [$estrellas, $dispositivo]) {
            $this->postJson('/api/calificaciones', [
                'place_id' => $ficha->id,
                'estrellas' => $estrellas,
                'comentario' => "opinion-{$dispositivo}",
                'dispositivo' => "dispositivo-{$dispositivo}-largo",
            ])->assertCreated();
        }
        $this->assertSame(3.0, $ficha->fresh()->calificacion_promedio);

        // Se oculta la de 1 estrella (spam de la competencia, el caso real).
        $spam = Calificacion::where('estrellas', 1)->firstOrFail();
        $spam->update(['oculto' => true]);
        $ficha->recalcularCalificacion();

        $ficha->refresh();
        $this->assertSame(5.0, $ficha->calificacion_promedio);
        $this->assertSame(1, $ficha->calificaciones_total);
        // Y deja de viajar a la PWA.
        $this->assertCount(1, $this->getJson("/api/calificaciones?place_id={$ficha->id}")->json());
    }

    /** Las fichas de emergencia no se califican (ver Calificacion). */
    public function test_no_se_puede_calificar_una_ficha_de_emergencia(): void
    {
        $ficha = $this->ficha(['cat' => 'emergencia']);

        $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id,
            'estrellas' => 1,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422)->assertJsonPath('error', 'no_calificable');

        $this->assertSame(0, Calificacion::count());
    }

    /** Nota fuera de 1–5, ficha inexistente o comentario larguísimo: 422. */
    public function test_valida_la_entrada(): void
    {
        $ficha = $this->ficha();
        $base = ['place_id' => $ficha->id, 'dispositivo' => 'dispositivo-de-prueba-1'];

        $this->postJson('/api/calificaciones', $base + ['estrellas' => 0])->assertStatus(422);
        $this->postJson('/api/calificaciones', $base + ['estrellas' => 6])->assertStatus(422);
        $this->postJson('/api/calificaciones', $base + [
            'estrellas' => 3,
            'comentario' => str_repeat('a', 281),
        ])->assertStatus(422);
        $this->postJson('/api/calificaciones', [
            'place_id' => 999999,
            'estrellas' => 3,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertStatus(422);
    }

    /**
     * La lista de opiniones solo trae las que tienen texto, y NO expone nada del
     * autor: ni siquiera el hash del dispositivo.
     */
    public function test_la_lista_solo_trae_comentarios_y_no_expone_al_autor(): void
    {
        $ficha = $this->ficha();

        $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id, 'estrellas' => 4, 'comentario' => 'Buena atención',
            'dispositivo' => 'dispositivo-con-texto',
        ])->assertCreated();
        // Sin comentario: cuenta para el promedio pero no aparece en la lista.
        $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id, 'estrellas' => 5,
            'dispositivo' => 'dispositivo-sin-texto',
        ])->assertCreated();

        $r = $this->getJson("/api/calificaciones?place_id={$ficha->id}")->assertOk();

        $this->assertCount(1, $r->json());
        $this->assertSame('Buena atención', $r->json('0.comentario'));
        $this->assertArrayNotHasKey('dispositivo', $r->json('0'));
        $this->assertSame(2, $ficha->fresh()->calificaciones_total);
    }

    /** El directorio lleva la nota puesta: es lo que la PWA muestra sin señal. */
    public function test_places_expone_estrellas_y_total(): void
    {
        $ficha = $this->ficha();

        $sinNota = $this->getJson('/api/places')->assertOk()->json('0');
        $this->assertNull($sinNota['estrellas']);
        $this->assertSame(0, $sinNota['calificaciones']);
        $this->assertTrue($sinNota['calificable']);

        $this->postJson('/api/calificaciones', [
            'place_id' => $ficha->id, 'estrellas' => 4,
            'dispositivo' => 'dispositivo-de-prueba-1',
        ])->assertCreated();

        $conNota = $this->getJson('/api/places')->assertOk()->json('0');
        $this->assertSame(4.0, (float) $conNota['estrellas']);
        $this->assertSame(1, $conNota['calificaciones']);
    }
}
