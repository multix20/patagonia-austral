<?php

use App\Http\Controllers\PropuestaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/**
 * Formulario para que el dueño de un servicio actualice SU ficha.
 *
 * El token del enlace es la única credencial (ver PropuestaController). Va con
 * rate limit por la misma razón que el resto de lo que escribe sin login: es la
 * única defensa contra alguien probando tokens al azar, y 20 por minuto es
 * holgadísimo para una persona llenando un formulario.
 */
Route::get('/mi-ficha/{token}', [PropuestaController::class, 'mostrar'])
    ->middleware('throttle:20,1')
    ->name('propuesta.formulario');
Route::post('/mi-ficha/{token}', [PropuestaController::class, 'guardar'])
    ->middleware('throttle:20,1')
    ->name('propuesta.guardar');
