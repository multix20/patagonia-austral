<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Importación de los DATOS DE CONTACTO publicados por carretera-austral.cl.
// Lee data/ca_places.json — generado por scripts/carretera-austral/2_a_places.py.
//
// De la fuente entran HECHOS (nombre, teléfono, WhatsApp, horario, dirección,
// coordenada); las descripciones son plantillas bilingües escritas por el
// proyecto. La prosa de una guía ajena no se copia — ver la cabecera de
// 2_a_places.py.
//
// NO se registra en DatabaseSeeder: igual que SERNATUR y Tortel, se corre a mano
// y contra la base que corresponda:
//     php artisan db:seed --class=Database\\Seeders\\CarreteraAustralPlaceSeeder
//
// TODO entra en BORRADOR (publicado=false). Rige "un servicio publicado por
// localidad y categoría" (27-jul-2026): estas fichas se revisan y se publican
// una a una desde el CMS, después de verificar el teléfono y corregir el pin.
//
// Idempotente: updateOrCreate por id, con los ids arrancando en 5000 para no
// chocar con el seed a mano (1–195 y 3001–3083), SERNATUR (2000–2181), Tortel
// (4000+) ni con lo que crea el CMS.
class CarreteraAustralPlaceSeeder extends Seeder
{
    public function run(): void
    {
        $ruta = database_path('seeders/data/ca_places.json');
        if (! is_file($ruta)) {
            $this->command->error("No encuentro $ruta. Copia ahí el JSON de scripts/carretera-austral/2_a_places.py.");

            return;
        }

        $lugares = json_decode(file_get_contents($ruta), true);
        if (! is_array($lugares)) {
            $this->command->error('ca_places.json no es un JSON válido.');

            return;
        }

        $localidades = Localidad::pluck('id', 'slug');

        // Índice de lo que YA existe fuera de este lote. Es el deduplicado que
        // manda: el del paso 2 compara contra places.json, que es solo el seed a
        // mano — acá se compara contra la base de verdad, donde también están
        // SERNATUR, Tortel y todo lo cargado desde el CMS.
        $idsLote = array_column($lugares, 'id');
        $existentes = [];
        $telefonos = [];
        Place::whereNotIn('id', $idsLote ?: [0])
            ->get(['nombre', 'localidad_id', 'tel', 'whatsapp'])
            ->each(function ($p) use (&$existentes, &$telefonos) {
                $existentes[$this->claveDup($p->nombre['es'] ?? '', $p->localidad_id)] = true;
                foreach ([$p->tel, $p->whatsapp] as $t) {
                    if ($d = preg_replace('/\D/', '', (string) $t)) {
                        // Los últimos 8 dígitos: el mismo número escrito con y
                        // sin +56 tiene que colisionar igual.
                        $telefonos[substr($d, -8)] = true;
                    }
                }
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
            $fono = preg_replace('/\D/', '', (string) ($l['tel'] ?? $l['whatsapp'] ?? ''));
            $fono = $fono ? substr($fono, -8) : null;

            // Mismo nombre en la misma localidad, o el mismo teléfono en
            // cualquier parte: una guía ajena lista negocios que el proyecto ya
            // cargó a mano, muchas veces con el nombre escrito distinto.
            if (isset($existentes[$clave]) || ($fono && isset($telefonos[$fono]))) {
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
                    // `whatsapp` y `horario` son columnas desde el 15-ago-2026 y
                    // el dato se pierde en silencio si el seeder no las copia
                    // —le pasó a PlaceSeeder con las barcazas—. Al agregar una
                    // columna: BD, CMS, API y seeder.
                    'whatsapp' => $l['whatsapp'] ?? null,
                    'horario' => $l['horario'] ?? null,
                    'nombre' => $l['nombre'],
                    'descripcion' => $l['desc'],
                    'como' => $l['como'],
                    'dist' => $l['dist'],
                    'localidad_id' => $localidades[$slug],
                    // Fijo, no configurable y sin leer el JSON: es dato de
                    // terceros sin verificar. Un flag por-lugar acá sería una
                    // puerta para publicar el lote entero sin querer.
                    'publicado' => false,
                ]
            );
            $existentes[$clave] = true;
            if ($fono) {
                $telefonos[$fono] = true;
            }
            $creados++;
        }

        // Sembrar con ids explícitos no avanza la secuencia de PostgreSQL: sin
        // esto, crear un lugar desde el CMS chocaría con estos ids.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('places', 'id'), (SELECT COALESCE(MAX(id), 1) FROM places))");
        }

        $this->command->info("carretera-austral.cl: $creados fichas importadas EN BORRADOR, $duplicados duplicadas omitidas, $omitidos sin localidad.");
        $this->command->info('Revisar en /admin (filtro: no publicados). Antes de publicar: verificar el teléfono y corregir el pin.');
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
