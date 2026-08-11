<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Calificacion;
use App\Models\Place;
use Illuminate\Http\Request;

// API pública de calificaciones (Fase 3). Sin login, como los reportes: el
// viajero puntúa el servicio al que fue y puede dejar un comentario. El control
// de abuso es rate limit por IP (routes/api.php) + una calificación por
// dispositivo y ficha (índice único) + moderación desde el CMS.
class CalificacionController extends Controller
{
    /** Cuántas opiniones con texto se devuelven por ficha. */
    private const OPINIONES_POR_FICHA = 30;

    /**
     * GET /api/calificaciones?place_id=N — opiniones visibles de una ficha, lo
     * más nuevo primero. Solo las que traen texto: una calificación sin
     * comentario ya está contada en el promedio de la ficha, y como fila vacía
     * en la lista no aporta nada.
     */
    public function index(Request $request)
    {
        $datos = $request->validate([
            'place_id' => ['required', 'integer', 'exists:places,id'],
        ]);

        return response()->json(
            Calificacion::where('place_id', $datos['place_id'])
                ->visibles()
                ->conComentario()
                ->orderByDesc('created_at')
                ->limit(self::OPINIONES_POR_FICHA)
                ->get()
                ->map(fn (Calificacion $c) => $c->toApi())
        );
    }

    /**
     * POST /api/calificaciones — califica una ficha.
     *
     * Volver a calificar la misma ficha desde el mismo dispositivo EDITA la
     * calificación anterior en vez de sumar otra. Dos motivos: es lo que espera
     * quien vuelve al mismo hospedaje al año siguiente y quiere corregir su
     * nota, y de paso hace que el reintento de la cola offline sea inofensivo
     * (mandar dos veces lo mismo deja el mismo resultado).
     */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'place_id' => ['required', 'integer', 'exists:places,id'],
            'estrellas' => ['required', 'integer', 'between:1,5'],
            'comentario' => ['nullable', 'string', 'max:280'],
            // Id aleatorio que la PWA guarda en el dispositivo. Se hashea antes
            // de tocar la BD: nunca se almacena en claro.
            'dispositivo' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $place = Place::findOrFail($datos['place_id']);

        // Las fichas de emergencia no llevan estrellas (ver el modelo). Se
        // responde 422 y no 403 porque, para la PWA, esto es lo mismo que
        // mandar un dato que no corresponde: no se reintenta.
        if (! $place->admiteCalificacion()) {
            return response()->json([
                'error' => 'no_calificable',
                'message' => 'Esta ficha no se califica.',
            ], 422);
        }

        $comentario = trim((string) ($datos['comentario'] ?? '')) ?: null;

        $calificacion = Calificacion::updateOrCreate(
            [
                'place_id' => $place->id,
                'dispositivo' => hash('sha256', $datos['dispositivo']),
            ],
            [
                'estrellas' => $datos['estrellas'],
                'comentario' => $comentario,
                // Una calificación editada vuelve a ser visible: si la anterior
                // se ocultó por el comentario, el texto nuevo merece su turno.
                'oculto' => false,
            ]
        );

        $place->recalcularCalificacion();

        return response()->json([
            'calificacion' => $calificacion->toApi(),
            // La ficha actualizada: la PWA pinta el promedio nuevo sin tener que
            // volver a bajarse el directorio entero.
            'estrellas' => $place->calificacion_promedio,
            'calificaciones' => $place->calificaciones_total,
        ], $calificacion->wasRecentlyCreated ? 201 : 200);
    }
}
