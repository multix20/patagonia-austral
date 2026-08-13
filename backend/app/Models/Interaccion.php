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

    /**
     * Agrupaciones que responden una PREGUNTA, no un tipo técnico. Es lo que
     * muestra el panel: nadie decide nada mirando "compartir: 4", pero sí
     * mirando "4 personas quisieron contactar un negocio".
     */
    public const GRUPOS = [
        // Lo más parecido a una venta que puede medir un directorio: alguien
        // pidió cómo llegar, llamó, o le mandó la ficha a otra persona.
        'contacto' => ['como_llegar', 'llamar', 'compartir'],
        // Lo que devuelve la comunidad: reportes de ruta, votos y estrellas.
        'aportes' => ['reporte', 'voto', 'calificacion'],
    ];

    /**
     * Tipos cuya `referencia` es el id de una ficha. En el resto la referencia
     * es otra cosa (slug de localidad, idioma, tipo de reporte), y por eso no
     * se puede traducir a un nombre sin mirar antes el tipo.
     */
    public const TIPOS_DE_FICHA = ['ficha', 'como_llegar', 'llamar', 'compartir'];

    /** Tope por evento y envío: ataja un lote absurdo sin castigar el uso real. */
    public const MAX_POR_EVENTO = 500;

    /** Suma de `cantidad` de unos tipos entre dos días, ambos incluidos. */
    public static function total(array $tipos, string $desde, string $hasta): int
    {
        return (int) static::query()
            ->whereIn('tipo', $tipos)
            ->whereBetween('dia', [$desde, $hasta])
            ->sum('cantidad');
    }

    /**
     * Serie diaria, con los días sin actividad EN CERO.
     *
     * El relleno no es un detalle de presentación: la tabla solo tiene filas de
     * los días en que pasó algo, así que dibujar lo que devuelve la consulta
     * pondría el lunes al lado del jueves con la misma separación que dos días
     * seguidos. Un gráfico así no está incompleto, está MINTIENDO sobre el
     * ritmo — que es justo lo único que se le pide.
     *
     * @return array<string, int> ['2026-08-01' => 3, '2026-08-02' => 0, …]
     */
    public static function serie(array $tipos, string $desde, string $hasta): array
    {
        $conteo = static::query()
            ->whereIn('tipo', $tipos)
            ->whereBetween('dia', [$desde, $hasta])
            ->groupBy('dia')
            ->selectRaw('dia, SUM(cantidad) as total')
            ->pluck('total', 'dia')
            // Postgres y SQLite no devuelven la fecha con el mismo formato:
            // se normaliza antes de usarla como clave.
            ->mapWithKeys(fn ($total, $dia) => [Carbon::parse($dia)->toDateString() => (int) $total])
            ->all();

        $serie = [];
        for ($d = Carbon::parse($desde); $d->lte(Carbon::parse($hasta)); $d->addDay()) {
            $serie[$d->toDateString()] = $conteo[$d->toDateString()] ?? 0;
        }

        return $serie;
    }

    /**
     * Ranking por `referencia`: qué localidad se abre más, qué ficha se mira
     * más. Es lo que la lista cruda NO puede contestar, porque el rollup guarda
     * una fila por DÍA y en pantalla la misma ficha aparece repetida una vez
     * por jornada.
     *
     * Se agrupa por (referencia, tipo) y se pliega en PHP en vez de armar un
     * `SUM(CASE WHEN …)` por tipo: el número de filas está acotado por el
     * catálogo —es la propiedad que define esta tabla, ver la migración—, así
     * que la consulta trae poco y el código queda sin SQL construido a mano.
     *
     * @return array<int, array{referencia: string, total: int, por_tipo: array<string, int>}>
     */
    public static function ranking(array $tipos, string $desde, string $hasta, int $limite = 8): array
    {
        $filas = static::query()
            ->whereIn('tipo', $tipos)
            ->whereBetween('dia', [$desde, $hasta])
            // Los eventos sin referencia ('app_abierta', 'busqueda', 'chat') no
            // rankean nada: no apuntan a ninguna ficha ni localidad.
            ->where('referencia', '<>', '')
            ->groupBy('referencia', 'tipo')
            ->selectRaw('referencia, tipo, SUM(cantidad) as total')
            ->get();

        $porReferencia = [];
        foreach ($filas as $fila) {
            $ref = (string) $fila->referencia;
            $porReferencia[$ref] ??= ['referencia' => $ref, 'total' => 0, 'por_tipo' => []];
            $porReferencia[$ref]['total'] += (int) $fila->total;
            $porReferencia[$ref]['por_tipo'][$fila->tipo] = (int) $fila->total;
        }

        usort($porReferencia, fn ($a, $b) => $b['total'] <=> $a['total']);

        return array_slice($porReferencia, 0, $limite);
    }

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
