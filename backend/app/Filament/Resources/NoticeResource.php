<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NoticeResource\Pages;
use App\Models\Notice;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class NoticeResource extends Resource
{
    protected static ?string $model = Notice::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationGroup = 'Contenido turístico';

    protected static ?string $modelLabel = 'aviso';

    protected static ?string $pluralModelLabel = 'avisos';

    protected static ?int $navigationSort = 2;

    /** Tipos de aviso (coinciden con la PWA) */
    public const TIPOS = [
        'info' => 'Información',
        'clima' => 'Clima',
        'seguridad' => 'Seguridad',
        'evento' => 'Evento',
    ];

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Aviso municipal')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('tipo')
                        ->label('Tipo')
                        ->options(self::TIPOS)
                        ->default('info')
                        ->required()
                        ->native(false),
                    Forms\Components\DateTimePicker::make('publicado_en')
                        ->label('Publicar en')
                        ->seconds(false)
                        ->helperText('Vacío = borrador (no visible). Con fecha futura, se publica automáticamente al llegar la hora.')
                        ->default(now()),

                    Forms\Components\Textarea::make('mensaje.es')
                        ->label('Mensaje (ES)')->required()->rows(3)->columnSpanFull(),
                    Forms\Components\Textarea::make('mensaje.en')
                        ->label('Mensaje (EN)')->required()->rows(3)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('mensaje.es')
                    ->label('Mensaje')->searchable()->limit(60)->wrap(),
                Tables\Columns\TextColumn::make('tipo')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::TIPOS[$state] ?? $state)
                    ->color(fn (string $state): string => match ($state) {
                        'seguridad' => 'danger',
                        'clima' => 'info',
                        'evento' => 'primary',
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('publicado_en')
                    ->label('Publicado')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Borrador')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creado')->dateTime('d/m/Y H:i')->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tipo')
                    ->label('Tipo')->options(self::TIPOS),
                Tables\Filters\Filter::make('publicados')
                    ->label('Solo publicados')
                    ->query(fn ($query) => $query->whereNotNull('publicado_en')->where('publicado_en', '<=', now())),
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
            ->defaultSort('publicado_en', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNotices::route('/'),
            'create' => Pages\CreateNotice::route('/create'),
            'edit' => Pages\EditNotice::route('/{record}/edit'),
        ];
    }
}
