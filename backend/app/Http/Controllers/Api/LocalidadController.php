<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Localidad;

class LocalidadController extends Controller
{
    /** GET /api/localidades — pueblos de la ruta (norte → sur) para el selector de la PWA */
    public function index()
    {
        return response()->json(
            Localidad::where('publicado', true)
                ->orderBy('orden')
                ->get()
                ->map(fn (Localidad $l) => $l->toApi())
        );
    }
}
