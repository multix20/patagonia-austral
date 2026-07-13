<?php

namespace Database\Seeders;

use App\Models\Localidad;
use Illuminate\Database\Seeder;

// Localidades de la Carretera Austral sur (Fase 1 — multi-localidad).
// Idempotente: updateOrCreate por slug; corre en cada arranque del contenedor.
// `orden` va en decenas norte → sur para poder intercalar pueblos después
// (Coyhaique=10 · Cerro Castillo=20 · Río Tranquilo=30 · Guadal/Chile Chico=40
//  · Bertrand=50 · Cochrane=60 · Tortel=70 · Villa O'Higgins=80).
class LocalidadSeeder extends Seeder
{
    public function run(): void
    {
        $localidades = [
            [
                'slug' => 'puerto-rio-tranquilo',
                'nombre' => ['es' => 'Puerto Río Tranquilo', 'en' => 'Puerto Río Tranquilo'],
                'lat' => -46.6252,
                'lng' => -72.6735,
                'zoom' => 14,
                'orden' => 30,
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
