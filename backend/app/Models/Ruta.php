<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Trazado o área dibujable en el mapa (pasarelas, senderos, rutas, glaciares).
// Ver la migración para por qué la geometría va como GeoJSON en jsonb y no en
// PostGIS.
class Ruta extends Model
{
    protected $table = 'rutas';

    /** Tipos válidos, en el orden en que conviene dibujarlos (las áreas al fondo). */
    public const TIPOS = ['area', 'ruta', 'sendero', 'pasarela'];

    protected $fillable = [
        'tipo', 'nombre', 'descripcion', 'largo_km', 'geometria', 'localidad_id', 'publicado',
    ];

    protected $casts = [
        'nombre' => 'array',
        'descripcion' => 'array',
        'geometria' => 'array',
        'largo_km' => 'float',
        'publicado' => 'boolean',
    ];

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    /**
     * Forma que consume la PWA. Se manda la geometría tal cual: Leaflet come
     * GeoJSON sin traducción.
     *
     * El `localidad` va como SLUG y no como id por la misma razón que en
     * `places`: es lo que la PWA ya usa para filtrar, y no la obliga a conocer
     * los ids de la base.
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'largo_km' => $this->largo_km,
            'localidad' => $this->localidad?->slug,
            'geometria' => $this->geometria,
        ];
    }

    /** Cantidad de vértices, para mostrarla en el CMS: es lo que pesa. */
    public function vertices(): int
    {
        return $this->contar($this->geometria['coordinates'] ?? []);
    }

    private function contar(array $coords): int
    {
        if ($coords === []) {
            return 0;
        }

        // Una lista de pares [lon, lat] termina la recursión; cualquier otra cosa
        // es un nivel más de anidamiento (MultiLineString, Polygon, MultiPolygon).
        if (is_numeric($coords[0][0] ?? null)) {
            return count($coords);
        }

        return array_sum(array_map(fn ($c) => $this->contar($c), $coords));
    }
}
