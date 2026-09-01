<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interaccion;
use App\Support\Origen;
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

        $canales = null;

        foreach ($datos['eventos'] as $e) {
            $ref = $e['ref'] ?? null;

            // Los dos eventos de origen son los únicos cuya referencia NO es un
            // id nuestro sino texto libre del navegador (una zona horaria IANA,
            // una etiqueta de idioma). Se canonizan contra la base de PHP antes
            // de guardar —la zona se reduce a país— y lo que no exista se
            // descarta en silencio: sin ese cierre, un endpoint que escribe sin
            // login admitiría referencias inventadas sin fin y la tabla dejaría
            // de estar acotada por el catálogo, que es la propiedad por la que
            // esto es un rollup (ver la migración y App\Support\Origen).
            if (in_array($e['tipo'], Interaccion::TIPOS_DE_ORIGEN, true)) {
                $ref = $e['tipo'] === 'origen_pais'
                    ? Origen::paisDeZona((string) $ref)
                    : Origen::idiomaNormalizado((string) $ref);

                if ($ref === null) {
                    continue;
                }
            }

            // Misma regla para el canal de difusión: la referencia sale del
            // `?c=` de la URL, o sea de cualquiera que se invente un enlace. Se
            // acepta solo lo que esté en la lista de canales y el resto se
            // descarta EN SILENCIO —sin 422— porque un 422 haría que la PWA
            // tirara el lote entero, y con él las aperturas y las fichas del
            // día (ver el manejo del 422 en analitica.js).
            if ($e['tipo'] === 'campana') {
                // Se pide una sola vez por lote, y solo si de verdad llegó un
                // canal: la mayoría de los lotes son fichas y contactos.
                $canales ??= Interaccion::canalesValidos();

                if (! isset($canales[(string) $ref])) {
                    continue;
                }
            }

            // El día lo pone el SERVIDOR, no el cliente. Un reloj mal puesto (o
            // alguien con ganas) podría cargar el contador a una fecha futura y
            // ensuciar el informe para siempre. Se pierde algo de precisión con
            // los lotes que cruzan la medianoche o que estuvieron días en la
            // cola sin señal; a cambio, ninguna fila puede quedar en 2035.
            Interaccion::sumar($e['tipo'], $ref, (int) $e['n']);
        }

        // 204: la PWA solo necesita saber que llegó para vaciar su cola. No hay
        // nada que devolverle — la analítica es de ida.
        return response()->noContent();
    }
}
