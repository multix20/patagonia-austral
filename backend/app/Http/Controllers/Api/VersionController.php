<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WebPushSender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Hook de despliegue de la PWA.
 *
 * Lo llama Netlify al terminar un deploy de producción ("outgoing webhook" →
 * Deploy succeeded) y desde aquí sale un Web Push que avisa que hay versión
 * nueva. Es lo único que hace aparecer el indicador con la app CERRADA: la app
 * abierta se entera sola (revisa el service worker), pero cerrada no corre nada
 * — y en Android el punto del lanzador solo lo pone una notificación.
 *
 * Configuración en DEPLOY.md §2.6.
 */
class VersionController extends Controller
{
    /** Un solo aviso por ventana: Netlify dispara el hook más de una vez por deploy. */
    private const CLAVE_ULTIMO = 'push:nueva-version';

    private const MINUTOS_ENTRE_AVISOS = 15;

    /** POST /api/version/desplegada?token=… */
    public function desplegada(Request $request)
    {
        $token = (string) config('webpush.deploy_token');

        // Sin token configurado el hook queda CERRADO. Es el botón de "notificar
        // a todos los dispositivos": no puede quedar abierto por omisión.
        if ($token === '') {
            return response()->json(['ok' => false, 'motivo' => 'hook-no-configurado'], 503);
        }

        $recibido = (string) ($request->header('X-Deploy-Token') ?? $request->query('token', ''));
        if (! hash_equals($token, $recibido)) {
            return response()->json(['ok' => false], 401);
        }

        // Netlify manda el deploy entero; solo interesa producción (los deploy
        // previews y las ramas no le cambian la app a nadie). Sin `context` —una
        // llamada manual con curl para probar— se asume producción.
        $contexto = (string) $request->input('context', 'production');
        if ($contexto !== 'production') {
            return response()->json(['ok' => true, 'enviado' => false, 'motivo' => 'no-produccion']);
        }

        // Un push va a TODOS los teléfonos: repetirlo por cada reintento de
        // Netlify sería spam. Fuera de la ventana el siguiente deploy sí avisa.
        if (Cache::has(self::CLAVE_ULTIMO)) {
            return response()->json(['ok' => true, 'enviado' => false, 'motivo' => 'ya-avisado']);
        }
        Cache::put(self::CLAVE_ULTIMO, now()->toIso8601String(), now()->addMinutes(self::MINUTOS_ENTRE_AVISOS));

        Log::info('VersionController: despliegue avisado', [
            'deploy' => $request->input('id'),
            'commit' => $request->input('commit_ref'),
        ]);

        // Igual que los avisos municipales: el reparto va después de la
        // respuesta, para no dejar colgado al webhook mientras se envían N push.
        dispatch(function () {
            app(WebPushSender::class)->enviarNuevaVersion();
        })->afterResponse();

        return response()->json(['ok' => true, 'enviado' => true]);
    }
}
