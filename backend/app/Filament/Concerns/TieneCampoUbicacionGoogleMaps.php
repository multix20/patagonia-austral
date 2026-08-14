<?php

namespace App\Filament\Concerns;

use App\Support\ExifGps;
use App\Support\GoogleMaps;
use Filament\Forms;
use Filament\Forms\Set;
use Filament\Notifications\Notification;

/**
 * Aporta los dos atajos para poner el pin sin teclear coordenadas: pegar un
 * enlace de Google Maps, o subir una foto sacada en el lugar.
 *
 * Se usa en lugares y localidades para que el pin quede donde de verdad está el
 * negocio. Teclear grados a mano es la fuente clásica de pines mal puestos, y en
 * la Austral un pin corrido manda a alguien media hora de ripio en la dirección
 * equivocada.
 */
trait TieneCampoUbicacionGoogleMaps
{
    protected static function campoPegarGoogleMaps(): Forms\Components\TextInput
    {
        return Forms\Components\TextInput::make('pegar_google_maps')
            ->label('Pegar desde Google Maps')
            ->placeholder('Enlace de Google Maps o "lat, lng"')
            ->helperText('Abre el lugar en Google Maps y pega aquí el enlace (o las coordenadas del clic derecho → "¿Qué hay aquí?"). La latitud y longitud se completan solas con la ubicación exacta del pin.')
            ->dehydrated(false) // campo solo de ayuda: no se guarda en la base de datos
            ->live(onBlur: true)
            ->columnSpanFull()
            ->afterStateUpdated(function (?string $state, Set $set): void {
                $coords = GoogleMaps::extraerCoordenadas($state);
                if ($coords !== null) {
                    $set('lat', $coords[0]);
                    $set('lng', $coords[1]);
                    $set('pegar_google_maps', null);
                }
            });
    }

    /**
     * Campo "Ubicar con una foto": lee el GPS que la cámara dejó dentro y
     * completa lat/lng.
     *
     * Por qué hace falta habiendo ya un campo de Google Maps: no todos los
     * dueños de servicios de la Austral tienen su negocio en Maps, ni saben
     * copiar un enlace. Sacar una foto parado en la puerta, en cambio, lo hace
     * cualquiera. Y la precisión es mejor que la de una dirección escrita, que
     * muchas veces ni existe ("camino a Tortel km 3, casa azul").
     *
     * La foto NO se guarda: se usa para leer el punto y se descarta. Es
     * deliberado — la foto que sirve para ubicar (una puerta, un cartel) casi
     * nunca es la que uno quiere publicar, y esas van en la sección Fotos.
     */
    protected static function campoUbicarConFoto(): Forms\Components\FileUpload
    {
        return Forms\Components\FileUpload::make('foto_ubicacion')
            ->label('Ubicar con una foto')
            ->helperText(
                'Sube una foto sacada EN el lugar y el pin se pone solo. Ojo: WhatsApp '
                .'borra la ubicación al mandar una imagen como foto — pídela como '
                .'«documento», por correo, o mejor aún pide la ubicación de WhatsApp. '
                .'La foto no se guarda: solo se lee su ubicación.'
            )
            ->image()
            // No se persiste: es una herramienta, no un dato de la ficha.
            ->dehydrated(false)
            ->live()
            ->columnSpanFull()
            ->afterStateUpdated(function ($state, Set $set): void {
                $archivo = is_array($state) ? reset($state) : $state;

                if (! $archivo || ! method_exists($archivo, 'getRealPath')) {
                    return;
                }

                $coords = ExifGps::extraerCoordenadas($archivo->getRealPath());

                if ($coords === null) {
                    Notification::make()
                        ->warning()
                        ->title('Esa foto no trae ubicación')
                        ->body(
                            'Le falta el dato GPS. Casi siempre es porque pasó por WhatsApp '
                            .'como foto (lo borra al recomprimir) o porque el teléfono tenía '
                            .'la ubicación apagada. Pide el archivo original, o la ubicación '
                            .'de WhatsApp, o el enlace de Google Maps.'
                        )
                        ->persistent()
                        ->send();

                    return;
                }

                $set('lat', $coords[0]);
                $set('lng', $coords[1]);

                Notification::make()
                    ->success()
                    ->title('Pin ubicado desde la foto')
                    ->body(sprintf('%.5f, %.5f — revísalo en el mapa antes de guardar.', $coords[0], $coords[1]))
                    ->send();

                // Aviso, no bloqueo: la foto puede ser vieja o de otro lado, y
                // quien edita sabe más que nosotros. Pero un punto lejos de la
                // ruta casi siempre es un error, y callarlo sería justo el bug
                // que este campo viene a evitar.
                if (! self::dentroDeLaAustral($coords[0], $coords[1])) {
                    Notification::make()
                        ->warning()
                        ->title('Ojo: esa foto se sacó lejos de la Carretera Austral')
                        ->body('Las coordenadas se completaron igual, pero conviene mirar el mapa antes de guardar.')
                        ->persistent()
                        ->send();
                }
            });
    }

    /**
     * Caja generosa alrededor de la ruta (Puerto Montt–Villa O'Higgins con
     * holgura). No es una validación geográfica fina: solo separa "esto es de la
     * zona" de "esto se sacó en Santiago".
     */
    private static function dentroDeLaAustral(float $lat, float $lng): bool
    {
        return $lat <= -40.5 && $lat >= -49.5 && $lng <= -70.5 && $lng >= -75.5;
    }
}
