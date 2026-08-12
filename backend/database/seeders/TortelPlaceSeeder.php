<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Importación de los POIs del mapa turístico oficial de la Municipalidad de
// Tortel (https://www.tortel.cl/mapa-turismo-tortel-2024/). Lee
// data/tortel_places.json — generado por scripts/tortel/2_a_places.py.
//
// NO se registra en DatabaseSeeder: igual que el lote SERNATUR, se corre a mano
// y contra la base que corresponda:
//     php artisan db:seed --class=Database\\Seeders\\TortelPlaceSeeder
//
// TODO entra en BORRADOR (publicado=false). Desde el 27-jul-2026 rige un
// servicio publicado por localidad y categoría; estas fichas se revisan y se
// publican una a una desde el CMS. El seeder NO publica nada por su cuenta, ni
// siquiera si el JSON dijera lo contrario — ver $publicado más abajo.
//
// Idempotente: updateOrCreate por id, con los ids arrancando en 4000 para no
// chocar con el seed a mano (1–192 y 3001–3083), con SERNATUR (2000–2181) ni con
// lo que crea el CMS.
class TortelPlaceSeeder extends Seeder
{
    public function run(): void
    {
        $ruta = database_path('seeders/data/tortel_places.json');
        if (! is_file($ruta)) {
            $this->command->error("No encuentro $ruta. Copia ahí el JSON de scripts/tortel/2_a_places.py.");

            return;
        }

        $lugares = json_decode(file_get_contents($ruta), true);
        if (! is_array($lugares)) {
            $this->command->error('tortel_places.json no es un JSON válido.');

            return;
        }

        $localidades = Localidad::pluck('id', 'slug');

        // Índice de lo que YA existe fuera de este lote, para no duplicar lo que
        // el fundador cargó a mano en el CMS: Caleta Tortel es justamente una de
        // las localidades con fichas propias desde el principio.
        $idsLote = array_column($lugares, 'id');
        $existentes = [];
        Place::whereNotIn('id', $idsLote ?: [0])
            ->get(['nombre', 'localidad_id'])
            ->each(function ($p) use (&$existentes) {
                $existentes[$this->claveDup($p->nombre['es'] ?? '', $p->localidad_id)] = true;
            });

        $creados = $omitidos = $duplicados = 0;
        foreach ($lugares as $l) {
            $slug = $l['localidad'] ?? null;
            if (! $slug || ! isset($localidades[$slug])) {
                $this->command->warn("Localidad no encontrada para id {$l['id']}: '$slug' — omitido.");
                $omitidos++;

                continue;
            }

            $clave = $this->claveDup($l['nombre']['es'] ?? '', $localidades[$slug]);
            if (isset($existentes[$clave])) {
                $this->command->warn("Duplicado (ya existe): {$l['nombre']['es']} — omitido.");
                $duplicados++;

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
                    // Fijo, no configurable y sin leer el JSON: es dato municipal
                    // sin revisar y la decisión editorial fue que se cure antes de
                    // salir. Un flag por-lugar acá sería una puerta para publicar
                    // 100 fichas de golpe sin querer.
                    'publicado' => false,
                ]
            );
            $creados++;
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL: sin
        // esto, crear un lugar desde el CMS chocaría con estos ids.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('places', 'id'), (SELECT COALESCE(MAX(id), 1) FROM places))");
        }

        $this->command->info("Tortel: $creados fichas importadas EN BORRADOR, $duplicados duplicadas omitidas, $omitidos sin localidad.");
        $this->command->info('Revisar y publicar desde /admin (filtro: localidad Caleta Tortel + no publicados).');
    }

    // Clave de deduplicación: nombre normalizado + id de localidad.
    private function claveDup(string $nombre, ?int $localidadId): string
    {
        $n = mb_strtolower(trim($nombre));
        $n = strtr($n, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'ü' => 'u']);
        $n = preg_replace('/[^a-z0-9]+/', ' ', $n);
        $n = trim(preg_replace('/\s+/', ' ', $n));

        return $n.'|'.($localidadId ?? '');
    }
}
