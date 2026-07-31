<?php

use App\Http\Controllers\Api\LocalidadController;
use App\Http\Controllers\Api\NoticeController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\VersionController;
use Illuminate\Support\Facades\Route;

// API pública de la PWA (solo lectura). El CMS Filament gestiona la escritura.
Route::get('/places', [PlaceController::class, 'index']);
Route::get('/localidades', [LocalidadController::class, 'index']);
Route::get('/notices', [NoticeController::class, 'index']);

// Web Push: clave pública VAPID y registro de suscripciones desde la PWA.
Route::get('/push/public-key', [PushController::class, 'publicKey']);
Route::post('/push/subscribe', [PushController::class, 'subscribe']);

// Crowdsourcing (Fase 3): reportes de ruta de los viajeros. Es la única parte de
// la API que ESCRIBE sin login, así que va con rate limit por IP: 10 reportes y
// 30 votos por minuto alcanzan de sobra para un uso normal y cortan el abuso
// automatizado. La lectura queda libre (la PWA sincroniza para uso offline).
Route::get('/reportes', [ReporteController::class, 'index']);
Route::post('/reportes', [ReporteController::class, 'store'])->middleware('throttle:10,1');
Route::post('/reportes/{reporte}/voto', [ReporteController::class, 'votar'])
    ->middleware('throttle:30,1');

// Hook de despliegue de la PWA (lo llama Netlify al publicar producción): manda
// el push de "versión nueva", que es lo que pone el indicador con la app
// cerrada. Va con token y con rate limit bajo: sin él, adivinar el token a
// fuerza bruta sería spamear a todos los dispositivos.
Route::post('/version/desplegada', [VersionController::class, 'desplegada'])
    ->middleware('throttle:6,1');
