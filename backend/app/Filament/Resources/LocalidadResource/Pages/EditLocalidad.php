<?php

namespace App\Filament\Resources\LocalidadResource\Pages;

use App\Filament\Resources\LocalidadResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditLocalidad extends EditRecord
{
    protected static string $resource = LocalidadResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
