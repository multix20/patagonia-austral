<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ruta;

class RutaController extends Controller
{
    /**
     * GET /api/rutas — trazados y áreas para dibujar en el mapa.
     *
     * Se ordenan por `tipo` según Ruta::TIPOS (áreas primero, pasarelas al
     * final) para que la PWA pueda pintarlas en ese orden y las líneas no queden
     * tapadas por un polígono. Es una decisión de dibujo, pero se resuelve acá
     * una vez y no en cada cliente.
     */
    public function index()
    {
        $orden = array_flip(Ruta::TIPOS);

        return response()->json(
            Ruta::with('localidad')
                ->where('publicado', true)
                ->get()
                ->sortBy(fn (Ruta $r) => $orden[$r->tipo] ?? 99)
                ->values()
                ->map(fn (Ruta $r) => $r->toApi())
        );
    }
}
