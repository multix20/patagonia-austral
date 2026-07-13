<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PlaceResource\Pages;
use App\Models\Localidad;
use App\Models\Place;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PlaceResource extends Resource
{
    protected static ?string $model = Place::class;

    protected static ?string $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'lugar';

    protected static ?string $pluralModelLabel = 'lugares';

    protected static ?int $navigationSort = 1;

    /** Categorías del directorio (coinciden con la PWA) */
    public const CATEGORIAS = [
        'atractivo' => 'Atractivo',
        'alojamiento' => 'Alojamiento',
        'comida' => 'Comida',
        'servicio' => 'Servicio',
        'evento' => 'Evento',
        'emergencia' => 'Emergencia',
    ];

    /** Opciones de localidad (norte → sur) para formulario y filtro */
    protected static function opcionesLocalidad(): array
    {
        return Localidad::orderBy('orden')
            ->get()
            ->mapWithKeys(fn (Localidad $l) => [$l->id => $l->nombre['es'] ?? $l->slug])
            ->all();
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Clasificación y ubicación')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('localidad_id')
                        ->label('Localidad')
                        ->options(fn () => self::opcionesLocalidad())
                        ->required()
                        ->native(false)
                        ->helperText('Pueblo de la Carretera Austral al que pertenece este lugar.'),
                    Forms\Components\Select::make('cat')
                        ->label('Categoría')
                        ->options(self::CATEGORIAS)
                        ->required()
                        ->native(false),
                    Forms\Components\Toggle::make('publicado')
                        ->label('Publicado en la app')
                        ->default(true)
                        ->inline(false),
                    Forms\Components\TextInput::make('lat')
                        ->label('Latitud')
                        ->numeric()
                        ->required()
                        ->step('0.0000001')
                        ->rules(['between:-90,90']),
                    Forms\Components\TextInput::make('lng')
                        ->label('Longitud')
                        ->numeric()
                        ->required()
                        ->step('0.0000001')
                        ->rules(['between:-180,180']),
                    Forms\Components\TextInput::make('tel')
                        ->label('Teléfono')
                        ->tel()
                        ->maxLength(255)
                        ->helperText('Opcional. Habilita el botón de llamada directa.'),
                ]),

            Forms\Components\Section::make('Contenido bilingüe (Español / English)')
                ->description('Ambos idiomas son obligatorios: la PWA muestra ES o EN según la preferencia del usuario.')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('nombre.es')
                        ->label('Nombre (ES)')->required()->maxLength(255),
                    Forms\Components\TextInput::make('nombre.en')
                        ->label('Nombre (EN)')->required()->maxLength(255),

                    Forms\Components\Textarea::make('descripcion.es')
                        ->label('Descripción (ES)')->required()->rows(4)->columnSpan(1),
                    Forms\Components\Textarea::make('descripcion.en')
                        ->label('Descripción (EN)')->required()->rows(4)->columnSpan(1),

                    Forms\Components\Textarea::make('como.es')
                        ->label('Cómo llegar (ES)')->required()->rows(3),
                    Forms\Components\Textarea::make('como.en')
                        ->label('Cómo llegar (EN)')->required()->rows(3),

                    Forms\Components\TextInput::make('dist.es')
                        ->label('Distancia (ES)')->required()->maxLength(255)
                        ->helperText('Ej: 22 km · 30 min en auto'),
                    Forms\Components\TextInput::make('dist.en')
                        ->label('Distancia (EN)')->required()->maxLength(255)
                        ->helperText('Ej: 22 km · 30 min by car'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn ($query) => $query->with('localidad'))
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')->sortable()->toggleable(),
                Tables\Columns\TextColumn::make('nombre.es')
                    ->label('Nombre')->searchable()->sortable()->limit(40),
                Tables\Columns\TextColumn::make('localidad_nombre')
                    ->label('Localidad')
                    ->getStateUsing(fn (Place $record): string => $record->localidad?->nombre['es'] ?? '—'),
                Tables\Columns\TextColumn::make('cat')
                    ->label('Categoría')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::CATEGORIAS[$state] ?? $state)
                    ->color(fn (string $state): string => match ($state) {
                        'emergencia' => 'danger',
                        'atractivo' => 'success',
                        'alojamiento' => 'info',
                        'comida' => 'warning',
                        'evento' => 'primary',
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('tel')
                    ->label('Teléfono')->toggleable()->placeholder('—'),
                Tables\Columns\IconColumn::make('publicado')
                    ->label('Publicado')->boolean()->sortable(),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Actualizado')->dateTime('d/m/Y H:i')->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('localidad_id')
                    ->label('Localidad')->options(fn () => self::opcionesLocalidad()),
                Tables\Filters\SelectFilter::make('cat')
                    ->label('Categoría')->options(self::CATEGORIAS),
                Tables\Filters\TernaryFilter::make('publicado')
                    ->label('Publicado'),
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
            ->defaultSort('id');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPlaces::route('/'),
            'create' => Pages\CreatePlace::route('/create'),
            'edit' => Pages\EditPlace::route('/{record}/edit'),
        ];
    }
}
