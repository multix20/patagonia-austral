<?php

namespace App\Filament\Resources\LocalidadResource\Pages;

use App\Filament\Resources\LocalidadResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListLocalidades extends ListRecords
{
    protected static string $resource = LocalidadResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
