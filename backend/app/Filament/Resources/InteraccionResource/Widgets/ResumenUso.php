<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Models\Interaccion;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Livewire\Attributes\Reactive;

/**
 * Las cuatro cifras con las que se decide algo, comparadas contra el periodo
 * anterior de la misma duración.
 *
 * La comparación es el punto, no un adorno. Un número suelto ("87 aperturas")
 * no se puede interpretar: 87 puede ser una gran noticia o el derrumbe de un
 * mes bueno. Y esta pantalla existe justamente para evaluar el primer volante
 * de la campaña de difusión (ver ESTADO_Y_PENDIENTES → "Publicitar la app"),
 * o sea para contestar "¿esto movió la aguja?" — que es una pregunta sobre la
 * diferencia entre dos periodos, no sobre un total.
 */
class ResumenUso extends StatsOverviewWidget
{
    /**
     * Periodo en días, que manda la PÁGINA. `#[Reactive]` es lo que hace que
     * cambiarlo arriba vuelva a calcular esto: sin el atributo, Livewire monta
     * el widget una vez y se queda con el valor del primer render.
     */
    #[Reactive]
    public ?int $periodo = 30;

    protected function getStats(): array
    {
        return [
            $this->tarjeta('Aperturas de la app', ['app_abierta'], 'heroicon-m-device-phone-mobile'),
            $this->tarjeta('Fichas vistas', ['ficha'], 'heroicon-m-eye'),
            $this->tarjeta('Contactos a un negocio', Interaccion::GRUPOS['contacto'], 'heroicon-m-phone-arrow-up-right'),
            $this->tarjeta('Aportes de viajeros', Interaccion::GRUPOS['aportes'], 'heroicon-m-megaphone'),
        ];
    }

    private function tarjeta(string $titulo, array $tipos, string $icono): Stat
    {
        $dias = $this->periodo ?: 30;

        // Dos ventanas pegadas del mismo largo: los últimos N días (hoy
        // incluido) y los N inmediatamente anteriores.
        $hasta = now()->toDateString();
        $desde = now()->subDays($dias - 1)->toDateString();
        $hastaPrevio = now()->subDays($dias)->toDateString();
        $desdePrevio = now()->subDays($dias * 2 - 1)->toDateString();

        $serie = Interaccion::serie($tipos, $desde, $hasta);
        $actual = array_sum($serie);
        $previo = Interaccion::total($tipos, $desdePrevio, $hastaPrevio);

        // ¿El periodo anterior es comparable, o es anterior a que existiera la
        // medición? No es lo mismo "esa semana no vino nadie" que "esa semana
        // no estábamos contando", y hasta ahora la tarjeta decía lo primero.
        $primerDia = Interaccion::primerDia();
        $sinMedicion = $primerDia === null || $primerDia > $hastaPrevio;

        // `null` = no hay con qué comparar (el periodo previo está en cero, así
        // que el porcentaje sería una división por cero, no un infinito).
        $variacion = $previo > 0 ? (int) round(($actual - $previo) / $previo * 100) : null;

        $tarjeta = (new Stat($titulo, number_format($actual, 0, ',', '.')))
            ->icon($icono)
            ->description($this->comparacion($actual, $previo, $dias, $variacion, $sinMedicion, $primerDia))
            ->descriptionIcon(match (true) {
                in_array($variacion, [null, 0], true) => null,
                $variacion > 0 => 'heroicon-m-arrow-trending-up',
                default => 'heroicon-m-arrow-trending-down',
            })
            ->color(match (true) {
                in_array($variacion, [null, 0], true) => 'gray',
                $variacion > 0 => 'success',
                default => 'danger',
            });

        // La chispa solo si hubo algo que dibujar: una línea plana en cero se
        // lee como "el dato existe y es constante", que es lo contrario de la
        // verdad.
        return $actual > 0 ? $tarjeta->chart(array_values($serie)) : $tarjeta;
    }

    private function comparacion(
        int $actual,
        int $previo,
        int $dias,
        ?int $variacion,
        bool $sinMedicion,
        ?string $primerDia,
    ): string {
        // Primero lo que se sabe del periodo ANTERIOR, porque cambia el sentido
        // de todo lo demás: si no había medición, no hubo cero — no hubo dato.
        if ($sinMedicion) {
            return $primerDia === null
                ? 'Todavía no hay nada medido'
                : 'Sin comparación: la medición empieza el '.Carbon::parse($primerDia)->format('d/m/Y');
        }

        if ($actual === 0 && $previo === 0) {
            return 'Sin datos en este periodo';
        }

        if ($variacion === null) {
            return "Primer periodo con datos (nada en los {$dias} días previos)";
        }

        // Una diferencia que redondea a cero se dice con palabras. Antes salía
        // "-0%" —226 contra 227— con flecha roja hacia abajo: un empate
        // disfrazado de mala noticia, que es exactamente el tipo de ruido que
        // hace desconfiar de un panel.
        if ($variacion === 0) {
            return "Igual que los {$dias} días previos ({$previo})";
        }

        $signo = $variacion > 0 ? '+' : '';

        return "{$signo}{$variacion}% · {$previo} en los {$dias} días previos";
    }
}
