<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Voto de un dispositivo sobre un reporte ("¿sigue ahí?"). La unicidad
// (reporte_id, dispositivo) la impone la BD: un dispositivo, un voto.
class ReporteVoto extends Model
{
    protected $table = 'reporte_votos';

    protected $fillable = ['reporte_id', 'dispositivo', 'confirma'];

    protected $casts = ['confirma' => 'boolean'];

    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class);
    }
}
