<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Importación masiva de los servicios de alojamiento extraídos de SERNATUR
// (scripts/sernatur/). Lee data/sernatur_places.json — generado por
// scripts/sernatur/2_generar_textos.py — con la MISMA forma que places.json.
//
// NO se registra en DatabaseSeeder: se corre a mano cuando el fundador ya
// revisó los textos:
//     php artisan db:seed --class=Database\\Seeders\\SernaturPlaceSeeder
//
// Idempotente: updateOrCreate por id (los ids arrancan en 2000 para no chocar
// con los ids semilla ni con los que crea el CMS).
class SernaturPlaceSeeder extends Seeder
{
    // Publicar de inmediato (true) o dejar en borrador para revisar en /admin (false).
    private const PUBLICAR = false;

    public function run(): void
    {
        $ruta = database_path('seeders/data/sernatur_places.json');
        if (! is_file($ruta)) {
            $this->command->error("No encuentro $ruta. Copia ahí el JSON generado por el paso 2.");

            return;
        }

        $lugares = json_decode(file_get_contents($ruta), true);
        if (! is_array($lugares)) {
            $this->command->error('sernatur_places.json no es un JSON válido.');

            return;
        }

        // Mapa slug → id de localidad (LocalidadSeeder debe haber corrido antes).
        $localidades = Localidad::pluck('id', 'slug');

        $creados = $omitidos = 0;
        foreach ($lugares as $l) {
            $slug = $l['localidad'] ?? null;
            if (! $slug || ! isset($localidades[$slug])) {
                $this->command->warn("Localidad no encontrada para id {$l['id']}: '$slug' — omitido.");
                $omitidos++;

                continue;
            }

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
                    'localidad_id' => $localidades[$slug],
                    'publicado' => self::PUBLICAR,
                ]
            );
            $creados++;
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL:
        // sin esto, crear un lugar desde el CMS chocaría con estos ids.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('places', 'id'), (SELECT COALESCE(MAX(id), 1) FROM places))");
        }

        $estado = self::PUBLICAR ? 'publicados' : 'en borrador';
        $this->command->info("SERNATUR: $creados servicios importados ($estado), $omitidos omitidos.");
    }
}
