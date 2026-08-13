{{--
    Vista compartida de los rankings del panel de analítica (ver
    App\Filament\Resources\InteraccionResource\Widgets\Ranking).

    Casi todo va en `style` en vez de clases utilitarias A PROPÓSITO. El CSS del
    panel viene precompilado desde el paquete de Filament y solo contiene las
    clases que Filament usa: una clase inventada acá puede no existir hoy, o
    dejar de existir en la próxima actualización, y el fallo sería mudo — la
    barra simplemente no se pinta. Lo único que se toma prestado son los tokens
    de TEXTO (`text-gray-…` con su variante oscura), que son los que Filament
    usa en toda su interfaz y por eso no se van a caer.

    Los colores propios están elegidos para funcionar en los DOS temas sin
    variante: el azul de la barra es el mismo que el de la línea del gráfico
    (contraste ≥3:1 sobre fondo blanco y sobre el gris casi negro del modo
    oscuro), y el carril es un gris translúcido, que se adapta solo.
--}}
<x-filament-widgets::widget>
    <x-filament::section :heading="$titulo" :description="$descripcion">
        @if (count($filas) === 0)
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $textoVacio }}</p>
        @else
            <div style="display: flex; flex-direction: column; gap: 0.875rem;">
                @foreach ($filas as $fila)
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                            <span class="text-sm text-gray-950 dark:text-white" style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                {{ $fila['etiqueta'] }}
                            </span>
                            <span class="text-sm text-gray-950 dark:text-white" style="flex-shrink: 0; font-weight: 600; font-variant-numeric: tabular-nums;">
                                {{ number_format($fila['total'], 0, ',', '.') }}
                            </span>
                        </div>

                        <div style="margin-top: 0.375rem; height: 6px; border-radius: 999px; background: rgba(128, 128, 128, 0.2);">
                            <div style="height: 6px; border-radius: 999px; background: #3987e5; width: {{ $fila['ancho'] }}%;"></div>
                        </div>

                        @if ($fila['detalle'])
                            <p class="text-xs text-gray-500 dark:text-gray-400" style="margin-top: 0.25rem;">
                                {{ $fila['detalle'] }}
                            </p>
                        @endif
                    </div>
                @endforeach
            </div>
        @endif
    </x-filament::section>
</x-filament-widgets::widget>
