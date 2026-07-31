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
     * dispositivos suscritos.
     */
    public function enviarAviso(Notice $notice): void
    {
        $this->enviar([
            'title' => 'Patagonia Austral',
            'body' => $notice->mensaje['es'] ?? '',
            'body_en' => $notice->mensaje['en'] ?? '',
            'tipo' => $notice->tipo,
        ], ['motivo' => 'aviso', 'notice_id' => $notice->id]);
    }

    /**
     * Avisa que hay una versión nueva de la PWA esperando.
     *
     * Lo dispara el hook de despliegue de Netlify (POST /api/version/desplegada)
     * y es la ÚNICA forma de que el indicador llegue con la app CERRADA: una
     * página cerrada no revisa nada, y en Android la Badging API no existe
     * (Chrome no la expone) — el punto del lanzador sale de tener una
     * notificación activa. La PWA la muestra silenciosa y la cierra sola al
     * actualizarse; ver frontend/public/push-listener.js.
     */
    public function enviarNuevaVersion(): void
    {
        $this->enviar([
            'title' => 'Nueva versión lista',
            'body' => 'Abre Patagonia Austral para actualizarla. Demora un segundo.',
            'body_en' => 'Open Patagonia Austral to update it. It takes a second.',
            'tipo' => 'nueva-version',
        ], ['motivo' => 'nueva-version']);
    }

    /**
     * Reparte un payload a todas las suscripciones y limpia las caducadas
     * (404/410): son dispositivos que desinstalaron la app o revocaron el
     * permiso, y si no se borran arrastran el fallo a cada envío siguiente.
     */
    private function enviar(array $payload, array $contexto = []): void
    {
        $suscripciones = PushSubscription::all();
        Log::info('WebPushSender: enviando', $contexto + ['suscripciones' => $suscripciones->count()]);

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

        $json = json_encode($payload);

        foreach ($suscripciones as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys' => ['p256dh' => $sub->p256dh, 'auth' => $sub->auth],
                ]),
                $json
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
