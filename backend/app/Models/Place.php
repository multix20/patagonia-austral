<?php

namespace App\Models;

use App\Services\AlmacenamientoFotos;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Place extends Model
{
    protected $fillable = [
        'cat', 'lat', 'lng', 'tel', 'nombre', 'descripcion', 'como', 'dist', 'publicado',
        'destacado', 'localidad_id', 'imagenes', 'calificacion_promedio', 'calificaciones_total',
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
        'calificacion_promedio' => 'float',
        'calificaciones_total' => 'integer',
    ];

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    public function calificaciones(): HasMany
    {
        return $this->hasMany(Calificacion::class);
    }

    /** ¿Esta ficha admite estrellas? (ver Calificacion::CATEGORIAS_SIN_CALIFICACION) */
    public function admiteCalificacion(): bool
    {
        return ! in_array($this->cat, Calificacion::CATEGORIAS_SIN_CALIFICACION, true);
    }

    /**
     * Recalcula promedio y total desde las calificaciones VISIBLES y los guarda
     * en la propia ficha.
     *
     * Se llama al crear/editar una calificación y al ocultarla desde el CMS. Es
     * el precio de tener el dato desnormalizado, y se paga al escribir —que pasa
     * de a una— en vez de en cada lectura de /api/places, que sirve las 231
     * fichas de una y la PWA pide en cada sincronización.
     *
     * Ocultar una opinión tiene que MOVER el promedio: si no, moderar spam
     * dejaría la nota envenenada y el número visible no correspondería a ninguna
     * opinión que se pueda leer.
     */
    public function recalcularCalificacion(): void
    {
        $visibles = $this->calificaciones()->visibles();
        $total = (clone $visibles)->count();

        $this->update([
            'calificaciones_total' => $total,
            'calificacion_promedio' => $total > 0
                ? round((clone $visibles)->avg('estrellas'), 2)
                : null,
        ]);
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
            // Nota y cuántas opiniones la sostienen. Viajan con el directorio (y
            // no en un endpoint aparte) para que las estrellas se vean SIN SEÑAL:
            // la decisión de dónde parar se toma en la ruta, que es justo donde
            // no hay cobertura para ir a buscarlas. Los comentarios sí van
            // aparte (/api/calificaciones): son muchos y solo se leen al abrir
            // la ficha, ya en el pueblo.
            'estrellas' => $this->calificacion_promedio,
            'calificaciones' => $this->calificaciones_total,
            'calificable' => $this->admiteCalificacion(),
        ];
    }
}
