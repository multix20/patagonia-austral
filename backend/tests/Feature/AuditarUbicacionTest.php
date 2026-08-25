<?php

namespace Tests\Feature;

use App\Filament\Resources\PlaceResource\Pages\ListPlaces;
use App\Models\Localidad;
use App\Models\Place;
use App\Models\User;
use App\Support\Ubicacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

// Cubre la auditoría del PIN: el comando `lugares:auditar-ubicacion` y el
// criterio compartido de App\Support\Ubicacion.
//
// Lo que hay que proteger acá son los dos errores opuestos: que la lista deje
// fuera un pin mal puesto (el problema que se quiere encontrar) y que meta uno
// que está bien (un atractivo a 20 km del pueblo es correcto, y una lista con
// ruido no se revisa).
class AuditarUbicacionTest extends TestCase
{
    use RefreshDatabase;

    private function localidad(): Localidad
    {
        return Localidad::firstOrCreate(
            ['slug' => 'caleta-tortel'],
            [
                'nombre' => ['es' => 'Caleta Tortel', 'en' => 'Caleta Tortel'],
                'lat' => -47.7967,
                'lng' => -73.536,
                'orden' => 180,
            ]
        );
    }

    private function ficha(array $extra = []): Place
    {
        return Place::create(array_merge([
            'cat' => 'alojamiento',
            'lat' => -47.7967,
            'lng' => -73.536,
            'nombre' => ['es' => 'Hospedaje', 'en' => 'Guesthouse'],
            'descripcion' => ['es' => 'x', 'en' => 'x'],
            'como' => ['es' => 'x', 'en' => 'x'],
            'dist' => ['es' => 'x', 'en' => 'x'],
            'publicado' => true,
            'localidad_id' => $this->localidad()->id,
        ], $extra));
    }

    public function test_haversine_mide_lo_que_se_espera(): void
    {
        // Un grado de latitud son ~111 km en cualquier punto del planeta.
        $this->assertEqualsWithDelta(111.2, Ubicacion::km(-47.0, -73.0, -48.0, -73.0), 0.5);
        $this->assertSame(0.0, Ubicacion::km(-47.7967, -73.536, -47.7967, -73.536));
    }

    public function test_marca_el_alojamiento_lejos_del_pueblo(): void
    {
        // ~7 km al norte del centro: en Tortel eso es cerro, no pasarela.
        $lejos = $this->ficha([
            'lat' => -47.7337,
            'nombre' => ['es' => 'Hospedaje del cerro', 'en' => 'Hill guesthouse'],
        ]);

        $this->assertGreaterThan(Ubicacion::KM_SOSPECHOSO, $lejos->kmAlCentro());

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('Hospedaje del cerro')
            ->assertSuccessful();
    }

    public function test_no_marca_un_atractivo_lejano(): void
    {
        // La Confluencia Baker-Neff está a 22 km de Cochrane y su pin está bien.
        $this->ficha([
            'cat' => 'atractivo',
            'lat' => -47.6,
            'nombre' => ['es' => 'Mirador lejano', 'en' => 'Distant lookout'],
        ]);

        $this->artisan('lugares:auditar-ubicacion')
            ->doesntExpectOutputToContain('Mirador lejano')
            ->assertSuccessful();
    }

    public function test_marca_la_coordenada_clavada_en_el_centro(): void
    {
        // Coordenada de relleno: exactamente el centro de la localidad.
        $this->ficha(['nombre' => ['es' => 'Ficha sin coordenada real', 'en' => 'No real coords']]);

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('Ficha sin coordenada real')
            ->assertSuccessful();
    }

    public function test_marca_las_fichas_apiladas_en_el_mismo_punto(): void
    {
        $this->ficha(['lat' => -47.81, 'lng' => -73.55, 'nombre' => ['es' => 'Cabañas A', 'en' => 'Cabins A']]);
        $this->ficha(['lat' => -47.81, 'lng' => -73.55, 'nombre' => ['es' => 'Cabañas B', 'en' => 'Cabins B']]);

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('Cabañas A')
            ->expectsOutputToContain('Cabañas B')
            ->assertSuccessful();
    }

    public function test_marca_la_coordenada_fuera_de_la_zona(): void
    {
        // Coordenada invertida (lat/lng al revés): cae en el Pacífico.
        $this->ficha([
            'lat' => -73.536,
            'lng' => -47.7967,
            'nombre' => ['es' => 'Coordenada invertida', 'en' => 'Swapped coords'],
        ]);

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('Coordenada invertida')
            ->assertSuccessful();
    }

    public function test_solo_mira_lo_publicado_salvo_que_se_pidan_todas(): void
    {
        $this->ficha([
            'lat' => -47.7337,
            'publicado' => false,
            'nombre' => ['es' => 'Borrador del cerro', 'en' => 'Draft on the hill'],
        ]);

        // Por omisión: lo que el viajero ve. Un borrador con el pin corrido no
        // le manda a nadie a media hora de ripio.
        $this->artisan('lugares:auditar-ubicacion')
            ->doesntExpectOutputToContain('Borrador del cerro')
            ->assertSuccessful();

        $this->artisan('lugares:auditar-ubicacion --todas')
            ->expectsOutputToContain('Borrador del cerro')
            ->assertSuccessful();
    }

    /**
     * El filtro del CMS y el comando comparten criterio, pero no consulta: el
     * filtro lo resuelve en SQL (con un join a `localidades` y aritmética en
     * crudo) y eso puede romperse sin que el comando se entere. Por eso se
     * prueba el scope directo.
     */
    public function test_el_filtro_del_cms_encuentra_cada_sintoma(): void
    {
        $cerca = $this->ficha(['lat' => -47.8003, 'lng' => -73.5375]);            // 400 m: bien puesta
        $lejos = $this->ficha(['lat' => -47.7337, 'lng' => -73.536]);             // ~7 km
        $atractivoLejos = $this->ficha(['cat' => 'atractivo', 'lat' => -47.6, 'lng' => -73.536]);
        $centro = $this->ficha(['lat' => -47.7967, 'lng' => -73.536]);            // centro exacto
        $apiladaA = $this->ficha(['lat' => -47.81, 'lng' => -73.55]);
        $apiladaB = $this->ficha(['lat' => -47.81, 'lng' => -73.55]);
        $fuera = $this->ficha(['lat' => -73.536, 'lng' => -47.7967]);             // invertida
        $espiral = $this->ficha(['lat' => -47.795002, 'lng' => -73.53708]);       // punto 5 del desparramo

        $ids = fn (?string $sintoma) => Place::query()
            ->ubicacionSospechosa($sintoma)
            ->pluck('places.id')
            ->all();

        // La coordenada invertida también cae en "lejos", y está bien: está
        // lejísimos. Lo que importa es que el atractivo lejano NO entre.
        $this->assertEqualsCanonicalizing([$lejos->id, $fuera->id], $ids('lejos'));
        $this->assertNotContains($atractivoLejos->id, $ids('lejos'));
        $this->assertSame([$centro->id], $ids('centro'));
        $this->assertEqualsCanonicalizing([$apiladaA->id, $apiladaB->id], $ids('apilada'));
        $this->assertSame([$fuera->id], $ids('fuera'));
        $this->assertSame([$espiral->id], $ids('desparramo'));

        // Sin síntoma elegido, el filtro no filtra nada.
        $this->assertCount(8, $ids(null));
        $this->assertContains($cerca->id, $ids(null));
    }

    public function test_se_puede_ordenar_por_distancia_al_centro(): void
    {
        $cerca = $this->ficha(['lat' => -47.8003, 'lng' => -73.5375]);
        $lejos = $this->ficha(['lat' => -47.7337, 'lng' => -73.536]);
        // Sin localidad: no tiene distancia, pero no puede desaparecer de la lista.
        $huerfana = $this->ficha(['localidad_id' => null, 'lat' => -47.75, 'lng' => -73.5]);

        $orden = Place::query()
            ->conCentroDeLocalidad()
            ->orderByRaw(Ubicacion::km2Sql().' desc')
            ->pluck('places.id')
            ->all();

        $this->assertContains($huerfana->id, $orden);
        $this->assertLessThan(
            array_search($cerca->id, $orden, true),
            array_search($lejos->id, $orden, true),
            'La ficha más lejos del centro tiene que quedar arriba.'
        );
    }

    /**
     * Que la consulta sea correcta no basta: la columna y el filtro viven en una
     * tabla de Filament, y un `sortable(query:)` mal armado o una columna
     * calculada que el motor intenta buscar como campo real tumban la lista
     * entera de lugares — la pantalla más usada del CMS.
     */
    public function test_la_lista_del_cms_ordena_y_filtra_por_ubicacion(): void
    {
        $lejos = $this->ficha(['lat' => -47.7337, 'lng' => -73.536]);
        $this->ficha(['lat' => -47.8003, 'lng' => -73.5375]);

        $this->actingAs(User::create([
            'name' => 'Admin', 'email' => 'admin@ejemplo.cl', 'password' => bcrypt('secreto'),
        ]));

        Livewire::test(ListPlaces::class)
            ->assertSuccessful()
            ->sortTable('km_al_centro', 'desc')
            ->assertCanSeeTableRecords(Place::all())
            ->filterTable('ubicacion', 'lejos')
            ->assertCanSeeTableRecords([$lejos])
            ->assertCountTableRecords(1);
    }

    public function test_reconoce_el_relleno_en_espiral_del_importador(): void
    {
        // Punto 5 de la espiral con la que `corrige_placeholders`
        // (scripts/sernatur/2_generar_textos.py) repartió los placeholders
        // alrededor del centro de Tortel. Valor calculado con el script.
        $this->ficha([
            'lat' => -47.795002,
            'lng' => -73.53708,
            'nombre' => ['es' => 'Hospedaje sin dirección', 'en' => 'Guesthouse without address'],
        ]);

        $this->assertNotEmpty(Place::idsDelDesparramo());

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('SIN UBICACIÓN REAL')
            ->assertSuccessful();
    }

    public function test_no_confunde_una_ficha_ubicada_a_mano_con_el_relleno(): void
    {
        // A 300 m del centro, pero fuera de la espiral: es una ubicación real.
        $this->ficha([
            'lat' => -47.7940,
            'lng' => -73.5340,
            'nombre' => ['es' => 'Hospedaje ubicado a mano', 'en' => 'Hand-placed guesthouse'],
        ]);

        $this->assertSame([], Place::idsDelDesparramo());
    }

    public function test_una_ficha_bien_puesta_no_aparece(): void
    {
        // A 400 m del centro: un hospedaje normal de pueblo.
        $this->ficha([
            'lat' => -47.8003,
            'lng' => -73.5375,
            'nombre' => ['es' => 'Hospedaje de las pasarelas', 'en' => 'Boardwalk guesthouse'],
        ]);

        $this->artisan('lugares:auditar-ubicacion')
            ->expectsOutputToContain('Ningún pin sospechoso')
            ->assertSuccessful();
    }
}
