<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushController extends Controller
{
    /** GET /api/push/public-key — clave pública VAPID para el navegador */
    public function publicKey()
    {
        return response()->json(['publicKey' => config('webpush.public_key')]);
    }

    /** POST /api/push/subscribe — registra la suscripción push del dispositivo */
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            ['p256dh' => $data['keys']['p256dh'], 'auth' => $data['keys']['auth']]
        );

        return response()->json(['ok' => true], 201);
    }
}
