<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Pueblo de la Carretera Austral (Fase 1 — multi-localidad).
class Localidad extends Model
{
    protected $table = 'localidades';

    protected $fillable = [
        'slug', 'nombre', 'lat', 'lng', 'zoom', 'orden', 'publicado',
    ];

    protected $casts = [
        'nombre' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'zoom' => 'integer',
        'orden' => 'integer',
        'publicado' => 'boolean',
    ];

    public function places(): HasMany
    {
        return $this->hasMany(Place::class);
    }

    /** Forma que consume la PWA (src/api/client.js) */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'nombre' => $this->nombre,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'zoom' => $this->zoom,
            'orden' => $this->orden,
        ];
    }
}
