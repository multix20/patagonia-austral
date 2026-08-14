<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Devuelve al mapa las tres fichas de Tortel que quedaron en revisión tras la
 * limpieza.
 *
 * La que más pesa es **Isla de los Muertos**: Monumento Histórico Nacional en el
 * delta del río Baker y probablemente el sitio más conocido de la comuna.
 * Llevaba sin publicar desde antes del lote municipal —o sea que la app cubría
 * Tortel sin mostrar su hito— y salió a la luz justamente al contar los
 * atractivos durante la curación. Tiene texto propio y curado, no de plantilla.
 *
 * Las otras dos (Plaza de Armas y El Mercadito) vuelven por decisión editorial:
 * en un pueblo sin calles, construido sobre pasarelas, las plazas no son adorno
 * urbano sino los puntos de referencia con los que la gente se orienta y se cita.
 * Van con una advertencia, ver abajo.
 */
return new class extends Migration
{
    private const PUBLICAR = [
        20 => 'Isla de los Muertos',
        4010 => 'Plaza de Armas',
        4011 => 'El Mercadito',
    ];

    public function up(): void
    {
        $this->marcar(true);
    }

    public function down(): void
    {
        $this->marcar(false);
    }

    /**
     * OJO con el texto de las dos plazas: hoy dicen "Plaza. Atractivo turístico
     * de Caleta Tortel, sector Centro." — la descripción de plantilla que generó
     * el importador, no algo escrito para un viajero. La ficha ya sirve como
     * referencia en el mapa, pero no tiene nada que contar todavía. Queda
     * anotado en ESTADO_Y_PENDIENTES para reemplazarlo con texto de verdad.
     */
    private function marcar(bool $publicado): void
    {
        $tortel = DB::table('localidades')->where('slug', 'caleta-tortel')->value('id');
        if (! $tortel) {
            return;
        }

        $comparador = DB::connection()->getDriverName() === 'pgsql'
            ? "nombre->>'es' = ?"
            : "json_extract(nombre, '$.es') = ?";

        foreach (self::PUBLICAR as $id => $nombre) {
            DB::table('places')
                ->where('id', $id)
                ->where('localidad_id', $tortel)
                ->whereRaw($comparador, [$nombre])
                ->update(['publicado' => $publicado, 'updated_at' => now()]);
        }
    }
};
