<?php

use App\Http\Controllers\Api\NoticeController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\PushController;
use Illuminate\Support\Facades\Route;

// API pública de la PWA (solo lectura). El CMS Filament gestiona la escritura.
Route::get('/places', [PlaceController::class, 'index']);
Route::get('/notices', [NoticeController::class, 'index']);

// Web Push: clave pública VAPID y registro de suscripciones desde la PWA.
Route::get('/push/public-key', [PushController::class, 'publicKey']);
Route::post('/push/subscribe', [PushController::class, 'subscribe']);
