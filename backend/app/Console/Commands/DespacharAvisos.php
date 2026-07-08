<?php

namespace App\Console\Commands;

use App\Models\Notice;
use App\Services\WebPushSender;
use Illuminate\Console\Command;

class DespacharAvisos extends Command
{
    protected $signature = 'avisos:despachar';

    protected $description = 'Envía Web Push de los avisos publicados cuya hora ya llegó y aún no se notificaron';

    public function handle(WebPushSender $sender): int
    {
        $pendientes = Notice::whereNotNull('publicado_en')
            ->where('publicado_en', '<=', now())
            ->whereNull('notificado_en')
            ->get();

        $this->info("Avisos pendientes de notificar: {$pendientes->count()}");

        foreach ($pendientes as $aviso) {
            // Marca antes de enviar para evitar reenvíos si la ejecución se solapa.
            $aviso->notificado_en = now();
            $aviso->saveQuietly();

            $sender->enviarAviso($aviso);
            $this->line("Enviado aviso #{$aviso->id}");
        }

        return self::SUCCESS;
    }
}
