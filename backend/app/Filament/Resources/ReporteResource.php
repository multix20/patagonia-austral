<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReporteResource\Pages;
use App\Models\Reporte;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

// Moderación de los reportes del crowdsourcing (Fase 3). Los reportes NO se crean
// desde el CMS: los manda la PWA. Aquí solo se vigilan, se ocultan si son falsos o
// abusivos, y se pueden revivir (extender la vigencia) cuando son útiles y ciertos.
class ReporteResource extends Resource
{
    protected static ?string $model = Reporte::class;

    protected static ?string $navigationIcon = 'heroicon-o-exclamation-triangle';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'reporte';

    protected static ?string $pluralModelLabel = 'reportes de ruta';

    protected static ?int $navigationSort = 3;

    /** Etiquetas de tipo (coinciden con la PWA). */
    public const TIPOS = [
        'derrumbe' => 'Derrumbe',
        'camino' => 'Estado del camino',
        'hielo' => 'Hielo / escarcha',
        'combustible' => 'Combustible',
        'ferry' => 'Barcaza',
        'alojamiento' => 'Alojamiento lleno',
        'camping' => 'Camping',
        'tiempo' => 'Clima',
        'fauna' => 'Animales en la ruta',
        'evento' => 'Evento',
        'comentario' => 'Comentario',
    ];

    /** Badge con el número de reportes vigentes, para verlos sin entrar. */
    public static function getNavigationBadge(): ?string
    {
        $vigentes = Reporte::vigentes()->count();

        return $vigentes > 0 ? (string) $vigentes : null;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('tipo')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::TIPOS[$state] ?? $state)
                    ->color(fn (string $state): string => match ($state) {
                        'derrumbe', 'camino' => 'danger',
                        'hielo', 'tiempo' => 'info',
                        'combustible', 'ferry' => 'warning',
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('localidad.nombre.es')
                    ->label('Localidad')->placeholder('Fuera de radio')->sortable(),
                Tables\Columns\TextColumn::make('comentario')
                    ->label('Comentario')->placeholder('—')->limit(60)->wrap(),
                Tables\Columns\TextColumn::make('confirmaciones')
                    ->label('Confirman')->badge()->color('success')->sortable(),
                Tables\Columns\TextColumn::make('descartes')
                    ->label('Descartan')->badge()->color('danger')->sortable(),
                Tables\Columns\TextColumn::make('expira_en')
                    ->label('Vigente hasta')
                    ->dateTime('d/m/Y H:i')
                    ->description(fn (Reporte $r) => $r->expira_en?->isPast() ? 'Caducado' : null)
                    ->sortable(),
                Tables\Columns\IconColumn::make('oculto')
                    ->label('Oculto')->boolean()->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Recibido')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tipo')
                    ->label('Tipo')->options(self::TIPOS),
                Tables\Filters\Filter::make('vigentes')
                    ->label('Solo vigentes')
                    ->query(fn (Builder $query) => $query->vigentes()),
                Tables\Filters\TernaryFilter::make('oculto')
                    ->label('Ocultos'),
            ])
            ->actions([
                // Ocultar / mostrar: el reporte nunca se borra por moderación, se
                // saca de la vista de la app y queda el registro.
                Tables\Actions\Action::make('alternarOculto')
                    ->label(fn (Reporte $r) => $r->oculto ? 'Mostrar' : 'Ocultar')
                    ->icon(fn (Reporte $r) => $r->oculto ? 'heroicon-o-eye' : 'heroicon-o-eye-slash')
                    ->color(fn (Reporte $r) => $r->oculto ? 'success' : 'danger')
                    ->action(fn (Reporte $r) => $r->update(['oculto' => ! $r->oculto])),
                // Revivir un reporte cierto que estaba a punto de caducar.
                Tables\Actions\Action::make('extender')
                    ->label('Extender 24 h')
                    ->icon('heroicon-o-clock')
                    ->requiresConfirmation()
                    ->action(fn (Reporte $r) => $r->update([
                        'expira_en' => ($r->expira_en?->isPast() ? now() : $r->expira_en)->copy()->addHours(24),
                    ])),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('ocultar')
                        ->label('Ocultar')
                        ->icon('heroicon-o-eye-slash')
                        ->color('danger')
                        ->action(fn (Collection $records) => $records->each->update(['oculto' => true]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make('mostrar')
                        ->label('Mostrar')
                        ->icon('heroicon-o-eye')
                        ->action(fn (Collection $records) => $records->each->update(['oculto' => false]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        // Sin páginas de crear/editar: el contenido lo genera la PWA.
        return [
            'index' => Pages\ListReportes::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
