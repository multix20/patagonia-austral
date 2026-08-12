<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Ruta;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Importa los trazados y áreas del mapa turístico municipal de Tortel. Lee
// data/tortel_rutas.json — generado por scripts/tortel/3_a_rutas.py.
//
// Igual que TortelPlaceSeeder: NO se registra en DatabaseSeeder (no corre en el
// deploy), se ejecuta a mano contra la base que corresponda, e importa TODO en
// borrador para revisarlo desde el CMS.
//
//     php artisan db:seed --class=Database\\Seeders\\RutaSeeder
class RutaSeeder extends Seeder
{
    public function run(): void
    {
        $ruta = database_path('seeders/data/tortel_rutas.json');
        if (! is_file($ruta)) {
            $this->command->error("No encuentro $ruta. Copia ahí el JSON de scripts/tortel/3_a_rutas.py.");

            return;
        }

        $filas = json_decode(file_get_contents($ruta), true);
        if (! is_array($filas)) {
            $this->command->error('tortel_rutas.json no es un JSON válido.');

            return;
        }

        $localidades = Localidad::pluck('id', 'slug');
        $creados = $omitidos = 0;

        foreach ($filas as $f) {
            $slug = $f['localidad'] ?? null;
            if ($slug && ! isset($localidades[$slug])) {
                $this->command->warn("Localidad no encontrada para ruta {$f['id']}: '$slug' — omitida.");
                $omitidos++;

                continue;
            }

            if (! in_array($f['tipo'] ?? '', Ruta::TIPOS, true)) {
                $this->command->warn("Tipo desconocido en ruta {$f['id']}: '{$f['tipo']}' — omitida.");
                $omitidos++;

                continue;
            }

            Ruta::updateOrCreate(
                ['id' => $f['id']],
                [
                    'tipo' => $f['tipo'],
                    'nombre' => $f['nombre'],
                    'descripcion' => $f['descripcion'] ?? null,
                    'largo_km' => $f['largo_km'] ?? null,
                    'geometria' => $f['geometria'],
                    'localidad_id' => $slug ? $localidades[$slug] : null,
                    // Fijo, sin leer el JSON: son geometrías importadas de un
                    // mapa de terceros y se revisan antes de mostrarse.
                    'publicado' => false,
                ]
            );
            $creados++;
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('rutas', 'id'), (SELECT COALESCE(MAX(id), 1) FROM rutas))");
        }

        $this->command->info("Rutas: $creados importadas EN BORRADOR, $omitidos omitidas.");
        $this->command->info('Revisar y publicar desde /admin → Rutas y áreas.');
    }
}
