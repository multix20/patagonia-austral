<?php

namespace Database\Seeders;

use App\Models\Localidad;
use Illuminate\Database\Seeder;

// Localidades de la Carretera Austral completa, Puerto Montt → Villa O'Higgins
// (multi-localidad, Fases 1, 2 y 2.5). Idempotente: updateOrCreate por slug;
// corre en cada arranque del contenedor. `orden` va norte → sur en decenas
// (10 Puerto Montt … 190 Villa O'Higgins) para poder intercalar pueblos.
// Los desvíos usan valores intermedios: Caleta Gonzalo (30) es el corazón de
// Pumalín entre las barcazas; Futaleufú (55) y Palena (58) son el ramal este
// desde Villa Santa Lucía; Puerto Cisnes (95) el desvío costero; Puerto Aysén
// (110) y Chacabuco (115) la Ruta 240 desde Coyhaique; Chile Chico (155) la
// ribera sur del lago General Carrera. Mantener en espejo con
// LOCALIDADES_SEED de frontend/src/data/places.js.
class LocalidadSeeder extends Seeder
{
    public function run(): void
    {
        $localidades = [
            [
                'slug' => 'puerto-montt',
                'nombre' => ['es' => 'Puerto Montt', 'en' => 'Puerto Montt'],
                'lat' => -41.4693,
                'lng' => -72.9424,
                'zoom' => 13,
                'orden' => 10,
            ],
            [
                'slug' => 'hornopiren',
                'nombre' => ['es' => 'Hornopirén', 'en' => 'Hornopirén'],
                'lat' => -41.9578,
                'lng' => -72.4372,
                'zoom' => 14,
                'orden' => 20,
            ],
            [
                'slug' => 'caleta-gonzalo',
                'nombre' => ['es' => 'Caleta Gonzalo (Pumalín)', 'en' => 'Caleta Gonzalo (Pumalín)'],
                'lat' => -42.5633,
                'lng' => -72.5989,
                'zoom' => 14,
                'orden' => 30,
            ],
            [
                'slug' => 'chaiten',
                'nombre' => ['es' => 'Chaitén', 'en' => 'Chaitén'],
                'lat' => -42.9169,
                'lng' => -72.7086,
                'zoom' => 14,
                'orden' => 40,
            ],
            [
                'slug' => 'el-amarillo',
                'nombre' => ['es' => 'El Amarillo', 'en' => 'El Amarillo'],
                'lat' => -42.9333,
                'lng' => -72.5333,
                'zoom' => 15,
                'orden' => 45,
            ],
            [
                'slug' => 'villa-santa-lucia',
                'nombre' => ['es' => 'Villa Santa Lucía', 'en' => 'Villa Santa Lucía'],
                'lat' => -43.4167,
                'lng' => -72.3667,
                'zoom' => 15,
                'orden' => 50,
            ],
            [
                'slug' => 'futaleufu',
                'nombre' => ['es' => 'Futaleufú', 'en' => 'Futaleufú'],
                'lat' => -43.1847,
                'lng' => -71.8697,
                'zoom' => 14,
                'orden' => 55,
            ],
            [
                'slug' => 'palena',
                'nombre' => ['es' => 'Palena', 'en' => 'Palena'],
                'lat' => -43.6167,
                'lng' => -71.8000,
                'zoom' => 15,
                'orden' => 58,
            ],
            [
                'slug' => 'la-junta',
                'nombre' => ['es' => 'La Junta', 'en' => 'La Junta'],
                'lat' => -43.9756,
                'lng' => -72.4058,
                'zoom' => 14,
                'orden' => 70,
            ],
            [
                'slug' => 'puyuhuapi',
                'nombre' => ['es' => 'Puyuhuapi', 'en' => 'Puyuhuapi'],
                'lat' => -44.3286,
                'lng' => -72.5567,
                'zoom' => 14,
                'orden' => 80,
            ],
            [
                'slug' => 'villa-amengual',
                'nombre' => ['es' => 'Villa Amengual', 'en' => 'Villa Amengual'],
                'lat' => -44.7167,
                'lng' => -72.1667,
                'zoom' => 15,
                'orden' => 90,
            ],
            [
                'slug' => 'puerto-cisnes',
                'nombre' => ['es' => 'Puerto Cisnes', 'en' => 'Puerto Cisnes'],
                'lat' => -44.7422,
                'lng' => -72.6889,
                'zoom' => 14,
                'orden' => 95,
            ],
            [
                'slug' => 'villa-manihuales',
                'nombre' => ['es' => 'Villa Mañihuales', 'en' => 'Villa Mañihuales'],
                'lat' => -45.2103,
                'lng' => -72.1547,
                'zoom' => 15,
                'orden' => 100,
            ],
            [
                'slug' => 'puerto-aysen',
                'nombre' => ['es' => 'Puerto Aysén', 'en' => 'Puerto Aysén'],
                'lat' => -45.4033,
                'lng' => -72.6947,
                'zoom' => 14,
                'orden' => 110,
            ],
            [
                'slug' => 'puerto-chacabuco',
                'nombre' => ['es' => 'Puerto Chacabuco', 'en' => 'Puerto Chacabuco'],
                'lat' => -45.4667,
                'lng' => -72.8167,
                'zoom' => 15,
                'orden' => 115,
            ],
            [
                'slug' => 'coyhaique',
                'nombre' => ['es' => 'Coyhaique', 'en' => 'Coyhaique'],
                'lat' => -45.5719,
                'lng' => -72.0683,
                'zoom' => 13,
                'orden' => 120,
            ],
            [
                'slug' => 'villa-cerro-castillo',
                'nombre' => ['es' => 'Villa Cerro Castillo', 'en' => 'Villa Cerro Castillo'],
                'lat' => -46.1216,
                'lng' => -72.1636,
                'zoom' => 15,
                'orden' => 130,
            ],
            [
                'slug' => 'puerto-rio-tranquilo',
                'nombre' => ['es' => 'Puerto Río Tranquilo', 'en' => 'Puerto Río Tranquilo'],
                'lat' => -46.6252,
                'lng' => -72.6735,
                'zoom' => 14,
                'orden' => 140,
            ],
            [
                'slug' => 'puerto-guadal',
                'nombre' => ['es' => 'Puerto Guadal', 'en' => 'Puerto Guadal'],
                'lat' => -46.8442,
                'lng' => -72.7027,
                'zoom' => 15,
                'orden' => 150,
            ],
            [
                'slug' => 'chile-chico',
                'nombre' => ['es' => 'Chile Chico', 'en' => 'Chile Chico'],
                'lat' => -46.5399,
                'lng' => -71.7288,
                'zoom' => 14,
                'orden' => 155,
            ],
            [
                'slug' => 'puerto-bertrand',
                'nombre' => ['es' => 'Puerto Bertrand', 'en' => 'Puerto Bertrand'],
                'lat' => -47.0219,
                'lng' => -72.8247,
                'zoom' => 15,
                'orden' => 160,
            ],
            [
                'slug' => 'cochrane',
                'nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539,
                'lng' => -72.5732,
                'zoom' => 13,
                'orden' => 170,
            ],
            [
                'slug' => 'caleta-tortel',
                'nombre' => ['es' => 'Caleta Tortel', 'en' => 'Caleta Tortel'],
                'lat' => -47.7967,
                'lng' => -73.5360,
                'zoom' => 15,
                'orden' => 180,
            ],
            [
                'slug' => 'villa-ohiggins',
                'nombre' => ['es' => "Villa O'Higgins", 'en' => "Villa O'Higgins"],
                'lat' => -48.4686,
                'lng' => -72.5601,
                'zoom' => 14,
                'orden' => 190,
            ],
        ];

        foreach ($localidades as $l) {
            Localidad::updateOrCreate(
                ['slug' => $l['slug']],
                [
                    'nombre' => $l['nombre'],
                    'lat' => $l['lat'],
                    'lng' => $l['lng'],
                    'zoom' => $l['zoom'],
                    'orden' => $l['orden'],
                    'publicado' => true,
                ]
            );
        }
    }
}
