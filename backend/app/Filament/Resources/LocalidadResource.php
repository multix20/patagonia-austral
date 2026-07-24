<?php

namespace App\Filament\Resources;

use App\Filament\Concerns\TieneCampoUbicacionGoogleMaps;
use App\Filament\Resources\LocalidadResource\Pages;
use App\Models\Localidad;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LocalidadResource extends Resource
{
    use TieneCampoUbicacionGoogleMaps;

    protected static ?string $model = Localidad::class;

    protected static ?string $navigationIcon = 'heroicon-o-map';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'localidad';

    protected static ?string $pluralModelLabel = 'localidades';

    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Identificación')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('nombre.es')
                        ->label('Nombre (ES)')->required()->maxLength(255),
                    Forms\Components\TextInput::make('nombre.en')
                        ->label('Nombre (EN)')->required()->maxLength(255),
                    Forms\Components\TextInput::make('slug')
                        ->label('Slug')
                        ->required()
                        ->maxLength(255)
                        ->alphaDash()
                        ->unique(ignoreRecord: true)
                        ->helperText('Identificador estable en minúsculas, ej: caleta-tortel. No cambiarlo una vez publicado (la PWA lo usa como clave).'),
                    Forms\Components\Toggle::make('publicado')
                        ->label('Publicada en la app')
                        ->default(true)
                        ->inline(false),
                ]),

            Forms\Components\Section::make('Mapa y orden en la ruta')
                ->columns(2)
                ->schema([
                    self::campoPegarGoogleMaps(),
                    Forms\Components\TextInput::make('lat')
                        ->label('Latitud (centro del pueblo)')
                        ->numeric()
                        ->required()
                        ->step('0.0000001')
                        ->rules(['between:-90,90'])
                        ->helperText('Se completa al pegar el enlace de Google Maps; ajústala solo si hace falta.'),
                    Forms\Components\TextInput::make('lng')
                        ->label('Longitud (centro del pueblo)')
                        ->numeric()
                        ->required()
                        ->step('0.0000001')
                        ->rules(['between:-180,180']),
                    Forms\Components\TextInput::make('zoom')
                        ->label('Zoom inicial del mapa')
                        ->numeric()
                        ->required()
                        ->default(13)
                        ->minValue(3)
                        ->maxValue(18)
                        ->helperText('13 pueblo mediano · 14-15 pueblo compacto'),
                    Forms\Components\TextInput::make('orden')
                        ->label('Orden en la ruta (norte → sur)')
                        ->numeric()
                        ->required()
                        ->minValue(0)
                        ->helperText('Menor = más al norte. Usar decenas (10, 20, 30…) para poder intercalar pueblos después.'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('orden')
                    ->label('Orden')->sortable(),
                Tables\Columns\TextColumn::make('nombre.es')
                    ->label('Nombre')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('slug')
                    ->label('Slug')->searchable()->toggleable(),
                Tables\Columns\TextColumn::make('places_count')
                    ->label('Lugares')
                    ->counts('places')
                    ->sortable(),
                Tables\Columns\IconColumn::make('publicado')
                    ->label('Publicada')->boolean()->sortable(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Actualizada')->dateTime('d/m/Y H:i')->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('publicado')
                    ->label('Publicada'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('orden');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListLocalidades::route('/'),
            'create' => Pages\CreateLocalidad::route('/create'),
            'edit' => Pages\EditLocalidad::route('/{record}/edit'),
        ];
    }
}
