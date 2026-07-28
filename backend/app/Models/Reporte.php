<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Reporte de ruta hecho por un viajero (crowdsourcing, Fase 3).
class Reporte extends Model
{
    protected $table = 'reportes';

    // `oculto` va en fillable porque se escribe por asignación masiva desde tres
    // lados: el auto-ocultado por descartes, la moderación del CMS y las acciones
    // en lote. Sin él, esos update() fallarían EN SILENCIO.
    protected $fillable = [
        'tipo', 'lat', 'lng', 'localidad_id', 'comentario', 'dispositivo', 'oculto', 'expira_en',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'oculto' => 'boolean',
        'expira_en' => 'datetime',
    ];

    /**
     * Vida útil por tipo, en HORAS. Es el corazón del modelo: un reporte no se
     * "borra", caduca — y la caducidad se evalúa al leer, así no hace falta ni
     * worker ni scheduler (que en Render free no corren).
     * Los plazos siguen qué tan rápido cambia el dato en la Carretera Austral:
     * el clima y la fauna se mueven en horas; un derrumbe o un corte pueden durar
     * días; que haya bencina en un pueblo chico se vuelve dudoso al día siguiente.
     */
    public const VIDA_HORAS = [
        'derrumbe' => 48,
        'camino' => 24,
        'hielo' => 12,
        'combustible' => 24,
        'ferry' => 12,
        'camping' => 72,
        'tiempo' => 6,
        'fauna' => 6,
        'evento' => 72,
        'comentario' => 24,
    ];

    /** Cuánto extiende la vigencia cada confirmación (horas), con tope. */
    public const EXTENSION_HORAS = 3;

    public const EXTENSION_MAXIMA_HORAS = 24;

    /** Descartes necesarios para ocultar un reporte que la comunidad desmiente. */
    public const DESCARTES_PARA_OCULTAR = 3;

    public static function tipos(): array
    {
        return array_keys(self::VIDA_HORAS);
    }

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    public function votos(): HasMany
    {
        return $this->hasMany(ReporteVoto::class);
    }

    /** Reportes que la PWA debe ver: visibles y sin caducar. */
    public function scopeVigentes(Builder $q): Builder
    {
        return $q->where('oculto', false)->where('expira_en', '>', now());
    }

    /**
     * Forma que consume la PWA. `localidad` va como slug (igual que en los
     * lugares) y se expone `expira_en` para que la app pueda apagar el marcador
     * sola si el viajero está sin señal desde hace rato.
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'comentario' => $this->comentario,
            'confirmaciones' => $this->confirmaciones,
            'descartes' => $this->descartes,
            'localidad' => $this->localidad?->slug,
            'creado_en' => $this->created_at?->toIso8601String(),
            'expira_en' => $this->expira_en?->toIso8601String(),
        ];
    }
}
