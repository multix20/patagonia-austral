<?php

namespace App\Filament\Concerns;

use App\Support\GoogleMaps;
use Filament\Forms;
use Filament\Forms\Set;

/**
 * Aporta un campo "Pegar desde Google Maps" que autocompleta lat/lng.
 *
 * Se usa tanto en lugares como en localidades para que el pin del mapa quede
 * exactamente donde Google lo muestra, sin teclear coordenadas a mano.
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
}
