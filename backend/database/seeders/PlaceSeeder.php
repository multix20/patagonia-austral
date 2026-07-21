<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Notice;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Siembra el directorio turístico desde data/places.json y data/notices.json
// (mismos datos semilla del frontend — mantener ambos archivos en espejo)
class PlaceSeeder extends Seeder
{
    public function run(): void
    {
        $lugares = json_decode(file_get_contents(database_path('seeders/data/places.json')), true);

        // Purga los lugares "(ejemplo)" que se sembraron antes de pasar a
        // contenido real (Fase 3). Idempotente: tras la primera pasada no queda
        // ninguno. updateOrCreate no borra lo que se quitó del JSON, por eso este
        // barrido explícito elimina también los que ya están en la BD.
        $ejemplos = Place::where('nombre->es', 'like', '%(ejemplo)%')->delete();
        if ($ejemplos > 0) {
            $this->command->info("PlaceSeeder: $ejemplos lugares de ejemplo eliminados.");
        }

        // Mapa slug → id para resolver la localidad de cada lugar semilla
        // (LocalidadSeeder corre antes en DatabaseSeeder).
        $localidades = Localidad::pluck('id', 'slug');

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
                    'localidad_id' => $localidades[$l['localidad'] ?? 'cochrane'] ?? null,
                    'publicado' => true,
                    'destacado' => $l['destacado'] ?? false,
                ]
            );
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL:
        // sin esto, crear un lugar desde el CMS chocaría con los ids semilla.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('places', 'id'), (SELECT COALESCE(MAX(id), 1) FROM places))");
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
