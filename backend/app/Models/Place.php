<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Place extends Model
{
    protected $fillable = [
        'cat', 'lat', 'lng', 'tel', 'nombre', 'descripcion', 'como', 'dist', 'publicado',
        'localidad_id',
    ];

    protected $casts = [
        'nombre' => 'array',
        'descripcion' => 'array',
        'como' => 'array',
        'dist' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'publicado' => 'boolean',
    ];

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    /**
     * Forma que consume la PWA (src/api/client.js).
     * El campo `localidad` (slug) es aditivo: las versiones antiguas de la
     * PWA lo ignoran, así que el backend puede desplegarse primero.
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
            'localidad' => $this->localidad?->slug,
        ];
    }
}
