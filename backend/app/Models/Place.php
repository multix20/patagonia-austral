<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Place extends Model
{
    protected $fillable = [
        'cat', 'lat', 'lng', 'tel', 'nombre', 'descripcion', 'como', 'dist', 'publicado',
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

    /** Forma que consume la PWA (src/api/client.js) */
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
        ];
    }
}
