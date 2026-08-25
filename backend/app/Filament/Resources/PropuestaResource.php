<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PropuestaResource\Pages;
use App\Models\Propuesta;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\HtmlString;

/**
 * Buzón de lo que mandan los dueños de los servicios sobre sus propias fichas.
 *
 * La pantalla está pensada para revisar rápido y sin transcribir: cada fila
 * muestra el ANTES y el DESPUÉS de lo que cambia, y "Aplicar" lo vuelca a la
 * ficha. Ese es el punto entero — el trabajo que antes era leer un correo,
 * entender qué cambió y copiarlo a mano al CMS, acá es mirar y aceptar.
 */
class PropuestaResource extends Resource
{
    protected static ?string $model = Propuesta::class;

    protected static ?string $navigationIcon = 'heroicon-o-inbox-arrow-down';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'propuesta';

    protected static ?string $pluralModelLabel = 'propuestas de fichas';

    protected static ?int $navigationSort = 2;

    /** Etiquetas de los campos, para el resumen de cambios. */
    private const ETIQUETAS = [
        'nombre' => 'Nombre',
        'tel' => 'Teléfono',
        'whatsapp' => 'WhatsApp',
        'horario' => 'Horario',
        'descripcion' => 'Descripción',
        'como' => 'Cómo llegar',
    ];

    /** El número de lo que espera revisión, visible sin entrar. */
    public static function getNavigationBadge(): ?string
    {
        $n = Propuesta::where('estado', 'respondida')->count();

        return $n > 0 ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn ($query) => $query->with('place.localidad'))
            ->columns([
                // `getStateUsing` y no `make('place.nombre')`: el nombre es un
                // jsonb bilingüe, y Filament resolviendo la relación por punto
                // aplana el array y muestra los dos idiomas pegados
                // ("Hospital de Cochrane, Cochrane Hospital").
                Tables\Columns\TextColumn::make('ficha')
                    ->label('Ficha')
                    ->getStateUsing(fn (Propuesta $p): string => $p->place?->nombre['es'] ?? '—')
                    ->description(fn (Propuesta $p): string => $p->place?->localidad?->nombre['es'] ?? '')
                    ->wrap(),

                Tables\Columns\TextColumn::make('estado')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'enviada' => 'Enlace generado, sin respuesta',
                        'respondida' => 'Por revisar',
                        'aplicada' => 'Aplicada',
                        default => 'Descartada',
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'respondida' => 'warning',
                        'aplicada' => 'success',
                        'descartada' => 'gray',
                        default => 'info',
                    }),

                // El corazón de la pantalla: qué cambia, en una mirada.
                Tables\Columns\TextColumn::make('cambios')
                    ->label('Qué propone')
                    ->getStateUsing(fn (Propuesta $p): HtmlString => new HtmlString(self::resumen($p)))
                    ->html()
                    ->wrap(),

                Tables\Columns\TextColumn::make('respondida_en')
                    ->label('Respondió')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('—')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('estado')
                    ->label('Estado')
                    ->options([
                        'respondida' => 'Por revisar',
                        'enviada' => 'Enlace generado, sin respuesta',
                        'aplicada' => 'Aplicada',
                        'descartada' => 'Descartada',
                    ])
                    ->default('respondida'),
            ])
            ->actions([
                Tables\Actions\Action::make('copiar')
                    ->label('Ver enlace')
                    ->icon('heroicon-m-link')
                    ->color('gray')
                    ->modalHeading('Enlace para el dueño del negocio')
                    ->modalDescription(fn (Propuesta $p): string => $p->url())
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Cerrar'),

                Tables\Actions\Action::make('aplicar')
                    ->label('Aplicar')
                    ->icon('heroicon-m-check')
                    ->color('success')
                    ->visible(fn (Propuesta $p): bool => $p->respondida())
                    ->requiresConfirmation()
                    ->modalHeading('Aplicar a la ficha')
                    ->modalDescription(fn (Propuesta $p): HtmlString => new HtmlString(
                        self::resumen($p).'<p style="margin-top:10px">Los campos que dejó en blanco no se tocan.</p>'
                    ))
                    ->modalSubmitActionLabel('Aplicar')
                    ->action(function (Propuesta $p): void {
                        $p->aplicar();
                        Notification::make()->success()->title('Ficha actualizada')->send();
                    }),

                Tables\Actions\Action::make('descartar')
                    ->label('Descartar')
                    ->icon('heroicon-m-x-mark')
                    ->color('danger')
                    ->visible(fn (Propuesta $p): bool => $p->respondida())
                    ->requiresConfirmation()
                    ->action(function (Propuesta $p): void {
                        // Primero el bucket y después el estado: si se marca
                        // descartada y el borrado falla, las fotos quedan
                        // huérfanas y ya nadie las va a mirar para saberlo.
                        $p->borrarFotos();
                        $p->update(['estado' => 'descartada', 'resuelta_en' => now()]);
                        Notification::make()->success()->title('Propuesta descartada')->send();
                    }),
            ])
            ->defaultSort('respondida_en', 'desc')
            ->emptyStateHeading('Todavía no hay propuestas')
            ->emptyStateDescription(
                'Genera los enlaces desde Lugares (acción en lote «Enlace para actualizar») '
                .'y mándalos por correo. Lo que respondan aparece acá.'
            );
    }

    /**
     * Resumen de los cambios, con el valor viejo tachado al lado del nuevo.
     *
     * Se muestra el ANTES y no solo lo propuesto porque revisar es comparar: sin
     * el valor actual al lado hay que abrir la ficha en otra pestaña para saber
     * si el dato cambió o si el dueño reescribió lo mismo.
     */
    private static function resumen(Propuesta $p): string
    {
        if (! $p->respondida()) {
            return '<span style="color:#6b7572">Sin respuesta todavía</span>';
        }

        $datos = $p->datos ?? [];
        $ficha = $p->place;
        $lineas = [];

        foreach (self::ETIQUETAS as $campo => $etiqueta) {
            $nuevo = trim((string) ($datos[$campo] ?? ''));
            if ($nuevo === '') {
                continue;
            }

            $actual = match ($campo) {
                'tel', 'whatsapp', 'horario' => (string) ($ficha->{$campo} ?? ''),
                default => is_array($ficha->{$campo} ?? null) ? ($ficha->{$campo}['es'] ?? '') : '',
            };

            $lineas[] = '<div style="margin-bottom:6px"><strong>'.e($etiqueta).':</strong> '
                .e(mb_strimwidth($nuevo, 0, 90, '…'))
                .($actual !== ''
                    ? '<br><span style="color:#6b7572;font-size:11px">antes: '
                        .e(mb_strimwidth($actual, 0, 70, '…')).'</span>'
                    : '')
                .'</div>';
        }

        if (isset($datos['lat'], $datos['lng'])) {
            $lineas[] = '<div><strong>Ubicación:</strong> '
                .number_format((float) $datos['lat'], 5, ',', '').', '
                .number_format((float) $datos['lng'], 5, ',', '')
                .'<br><span style="color:#6b7572;font-size:11px">antes: '
                .number_format((float) $ficha->lat, 5, ',', '').', '
                .number_format((float) $ficha->lng, 5, ',', '').'</span></div>';
        }

        // Las fotos se MIRAN, no se resumen: es lo único de la propuesta que no
        // se puede juzgar leyendo. Van al final y en miniatura, que alcanza para
        // decidir si la foto es del negocio y está presentable.
        $fotos = $p->fotosUrl();

        if ($fotos !== []) {
            $lineas[] = '<div style="margin-top:10px"><strong>Fotos propuestas:</strong>'
                .'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">'
                .implode('', array_map(
                    fn (string $url) => '<img src="'.e($url).'" alt="" '
                        .'style="width:92px;height:92px;object-fit:cover;border-radius:8px;border:1px solid #e2e0d8">',
                    $fotos
                ))
                .'</div><span style="color:#6b7572;font-size:11px">Se suman a las que ya tiene la ficha.</span></div>';
        }

        return $lineas === []
            ? '<span style="color:#6b7572">Respondió sin cambiar nada</span>'
            : implode('', $lineas);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPropuestas::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
