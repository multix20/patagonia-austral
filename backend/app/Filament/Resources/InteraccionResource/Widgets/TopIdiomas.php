<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Filament\Resources\InteraccionResource;

/**
 * En qué idioma tiene el teléfono quien abre la app.
 *
 * Es la otra mitad del origen, y la que separa dos públicos que el país no
 * distingue: el alemán que ya está en la ruta manda zona horaria de Chile pero
 * idioma `de-DE`, y `es-AR` es un argentino, que en la Austral es un segmento
 * grande y distinto del chileno.
 *
 * Ojo con no confundirlo con el tipo `idioma`, que cuenta los CAMBIOS de
 * idioma dentro de la app: eso mide a quien tocó el botón, no a quien llegó.
 * Para saber si conviene escribir el próximo contenido en inglés hace falta
 * esto, que se mide en cada apertura.
 */
class TopIdiomas extends Ranking
{
    protected function tipos(): array
    {
        return ['origen_idioma'];
    }

    protected function titulo(): string
    {
        return 'Idioma del visitante';
    }

    protected function descripcion(): string
    {
        return $this->medidoDesde('El idioma del teléfono, no el que eligió en la app');
    }

    protected function textoVacio(): string
    {
        return 'Todavía nadie abrió la app en este periodo.';
    }

    protected function etiquetaDe(string $referencia): string
    {
        return InteraccionResource::etiqueta('origen_idioma', $referencia);
    }
}
