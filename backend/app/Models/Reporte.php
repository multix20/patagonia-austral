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
     *
     * Recorte a TRES tipos (ago-2026), todos con la MISMA vigencia de 24 h. Antes
     * eran once tipos con siete plazos distintos, afinados uno a uno; el problema
     * no era el plazo sino la grilla: once botones no se contestan de un toque
     * con el auto detenido. Los tres que quedan son los que hacen frenar a quien
     * viene detrás, y para los tres la pregunta es la misma —"¿sigue ahí hoy?"—,
     * así que comparten las 24 h. Un plazo único además se puede prometer en la
     * interfaz sin letra chica.
     *
     * Los tipos viejos (derrumbe, hielo, camino, combustible…) ya no se pueden
     * crear, pero los reportes existentes siguen vivos hasta su `expira_en`: la
     * caducidad se guardó en la fila al crearla, no se recalcula al leer.
     */
    public const VIDA_HORAS = [
        'peligro' => 24,
        'accidente' => 24,
        // Faena/desvío del Plan Ruta Austral (MOP, 2026-2030). Es el único de los
        // tres que puede durar semanas en el mismo punto, pero se queda en 24 h
        // como los otros: quien la vuelve a pasar la confirma, y una faena que ya
        // nadie confirma probablemente terminó. Vale más un mapa que se apaga
        // solo que uno con obras fantasma de hace un mes.
        'faena' => 24,
    ];

    /** Cuánto extiende la vigencia cada confirmación (horas), con tope. */
    public const EXTENSION_HORAS = 3;

    /**
     * Piso del tope de extensión (horas). Ojo con el nombre: NO es un máximo.
     * Es el valor mínimo que puede tomar el tope de `topeExtensionHoras()`, y
     * manda solo para los tipos de vida corta (≤ 24 h), que son la mayoría.
     */
    public const EXTENSION_TOPE_MINIMO_HORAS = 24;

    /**
     * Hasta cuándo pueden estirar las confirmaciones un reporte de este tipo,
     * contado desde ahora. El tope acota la EXTENSIÓN, no la vigencia natural:
     * un tope fijo ACORTABA los reportes de vida larga — confirmar uno de 72 h
     * lo dejaba en 24 h, o sea que la comunidad lo mataba justo por darle la
     * razón. La fórmula es "una vida entera por delante", con el mínimo de 24 h
     * para los tipos cortos.
     *
     * Con los tres tipos actuales en 24 h esto devuelve siempre 24, y la fórmula
     * podría parecer de más. Se conserva por dos razones: sostiene el día que
     * vuelva a haber un tipo de vida larga, y da un tope sano (24 h) a los tipos
     * HISTÓRICOS, que ya no están en VIDA_HORAS. A esos el tope no les puede
     * recortar nada igualmente: `votar()` nunca baja `expira_en` (ver el `max()`
     * de la actualización), así que un reporte viejo simplemente deja de
     * estirarse y vive lo que le quedaba.
     */
    public static function topeExtensionHoras(string $tipo): int
    {
        return max(self::EXTENSION_TOPE_MINIMO_HORAS, self::VIDA_HORAS[$tipo] ?? 0);
    }

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
