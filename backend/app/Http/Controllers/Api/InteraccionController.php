<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interaccion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Recepción de la analítica de uso de la PWA (Fase 3).
//
// La app NO llama a este endpoint en cada toque: acumula los contadores en
// IndexedDB y manda un lote cada tanto (ver frontend/src/analitica.js). Así el
// viajero sin señal —el caso normal en la ruta— no pierde sus números, y el
// backend recibe una petición cada varios minutos en vez de una por toque, que
// es lo que hace que esto quepa en el plan gratis de Render.
class InteraccionController extends Controller
{
    /** Cuántas líneas admite un lote. Un mes entero de uso intenso cabe de sobra. */
    private const MAX_EVENTOS = 100;

    /** POST /api/interacciones — suma un lote de contadores al rollup diario. */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'eventos' => ['required', 'array', 'max:'.self::MAX_EVENTOS],
            'eventos.*.tipo' => ['required', Rule::in(array_keys(Interaccion::TIPOS))],
            'eventos.*.ref' => ['nullable', 'string', 'max:64'],
            'eventos.*.n' => ['required', 'integer', 'between:1,'.Interaccion::MAX_POR_EVENTO],
        ]);

        foreach ($datos['eventos'] as $e) {
            // El día lo pone el SERVIDOR, no el cliente. Un reloj mal puesto (o
            // alguien con ganas) podría cargar el contador a una fecha futura y
            // ensuciar el informe para siempre. Se pierde algo de precisión con
            // los lotes que cruzan la medianoche o que estuvieron días en la
            // cola sin señal; a cambio, ninguna fila puede quedar en 2035.
            Interaccion::sumar($e['tipo'], $e['ref'] ?? null, (int) $e['n']);
        }

        // 204: la PWA solo necesita saber que llegó para vaciar su cola. No hay
        // nada que devolverle — la analítica es de ida.
        return response()->noContent();
    }
}
