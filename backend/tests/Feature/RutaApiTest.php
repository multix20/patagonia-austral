<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Ruta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre `GET /api/rutas`, la capa de trazados y áreas (pasarelas de Tortel,
// senderos, glaciares). Lo que hay que proteger acá es distinto de `places`:
// no es una lista de fichas sino GEOMETRÍA, y los tres riesgos son que se
// publique lo que está en borrador, que la geometría se deforme al viajar, y que
// el orden de dibujo deje las líneas debajo de un polígono.
class RutaApiTest extends TestCase
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

    private function ruta(array $extra = []): Ruta
    {
        return Ruta::create(array_merge([
            'tipo' => 'sendero',
            'nombre' => ['es' => 'Sendero de prueba', 'en' => 'Test trail'],
            'descripcion' => ['es' => 'Descripción', 'en' => 'Description'],
            'largo_km' => 2.67,
            'geometria' => [
                'type' => 'LineString',
                'coordinates' => [[-73.5361, -47.7968], [-73.5352, -47.7959]],
            ],
            'localidad_id' => $this->localidad()->id,
            'publicado' => true,
        ], $extra));
    }

    public function test_solo_devuelve_las_publicadas(): void
    {
        $this->ruta(['nombre' => ['es' => 'Visible', 'en' => 'Visible']]);
        $this->ruta(['nombre' => ['es' => 'Borrador', 'en' => 'Draft'], 'publicado' => false]);

        $datos = $this->getJson('/api/rutas')->assertOk()->json();

        $this->assertCount(1, $datos);
        $this->assertSame('Visible', $datos[0]['nombre']['es']);
    }

    public function test_la_geometria_viaja_intacta(): void
    {
        // Es el punto entero de esta tabla: si la geometría se altera al
        // serializar, Leaflet dibuja cualquier cosa y nadie se entera hasta
        // verlo en el mapa.
        $poligono = [
            'type' => 'MultiPolygon',
            'coordinates' => [[[[-73.6, -47.8], [-73.5, -47.8], [-73.5, -47.7], [-73.6, -47.8]]]],
        ];
        $this->ruta(['tipo' => 'area', 'geometria' => $poligono, 'largo_km' => null]);

        $datos = $this->getJson('/api/rutas')->assertOk()->json();

        $this->assertSame($poligono, $datos[0]['geometria']);
    }

    public function test_ordena_las_areas_primero_y_las_pasarelas_al_final(): void
    {
        // El orden es de DIBUJO: un glaciar pintado encima taparía el sendero.
        $this->ruta(['tipo' => 'pasarela']);
        $this->ruta(['tipo' => 'area']);
        $this->ruta(['tipo' => 'sendero']);
        $this->ruta(['tipo' => 'ruta']);

        $tipos = array_column($this->getJson('/api/rutas')->assertOk()->json(), 'tipo');

        $this->assertSame(['area', 'ruta', 'sendero', 'pasarela'], $tipos);
    }

    public function test_la_localidad_viaja_como_slug(): void
    {
        // La PWA filtra por slug: mandar el id la obligaría a conocer la base.
        $this->ruta();

        $datos = $this->getJson('/api/rutas')->assertOk()->json();

        $this->assertSame('caleta-tortel', $datos[0]['localidad']);
    }

    public function test_cuenta_los_vertices_de_cualquier_anidamiento(): void
    {
        // El contador es lo que en el CMS avisa que una geometría pesa demasiado
        // (el glaciar del origen traía 17.115 vértices), así que tiene que
        // funcionar igual en una línea suelta que en un MultiPolygon.
        $linea = $this->ruta();
        $this->assertSame(2, $linea->vertices());

        $area = $this->ruta([
            'tipo' => 'area',
            'geometria' => [
                'type' => 'MultiPolygon',
                'coordinates' => [
                    [[[-73.6, -47.8], [-73.5, -47.8], [-73.5, -47.7], [-73.6, -47.8]]],
                    [[[-73.4, -47.9], [-73.3, -47.9], [-73.3, -47.8], [-73.4, -47.9]]],
                ],
            ],
        ]);
        $this->assertSame(8, $area->vertices());

        // Un Point trae `coordinates` como [lon, lat]: números sueltos en el
        // primer nivel. No corresponde a ningún tipo de esta tabla, pero la
        // geometría se puede pegar a mano en el CMS, y antes del guard esto
        // reventaba con un TypeError — o sea, una fila mal pegada dejaba la
        // lista de trazados en un 500. Ahora cuenta 0 y la pantalla vive.
        $punto = $this->ruta([
            'geometria' => ['type' => 'Point', 'coordinates' => [-73.5361, -47.7968]],
        ]);
        $this->assertSame(0, $punto->vertices());
    }
}
