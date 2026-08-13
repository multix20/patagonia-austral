<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Filament\Resources\InteraccionResource;
use App\Models\Interaccion;

/**
 * Qué fichas se miran, y —lo que de verdad importa— cuántas de esas miradas
 * terminaron en un intento de contacto.
 *
 * El desglose es el dato vendible de la capa comercial (Fase 3): a un negocio
 * no se le ofrece una intuición, se le dice "tu ficha se vio N veces este mes y
 * M personas pidieron cómo llegar". Por eso el ranking suma vistas Y contactos
 * en vez de ordenar solo por vistas: una ficha con pocas visitas y muchos
 * "llamar" vale más que una muy mirada que no mueve a nadie.
 */
class TopFichas extends Ranking
{
    protected function tipos(): array
    {
        return Interaccion::TIPOS_DE_FICHA;
    }

    protected function titulo(): string
    {
        return 'Fichas más miradas';
    }

    protected function descripcion(): string
    {
        return 'Vistas y contactos, sumados';
    }

    protected function textoVacio(): string
    {
        return 'Todavía nadie abrió una ficha en este periodo.';
    }

    protected function etiquetaDe(string $referencia): string
    {
        return InteraccionResource::etiqueta('ficha', $referencia);
    }

    protected function detalleDe(array $fila): ?string
    {
        $vistas = $fila['por_tipo']['ficha'] ?? 0;
        $contactos = array_sum(array_intersect_key(
            $fila['por_tipo'],
            array_flip(Interaccion::GRUPOS['contacto'])
        ));

        $partes = [$vistas === 1 ? '1 vista' : "{$vistas} vistas"];

        if ($contactos > 0) {
            $partes[] = $contactos === 1 ? '1 contacto' : "{$contactos} contactos";
        }

        return implode(' · ', $partes);
    }
}
