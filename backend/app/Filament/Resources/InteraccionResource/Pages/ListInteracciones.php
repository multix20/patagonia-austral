<?php

namespace App\Filament\Resources\InteraccionResource\Pages;

use App\Filament\Resources\InteraccionResource;
use App\Filament\Resources\InteraccionResource\Widgets;
use App\Models\Interaccion;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Forms\Components\DatePicker;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Livewire\Attributes\Url;

/**
 * Panel de analítica.
 *
 * Antes esto era solo la lista cruda del rollup, y esa lista no puede contestar
 * ninguna de las preguntas por las que se construyó la tabla: como se guarda
 * una fila por (tipo, referencia, DÍA), la misma ficha aparece repetida una vez
 * por jornada y el total hay que sumarlo a ojo. Arriba van entonces las cifras
 * ya agregadas —resumen, evolución y rankings— y la lista queda abajo como el
 * detalle al que se baja cuando algo llama la atención.
 *
 * **Un solo selector de periodo para toda la página.** Es la regla que evita el
 * peor defecto de un panel: que las tarjetas de arriba y la lista de abajo
 * cuenten ventanas distintas, cada número correcto por separado y ninguno
 * cuadrando con el otro. El periodo vive acá, viaja a los widgets por
 * `getWidgetData()` y también acota la consulta de la tabla.
 */
class ListInteracciones extends ListRecords
{
    protected static string $resource = InteraccionResource::class;

    /** Ventanas ofrecidas, en días. */
    public const PERIODOS = [
        7 => 'Últimos 7 días',
        30 => 'Últimos 30 días',
        90 => 'Últimos 90 días',
    ];

    /** En la URL: así un periodo concreto se puede guardar o mandar por chat. */
    #[Url]
    public int $periodo = 30;

    /** Primer día de la ventana (hoy incluido). */
    public function desde(): string
    {
        return now()->subDays($this->periodoValido() - 1)->toDateString();
    }

    /**
     * El periodo llega por la URL, así que puede venir con cualquier cosa. Sin
     * esto, `?periodo=0` deja `subDays(-1)` —una ventana que empieza mañana— y
     * la página entera muestra ceros como si no hubiera pasado nada nunca.
     */
    private function periodoValido(): int
    {
        return array_key_exists($this->periodo, self::PERIODOS) ? $this->periodo : 30;
    }

    public function getWidgetData(): array
    {
        return ['periodo' => $this->periodoValido()];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            Widgets\ResumenUso::class,
            Widgets\ActividadDiaria::class,
            Widgets\TopLocalidades::class,
            Widgets\TopFichas::class,
            // Por dónde llegaron. Va pegado a las fichas y no al final con los
            // dos de origen porque contesta otra cosa: no "de qué país es el
            // que entró" sino "cuál de las cosas que hicimos lo trajo", que es
            // la pregunta con la que se decide si una campaña se repite.
            Widgets\TopCampanas::class,
            // De dónde llega quien abre la app. Van al final y no arriba a
            // propósito: contestan "quién vino", que es la pregunta del día que
            // aparece el primer visitante de verdad, pero lo que se mira todas
            // las semanas para decidir contenido y capa comercial sigue siendo
            // qué pueblo y qué ficha se abren.
            Widgets\TopOrigenes::class,
            Widgets\TopIdiomas::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|string|array
    {
        return 2;
    }

    /**
     * Qué ventana se está mirando, en palabras y con las fechas exactas.
     *
     * Vive en el subtítulo y NO en el botón por una razón concreta: Filament
     * arma las acciones de cabecera en el hook `booted`, o sea ANTES de que
     * corra la acción que cambia el periodo, así que un botón rotulado con el
     * valor actual se queda mostrando el anterior — y un selector que miente
     * sobre su propio estado es peor que no tenerlo. El subtítulo se recalcula
     * en cada render, y de paso dice las fechas, que es lo que hay que citar
     * cuando se compara con la fecha de un volante.
     */
    public function getSubheading(): ?string
    {
        $dias = $this->periodoValido();

        return sprintf(
            '%s · del %s al %s',
            self::PERIODOS[$dias],
            now()->subDays($dias - 1)->format('d/m/Y'),
            now()->format('d/m/Y'),
        );
    }

    protected function getHeaderActions(): array
    {
        return [
            $this->accionBorrar(),
            ActionGroup::make(
                collect(self::PERIODOS)
                    ->map(fn (string $etiqueta, int $dias) => Action::make("periodo{$dias}")
                        ->label($etiqueta)
                        ->action(fn ($livewire) => $livewire->periodo = $dias))
                    ->values()
                    ->all()
            )
                ->label('Cambiar periodo')
                ->icon('heroicon-m-calendar-days')
                ->button()
                ->outlined(),
        ];
    }

    /**
     * Poner el contador en cero antes de empezar a medir de verdad.
     *
     * Los primeros números de la tabla son del propio desarrollo —abrir la app
     * veinte veces para probar el mapa cuenta veinte aperturas—, y arrancar una
     * campaña midiendo contra esa base es engañarse solo: el panel mostraría
     * una caída el día que dejas de probar y un "crecimiento" que en realidad
     * es tráfico tuyo saliendo del promedio.
     *
     * El corte es POR FECHA y no "borrar mis pruebas" porque la analítica es
     * anónima por diseño —sin usuario, sin sesión, sin dispositivo (ver la
     * migración)—, así que el dato que haría falta para distinguirlas no existe
     * ni existirá. La fecha es el único corte honesto que se puede ofrecer.
     */
    private function accionBorrar(): Action
    {
        return Action::make('borrarAnalitica')
            ->label('Poner en cero')
            ->icon('heroicon-m-trash')
            ->color('danger')
            ->outlined()
            ->modalIcon('heroicon-o-exclamation-triangle')
            ->modalHeading('Poner la analítica en cero')
            ->modalDescription(
                'Borra el histórico hasta el día que elijas, incluido. No se puede deshacer '
                .'y no hay respaldo: son contadores, no contenido. Sirve para no arrastrar '
                .'las cifras de tus propias pruebas a la primera campaña.'
            )
            ->modalSubmitActionLabel('Sí, borrar')
            ->form([
                DatePicker::make('hasta')
                    ->label('Borrar todo lo registrado hasta este día (incluido)')
                    ->native(false)
                    ->displayFormat('d/m/Y')
                    ->default(now())
                    // No hay filas futuras, así que "hasta hoy" borra todo. Y
                    // dejar elegir mañana solo invitaría a pensar que se puede
                    // programar un borrado, que no es lo que hace.
                    ->maxDate(now())
                    ->required()
                    ->helperText('Con la fecha de hoy se borra todo. Con la de ayer, se conserva lo de hoy.'),
            ])
            ->action(function (array $data): void {
                $hasta = Carbon::parse($data['hasta'])->toDateString();
                $borrado = Interaccion::borrarHasta($hasta);

                Notification::make()
                    ->success()
                    ->title('Analítica puesta en cero')
                    ->body(sprintf(
                        'Se borraron %s filas (%s interacciones) hasta el %s.',
                        number_format($borrado['filas'], 0, ',', '.'),
                        number_format($borrado['eventos'], 0, ',', '.'),
                        Carbon::parse($hasta)->format('d/m/Y'),
                    ))
                    ->send();
            });
    }

    /** La lista de abajo mira exactamente la misma ventana que los widgets. */
    protected function getTableQuery(): ?Builder
    {
        return parent::getTableQuery()?->where('dia', '>=', $this->desde());
    }
}
