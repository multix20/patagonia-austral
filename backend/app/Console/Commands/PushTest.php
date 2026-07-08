<?php

namespace App\Console\Commands;

use App\Models\PushSubscription;
use Illuminate\Console\Command;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushTest extends Command
{
    protected $signature = 'push:test';

    protected $description = 'Envía una notificación de prueba a todas las suscripciones Web Push';

    public function handle(): int
    {
        $subs = PushSubscription::all();
        $this->info("Suscripciones registradas: {$subs->count()}");

        if ($subs->isEmpty()) {
            $this->warn('No hay suscripciones. Activa las notificaciones en la PWA primero.');

            return self::SUCCESS;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('webpush.subject'),
                'publicKey' => config('webpush.public_key'),
                'privateKey' => config('webpush.private_key'),
            ],
        ]);

        $payload = json_encode([
            'title' => 'Prueba · Municipalidad de Cochrane',
            'body' => 'Notificación de prueba ✅',
            'tipo' => 'info',
        ]);

        foreach ($subs as $s) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $s->endpoint,
                    'keys' => ['p256dh' => $s->p256dh, 'auth' => $s->auth],
                ]),
                $payload
            );
        }

        foreach ($webPush->flush() as $report) {
            $code = $report->getResponse()?->getStatusCode();
            if ($report->isSuccess()) {
                $this->line("<info>OK</info> [{$code}] ".$report->getEndpoint());
            } else {
                $this->line("<error>FALLO</error> [{$code}] ".$report->getEndpoint());
                $this->line('   Motivo: '.$report->getReason());
            }
        }

        $this->info('Listo. Si el envío es OK pero no ves la notificación, el problema está en el service worker.');

        return self::SUCCESS;
    }
}
