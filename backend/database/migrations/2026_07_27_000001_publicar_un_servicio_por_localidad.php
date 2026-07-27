<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Deja la BD con UN SOLO servicio publicado por localidad y categoría (regla de
// datos de jul-2026: primero la calidad del dato, después el volumen). Hace la
// pasada que el seeder no puede hacer solo, porque `updateOrCreate` nunca toca
// las filas que no están en places.json: los ~100 alojamientos SERNATUR (ids
// 2000+) y cualquier ficha cargada a mano en el CMS.
//
// Corre en el deploy (`migrate --force --seed`) ANTES del PlaceSeeder, que a
// continuación reafirma el estado de las fichas del JSON y publica las
// preliminares (ids 3000+) solo en los cupos que hayan quedado vacíos.
//
// Es una pasada ÚNICA: de ahí en adelante el CMS manda y nadie despublica por
// detrás. Si se quiere volver a normalizar, generar una migración nueva.
return new class extends Migration
{
    /**
     * Selección curada del propio places.json: la ficha que queda publicada en
     * cada cupo (localidad + categoría) del contenido ya redactado. El resto del
     * JSON queda con "publicado": false y se conserva para cuando se abra la mano.
     */
    private const IDS_PUBLICADOS = [
        1, 9, 11, 14, 16, 18, 19, 21, 22, 27, 28, 30, 35, 36, 38, 43, 44, 46, 50,
        51, 53, 57, 58, 60, 65, 66, 68, 74, 75, 78, 81, 82, 83, 86, 89, 91, 94,
        97, 98, 102, 105, 107, 111, 114, 116, 120, 123, 126, 128, 131, 133, 137,
        140, 142, 145, 148, 150, 153, 157, 159, 162, 165, 166, 169, 170, 171,
        172, 173, 176, 180, 182, 186, 191,
    ];

    /**
     * Rango de ids de las fichas PRELIMINARES del JSON (relleno verosímil sin
     * teléfono). Al cerrar el deploy todavía no existen en la BD —las crea el
     * seeder—, pero se excluyen explícitamente para no confundirlas con lo que
     * el CMS cree después, que sí es candidato válido a ocupar un cupo.
     */
    private const IDS_PRELIMINARES = [3001, 3083];

    public function up(): void
    {
        // 1. Nada publicado: se parte de cero para que el cupo quede en uno.
        DB::table('places')->update(['publicado' => false]);

        // 2. La selección curada del JSON.
        DB::table('places')->whereIn('id', self::IDS_PUBLICADOS)->update(['publicado' => true]);

        // 3. Cupos que el JSON no cubre (sobre todo `alojamiento`, que en la BD
        //    viene del lote SERNATUR): se publica el mejor candidato real que
        //    haya —destacado primero, luego con teléfono, luego el id más bajo—
        //    dejando afuera solo las fichas preliminares del JSON, que son
        //    relleno y las publica el seeder únicamente si el cupo sigue vacío.
        $cupos = DB::table('places')
            ->select('localidad_id', 'cat')
            ->whereNotNull('localidad_id')
            ->whereNotBetween('id', self::IDS_PRELIMINARES)
            ->groupBy('localidad_id', 'cat')
            ->havingRaw('SUM(CASE WHEN publicado THEN 1 ELSE 0 END) = 0')
            ->get();

        foreach ($cupos as $cupo) {
            $id = DB::table('places')
                ->where('localidad_id', $cupo->localidad_id)
                ->where('cat', $cupo->cat)
                ->whereNotBetween('id', self::IDS_PRELIMINARES)
                ->orderByDesc('destacado')
                ->orderByRaw('CASE WHEN tel IS NULL OR tel = \'\' THEN 1 ELSE 0 END')
                ->orderBy('id')
                ->value('id');

            if ($id) {
                DB::table('places')->where('id', $id)->update(['publicado' => true]);
            }
        }
    }

    public function down(): void
    {
        // No se revierte: no guardamos el estado de publicación previo por fila.
        // Para volver a publicar algo, hacerlo desde el CMS.
    }
};
