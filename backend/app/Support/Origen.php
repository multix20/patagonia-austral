<?php

namespace App\Support;

use DateTimeZone;
use Illuminate\Support\Str;
use Locale;
use Throwable;

/**
 * De dónde entra quien abre la app — deducido SIN mirar la IP.
 *
 * Por qué existe: el panel contestaba "cuánta gente abre la app" pero no "quién
 * llegó", y esa es la primera pregunta que aparece el día que alguien que no
 * eres tú abre la PWA. La respuesta honesta a "quién" es que no se sabe y no se
 * va a saber (no hay cuentas, ni sesión, ni dispositivo: ver la migración de
 * `interacciones`). Lo que sí se puede contestar sin espiar a nadie es "desde
 * qué país", y de paso "en qué idioma tiene el teléfono", que es lo que separa
 * al viajero extranjero del chileno.
 *
 * Las dos señales salen del propio navegador y no del servidor:
 *
 *  - **Zona horaria** (`Intl.DateTimeFormat().resolvedOptions().timeZone`) → país.
 *    Dice dónde está el TELÉFONO: un alemán que ya va por Coyhaique manda
 *    `America/Santiago`, porque el sistema le cambió la hora al aterrizar.
 *  - **Idioma del navegador** (`navigator.language`) → de dónde viene la PERSONA.
 *    Ese mismo alemán sigue mandando `de-DE`. Por eso van las dos: una sola
 *    contestaría a medias.
 *
 * Se resuelve acá, en PHP, y no en la PWA, por dos razones: la tabla IANA →
 * país ya viene dentro de PHP (el navegador no la tiene, habría que empaquetar
 * un mapa de 400 zonas en un bundle que se precachea), y sobre todo porque
 * `/api/interacciones` escribe SIN LOGIN — lo que llegue hay que canonizarlo
 * contra un conjunto cerrado antes de guardarlo. Sin eso, cualquiera podría
 * mandar referencias inventadas hasta hacer crecer la tabla sin techo, que es
 * justo la propiedad que el rollup existe para conservar.
 *
 * Lo que se guarda es un contador diario por país y por idioma. Sigue sin haber
 * IP, ni sesión, ni dispositivo, ni orden de eventos: "hoy entraron 4 desde
 * Alemania" no permite reconstruir el recorrido de ninguna de esas 4 personas.
 */
class Origen
{
    /**
     * Zona horaria IANA → código ISO de país, o `null` si no se puede saber.
     *
     * Devuelve `null` —y el evento se descarta— para lo que no es una zona con
     * país detrás: un desfase crudo (`+05:00`), una abreviatura sin ubicación
     * (`EST`), `UTC` (que ICU marca como país `??`) o directamente basura.
     * Guardar esos casos como "desconocido" solo llenaría el ranking con una
     * fila que no se puede accionar.
     */
    public static function paisDeZona(string $zona): ?string
    {
        try {
            $ubicacion = (new DateTimeZone($zona))->getLocation();
        } catch (Throwable) {
            return null; // la zona no existe en la base IANA de PHP
        }

        $pais = $ubicacion['country_code'] ?? '';

        return preg_match('/^[A-Z]{2}$/', $pais) && $pais !== 'ZZ' ? $pais : null;
    }

    /**
     * Etiqueta de idioma del navegador → forma canónica `xx` o `xx-YY`.
     *
     * Se queda con el idioma y, si viene, la región, y tira el resto de los
     * subtags: `zh-Hans-CN` es `zh-CN`. La región importa y no se descarta
     * porque en la Austral separa dos públicos distintos que hablan el mismo
     * idioma —`es-CL` y `es-AR`—, y los argentinos son una parte grande de
     * quien recorre la ruta. Se admite también la región numérica (`es-419`,
     * "Latinoamérica"), que es lo que reportan muchos Android.
     *
     * Idioma o región que ICU no conoce se descartan: es lo que mantiene el
     * conjunto de referencias cerrado en un endpoint que escribe sin login.
     */
    public static function idiomaNormalizado(string $etiqueta): ?string
    {
        $partes = preg_split('/[-_]/', trim($etiqueta));
        $idioma = strtolower($partes[0] ?? '');

        if (! preg_match('/^[a-z]{2,3}$/', $idioma) || ! self::conocido(Locale::getDisplayLanguage($idioma, 'en'), $idioma)) {
            return null;
        }

        foreach (array_slice($partes, 1) as $subtag) {
            // La región es el primer subtag de dos letras o tres dígitos; los de
            // cuatro letras son el sistema de escritura (`Hans`) y se saltan.
            if (! preg_match('/^([A-Za-z]{2}|[0-9]{3})$/', $subtag)) {
                continue;
            }

            $region = strtoupper($subtag);

            return self::conocido(Locale::getDisplayRegion("-{$region}", 'en'), $region)
                ? "{$idioma}-{$region}"
                : $idioma;
        }

        return $idioma;
    }

    /** Nombre del país en español, o el código si ICU no lo conoce. */
    public static function nombrePais(string $codigo): string
    {
        return Locale::getDisplayRegion('-'.strtoupper($codigo), 'es') ?: $codigo;
    }

    /** Nombre del idioma en español: `es-AR` → "Español (Argentina)". */
    public static function nombreIdioma(string $etiqueta): string
    {
        $idioma = Str::ucfirst(Locale::getDisplayLanguage($etiqueta, 'es'));
        $region = Locale::getDisplayRegion($etiqueta, 'es');

        return $region === '' ? $idioma : "{$idioma} ({$region})";
    }

    /**
     * ¿ICU reconoció el código? Cuando no lo conoce devuelve el código tal cual
     * (`xq` → "xq"), así que basta con comparar el nombre con la entrada. El
     * "ZZ"/"und" de ICU —su forma de decir "desconocido"— tampoco pasa: sí
     * tiene nombre, pero no es un origen.
     */
    private static function conocido(string $nombre, string $codigo): bool
    {
        return $nombre !== '' && $nombre !== $codigo && ! in_array(strtoupper($codigo), ['ZZ', 'UND'], true);
    }
}
