<?php

namespace App\Support;

/**
 * Cuentas de distancia para AUDITAR dónde quedó el pin de una ficha.
 *
 * Por qué existe: los lotes importados (SERNATUR y el mapa municipal de Tortel)
 * traen coordenadas de calidad desigual —placeholders repetidos, puntos
 * digitalizados a ojo sobre otro plano— y en el mapa eso se ve como alojamientos
 * desparramados por el cerro, lejos de las pasarelas donde de verdad están. El
 * dato malo no avisa: hay que ir a buscarlo.
 *
 * Acá vive el criterio (qué se considera sospechoso y por qué) para que el CMS
 * y el comando de auditoría digan lo mismo, no dos números parecidos.
 */
class Ubicacion
{
    /** Radio medio de la Tierra (IUGG), en km. */
    private const RADIO_TIERRA_KM = 6371.0088;

    /**
     * Un comercio más lejos que esto del centro de SU pueblo casi siempre es un
     * pin mal puesto, no un negocio apartado. Es un umbral de sospecha, no un
     * veredicto: existe el hospedaje a 5 km del pueblo, y por eso lo que sale de
     * acá es una lista para revisar, nunca una corrección automática.
     */
    public const KM_SOSPECHOSO = 3.0;

    /**
     * Categorías que, por definición, están EN el pueblo o a un paso. Los
     * `atractivo` quedan fuera a propósito: la Confluencia Baker-Neff está a
     * 22 km de Cochrane y ahí el pin lejano es el dato correcto.
     */
    public const CATEGORIAS_EN_EL_PUEBLO = ['alojamiento', 'comida', 'servicio', 'emergencia', 'evento'];

    /**
     * Pin clavado en el centro exacto del pueblo = coordenada de relleno. Nadie
     * ubica un negocio con esa precisión a mano; lo que la produce es un
     * importador que, sin dato, copió el centro de la localidad.
     */
    public const METROS_CENTRO_EXACTO = 30;

    /**
     * Caja de la Carretera Austral con holgura (la misma idea que el aviso del
     * campo "ubicar con foto"): separa "esto es de la zona" de "esto quedó en
     * Santiago, en el mar o en (0, 0)".
     */
    public const CAJA = ['lat_min' => -49.5, 'lat_max' => -40.5, 'lng_min' => -75.5, 'lng_max' => -70.5];

    /**
     * El "desparramo" del importador SERNATUR
     * (`scripts/sernatur/2_generar_textos.py` → `corrige_placeholders`).
     *
     * Aquel dato traía coordenadas por defecto repetidas por decenas de
     * servicios, a veces a 60 km del pueblo. El importador las reemplazó por
     * puntos REPARTIDOS EN ESPIRAL alrededor del centro de la localidad, con el
     * ángulo áureo y un radio de ~100 m·√i (hasta ~450 m). Fue lo correcto en su
     * momento —mejor "en el pueblo" que "a 60 km"— pero hay que decirlo claro:
     * **esos pines no son una ubicación, son un relleno con forma de ubicación**.
     * En el mapa se ven como alojamientos sembrados por el cerro, cada uno
     * apuntando a una casa que no es.
     *
     * Se reconocen exactamente porque la espiral es determinista: se regeneran
     * los puntos y se compara. Sirve para separar "el pin está mal" de "el pin
     * nunca existió", que son dos trabajos distintos: el segundo no se arregla
     * mirando el mapa, hay que salir a buscar la dirección real.
     */
    public const ESPIRAL_ANGULO_GRADOS = 137.508;

    public const ESPIRAL_PASO_GRADOS = 0.0009;

    /** Tolerancia al comparar con la espiral: el JSON redondea a 6 decimales (~11 cm). */
    private const ESPIRAL_TOLERANCIA = 0.00002;

    /**
     * ¿Esta coordenada es uno de los puntos que generó el desparramo alrededor
     * de (clat, clng)?
     *
     * `$maximo` es cuántas posiciones de la espiral se prueban; el importador
     * generó una por servicio corregido de esa localidad.
     */
    public static function esDelDesparramo(float $lat, float $lng, float $clat, float $clng, int $maximo = 200): bool
    {
        // i = 0 es el centro exacto, y ese caso ya tiene su propio motivo.
        for ($i = 1; $i <= $maximo; $i++) {
            $ang = deg2rad($i * self::ESPIRAL_ANGULO_GRADOS);
            $rad = self::ESPIRAL_PASO_GRADOS * sqrt($i);

            if (abs($lat - ($clat + $rad * cos($ang))) < self::ESPIRAL_TOLERANCIA
                && abs($lng - ($clng + $rad * sin($ang))) < self::ESPIRAL_TOLERANCIA) {
                return true;
            }
        }

        return false;
    }

    /** Distancia en línea recta, en km (haversine). */
    public static function km(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * self::RADIO_TIERRA_KM * asin(min(1.0, sqrt($a)));
    }

    /**
     * Un número decimal escrito DENTRO del SQL, no pasado como parámetro.
     *
     * No es un atajo: Laravel entrega los `float` al driver como cadena, y
     * SQLite —donde corren los tests— ordena cualquier número ANTES que
     * cualquier texto, así que `49.18 > '9'` da falso y el filtro devuelve una
     * lista vacía sin error ninguno. En Postgres funciona, o sea que el bug
     * aparecería solo en los tests... o solo en producción, según de qué lado
     * se mire. Se escribe el literal y se acabó el problema en los dos motores.
     *
     * Seguro porque el valor no viene de nadie de afuera: son los umbrales de
     * esta clase, y `sprintf('%F')` fuerza el punto decimal aunque el sistema
     * use coma.
     */
    public static function numeroSql(float $valor): string
    {
        return sprintf('%.9F', $valor);
    }

    /** ¿Cae dentro de la caja de la Carretera Austral? */
    public static function enLaAustral(?float $lat, ?float $lng): bool
    {
        if ($lat === null || $lng === null) {
            return false;
        }

        return $lat >= self::CAJA['lat_min'] && $lat <= self::CAJA['lat_max']
            && $lng >= self::CAJA['lng_min'] && $lng <= self::CAJA['lng_max'];
    }

    /**
     * Distancia AL CUADRADO en km², como expresión SQL entre `places` y
     * `localidades` (la tabla del centro tiene que venir unida en la consulta).
     *
     * Va al cuadrado para no pedirle raíz cuadrada al motor, y es plana —un
     * grado de latitud son 111,32 km y uno de longitud eso por el coseno de la
     * latitud, ~0,7 en el medio de la ruta— porque a esta escala la curvatura no
     * mueve la aguja. Sin POWER() ni funciones matemáticas: SQLite (los tests)
     * puede venir compilado sin ellas, y multiplicar se puede en los dos motores.
     *
     * El borde del filtro queda con un error de pocos por ciento respecto del
     * número que muestra la columna (ese sí es haversine). Da igual: 3 km es un
     * umbral de olfato, no una medida — que un pin entre a la lista con 2,95 km
     * o con 3,05 no cambia nada de lo que hay que ir a revisar.
     */
    public static function km2Sql(): string
    {
        $dLat = '((places.lat - localidades.lat) * 111.32)';
        $dLng = '((places.lng - localidades.lng) * 111.32 * 0.7)';

        return "($dLat * $dLat + $dLng * $dLng)";
    }
}
