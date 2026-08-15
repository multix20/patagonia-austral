<?php

namespace App\Filament\Resources;

use App\Filament\Concerns\TieneCampoUbicacionGoogleMaps;
use App\Filament\Resources\PlaceResource\Pages;
use App\Models\Localidad;
use App\Models\Place;
use App\Models\Propuesta;
use App\Services\AlmacenamientoFotos;
use App\Services\GuardarFoto;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\HtmlString;

class PlaceResource extends Resource
{
    use TieneCampoUbicacionGoogleMaps;

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
                    Forms\Components\Toggle::make('destacado')
                        ->label('Destacado (ficha comercial)')
                        ->helperText('Resalta el lugar en la app: aparece primero en su localidad y con un sello.')
                        ->default(false)
                        ->inline(false),
                    self::campoPegarGoogleMaps(),
                    self::campoUbicarConFoto(),
                    Forms\Components\TextInput::make('lat')
                        ->label('Latitud')
                        ->numeric()
                        ->required()
                        ->step('0.0000001')
                        ->rules(['between:-90,90'])
                        ->helperText('Se completa al pegar el enlace de Google Maps; ajústala solo si hace falta.'),
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
                    Forms\Components\TextInput::make('whatsapp')
                        ->label('WhatsApp')
                        ->tel()
                        ->maxLength(255)
                        ->helperText('Solo si es distinto del teléfono: si el teléfono ya es un móvil, la app lo usa para el chat. Habilita "Pedir disponibilidad" en el asistente.'),
                    Forms\Components\TextInput::make('horario')
                        ->label('Horario de atención')
                        ->maxLength(255)
                        ->helperText('Texto libre, como lo diga el dueño. Ej: Todos los días 9:00–22:00 · Invierno hasta las 20:00.'),
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

            Forms\Components\Section::make('Fotos')
                ->description('La primera foto es la que se ve en la cabecera de la ficha y en la tarjeta del mapa. Arrastra para reordenar.')
                ->schema([
                    Forms\Components\FileUpload::make('imagenes')
                        ->label('Fotos de la ficha')
                        ->disk(config('fotos.disco'))
                        ->directory(config('fotos.carpeta'))
                        ->visibility('public')
                        ->image()
                        ->imageEditor()
                        ->multiple()
                        ->reorderable()
                        ->appendFiles()
                        ->maxFiles(config('fotos.max_por_ficha'))
                        ->maxSize(config('fotos.max_subida_kb'))
                        // Sin las credenciales de R2 el campo ACEPTA el archivo
                        // (la subida temporal es local) y recién revienta al
                        // guardar, con un error del SDK de AWS y la ficha ya
                        // escrita. Apagarlo y decir por qué evita ese viaje.
                        ->disabled(fn (): bool => ! app(AlmacenamientoFotos::class)->listo())
                        ->helperText(fn (): string => app(AlmacenamientoFotos::class)->listo()
                            ? 'Hasta '.config('fotos.max_por_ficha').' fotos, máx. '
                                .round(config('fotos.max_subida_kb') / 1024).' MB cada una. Se convierten '
                                .'solas a WebP de '.config('fotos.lado_maximo').' px: no hace falta '
                                .'achicarlas antes. Usa fotos propias o cedidas por el negocio.'
                            : 'El almacenamiento de fotos (Cloudflare R2) todavía no está '
                                .'configurado: faltan las variables R2_* en el dashboard de Render. '
                                .'Mientras tanto el resto de la ficha se guarda normal — solo las '
                                .'fotos quedan bloqueadas. Pasos: DEPLOY.md §2.5.'
                        )
                        // La conversión ocurre aquí y no en un job: Render free no
                        // corre worker de colas, así que lo que no se haga en la
                        // petición no se hace nunca. Una foto tarda ~200 ms.
                        ->saveUploadedFileUsing(
                            fn ($file): ?string => app(GuardarFoto::class)->guardar($file)
                        ),
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
                // Solo la primera foto: es la que la PWA usa de cabecera y
                // miniatura, así que de un vistazo se ve qué ficha va a lucir
                // bien y cuál sale con el degradado de siempre.
                Tables\Columns\ImageColumn::make('portada')
                    ->label('Foto')
                    ->disk(config('fotos.disco'))
                    ->square()
                    ->getStateUsing(fn (Place $record): ?string => $record->imagenes[0] ?? null),
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
                Tables\Columns\ToggleColumn::make('publicado')
                    ->label('Publicado')->sortable(),
                Tables\Columns\ToggleColumn::make('destacado')
                    ->label('Destacado')->sortable(),
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
                Tables\Filters\TernaryFilter::make('destacado')
                    ->label('Destacado'),
                // La lista de trabajo de la segunda pasada: cruzado con el filtro
                // de localidad, dice a qué encargada de turismo escribirle y por
                // cuáles fichas preguntar.
                Tables\Filters\TernaryFilter::make('con_foto')
                    ->label('Con foto')
                    ->placeholder('Todas')
                    ->trueLabel('Solo con foto')
                    ->falseLabel('Solo SIN foto')
                    // whereJsonLength y no un whereRaw con `imagenes::text`: ese
                    // cast es de Postgres y reventaría en los tests, que corren
                    // sobre SQLite. Laravel lo traduce a la función nativa de
                    // cada motor.
                    ->queries(
                        true: fn ($query) => $query->whereJsonLength('imagenes', '>', 0),
                        false: fn ($query) => $query->where(
                            fn ($q) => $q->whereNull('imagenes')->orWhereJsonLength('imagenes', 0)
                        ),
                        blank: fn ($query) => $query,
                    ),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    /**
                     * Genera el enlace personal con el que cada dueño actualiza
                     * SU ficha, y los devuelve en una lista lista para pegar en
                     * el correo de la campaña.
                     *
                     * Van con el nombre del negocio al lado porque el enlace por
                     * sí solo es indistinguible del de otro: mandarle a alguien
                     * el enlace equivocado le daría acceso a editar una ficha
                     * ajena.
                     */
                    Tables\Actions\BulkAction::make('enlace_actualizar')
                        ->label('Enlace para actualizar')
                        ->icon('heroicon-o-link')
                        ->color('info')
                        ->deselectRecordsAfterCompletion()
                        ->modalHeading('Enlaces para la campaña')
                        ->modalDescription('Uno por ficha. Cópialos al correo que le mandes a cada negocio.')
                        ->modalSubmitAction(false)
                        ->modalCancelActionLabel('Cerrar')
                        ->modalContent(fn (Collection $records) => static::ventanaEnlaces($records)),
                    Tables\Actions\BulkAction::make('publicar')
                        ->label('Publicar')
                        ->icon('heroicon-o-eye')
                        ->color('success')
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion()
                        ->action(fn (Collection $records) => $records->toQuery()->update(['publicado' => true])),
                    Tables\Actions\BulkAction::make('despublicar')
                        ->label('Despublicar')
                        ->icon('heroicon-o-eye-slash')
                        ->color('gray')
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion()
                        ->action(fn (Collection $records) => $records->toQuery()->update(['publicado' => false])),
                    Tables\Actions\BulkAction::make('destacar')
                        ->label('Destacar')
                        ->icon('heroicon-o-star')
                        ->color('warning')
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion()
                        ->action(fn (Collection $records) => $records->toQuery()->update(['destacado' => true])),
                    Tables\Actions\BulkAction::make('quitar_destacado')
                        ->label('Quitar destacado')
                        ->icon('heroicon-o-star')
                        ->color('gray')
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion()
                        ->action(fn (Collection $records) => $records->toQuery()->update(['destacado' => false])),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('id');
    }

    /**
     * Ventana con los enlaces personales para actualizar fichas.
     *
     * La comparten la acción en lote de la lista (varias fichas, para armar la
     * campaña de correos) y la de la pantalla de edición (una sola). Es el mismo
     * enlace en los dos casos: `Propuesta::invitar()` reusa la invitación que ya
     * esté sin responder, así que abrir esta ventana dos veces no genera dos
     * enlaces distintos para el mismo negocio.
     *
     * Cada enlace va con el nombre del negocio al lado porque uno es
     * indistinguible de otro a simple vista, y mandarle a alguien el equivocado
     * le daría acceso a editar una ficha ajena.
     *
     * El botón de copiar no es un adorno: esto se opera desde el teléfono, y
     * seleccionar a dedo una URL de 40 caracteres dentro de una ventana con
     * scroll es donde el flujo se rompía.
     */
    public static function ventanaEnlaces(\Illuminate\Support\Collection $fichas): HtmlString
    {
        $filas = $fichas->map(function (Place $ficha) {
            $url = Propuesta::invitar($ficha)->url();

            return '<div style="margin-bottom:14px">'
                .'<strong>'.e($ficha->nombre['es'] ?? '').'</strong><br>'
                .'<code style="font-size:12px;word-break:break-all">'.e($url).'</code><br>'
                .'<button type="button" x-data="{copiado:false}"'
                .' @click="navigator.clipboard.writeText('.e(json_encode($url)).'); copiado=true; setTimeout(() => copiado=false, 1500)"'
                .' x-text="copiado ? \'¡Copiado!\' : \'Copiar enlace\'"'
                .' style="margin-top:4px;padding:4px 10px;border:1px solid currentColor;border-radius:6px;font-size:12px"></button>'
                .'</div>';
        })->implode('');

        return new HtmlString('<div style="max-height:60vh;overflow:auto">'.$filas.'</div>');
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
