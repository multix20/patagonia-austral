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
    // Respaldo cuando un registro del JSON no trae su propio flag 'publicado'
    // (JSON antiguos, previos a la selección "siembra gratis" del paso 2).
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

        // Índice de lugares YA existentes que NO son de este lote (los que cargó
        // el fundador a mano en el CMS, p.ej. Tortel y Villa O'Higgins). Sirve
        // para no duplicar: clave = nombre normalizado + localidad_id.
        $idsLote = array_column($lugares, 'id');
        $existentes = [];
        Place::whereNotIn('id', $idsLote ?: [0])
            ->get(['nombre', 'localidad_id'])
            ->each(function ($p) use (&$existentes) {
                $nombre = $p->nombre['es'] ?? '';
                $existentes[$this->claveDup($nombre, $p->localidad_id)] = true;
            });

        $creados = $omitidos = $publicados = $duplicados = 0;
        foreach ($lugares as $l) {
            $slug = $l['localidad'] ?? null;
            if (! $slug || ! isset($localidades[$slug])) {
                $this->command->warn("Localidad no encontrada para id {$l['id']}: '$slug' — omitido.");
                $omitidos++;

                continue;
            }

            // Deduplicación: si ya existe un lugar con el mismo nombre en la misma
            // localidad (cargado a mano), se omite para no duplicarlo.
            $clave = $this->claveDup($l['nombre']['es'] ?? '', $localidades[$slug]);
            if (isset($existentes[$clave])) {
                $this->command->warn("Duplicado (ya existe): {$l['nombre']['es']} en $slug — omitido.");
                $duplicados++;

                continue;
            }

            // 'publicado' por-lugar (siembra gratis: top N de cada localidad).
            // Si el JSON no lo trae, cae al respaldo global.
            $publicado = $l['publicado'] ?? self::PUBLICAR;

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
                    'publicado' => $publicado,
                ]
            );
            $creados++;
            $publicados += $publicado ? 1 : 0;
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL:
        // sin esto, crear un lugar desde el CMS chocaría con estos ids.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('places', 'id'), (SELECT COALESCE(MAX(id), 1) FROM places))");
        }

        $borrador = $creados - $publicados;
        $this->command->info("SERNATUR: $creados servicios importados ($publicados publicados, $borrador en borrador), $duplicados duplicados omitidos, $omitidos sin localidad.");
    }

    // Clave de deduplicación: nombre normalizado (minúsculas, sin acentos ni
    // símbolos, espacios colapsados) + id de localidad.
    private function claveDup(string $nombre, ?int $localidadId): string
    {
        $n = mb_strtolower(trim($nombre));
        $n = strtr($n, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'ü' => 'u']);
        $n = preg_replace('/[^a-z0-9]+/', ' ', $n);
        $n = trim(preg_replace('/\s+/', ' ', $n));

        return $n.'|'.($localidadId ?? '');
    }
}
