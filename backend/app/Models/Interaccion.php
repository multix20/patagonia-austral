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
        // Copiloto del asistente: el viajero pidió disponibilidad a un negocio
        // desde el chat. Es la interacción más cercana a una venta que puede
        // medir un directorio —muy por encima de "vio la ficha"— y es el número
        // con el que se le muestra a un negocio que la app le sirve.
        'consulta_reserva' => 'Consulta de disponibilidad',
        // La misma consulta, pero armada sin cobertura: queda guardada para
        // mandarla al llegar al pueblo. Se cuenta aparte porque mide algo
        // distinto: cuánta decisión se toma en la ruta, sin señal.
        'consulta_guardada' => 'Consulta guardada sin señal',
        'perfil_viaje' => 'Viaje configurado en el asistente',
        // Por dónde llegó quien abrió la app: el código que lleva el enlace
        // (`rutaaustral.cl/?c=muni`), el QR del mesón o la publicación de turno.
        // Es lo único que separa "entraron 40 personas" de "40 personas
        // entraron POR EL CORREO A LOS MUNICIPIOS", que es la pregunta que
        // decide si una campaña sirvió y cuál repetir. Ver `CANALES`.
        'campana' => 'Llegada por un canal',
        // De dónde entró quien abrió la app. No sale de la IP sino del propio
        // navegador: la zona horaria dice dónde está el TELÉFONO y el idioma del
        // sistema de dónde viene la PERSONA — el alemán que ya va por Coyhaique
        // manda `America/Santiago` y `de-DE`, y hacen falta los dos para
        // distinguirlo de un chileno. Ver App\Support\Origen.
        'origen_pais' => 'País del visitante',
        'origen_idioma' => 'Idioma del visitante',
    ];

    /**
     * Agrupaciones que responden una PREGUNTA, no un tipo técnico. Es lo que
     * muestra el panel: nadie decide nada mirando "compartir: 4", pero sí
     * mirando "4 personas quisieron contactar un negocio".
     */
    public const GRUPOS = [
        // Lo más parecido a una venta que puede medir un directorio: alguien
        // pidió cómo llegar, llamó, o le mandó la ficha a otra persona.
        'contacto' => ['como_llegar', 'llamar', 'compartir', 'consulta_reserva'],
        // Lo que devuelve la comunidad: reportes de ruta, votos y estrellas.
        'aportes' => ['reporte', 'voto', 'calificacion'],
    ];

    /**
     * Tipos cuya `referencia` es el id de una ficha. En el resto la referencia
     * es otra cosa (slug de localidad, idioma, tipo de reporte), y por eso no
     * se puede traducir a un nombre sin mirar antes el tipo.
     */
    public const TIPOS_DE_FICHA = ['ficha', 'como_llegar', 'llamar', 'compartir', 'consulta_reserva', 'consulta_guardada'];

    /**
     * Tipos cuya `referencia` llega como texto LIBRE del navegador (una zona
     * horaria IANA, una etiqueta de idioma) y hay que canonizar ANTES de
     * guardar — ver App\Support\Origen y el controlador.
     *
     * Son la única familia que no trae un id nuestro, así que la única por la
     * que este endpoint sin login podría escribir referencias inventadas hasta
     * hacer crecer la tabla sin techo. El rollup acota las filas al catálogo
     * (ver la migración); estas dos hay que acotarlas a mano.
     */
    public const TIPOS_DE_ORIGEN = ['origen_pais', 'origen_idioma'];

    /**
     * Canales de difusión, en lista cerrada por el mismo motivo que los tipos:
     * la referencia de `campana` llega del navegador —del `?c=` de la URL— a un
     * endpoint que escribe SIN LOGIN, así que sin lista blanca cualquiera podría
     * inventar códigos hasta hacer crecer la tabla sin techo, y el rollup
     * dejaría de estar acotado por el catálogo.
     *
     * Los códigos son cortos y dictables a propósito: se imprimen en un QR, se
     * pegan en un correo frío y a veces se leen en voz alta. Y hay que agregar
     * el canal ACÁ antes de repartir el enlace — un código que no está en esta
     * lista se descarta en silencio y ese canal queda sin medir, que es
     * exactamente el error que la campaña no puede permitirse.
     */
    public const CANALES = [
        'muni' => 'Correo a municipios',
        'negocio' => 'Correo a negocios',
        'oit' => 'Oficina de información turística',
        'landing' => 'Landing /proyecto',
        'qr-local' => 'QR — hamburguesería km 1020',
        'qr-furgon' => 'QR — furgón Tortel↔Cochrane',
        'qr-meson' => 'QR — mesón de alojamiento',
        'facebook' => 'Grupos de Facebook',
        'instagram' => 'Instagram',
        'volante' => 'Volante impreso',
        'firma' => 'Firma de correo o tarjeta',
    ];

    /**
     * Prefijo del código de cada oficina de información turística:
     * `oit-cochrane`, `oit-caleta-tortel`. Uno por localidad, no uno genérico.
     *
     * Por qué por localidad y no una entrada fija en `CANALES`: el QR del mesón
     * se imprime por oficina, y lo que cada municipio quiere saber es cuánta
     * gente instaló la guía **en su mesón** — no cuánta en el país. Además le da
     * al municipio una razón concreta para ponerlo: son sus números.
     *
     * Sigue siendo un conjunto cerrado, que es la propiedad que importa en un
     * endpoint sin login: el sufijo tiene que ser el slug de una localidad que
     * exista. Y se mantiene solo — una localidad nueva trae su código sin que
     * nadie tenga que acordarse de agregarlo acá.
     */
    public const PREFIJO_OIT = 'oit-';

    /**
     * Todos los códigos de canal que se pueden guardar hoy: la lista fija más el
     * QR de cada oficina (`oit-<slug>`), uno por localidad cargada.
     *
     * Devuelve el conjunto entero en vez de validar de a uno —y sin caché
     * estática— a propósito: un lote trae hasta 100 eventos, así que el
     * controlador lo pide UNA vez por petición, y una estática se quedaría
     * pegada con las localidades de la petición anterior (en los tests, con las
     * de otro test).
     *
     * @return array<string, string> código → etiqueta para el panel
     */
    public static function canalesValidos(): array
    {
        $oit = Localidad::orderBy('orden')
            ->get()
            ->mapWithKeys(fn (Localidad $l) => [
                self::PREFIJO_OIT.$l->slug => 'OIT — '.($l->nombre['es'] ?? $l->slug),
            ])
            ->all();

        return self::CANALES + $oit;
    }

    /** Tope por evento y envío: ataja un lote absurdo sin castigar el uso real. */
    public const MAX_POR_EVENTO = 500;

    /**
     * Primer día del que hay ALGO registrado, o `null` si la tabla está vacía.
     *
     * Es el día en que empezó a existir la medición, y hace falta para no
     * afirmar lo que no se sabe: antes de esa fecha la app se usaba igual, solo
     * que nadie contaba. Un gráfico que dibuja esos días planos en cero no está
     * mostrando "cero uso", está inventando un dato — y encima el más
     * desmoralizante posible. Se mira sobre TODOS los tipos por defecto a
     * propósito: un día sin fichas vistas pero con aperturas sí es un cero de
     * verdad.
     *
     * Con `$tipos` se pregunta lo mismo para UNA familia de eventos, que es lo
     * que necesita un widget cuyo dato empezó a existir después que el resto:
     * el país del visitante se mide desde agosto de 2026, así que en una
     * ventana de 30 días su ranking cubre menos días que las aperturas de al
     * lado, y sin decirlo parecería que casi nadie tiene país.
     */
    public static function primerDia(?array $tipos = null): ?string
    {
        $dia = static::query()
            ->when($tipos !== null, fn ($q) => $q->whereIn('tipo', $tipos))
            ->min('dia');

        return $dia ? Carbon::parse($dia)->toDateString() : null;
    }

    /**
     * Borra el histórico hasta un día, incluido. Devuelve qué se llevó por
     * delante, para poder decirlo en pantalla.
     *
     * Por qué esto existe: los primeros números de la tabla son del propio
     * desarrollo —abrir la app veinte veces para probar el mapa cuenta veinte
     * aperturas— y arrancar una campaña midiendo contra esa base es engañarse
     * solo. Por qué es POR FECHA y no "borrar lo mío": la analítica es anónima
     * por diseño (sin usuario, sin sesión, sin dispositivo, ver la migración),
     * así que no existe el dato que permitiría distinguir las pruebas del uso
     * real. La fecha es el único corte honesto que se puede ofrecer.
     *
     * @return array{filas: int, eventos: int}
     */
    public static function borrarHasta(string $dia): array
    {
        $alcance = static::query()->where('dia', '<=', $dia);

        $resumen = [
            'filas' => (clone $alcance)->count(),
            'eventos' => (int) (clone $alcance)->sum('cantidad'),
        ];

        $alcance->delete();

        return $resumen;
    }

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
