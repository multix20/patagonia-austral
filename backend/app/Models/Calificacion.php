<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Calificación de un viajero sobre una ficha del directorio (Fase 3).
class Calificacion extends Model
{
    protected $table = 'calificaciones';

    // `oculto` va en fillable porque la moderación del CMS lo escribe por
    // asignación masiva, igual que en Reporte. Sin él, esos update() fallarían
    // EN SILENCIO.
    protected $fillable = ['place_id', 'estrellas', 'comentario', 'dispositivo', 'oculto'];

    protected $casts = [
        'estrellas' => 'integer',
        'oculto' => 'boolean',
    ];

    /**
     * Categorías que NO se pueden calificar. Poner estrellas a la posta de
     * Carabineros o a la ambulancia no informa a nadie y sí puede hacer daño: en
     * un pueblo de 400 habitantes donde el servicio de urgencia es uno solo, una
     * mala nota no genera competencia, genera desconfianza en lo único que hay.
     * El resto del directorio (dormir, comer, atractivos, servicios, eventos) sí
     * se califica: ahí la opinión ayuda a elegir.
     */
    public const CATEGORIAS_SIN_CALIFICACION = ['emergencia'];

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    /** Las que la PWA puede mostrar. */
    public function scopeVisibles(Builder $q): Builder
    {
        return $q->where('oculto', false);
    }

    /** Solo las que traen texto: la lista de opiniones de la ficha. */
    public function scopeConComentario(Builder $q): Builder
    {
        return $q->whereNotNull('comentario')->where('comentario', '!=', '');
    }

    /**
     * Forma que consume la PWA. No viaja NADA que identifique al autor: ni el
     * hash del dispositivo. La app no tiene por qué saber quién escribió, solo
     * qué se dijo y cuándo.
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'place_id' => $this->place_id,
            'estrellas' => $this->estrellas,
            'comentario' => $this->comentario,
            'creado_en' => $this->created_at?->toIso8601String(),
        ];
    }
}
