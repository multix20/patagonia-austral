<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;

class PlaceController extends Controller
{
    /** GET /api/places — directorio completo para sincronización offline de la PWA */
    public function index()
    {
        return response()->json(
            Place::where('publicado', true)
                ->orderBy('id')
                ->get()
                ->map(fn (Place $p) => $p->toApi())
        );
    }
}
