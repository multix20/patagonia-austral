<?php

namespace App\Support;

/**
 * Utilidades para trabajar con enlaces de Google Maps.
 *
 * El objetivo es que el administrador NO tenga que teclear coordenadas a mano
 * (fuente habitual de pines mal ubicados): pega el enlace del lugar desde Google
 * Maps y de ahí extraemos la latitud/longitud exactas del pin.
 */
class GoogleMaps
{
    /**
     * Extrae [lat, lng] de un enlace de Google Maps o de un texto "lat, lng".
     *
     * Orden de preferencia:
     *   1. Marcador real del lugar en la URL: ...!3d<lat>!4d<lng> (lo más exacto).
     *   2. Centro del visor: ...@<lat>,<lng>,17z
     *   3. Parámetros de consulta: ?q= / &query= / &ll= / &destination= = <lat>,<lng>
     *   4. Texto plano "<lat>, <lng>" (lo que copias del panel "¿Qué hay aquí?").
     *
     * Los enlaces cortos (maps.app.goo.gl / goo.gl/maps) NO traen las coordenadas
     * en el texto: hay que abrirlos primero y copiar el enlace largo.
     *
     * @return array{0: float, 1: float}|null  null si no hay coordenadas válidas.
     */
    public static function extraerCoordenadas(?string $texto): ?array
    {
        $texto = trim((string) $texto);
        if ($texto === '') {
            return null;
        }

        $patrones = [
            '/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/',
            '/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/',
            '/[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/',
            '/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/',
        ];

        foreach ($patrones as $patron) {
            if (preg_match($patron, $texto, $m)) {
                $coords = self::validar($m[1], $m[2]);
                if ($coords !== null) {
                    return $coords;
                }
            }
        }

        return null;
    }

    /**
     * Valida rangos geográficos y normaliza a float.
     *
     * @return array{0: float, 1: float}|null
     */
    private static function validar(string $lat, string $lng): ?array
    {
        $lat = (float) $lat;
        $lng = (float) $lng;

        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }

        // Descarta el (0,0) del Golfo de Guinea: casi siempre es un enlace sin
        // coordenadas reales, no un lugar de la Patagonia.
        if ($lat === 0.0 && $lng === 0.0) {
            return null;
        }

        return [$lat, $lng];
    }
}
