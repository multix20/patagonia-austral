<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notice;

class NoticeController extends Controller
{
    /** GET /api/notices — avisos municipales publicados (últimos 20) */
    public function index()
    {
        return response()->json(
            Notice::whereNotNull('publicado_en')
                ->where('publicado_en', '<=', now())
                ->orderByDesc('publicado_en')
                ->limit(20)
                ->get(['id', 'mensaje', 'tipo', 'publicado_en'])
        );
    }
}
