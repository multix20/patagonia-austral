<?php

namespace App\Filament\Resources\LocalidadResource\Pages;

use App\Filament\Resources\LocalidadResource;
use Filament\Resources\Pages\CreateRecord;

class CreateLocalidad extends CreateRecord
{
    protected static string $resource = LocalidadResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
