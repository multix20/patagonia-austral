<?php

namespace App\Observers;

use App\Models\Notice;
use App\Services\WebPushSender;
use Illuminate\Support\Facades\Log;

class NoticeObserver
{
    /**
     * Al guardar un aviso:
     *  - Si su fecha de publicación ya llegó (<= ahora) y no se ha notificado,
     *    envía el Web Push de inmediato (tras la respuesta HTTP).
     *  - Si está programado a futuro, no hace nada: el comando `avisos:despachar`
     *    (planificado cada minuto) lo enviará cuando llegue la hora.
     */
    public function saved(Notice $notice): void
    {
        $listoParaEnviar = $notice->publicado_en !== null
            && $notice->publicado_en <= now()
            && $notice->notificado_en === null;

        if ($listoParaEnviar) {
            Log::info('NoticeObserver: aviso publicado, encolando push', ['notice_id' => $notice->id]);

            // Marca inmediata (silenciosa) para evitar reenvíos y choques con el planificador.
            $notice->notificado_en = now();
            $notice->saveQuietly();

            dispatch(function () use ($notice) {
                app(WebPushSender::class)->enviarAviso($notice);
            })->afterResponse();
        }
    }
}
