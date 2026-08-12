<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CalificacionResource\Pages;
use App\Models\Calificacion;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;

// Moderación de las calificaciones del crowdsourcing (Fase 3). No se crean desde
// el CMS: las manda la PWA. Aquí se leen y se ocultan las que son spam, insulto
// o venganza de la competencia — que en pueblos de 400 habitantes es un riesgo
// real, no teórico.
//
// Ocultar SIEMPRE recalcula el promedio de la ficha: si no, moderar dejaría la
// nota envenenada y el número visible no correspondería a ninguna opinión que se
// pueda leer.
class CalificacionResource extends Resource
{
    protected static ?string $model = Calificacion::class;

    protected static ?string $navigationIcon = 'heroicon-o-star';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'calificación';

    protected static ?string $pluralModelLabel = 'calificaciones';

    protected static ?int $navigationSort = 4;

    /** Badge con las que traen comentario: son las que hay que leer. */
    public static function getNavigationBadge(): ?string
    {
        $conTexto = Calificacion::visibles()->conComentario()->count();

        return $conTexto > 0 ? (string) $conTexto : null;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('place.nombre.es')
                    ->label('Ficha')->searchable()->sortable()->wrap(),
                Tables\Columns\TextColumn::make('place.localidad.nombre.es')
                    ->label('Localidad')->placeholder('—')->sortable(),
                Tables\Columns\TextColumn::make('estrellas')
                    ->label('Nota')
                    ->badge()
                    // Verde de 4 para arriba, rojo de 2 para abajo: la tabla se
                    // revisa de un vistazo buscando lo que se salió de madre.
                    ->color(fn (int $state): string => match (true) {
                        $state >= 4 => 'success',
                        $state <= 2 => 'danger',
                        default => 'warning',
                    })
                    ->formatStateUsing(fn (int $state): string => str_repeat('★', $state))
                    ->sortable(),
                Tables\Columns\TextColumn::make('comentario')
                    ->label('Comentario')->placeholder('— sin texto —')->limit(80)->wrap(),
                Tables\Columns\IconColumn::make('oculto')
                    ->label('Oculto')->boolean()->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Recibida')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('estrellas')
                    ->label('Nota')
                    ->options([5 => '★★★★★', 4 => '★★★★', 3 => '★★★', 2 => '★★', 1 => '★']),
                Tables\Filters\TernaryFilter::make('oculto')->label('Ocultas'),
                Tables\Filters\Filter::make('con_comentario')
                    ->label('Solo con comentario')
                    ->query(fn ($query) => $query->conComentario()),
            ])
            ->actions([
                Tables\Actions\Action::make('alternarOculto')
                    ->label(fn (Calificacion $c) => $c->oculto ? 'Mostrar' : 'Ocultar')
                    ->icon(fn (Calificacion $c) => $c->oculto ? 'heroicon-o-eye' : 'heroicon-o-eye-slash')
                    ->color(fn (Calificacion $c) => $c->oculto ? 'success' : 'danger')
                    ->action(function (Calificacion $c): void {
                        $c->update(['oculto' => ! $c->oculto]);
                        $c->place?->recalcularCalificacion();
                    }),
                Tables\Actions\DeleteAction::make()
                    ->after(fn (Calificacion $c) => $c->place?->recalcularCalificacion()),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('ocultar')
                        ->label('Ocultar')
                        ->icon('heroicon-o-eye-slash')
                        ->color('danger')
                        ->action(function (Collection $records): void {
                            $records->each->update(['oculto' => true]);
                            // Una pasada por ficha, no una por calificación: al
                            // ocultar en lote lo normal es que varias sean de la
                            // misma ficha y recalcular por cada una repetiría el
                            // mismo AVG() sin cambiar el resultado.
                            $records->pluck('place')->filter()->unique('id')
                                ->each->recalcularCalificacion();
                        })
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make('mostrar')
                        ->label('Mostrar')
                        ->icon('heroicon-o-eye')
                        ->action(function (Collection $records): void {
                            $records->each->update(['oculto' => false]);
                            $records->pluck('place')->filter()->unique('id')
                                ->each->recalcularCalificacion();
                        })
                        ->deselectRecordsAfterCompletion(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        // Sin crear/editar: el contenido lo generan los viajeros desde la PWA.
        return [
            'index' => Pages\ListCalificaciones::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
