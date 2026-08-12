<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RutaResource\Pages;
use App\Models\Ruta;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

// Trazados y áreas del mapa: pasarelas de Tortel, senderos, rutas y glaciares.
//
// Las geometrías NO se editan acá: entran por importación (scripts/tortel/ +
// RutaSeeder) y dibujar un trazado a mano en un formulario web no es algo que
// este CMS pueda hacer bien. Lo que sí se edita es lo que un humano decide —
// nombre, descripción y si se publica—, y para la geometría se muestra el número
// de vértices, que es lo que pesa en el teléfono del viajero.
class RutaResource extends Resource
{
    protected static ?string $model = Ruta::class;

    protected static ?string $navigationIcon = 'heroicon-o-map';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'ruta';

    protected static ?string $pluralModelLabel = 'rutas y áreas';

    protected static ?int $navigationSort = 4;

    public const TIPOS = [
        'pasarela' => 'Pasarela',
        'sendero' => 'Sendero',
        'ruta' => 'Ruta',
        'area' => 'Área / parque',
    ];

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Contenido')->schema([
                Forms\Components\TextInput::make('nombre.es')
                    ->label('Nombre (ES)')->required()->maxLength(160),
                Forms\Components\TextInput::make('nombre.en')
                    ->label('Nombre (EN)')->required()->maxLength(160),
                Forms\Components\Textarea::make('descripcion.es')
                    ->label('Descripción (ES)')->rows(3),
                Forms\Components\Textarea::make('descripcion.en')
                    ->label('Descripción (EN)')->rows(3),
            ])->columns(2),

            Forms\Components\Section::make('Clasificación')->schema([
                Forms\Components\Select::make('tipo')
                    ->label('Tipo')->options(self::TIPOS)->required(),
                Forms\Components\Select::make('localidad_id')
                    ->label('Localidad')->relationship('localidad', 'slug')->searchable(),
                Forms\Components\TextInput::make('largo_km')
                    ->label('Largo (km)')->numeric()->step('0.01'),
                Forms\Components\Toggle::make('publicado')
                    ->label('Publicado')
                    ->helperText('Las importadas entran en borrador: revisa el nombre y el texto antes de publicar.'),
            ])->columns(2),

            Forms\Components\Section::make('Geometría')->schema([
                Forms\Components\Placeholder::make('resumen_geometria')
                    ->label('')
                    ->content(fn (?Ruta $record): string => $record
                        ? sprintf(
                            '%s con %d vértices. No se edita desde el CMS: se importa con scripts/tortel/.',
                            $record->geometria['type'] ?? '—',
                            $record->vertices()
                        )
                        : 'Se importa con scripts/tortel/.'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('nombre.es')
                    ->label('Nombre')->searchable()->wrap(),
                Tables\Columns\TextColumn::make('tipo')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::TIPOS[$state] ?? $state),
                Tables\Columns\TextColumn::make('localidad.slug')->label('Localidad'),
                Tables\Columns\TextColumn::make('largo_km')
                    ->label('Km')->numeric(2)->alignRight(),
                // El peso es la razón por la que estas filas existen con
                // simplificación: verlo acá evita publicar sin querer una
                // geometría de 17.000 vértices.
                Tables\Columns\TextColumn::make('vertices')
                    ->label('Vértices')
                    ->state(fn (Ruta $record): int => $record->vertices())
                    ->alignRight(),
                Tables\Columns\ToggleColumn::make('publicado')->label('Publicado'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tipo')->label('Tipo')->options(self::TIPOS),
                Tables\Filters\TernaryFilter::make('publicado')->label('Publicado'),
            ])
            ->actions([Tables\Actions\EditAction::make()])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('publicar')
                        ->label('Publicar')
                        ->icon('heroicon-o-eye')
                        ->action(fn ($records) => $records->each->update(['publicado' => true]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make('despublicar')
                        ->label('Despublicar')
                        ->icon('heroicon-o-eye-slash')
                        ->action(fn ($records) => $records->each->update(['publicado' => false]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('tipo');
    }

    public static function getPages(): array
    {
        // Sin página de crear: una ruta nace de una importación, no de un
        // formulario — no hay forma razonable de dibujar un trazado acá.
        return [
            'index' => Pages\ListRutas::route('/'),
            'edit' => Pages\EditRuta::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
