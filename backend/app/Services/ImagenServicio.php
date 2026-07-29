<?php

namespace App\Services;

// Convierte la foto que sube el CMS a WebP redimensionado, antes de guardarla.
//
// POR QUÉ CONVERTIR Y NO GUARDAR EL ORIGINAL: la foto la ve un turista en la
// Carretera Austral, con la señal que hay (o sin ella). Una foto de celular sale
// de 3–5 MB; en WebP a 1600 px queda en ~150 KB. Es la diferencia entre que la
// ficha cargue en una barra de señal o se quede en blanco.
//
// Se usa GD y no una librería de imágenes: GD ya está compilado en el contenedor
// (Dockerfile) y lo que hace falta —orientar, escalar, codificar— son tres
// llamadas. Una dependencia más solo alargaría el build de Render.
class ImagenServicio
{
    /**
     * Devuelve el binario WebP ya orientado y escalado, o null si el archivo no
     * es una imagen que GD sepa leer (el que sube se entera con un error del
     * formulario, no con una ficha rota).
     */
    public function aWebp(string $binario, int $ladoMaximo, int $calidad): ?string
    {
        $img = @imagecreatefromstring($binario);
        if ($img === false) {
            return null;
        }

        try {
            $img = $this->orientar($img, $binario);
            $img = $this->escalar($img, $ladoMaximo);

            // Las fotos de interiores suelen traer canal alfa (PNG); WebP lo
            // soporta, pero hay que pedirlo explícitamente o sale fondo negro.
            imagealphablending($img, false);
            imagesavealpha($img, true);

            ob_start();
            $ok = imagewebp($img, null, $calidad);
            $salida = (string) ob_get_clean();

            return $ok && $salida !== '' ? $salida : null;
        } finally {
            imagedestroy($img);
        }
    }

    /**
     * Endereza la foto según el EXIF. Sin esto, las fotos verticales de celular
     * salen acostadas: el sensor graba siempre en horizontal y deja la rotación
     * anotada en el metadato, que se pierde al recodificar.
     */
    private function orientar(\GdImage $img, string $binario): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $img;
        }

        // exif_read_data necesita un stream, no una cadena suelta.
        $orientacion = @exif_read_data('data://image/jpeg;base64,'.base64_encode($binario))['Orientation'] ?? null;

        $grados = match ($orientacion) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($grados === 0) {
            return $img;
        }

        $rotada = imagerotate($img, $grados, 0);
        if ($rotada === false) {
            return $img;
        }

        imagedestroy($img);

        return $rotada;
    }

    /** Escala a lo ancho o a lo alto, lo que sea mayor. Nunca agranda. */
    private function escalar(\GdImage $img, int $ladoMaximo): \GdImage
    {
        $ancho = imagesx($img);
        $alto = imagesy($img);
        $lado = max($ancho, $alto);

        if ($lado <= $ladoMaximo) {
            return $img;
        }

        $escala = $ladoMaximo / $lado;
        $nueva = imagescale($img, (int) round($ancho * $escala), (int) round($alto * $escala));
        if ($nueva === false) {
            return $img;
        }

        imagedestroy($img);

        return $nueva;
    }
}
