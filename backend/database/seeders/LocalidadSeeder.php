<?php

namespace Database\Seeders;

use App\Models\Localidad;
use Illuminate\Database\Seeder;

// Localidades de la Carretera Austral sur (Fases 1 y 2 — multi-localidad).
// Idempotente: updateOrCreate por slug; corre en cada arranque del contenedor.
// `orden` va norte → sur en decenas para poder intercalar pueblos después
// (Coyhaique=10 · Cerro Castillo=20 · Río Tranquilo=30 · Guadal=40 ·
//  Chile Chico=45 · Bertrand=50 · Cochrane=60 · Tortel=70 · Villa O'Higgins=80).
// Chile Chico va en 45: no está sobre la Carretera pero es el desvío clásico
// por la ribera sur del lago General Carrera, entre Guadal y Bertrand.
class LocalidadSeeder extends Seeder
{
    public function run(): void
    {
        $localidades = [
            [
                'slug' => 'coyhaique',
                'nombre' => ['es' => 'Coyhaique', 'en' => 'Coyhaique'],
                'lat' => -45.5719,
                'lng' => -72.0683,
                'zoom' => 13,
                'orden' => 10,
            ],
            [
                'slug' => 'villa-cerro-castillo',
                'nombre' => ['es' => 'Villa Cerro Castillo', 'en' => 'Villa Cerro Castillo'],
                'lat' => -46.1216,
                'lng' => -72.1636,
                'zoom' => 15,
                'orden' => 20,
            ],
            [
                'slug' => 'puerto-rio-tranquilo',
                'nombre' => ['es' => 'Puerto Río Tranquilo', 'en' => 'Puerto Río Tranquilo'],
                'lat' => -46.6252,
                'lng' => -72.6735,
                'zoom' => 14,
                'orden' => 30,
            ],
            [
                'slug' => 'puerto-guadal',
                'nombre' => ['es' => 'Puerto Guadal', 'en' => 'Puerto Guadal'],
                'lat' => -46.8442,
                'lng' => -72.7027,
                'zoom' => 15,
                'orden' => 40,
            ],
            [
                'slug' => 'chile-chico',
                'nombre' => ['es' => 'Chile Chico', 'en' => 'Chile Chico'],
                'lat' => -46.5399,
                'lng' => -71.7288,
                'zoom' => 14,
                'orden' => 45,
            ],
            [
                'slug' => 'puerto-bertrand',
                'nombre' => ['es' => 'Puerto Bertrand', 'en' => 'Puerto Bertrand'],
                'lat' => -47.0219,
                'lng' => -72.8247,
                'zoom' => 15,
                'orden' => 50,
            ],
            [
                'slug' => 'cochrane',
                'nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539,
                'lng' => -72.5732,
                'zoom' => 13,
                'orden' => 60,
            ],
            [
                'slug' => 'caleta-tortel',
                'nombre' => ['es' => 'Caleta Tortel', 'en' => 'Caleta Tortel'],
                'lat' => -47.7967,
                'lng' => -73.5360,
                'zoom' => 15,
                'orden' => 70,
            ],
            [
                'slug' => 'villa-ohiggins',
                'nombre' => ['es' => "Villa O'Higgins", 'en' => "Villa O'Higgins"],
                'lat' => -48.4686,
                'lng' => -72.5601,
                'zoom' => 14,
                'orden' => 80,
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
