<?php

namespace App\Models;

use App\Observers\NoticeObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(NoticeObserver::class)]
class Notice extends Model
{
    protected $fillable = ['mensaje', 'tipo', 'publicado_en', 'notificado_en'];

    protected $casts = [
        'mensaje' => 'array',
        'publicado_en' => 'datetime',
        'notificado_en' => 'datetime',
    ];
}
