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

        // El `is_array` no sobra: un GeoJSON de tipo Point trae `coordinates`
        // como [lon, lat], o sea números sueltos en el primer nivel. Ahí
        // `$coords[0][0]` es null (offset sobre un float), no entra por la rama
        // de arriba, y la recursión recibía un float → TypeError, que en el CMS
        // se ve como un 500 al abrir la lista de trazados. `rutas` no debería
        // tener Points —los tipos son área/ruta/sendero/pasarela— pero la
        // geometría se puede pegar a mano desde el editor, y una fila mal pegada
        // no puede tumbar la pantalla entera.
        return array_sum(array_map(fn ($c) => is_array($c) ? $this->contar($c) : 0, $coords));
    }
}
