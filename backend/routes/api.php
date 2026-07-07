<?php

use App\Http\Controllers\Api\NoticeController;
use App\Http\Controllers\Api\PlaceController;
use Illuminate\Support\Facades\Route;

// API pública de la PWA (solo lectura). El CMS Filament gestiona la escritura.
Route::get('/places', [PlaceController::class, 'index']);
Route::get('/notices', [NoticeController::class, 'index']);
