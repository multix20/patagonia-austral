<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Filament\Resources\InteraccionResource;

/**
 * Qué pueblos abre la gente. Es la pregunta de contenido: donde hay demanda y
 * pocas fichas publicadas, ahí conviene gastar la próxima tanda de correos a
 * las encargadas de turismo.
 */
class TopLocalidades extends Ranking
{
    protected function tipos(): array
    {
        return ['localidad'];
    }

    protected function titulo(): string
    {
        return 'Localidades más abiertas';
    }

    protected function descripcion(): string
    {
        return 'Dónde está mirando la gente';
    }

    protected function textoVacio(): string
    {
        return 'Todavía nadie abrió una localidad en este periodo.';
    }

    protected function etiquetaDe(string $referencia): string
    {
        return InteraccionResource::etiqueta('localidad', $referencia);
    }
}
