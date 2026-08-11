<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

// Contador diario de una interacción de la PWA. Ver la migración para por qué
// esto es un rollup y no un registro por evento.
class Interaccion extends Model
{
    protected $table = 'interacciones';

    protected $fillable = ['tipo', 'referencia', 'dia', 'cantidad'];

    protected $casts = [
        'dia' => 'date',
        'cantidad' => 'integer',
    ];

    /**
     * Lista blanca de tipos. La API rechaza cualquier otro.
     *
     * Es a propósito una lista CERRADA y no un campo libre: la tabla la escribe
     * un endpoint público sin login, así que sin lista blanca cualquiera podría
     * inventar millones de tipos distintos y hacer crecer la tabla sin techo —
     * el rollup dejaría de acotar nada. Con la lista, el número de filas por día
     * está limitado por el catálogo (tipos × referencias posibles).
     *
     * El valor de cada entrada es la etiqueta que muestra el CMS.
     */
    public const TIPOS = [
        'app_abierta' => 'Aperturas de la app',
        'localidad' => 'Localidad abierta',
        'ficha' => 'Ficha vista',
        'como_llegar' => 'Cómo llegar',
        'llamar' => 'Llamar',
        'compartir' => 'Compartir',
        'busqueda' => 'Buscador abierto',
        'chat' => 'Asistente abierto',
        'reporte' => 'Reporte enviado',
        'voto' => 'Voto en un reporte',
        'calificacion' => 'Calificación enviada',
        'idioma' => 'Cambio de idioma',
    ];

    /** Tope por evento y envío: ataja un lote absurdo sin castigar el uso real. */
    public const MAX_POR_EVENTO = 500;

    /**
     * Suma `cantidad` al contador del día. Una sola consulta atómica: dos
     * viajeros mandando su lote a la vez no se pisan (la unicidad de
     * (tipo, referencia, día) la impone la BD, y el UPSERT resuelve el choque
     * sumando en vez de fallar).
     *
     * Ojo con `referencia` NULL: en SQL, NULL nunca es igual a NULL, así que un
     * índice único NO impide filas repetidas con referencia nula. Por eso los
     * eventos sin referencia se guardan con cadena vacía y no con NULL.
     */
    public static function sumar(string $tipo, ?string $referencia, int $cantidad, ?Carbon $dia = null): void
    {
        $fila = [
            'tipo' => $tipo,
            'referencia' => (string) $referencia,
            'dia' => ($dia ?? now())->toDateString(),
        ];

        static::query()->upsert(
            [$fila + [
                'cantidad' => $cantidad,
                'created_at' => now(),
                'updated_at' => now(),
            ]],
            ['tipo', 'referencia', 'dia'],
            ['cantidad' => DB::raw('interacciones.cantidad + excluded.cantidad'), 'updated_at' => DB::raw('excluded.updated_at')]
        );
    }
}
