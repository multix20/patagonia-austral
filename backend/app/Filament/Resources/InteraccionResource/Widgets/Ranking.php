<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Models\Interaccion;
use Filament\Widgets\Widget;
use Livewire\Attributes\Reactive;

/**
 * Base de los rankings del panel ("lo más abierto", "lo más visto").
 *
 * Esto es lo que la lista cruda NO puede contestar por más que se ordene: el
 * rollup guarda una fila por DÍA, así que la misma ficha aparece repetida una
 * vez por jornada y el total hay que sumarlo a mano. La pregunta "¿qué se mira
 * más?" solo existe agregada.
 *
 * Forma elegida: barras horizontales de UN SOLO color con el número al lado.
 * Las localidades y las fichas son categorías sin orden natural, así que pintar
 * cada barra de un tono distinto según su tamaño sería codificar dos veces lo
 * mismo (el largo ya dice quién es más grande) y quemar el color, que es el
 * único canal libre que queda.
 */
abstract class Ranking extends Widget
{
    protected static string $view = 'filament.widgets.ranking';

    #[Reactive]
    public ?int $periodo = 30;

    /** Cuántas filas se muestran. Más que esto ya es la lista de abajo. */
    protected const FILAS = 8;

    /** Tipos de interacción que entran en este ranking. */
    abstract protected function tipos(): array;

    abstract protected function titulo(): string;

    abstract protected function descripcion(): string;

    /** Qué decir cuando todavía no hay ni un dato. */
    abstract protected function textoVacio(): string;

    /** Nombre legible de una referencia (id de ficha, slug de localidad…). */
    abstract protected function etiquetaDe(string $referencia): string;

    /** Línea secundaria opcional bajo la barra (desglose por tipo). */
    protected function detalleDe(array $fila): ?string
    {
        return null;
    }

    protected function getViewData(): array
    {
        $dias = $this->periodo ?: 30;
        $filas = Interaccion::ranking(
            $this->tipos(),
            now()->subDays($dias - 1)->toDateString(),
            now()->toDateString(),
            static::FILAS,
        );

        // La barra se mide contra el PRIMERO, no contra el total: lo que se
        // compara acá es "cuánto más que el que va ganando", y con el total la
        // primera barra quedaría al 30% de ancho y todas las demás invisibles.
        $tope = $filas[0]['total'] ?? 0;

        return [
            'titulo' => $this->titulo(),
            'descripcion' => $this->descripcion(),
            'textoVacio' => $this->textoVacio(),
            'filas' => array_map(fn (array $f) => [
                'etiqueta' => $this->etiquetaDe($f['referencia']),
                'total' => $f['total'],
                'detalle' => $this->detalleDe($f),
                'ancho' => $tope > 0 ? max(2, round($f['total'] / $tope * 100)) : 0,
            ], $filas),
        ];
    }
}
