<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Toma la foto que subió el CMS, la convierte a WebP y la deja en el bucket.
// Devuelve la RUTA relativa que se guarda en `places.imagenes` (no la URL: ver
// Place::imagenesUrl).
//
// Vive fuera de PlaceResource para poder probarlo sin levantar Filament.
class GuardarFoto
{
    public function __construct(private ImagenServicio $imagenes) {}

    /**
     * @param  mixed  $archivo  El temporal de Livewire, o un UploadedFile del
     *                          formulario público: los dos tienen get() y
     *                          getClientOriginalName().
     * @param  string|null  $carpeta  Dónde dejarla. Por omisión la de las fichas;
     *                                el formulario del dueño pasa la de
     *                                propuestas, que es contenido sin revisar.
     * @return string|null Ruta dentro del disco, o null si el archivo no era una imagen legible.
     */
    public function guardar(mixed $archivo, ?string $carpeta = null): ?string
    {
        $binario = $archivo->get();

        $webp = $this->imagenes->aWebp(
            $binario,
            (int) config('fotos.lado_maximo'),
            (int) config('fotos.calidad'),
        );

        if ($webp === null) {
            // No se pudo decodificar (archivo corrupto, o un formato que GD no
            // lee). Se avisa en el log y se devuelve null: mejor una ficha sin
            // foto que una ficha con un enlace roto.
            Log::warning('Foto descartada: GD no pudo leerla', [
                'archivo' => method_exists($archivo, 'getClientOriginalName')
                    ? $archivo->getClientOriginalName()
                    : null,
            ]);

            return null;
        }

        // Nombre aleatorio y no el original: evita colisiones entre fichas, no
        // filtra cómo se llamaba el archivo en el computador de quien lo subió, y
        // esquiva los acentos y espacios que traen problema en una URL.
        $ruta = trim($carpeta ?? (string) config('fotos.carpeta'), '/').'/'.Str::uuid()->toString().'.webp';

        Storage::disk(config('fotos.disco'))->put($ruta, $webp, 'public');

        return $ruta;
    }
}
