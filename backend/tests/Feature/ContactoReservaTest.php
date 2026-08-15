<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Los datos que hacen posible RESERVAR desde la app: `whatsapp` y `horario`.
 *
 * Lo que protege esta suite no es el CRUD sino la cadena completa, que es donde
 * estaba el problema: la PWA leía `lugar.whatsapp` contra un campo que no
 * existía en ninguna parte, así que el botón de WhatsApp nunca se dibujó en
 * producción. Un campo que la app consume tiene que llegar POR LA API; que la
 * columna exista no basta.
 */
class ContactoReservaTest extends TestCase
{
    use RefreshDatabase;

    private function ficha(array $extra = []): Place
    {
        $localidad = Localidad::firstOrCreate(
            ['slug' => 'cochrane'],
            ['nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539, 'lng' => -72.5714, 'orden' => 170]
        );

        return Place::create(array_merge([
            'localidad_id' => $localidad->id,
            'cat' => 'alojamiento',
            'nombre' => ['es' => 'Cabañas del Baker', 'en' => 'Baker Cabins'],
            'descripcion' => ['es' => 'Cabañas', 'en' => 'Cabins'],
            'como' => ['es' => 'En el centro', 'en' => 'Downtown'],
            'dist' => ['es' => '1 km', 'en' => '1 km'],
            'lat' => -47.2539,
            'lng' => -72.5714,
            'publicado' => true,
        ], $extra));
    }

    public function test_la_api_publica_el_whatsapp_y_el_horario(): void
    {
        $this->ficha([
            'tel' => '+56 67 2 522 115',
            'whatsapp' => '+56 9 8765 4321',
            'horario' => 'Todos los días 9:00–22:00',
        ]);

        $this->getJson('/api/places')
            ->assertOk()
            ->assertJsonFragment([
                'whatsapp' => '+56 9 8765 4321',
                // Se llama `hrs` en la API: es el nombre que la tarjeta del mapa
                // ya venía leyendo. Si esto cambia, el chip de horario se apaga
                // sin que nada falle.
                'hrs' => 'Todos los días 9:00–22:00',
            ]);
    }

    /** Una ficha sin esos datos sigue viajando igual: los campos van en null. */
    public function test_una_ficha_sin_contacto_no_rompe_la_api(): void
    {
        $this->ficha();

        $this->getJson('/api/places')
            ->assertOk()
            ->assertJsonFragment(['whatsapp' => null, 'hrs' => null]);
    }

    /**
     * El WhatsApp es lo más valioso que puede llegar por el formulario de los
     * dueños —es el canal por el que se reserva en la Austral—, así que se pide
     * ahí y la revisión tiene que poder volcarlo a la ficha.
     */
    public function test_el_dueno_puede_proponer_su_whatsapp_y_su_horario(): void
    {
        $ficha = $this->ficha(['tel' => '+56 67 2 522 115']);
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, [
            'whatsapp' => '+56 9 5555 5555',
            'horario' => 'Lun a sáb 10:00–20:00',
        ])->assertOk();

        // Sigue valiendo la regla de siempre: responder NO toca la ficha.
        $ficha->refresh();
        $this->assertNull($ficha->whatsapp);

        $p->refresh()->aplicar();
        $ficha->refresh();
        $this->assertSame('+56 9 5555 5555', $ficha->whatsapp);
        $this->assertSame('Lun a sáb 10:00–20:00', $ficha->horario);
        $this->assertSame('+56 67 2 522 115', $ficha->tel, 'Lo que vino en blanco no se toca.');
    }

    /**
     * Los tipos nuevos de la analítica tienen que estar en la lista blanca: el
     * endpoint valida contra ella y un tipo desconocido devuelve 422, así que un
     * tipo que la PWA manda y el backend no conoce tira abajo el LOTE ENTERO —
     * incluidas las métricas que sí eran válidas.
     */
    public function test_la_analitica_acepta_las_consultas_de_disponibilidad(): void
    {
        $ficha = $this->ficha();

        $this->postJson('/api/interacciones', [
            'eventos' => [
                ['tipo' => 'consulta_reserva', 'ref' => (string) $ficha->id, 'dia' => '2026-08-15', 'n' => 2],
                ['tipo' => 'consulta_guardada', 'ref' => (string) $ficha->id, 'dia' => '2026-08-15', 'n' => 1],
                ['tipo' => 'perfil_viaje', 'ref' => '', 'dia' => '2026-08-15', 'n' => 1],
            ],
        ])->assertNoContent();

        $this->assertDatabaseHas('interacciones', ['tipo' => 'consulta_reserva', 'cantidad' => 2]);
        $this->assertDatabaseHas('interacciones', ['tipo' => 'perfil_viaje', 'cantidad' => 1]);
    }
}
