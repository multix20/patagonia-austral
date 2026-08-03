<?php

namespace App\Models;

use App\Services\AlmacenamientoFotos;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Place extends Model
{
    protected $fillable = [
        'cat', 'lat', 'lng', 'tel', 'nombre', 'descripcion', 'como', 'dist', 'publicado',
        'destacado', 'localidad_id', 'imagenes',
    ];

    protected $casts = [
        'nombre' => 'array',
        'descripcion' => 'array',
        'como' => 'array',
        'dist' => 'array',
        'imagenes' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'publicado' => 'boolean',
        'destacado' => 'boolean',
    ];

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    /**
     * URLs públicas de las fotos, en el orden guardado.
     *
     * En la BD viven RUTAS relativas al bucket; la URL se arma al leer. Así el
     * dominio público de R2 es una variable de entorno y no algo incrustado en
     * 200 filas: cambiar a dominio propio no obliga a migrar datos.
     */
    public function imagenesUrl(): array
    {
        $rutas = array_values(array_filter($this->imagenes ?? [], 'is_string'));

        // Sin las variables R2_* el disco NI SIQUIERA se puede construir:
        // flysystem exige un bucket `string` y recibe null, así que
        // Storage::disk('r2') lanza TypeError. Como esto corre por CADA ficha
        // dentro de toApi(), el efecto no era "la foto no carga" sino que TODO
        // /api/places devolvía 500 y la PWA quedaba sin datos — por fotos que
        // ni siquiera existen todavía. Mientras el almacenamiento no esté
        // configurado, las fichas van sin foto: el degradado que la app ya sabe
        // manejar. (Ojo con reproducirlo en local: un .env con `R2_BUCKET=`
        // vacío da `''`, que SÍ es string y no falla. El fallo pide la variable
        // ausente del todo, como en Render.)
        if ($rutas === [] || ! app(AlmacenamientoFotos::class)->listo()) {
            return [];
        }

        $disco = Storage::disk(config('fotos.disco'));

        return array_map(fn (string $ruta) => $this->absoluta($disco->url($ruta)), $rutas);
    }

    /**
     * La URL tiene que ser ABSOLUTA sí o sí: la PWA se sirve desde Netlify y la
     * API desde Render, así que un '/storage/foo.webp' se resolvería contra el
     * dominio de la PWA y daría 404. Pasa si el disco quedó mal configurado
     * (R2_URL vacía), y el síntoma sería una ficha sin foto y sin error visible.
     */
    private function absoluta(string $url): string
    {
        return str_starts_with($url, 'http')
            ? $url
            : rtrim(config('app.url'), '/').'/'.ltrim($url, '/');
    }

    /**
     * Forma que consume la PWA (src/api/client.js).
     * Los campos `localidad` (slug) e `imagenes` son aditivos: las versiones
     * antiguas de la PWA los ignoran, así que el backend puede desplegarse
     * primero. Y al revés: una PWA nueva contra fichas sin foto recibe `[]` y
     * cae en el degradado + icono de siempre.
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'cat' => $this->cat,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'tel' => $this->tel,
            'nombre' => $this->nombre,
            'desc' => $this->descripcion,
            'como' => $this->como,
            'dist' => $this->dist,
            'destacado' => $this->destacado,
            'localidad' => $this->localidad?->slug,
            'imagenes' => $this->imagenesUrl(),
        ];
    }
}
