<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

// Publica (publicado = true) los N alojamientos con la ficha más completa de
// cada localidad, sobre los ya cargados en la BD (importación SERNATUR). Sirve
// para habilitar el "top N" sin ir uno por uno en el CMS. Reutilizable: se puede
// correr de nuevo tras cargar más data (`php artisan alojamientos:publicar-top`).
class PublicarTopAlojamientos extends Command
{
    protected $signature = 'alojamientos:publicar-top {n=10 : Cuántos publicar por localidad}';

    protected $description = 'Publica los N alojamientos con datos más completos de cada localidad (aditivo: no despublica).';

    public function handle(): int
    {
        $n = max(0, (int) $this->argument('n'));
        $ids = self::idsTop($n);

        if (empty($ids)) {
            $this->info('No hay alojamientos por publicar.');

            return self::SUCCESS;
        }

        $afectados = DB::table('places')->whereIn('id', $ids)->update(['publicado' => true]);
        $this->info("Alojamientos publicados (top $n por localidad): $afectados.");

        return self::SUCCESS;
    }

    /**
     * Devuelve los ids de los N alojamientos con ficha más completa de cada
     * localidad. Ranking: con teléfono primero, luego descripción más completa,
     * desempate alfabético por nombre (ES). Nota: el score exacto del pipeline
     * SERNATUR (3·tel + 2·dirección + 1·email) no quedó en la BD —la dirección y
     * el email se fundieron en el texto—, así que aquí se aproxima con las señales
     * disponibles. Aditivo por diseño: quien llama solo pone publicado=true.
     */
    public static function idsTop(int $n): array
    {
        if ($n <= 0) {
            return [];
        }

        $porLocalidad = DB::table('places')
            ->where('cat', 'alojamiento')
            ->get(['id', 'localidad_id', 'tel', 'nombre', 'descripcion'])
            ->groupBy('localidad_id');

        $ids = [];
        foreach ($porLocalidad as $items) {
            $ordenados = $items->sort(function ($a, $b) {
                $telA = empty($a->tel) ? 0 : 1;
                $telB = empty($b->tel) ? 0 : 1;
                if ($telA !== $telB) {
                    return $telB <=> $telA;
                }
                // `descripcion` viene como string JSON (query builder no castea);
                // su largo aproxima la completitud de la ficha (ES + EN).
                $largoA = strlen((string) $a->descripcion);
                $largoB = strlen((string) $b->descripcion);
                if ($largoA !== $largoB) {
                    return $largoB <=> $largoA;
                }
                $nombreA = json_decode((string) $a->nombre, true)['es'] ?? '';
                $nombreB = json_decode((string) $b->nombre, true)['es'] ?? '';

                return strcmp($nombreA, $nombreB);
            })->values();

            foreach ($ordenados->take($n) as $r) {
                $ids[] = $r->id;
            }
        }

        return $ids;
    }
}
