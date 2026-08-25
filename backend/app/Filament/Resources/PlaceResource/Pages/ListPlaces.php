<?php

namespace App\Filament\Resources\PlaceResource\Pages;

use App\Filament\Resources\PlaceResource;
use App\Models\Localidad;
use App\Support\ListaCampana;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Pages\ListRecords;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListPlaces extends ListRecords
{
    protected static string $resource = PlaceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            $this->accionListaCampana(),
            Actions\CreateAction::make(),
        ];
    }

    /**
     * Descarga la lista de envío de la campaña, con el enlace personal de cada
     * ficha ya puesto al lado del negocio.
     *
     * **Por qué está acá y no en un runner de GitHub.** El mismo dato lo saca
     * `php artisan campana:contactos`, pero eso obliga a estar frente al PC con
     * la base a mano. La tentación es moverlo a Actions y bajar el CSV como
     * artefacto desde el teléfono — y no se puede: **el repo es público**, así
     * que un artefacto o un log de Actions lo puede bajar cualquiera, y el
     * enlace `/mi-ficha/<token>` es una credencial: con uno, un desconocido
     * propone cambios sobre esa ficha. El CMS ya pide login y se abre igual
     * desde el teléfono, así que es la salida que no expone nada.
     *
     * La lógica es la misma que la del comando (`App\Support\ListaCampana`)
     * para que las dos puertas no entreguen listas distintas.
     */
    private function accionListaCampana(): Actions\Action
    {
        return Actions\Action::make('listaCampana')
            ->label('Lista de la campaña')
            ->icon('heroicon-o-arrow-down-tray')
            ->color('gray')
            ->outlined()
            ->modalHeading('Descargar la lista de envío')
            ->modalDescription(
                'Una fila por ficha publicada, con su enlace personal al lado del negocio. '
                .'Las emergencias y lo que no esté publicado quedan fuera. '
                .'El correo del dueño va vacío: ese dato no vive en la base.'
            )
            ->modalSubmitActionLabel('Descargar CSV')
            ->form([
                Forms\Components\Select::make('cat')
                    ->label('Categoría')
                    // Sin `emergencia`: a una posta rural no se le escribe como
                    // negocio, su dato se confirma con la municipalidad.
                    ->options(collect(PlaceResource::CATEGORIAS)->except('emergencia')->all())
                    ->placeholder('Todas')
                    ->native(false),
                Forms\Components\Select::make('localidad')
                    ->label('Localidad')
                    ->options(fn () => Localidad::orderBy('orden')
                        ->get()
                        ->mapWithKeys(fn (Localidad $l) => [$l->slug => $l->nombre['es'] ?? $l->slug])
                        ->all())
                    ->placeholder('Todas')
                    ->searchable()
                    ->native(false),
                Forms\Components\Toggle::make('sin_telefono')
                    ->label('Solo las fichas sin teléfono ni WhatsApp')
                    ->helperText('Las que la campaña existe para arreglar.')
                    ->inline(false),
            ])
            ->action(function (array $data): StreamedResponse {
                $csv = ListaCampana::csv([
                    'cat' => $data['cat'] ?? null,
                    'localidad' => $data['localidad'] ?? null,
                    'sin_telefono' => (bool) ($data['sin_telefono'] ?? false),
                ]);

                return response()->streamDownload(
                    fn () => print($csv),
                    'campana-'.now()->format('Y-m-d').'.csv',
                    ['Content-Type' => 'text/csv; charset=UTF-8'],
                );
            });
    }
}
