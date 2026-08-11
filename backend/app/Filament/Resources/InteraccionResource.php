<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InteraccionResource\Pages;
use App\Models\Interaccion;
use App\Models\Place;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

// Analítica de uso, solo lectura. Responde las preguntas que hay que contestar
// antes del primer volante: cuánta gente abre la app, qué fichas se miran, desde
// qué localidad, y cuántos tocan "Cómo llegar" o "Llamar" — que es lo más
// parecido a una venta que puede medir un directorio.
class InteraccionResource extends Resource
{
    protected static ?string $model = Interaccion::class;

    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationGroup = 'Analítica';

    protected static ?string $modelLabel = 'interacción';

    protected static ?string $pluralModelLabel = 'interacciones';

    /**
     * Nombres de ficha para la columna "Sobre qué", cargados UNA vez por
     * petición. Sin esto la tabla haría una consulta por fila para traducir el
     * id a un nombre (el clásico N+1), y esta es justo la pantalla que se abre
     * con 50 filas de golpe.
     */
    private static ?array $nombresFicha = null;

    private static function nombreFicha(string $id): string
    {
        self::$nombresFicha ??= Place::pluck('nombre', 'id')
            ->map(fn ($n) => is_array($n) ? ($n['es'] ?? '') : (string) $n)
            ->all();

        return self::$nombresFicha[(int) $id] ?? "Ficha #{$id}";
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('dia')
                    ->label('Día')->date('d/m/Y')->sortable(),
                Tables\Columns\TextColumn::make('tipo')
                    ->label('Qué')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => Interaccion::TIPOS[$state] ?? $state)
                    ->color(fn (string $state): string => match ($state) {
                        'como_llegar', 'llamar', 'compartir' => 'success', // intención de ir
                        'reporte', 'voto', 'calificacion' => 'warning',    // aportes
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('referencia')
                    ->label('Sobre qué')
                    ->placeholder('—')
                    // La referencia cruda es un id o un slug: ilegible en una
                    // tabla que se lee para decidir. Las fichas se traducen a su
                    // nombre; el resto (slug de localidad, tipo de reporte,
                    // idioma) ya se entiende tal cual.
                    ->formatStateUsing(function (?string $state, Interaccion $i): string {
                        if ($state === null || $state === '') {
                            return '—';
                        }

                        return in_array($i->tipo, ['ficha', 'como_llegar', 'llamar', 'compartir'], true)
                            ? self::nombreFicha($state)
                            : $state;
                    })
                    ->wrap(),
                Tables\Columns\TextColumn::make('cantidad')
                    ->label('Veces')
                    ->badge()
                    ->sortable()
                    // El total de lo que hay en pantalla: con el filtro de tipo
                    // puesto, es la cifra que se cita en una conversación.
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->label('Total')),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tipo')
                    ->label('Qué')->options(Interaccion::TIPOS),
                Tables\Filters\Filter::make('ultimos_30')
                    ->label('Últimos 30 días')
                    ->default()
                    ->query(fn (Builder $q) => $q->where('dia', '>=', now()->subDays(30)->toDateString())),
            ])
            // Lo más reciente y lo más usado arriba: así la primera pantalla ya
            // responde "qué está pasando ahora".
            ->defaultSort('dia', 'desc')
            ->defaultPaginationPageOption(50);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInteracciones::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
