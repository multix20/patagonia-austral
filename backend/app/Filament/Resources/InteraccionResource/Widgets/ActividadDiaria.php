<?php

namespace App\Filament\Resources\InteraccionResource\Widgets;

use App\Models\Interaccion;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;
use Livewire\Attributes\Reactive;

/**
 * Cuánto se usa la app cada día. Dos líneas sobre UN SOLO eje:
 *
 *  - **Aperturas** — cuánta gente llega (alcance).
 *  - **Fichas vistas** — cuánto mira quien llegó (profundidad).
 *
 * Las dos cuentan lo mismo (eventos), así que comparten escala honestamente. Un
 * segundo eje habría sido la trampa clásica: alinear dos escalas distintas
 * inventa una correlación que no está en el dato.
 */
class ActividadDiaria extends ChartWidget
{
    #[Reactive]
    public ?int $periodo = 30;

    protected static ?string $heading = 'Actividad por día';

    protected int|string|array $columnSpan = 'full';

    protected static ?string $maxHeight = '260px';

    protected function getType(): string
    {
        return 'line';
    }

    /**
     * Azul y naranja fijos, los mismos en tema claro y oscuro.
     *
     * No es comodidad: el par está verificado contra las DOS superficies del
     * panel (blanco y el gris casi negro del modo oscuro) y pasa banda de
     * luminosidad, piso de croma, contraste ≥3:1 y separación para daltonismo
     * (ΔE 26,8 en protanopía, muy por encima del piso de 8). Un par que solo
     * sirviera en un tema obligaría a repintar el gráfico al cambiar de modo.
     */
    private const COLORES = ['#3987e5', '#d95926'];

    protected function getData(): array
    {
        $dias = $this->periodo ?: 30;
        $hasta = now()->toDateString();
        $desde = now()->subDays($dias - 1)->toDateString();

        $aperturas = Interaccion::serie(['app_abierta'], $desde, $hasta);
        $fichas = Interaccion::serie(['ficha'], $desde, $hasta);

        return [
            'datasets' => [
                $this->linea('Aperturas de la app', $aperturas, self::COLORES[0]),
                $this->linea('Fichas vistas', $fichas, self::COLORES[1]),
            ],
            // Etiqueta corta: con 90 días en pantalla la fecha completa no cabe,
            // y el eje se encarga de saltarse las que sobran.
            'labels' => array_map(
                fn (string $dia) => Carbon::parse($dia)->format('d/m'),
                array_keys($aperturas)
            ),
        ];
    }

    private function linea(string $etiqueta, array $serie, string $color): array
    {
        return [
            'label' => $etiqueta,
            'data' => array_values($serie),
            'borderColor' => $color,
            'backgroundColor' => $color,
            'borderWidth' => 2,
            // Sin nodos dibujados —con 90 días serían una salchicha— pero con
            // una zona de acierto ancha: el dato se lee al pasar por encima, y
            // apuntar a un punto de 3 px con el dedo no es una interacción.
            'pointRadius' => 0,
            'pointHoverRadius' => 5,
            'pointHitRadius' => 14,
            // Recto, no curvo: una curva insinúa valores entre dos días que
            // simplemente no existen. Esto se cuenta por jornada.
            'tension' => 0,
            'fill' => false,
        ];
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                // Dos series: la leyenda no es opcional, es lo único que dice
                // cuál línea es cuál.
                'legend' => ['display' => true, 'position' => 'bottom'],
                'tooltip' => ['mode' => 'index', 'intersect' => false],
            ],
            'interaction' => ['mode' => 'index', 'intersect' => false],
            'scales' => [
                'y' => [
                    // Sin esto Chart.js recorta el eje y una diferencia de dos
                    // visitas parece un despegue.
                    'beginAtZero' => true,
                    'ticks' => ['precision' => 0],
                ],
                'x' => [
                    'grid' => ['display' => false],
                    'ticks' => ['maxTicksLimit' => 8, 'autoSkip' => true, 'maxRotation' => 0],
                ],
            ],
        ];
    }
}
