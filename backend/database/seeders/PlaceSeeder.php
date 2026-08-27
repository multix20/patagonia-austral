<?php

namespace Database\Seeders;

use App\Models\Localidad;
use App\Models\Notice;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Siembra el directorio turístico desde data/places.json y data/notices.json
// (mismos datos semilla del frontend — mantener ambos archivos en espejo)
//
// Desde jul-2026 el JSON manda sobre el estado de publicación, siguiendo la regla
// "un servicio publicado por localidad y categoría":
//   - `"publicado": false` → la ficha se carga pero no se sirve por la API.
//     Ausente → se publica (el caso normal).
//   - `"preliminar": true` → cupo reservado con una ficha verosímil sin teléfono
//     (dormir/comer/eventos sin dato real todavía). Se publica SOLO si en ese
//     cupo (localidad + categoría) no hay ninguna otra ficha publicada, para que
//     un dato real —p. ej. un alojamiento SERNATUR o algo cargado en el CMS—
//     siempre le gane al relleno.
class PlaceSeeder extends Seeder
{
    public function run(): void
    {
        // FRENO — no re-sembrar sobre una base que ya tiene contenido.
        //
        // `docker/start.sh` corre `migrate --force --seed` en CADA arranque del
        // contenedor, y en Render free el servicio se duerme a los ~15 min: o sea
        // que esto se ejecuta varias veces al día. Como `sembrar()` hace un
        // updateOrCreate con TODOS los campos —incluidos `publicado` y
        // `destacado`—, cada pasada revertía a places.json lo curado en /admin.
        // El síntoma era mudo: editabas el CMS, el servicio despertaba y la
        // selección volvía sola a la del JSON.
        //
        // Para reimportar a propósito (contenido nuevo en places.json):
        //     SEMBRAR_LUGARES=1 php artisan db:seed --class=Database\\Seeders\\PlaceSeeder
        if (Place::count() > 0 && ! env('SEMBRAR_LUGARES')) {
            $this->command->warn('PlaceSeeder: ya hay lugares en la BD — no se re-siembra (SEMBRAR_LUGARES=1 para forzar).');

            return;
        }

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

        // Primero las fichas normales; las preliminares al final, porque su
        // publicación depende de si el cupo quedó ocupado por una ficha real.
        $preliminares = [];
        foreach ($lugares as $l) {
            if ($l['preliminar'] ?? false) {
                $preliminares[] = $l;

                continue;
            }
            $this->sembrar($l, $localidades, $l['publicado'] ?? true);
        }

        foreach ($preliminares as $l) {
            $localidadId = $localidades[$l['localidad'] ?? 'cochrane'] ?? null;
            $cupoOcupado = Place::where('localidad_id', $localidadId)
                ->where('cat', $l['cat'])
                ->where('publicado', true)
                ->where('id', '!=', $l['id'])
                ->exists();
            $this->sembrar($l, $localidades, ! $cupoOcupado);
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

    /** Crea o actualiza un lugar semilla con el estado de publicación indicado. */
    private function sembrar(array $l, $localidades, bool $publicado): void
    {
        Place::updateOrCreate(
            ['id' => $l['id']],
            [
                'cat' => $l['cat'],
                'lat' => $l['lat'],
                'lng' => $l['lng'],
                'tel' => $l['tel'] ?? null,
                // `whatsapp` y `horario` existen como columna desde
                // add_contacto_a_places, pero el sembrado no los copiaba: un dato
                // escrito en places.json se perdía en silencio al sembrar. Se
                // notó cargando los horarios de las barcazas.
                'whatsapp' => $l['whatsapp'] ?? null,
                'email' => $l['email'] ?? null,
                'horario' => $l['horario'] ?? null,
                'nombre' => $l['nombre'],
                'descripcion' => $l['desc'],
                'como' => $l['como'],
                'dist' => $l['dist'],
                'localidad_id' => $localidades[$l['localidad'] ?? 'cochrane'] ?? null,
                'publicado' => $publicado,
                'destacado' => $l['destacado'] ?? false,
            ]
        );
    }
}
