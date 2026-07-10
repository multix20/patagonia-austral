<?php

namespace App\Services;

use App\Models\Notice;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushSender
{
    /**
     * Envía un aviso municipal como notificación Web Push a todos los
     * dispositivos suscritos. Limpia las suscripciones caducadas (404/410).
     */
    public function enviarAviso(Notice $notice): void
    {
        $suscripciones = PushSubscription::all();
        Log::info('WebPushSender: enviando aviso', [
            'notice_id' => $notice->id,
            'suscripciones' => $suscripciones->count(),
        ]);

        if ($suscripciones->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('webpush.subject'),
                'publicKey' => config('webpush.public_key'),
                'privateKey' => config('webpush.private_key'),
            ],
        ]);

        $payload = json_encode([
            'title' => 'Patagonia Austral',
            'body' => $notice->mensaje['es'] ?? '',
            'body_en' => $notice->mensaje['en'] ?? '',
            'tipo' => $notice->tipo,
        ]);

        foreach ($suscripciones as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys' => ['p256dh' => $sub->p256dh, 'auth' => $sub->auth],
                ]),
                $payload
            );
        }

        foreach ($webPush->flush() as $report) {
            $codigo = $report->getResponse()?->getStatusCode();
            if ($report->isSuccess()) {
                Log::info('WebPushSender: enviado OK', ['codigo' => $codigo]);
            } else {
                Log::warning('WebPushSender: fallo de envío', [
                    'codigo' => $codigo,
                    'motivo' => $report->getReason(),
                ]);
                if (in_array($codigo, [404, 410], true)) {
                    PushSubscription::where('endpoint', (string) $report->getEndpoint())->delete();
                }
            }
        }
    }
}
