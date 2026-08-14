<?php

namespace App\Support;

/**
 * Saca las coordenadas GPS que la cámara dejó dentro de una foto.
 *
 * Para qué: ubicar el pin de una ficha sin teclear coordenadas ni depender de
 * que el dueño del negocio sepa usar Google Maps. Una foto sacada EN el local,
 * con la ubicación del teléfono encendida, trae el punto con precisión de 5 a 10
 * metros — mejor que cualquier dirección escrita, que en la Austral muchas veces
 * ni existe ("camino a Tortel km 3, casa azul").
 *
 * **La trampa: WhatsApp borra el EXIF.** Recomprime la imagen al mandarla como
 * foto, y en esa pasada se pierden las coordenadas. Sobreviven si el archivo
 * viaja intacto: como *documento* en WhatsApp, adjunto en un correo, o AirDrop.
 * Por eso el CMS, cuando no encuentra GPS, lo dice con esas palabras en vez de
 * un "no se pudo": el problema casi nunca es la foto, es el camino que tomó.
 *
 * Formatos: el GPS vive en el EXIF, que existe en JPEG y HEIC. Un PNG —una
 * captura de pantalla, por ejemplo— no lo lleva nunca.
 */
class ExifGps
{
    /**
     * Coordenadas de una foto, o `null` si no trae.
     *
     * @return array{0: float, 1: float}|null [lat, lng]
     */
    public static function extraerCoordenadas(string $rutaArchivo): ?array
    {
        if (! function_exists('exif_read_data') || ! is_readable($rutaArchivo)) {
            return null;
        }

        // El @ no es descuido: `exif_read_data` emite warnings para cualquier
        // archivo sin EXIF —o sea, para el caso NORMAL de una foto de WhatsApp—
        // y eso llenaría el log de ruido por algo que ya se maneja devolviendo
        // null. Los errores que sí importan se ven en el valor de retorno.
        $exif = @exif_read_data($rutaArchivo, 'GPS', true);

        if (! is_array($exif) || ! isset($exif['GPS'])) {
            return null;
        }

        $gps = $exif['GPS'];

        $lat = self::aGrados($gps['GPSLatitude'] ?? null, $gps['GPSLatitudeRef'] ?? null, 'S', 'N');
        $lng = self::aGrados($gps['GPSLongitude'] ?? null, $gps['GPSLongitudeRef'] ?? null, 'W', 'E');

        if ($lat === null || $lng === null) {
            return null;
        }

        // Coordenadas fuera de rango = EXIF corrupto. Y el (0,0) merece mención
        // aparte: es la "isla nula" frente a África, y no lo produce una cámara
        // sino un GPS que no alcanzó a fijar posición y guardó ceros. Aceptarlo
        // pondría el pin en medio del Atlántico.
        if (abs($lat) > 90 || abs($lng) > 180 || ($lat === 0.0 && $lng === 0.0)) {
            return null;
        }

        return [round($lat, 7), round($lng, 7)];
    }

    /**
     * Pasa el trío grados/minutos/segundos del EXIF a grados decimales.
     *
     * El EXIF guarda cada pieza como una FRACCIÓN en texto ("47/1", "1523/100"),
     * no como número: es el formato "rational" del estándar. Hay que dividir a
     * mano, y ojo con el denominador en cero, que aparece en archivos tocados
     * por editores baratos.
     *
     * @param  mixed  $piezas  Los tres valores del estándar (grados, minutos, segundos).
     * @param  mixed  $referencia  Hemisferio: N/S para latitud, E/W para longitud.
     * @param  string  $negativa  Cuál de las dos referencias va con signo menos.
     * @param  string  $positiva  La otra. Se exige que la referencia sea UNA DE LAS DOS.
     */
    private static function aGrados(mixed $piezas, mixed $referencia, string $negativa, string $positiva): ?float
    {
        if (! is_array($piezas) || count($piezas) < 3) {
            return null;
        }

        $grados = self::deFraccion($piezas[0]);
        $minutos = self::deFraccion($piezas[1]);
        $segundos = self::deFraccion($piezas[2]);

        if ($grados === null || $minutos === null || $segundos === null) {
            return null;
        }

        $valor = $grados + $minutos / 60 + $segundos / 3600;

        // La referencia tiene que ser EXACTAMENTE una de las dos letras válidas.
        // No alcanza con "no es la negativa": ese atajo trataba cualquier basura
        // —incluido el byte nulo que deja un EXIF a medio escribir— como si
        // fuera el hemisferio positivo, y una foto de Cochrane terminaba con el
        // pin en Siberia. En Chile todo es Sur y Oeste y sería fácil suponerlo,
        // pero suponer acá es inventar: sin referencia creíble, no hay pin.
        $ref = is_string($referencia) ? strtoupper(trim($referencia, " \0")) : '';

        if ($ref !== $negativa && $ref !== $positiva) {
            return null;
        }

        return $ref === $negativa ? -$valor : $valor;
    }

    private static function deFraccion(mixed $valor): ?float
    {
        if (is_int($valor) || is_float($valor)) {
            return (float) $valor;
        }

        if (! is_string($valor)) {
            return null;
        }

        if (! str_contains($valor, '/')) {
            return is_numeric($valor) ? (float) $valor : null;
        }

        [$arriba, $abajo] = explode('/', $valor, 2);

        if (! is_numeric($arriba) || ! is_numeric($abajo) || (float) $abajo == 0.0) {
            return null;
        }

        return (float) $arriba / (float) $abajo;
    }
}
