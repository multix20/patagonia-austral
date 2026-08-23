<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Filament\Resources\InteraccionResource;

/**
 * Desde qué países se abre la app.
 *
 * Es la pregunta que aparece el día que alguien que no eres tú abre la PWA:
 * "¿quién la vio?". La respuesta honesta a "quién" es que no se sabe —no hay
 * cuentas, ni sesión, ni dispositivo, ni IP guardada: ver la migración de
 * `interacciones`— y este widget no la cambia. Lo que sí contesta es "desde
 * dónde", que para decidir es casi siempre lo mismo: no es igual que las 30
 * aperturas de la semana vengan de Chile a que vengan de Alemania.
 *
 * El país sale de la zona horaria del teléfono, así que dice dónde está el
 * APARATO, no de dónde es la persona: el europeo que ya va por Coyhaique
 * aparece en Chile. Para eso está el widget de idioma al lado.
 */
class TopOrigenes extends Ranking
{
    protected function tipos(): array
    {
        return ['origen_pais'];
    }

    protected function titulo(): string
    {
        return 'Desde qué países entran';
    }

    protected function descripcion(): string
    {
        return $this->medidoDesde('Por la zona horaria del teléfono, sin mirar la IP');
    }

    protected function textoVacio(): string
    {
        return 'Todavía nadie abrió la app en este periodo.';
    }

    protected function etiquetaDe(string $referencia): string
    {
        return InteraccionResource::etiqueta('origen_pais', $referencia);
    }
}
