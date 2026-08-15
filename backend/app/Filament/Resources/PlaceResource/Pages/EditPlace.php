<?php

namespace App\Filament\Resources\PlaceResource\Pages;

use App\Filament\Resources\PlaceResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPlace extends EditRecord
{
    protected static string $resource = PlaceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            /**
             * El mismo enlace que entrega la acción en lote de la lista, pero
             * para esta ficha sola.
             *
             * Existe porque el CMS se opera desde el teléfono: marcar casillas
             * en una tabla ancha para seleccionar UNA fila es incómodo, y para
             * escribirle a un negocio de a uno —que es como se hace— entrar a
             * su ficha es el camino natural.
             */
            Actions\Action::make('enlace_actualizar')
                ->label('Enlace para actualizar')
                ->icon('heroicon-o-link')
                ->color('info')
                ->modalHeading('Enlace para el dueño')
                ->modalDescription('Mándaselo por correo o WhatsApp. Le abre el formulario con los datos de esta ficha; lo que responda queda en Propuestas de fichas, esperando tu aprobación.')
                ->modalSubmitAction(false)
                ->modalCancelActionLabel('Cerrar')
                ->modalContent(fn () => PlaceResource::ventanaEnlaces(collect([$this->getRecord()]))),
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
