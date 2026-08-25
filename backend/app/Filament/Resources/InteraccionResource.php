<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InteraccionResource\Pages;
use App\Models\Interaccion;
use App\Models\Localidad;
use App\Models\Place;
use App\Support\Origen;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

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

    // Sin esto la URL queda en /admin/interaccions: Filament pluraliza el nombre
    // de la clase en inglés y "interaccion" no es una palabra que sepa doblar.
    protected static ?string $slug = 'interacciones';

    /**
     * Nombres de ficha y de localidad para traducir la columna "Sobre qué",
     * cargados UNA vez por petición. Sin esto la tabla haría una consulta por
     * fila (el clásico N+1), y esta es justo la pantalla que se abre con 50
     * filas de golpe — y ahora además la usan los rankings del panel.
     */
    private static ?array $nombresFicha = null;

    private static ?array $nombresLocalidad = null;

    /** Etiquetas de `referencia` que no salen de ninguna tabla. */
    private const ETIQUETAS_FIJAS = [
        'idioma' => ['es' => 'Español', 'en' => 'English'],
        'voto' => ['confirma' => 'Sigue ahí', 'descarta' => 'Ya no está'],
    ];

    /**
     * Texto legible de `referencia`. NO se puede traducir sin mirar antes el
     * tipo: la misma columna guarda un id de ficha, un slug de localidad, un
     * idioma, un tipo de reporte o una nota de 1 a 5 según lo que haya pasado.
     *
     * Vive acá y no en el modelo a propósito: es presentación —depende de las
     * etiquetas del CMS— y el modelo tiene que poder usarse sin Filament.
     */
    public static function etiqueta(string $tipo, ?string $referencia): string
    {
        $referencia = (string) $referencia;

        if ($referencia === '') {
            return '—';
        }

        if (in_array($tipo, Interaccion::TIPOS_DE_FICHA, true)) {
            self::$nombresFicha ??= Place::pluck('nombre', 'id')
                ->map(fn ($n) => is_array($n) ? ($n['es'] ?? '') : (string) $n)
                ->all();

            // Una ficha borrada deja su histórico huérfano. Se muestra el id en
            // vez de esconder la fila: el número siguió contando para el total.
            return self::$nombresFicha[(int) $referencia] ?? "Ficha #{$referencia}";
        }

        if ($tipo === 'localidad') {
            self::$nombresLocalidad ??= Localidad::pluck('nombre', 'slug')
                ->map(fn ($n) => is_array($n) ? ($n['es'] ?? '') : (string) $n)
                ->all();

            return self::$nombresLocalidad[$referencia] ?? $referencia;
        }

        if ($tipo === 'reporte') {
            return ReporteResource::TIPOS[$referencia] ?? $referencia;
        }

        if ($tipo === 'calificacion') {
            return $referencia === '1' ? '1 estrella' : "{$referencia} estrellas";
        }

        // Se guarda el código (CL, es-AR) y no el nombre: es lo que mantiene el
        // conjunto cerrado y lo que sobrevive a que cambie el nombre de un país.
        // El nombre se arma acá, que es donde se lee.
        if ($tipo === 'origen_pais') {
            return Origen::nombrePais($referencia);
        }

        if ($tipo === 'origen_idioma') {
            return Origen::nombreIdioma($referencia);
        }

        // El canal se guarda por su código (`muni`, `qr-furgon`) porque es lo
        // que viaja en la URL impresa; el nombre largo se arma acá, que es
        // donde se lee. Un código que ya no está en la lista se muestra tal
        // cual: siguió contando para el total del día en que se usó.
        if ($tipo === 'campana') {
            return Interaccion::CANALES[$referencia] ?? $referencia;
        }

        return self::ETIQUETAS_FIJAS[$tipo][$referencia] ?? $referencia;
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
                        'campana' => 'info',                               // de dónde llegó
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('referencia')
                    ->label('Sobre qué')
                    ->placeholder('—')
                    // La referencia cruda es un id o un slug: ilegible en una
                    // tabla que se lee para decidir. `etiqueta()` la traduce
                    // según el tipo — nombre de ficha, nombre de localidad,
                    // "Trabajos en la vía", "Español"…
                    ->formatStateUsing(fn (?string $state, Interaccion $i): string => self::etiqueta($i->tipo, $state))
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
                // El filtro de fechas que vivía acá lo reemplazó el selector de
                // periodo de la PÁGINA (ver ListInteracciones): tenerlo en los
                // dos lados dejaba las tarjetas de arriba y la lista de abajo
                // contando ventanas distintas, que es la peor forma de mentir
                // en un panel — cada número es correcto y juntos no cuadran.
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
