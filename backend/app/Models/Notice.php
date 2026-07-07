<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $fillable = ['mensaje', 'tipo', 'publicado_en'];

    protected $casts = [
        'mensaje' => 'array',
        'publicado_en' => 'datetime',
    ];
}
