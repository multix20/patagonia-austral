<?php

namespace Database\Seeders;

use App\Models\Notice;
use App\Models\Place;
use Illuminate\Database\Seeder;

// Siembra el directorio turístico desde data/places.json y data/notices.json
// (mismos datos semilla del frontend, generados automáticamente)
class PlaceSeeder extends Seeder
{
    public function run(): void
    {
        $lugares = json_decode(file_get_contents(database_path('seeders/data/places.json')), true);

        foreach ($lugares as $l) {
            Place::updateOrCreate(
                ['id' => $l['id']],
                [
                    'cat' => $l['cat'],
                    'lat' => $l['lat'],
                    'lng' => $l['lng'],
                    'tel' => $l['tel'] ?? null,
                    'nombre' => $l['nombre'],
                    'descripcion' => $l['desc'],
                    'como' => $l['como'],
                    'dist' => $l['dist'],
                    'publicado' => true,
                ]
            );
        }

        $avisos = json_decode(file_get_contents(database_path('seeders/data/notices.json')), true);

        // Evita comparar la columna jsonb con igualdad (no soportado por PostgreSQL);
        // siembra solo si aún no hay avisos, para no duplicar en re-ejecuciones.
        if (Notice::count() === 0) {
            foreach ($avisos as $a) {
                Notice::create([
                    'mensaje' => $a,
                    'tipo' => 'info',
                    'publicado_en' => now(),
                ]);
            }
        }
    }
}
