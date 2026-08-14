<?php

namespace App\Http\Controllers;

use App\Models\Propuesta;
use Illuminate\Http\Request;

/**
 * Formulario que el dueño de un servicio abre desde el enlace del correo.
 *
 * No hay login: el token del enlace es la credencial. Es una decisión de
 * producto, no un atajo — pedirle una cuenta y una contraseña a cada dueño de
 * hospedaje de la Austral significa que no contesta nadie, y el objetivo es
 * justamente que contesten. A cambio, lo que llega NO toca la ficha: queda como
 * propuesta hasta que alguien la revise.
 *
 * Va servido por Laravel y no por la PWA a propósito: esto lo usa una vez el
 * dueño de un negocio con señal en el pueblo, no el viajero sin cobertura. Meter
 * un formulario de administración en el bundle que se precachea para la ruta
 * sería cargarle peso a quien nunca lo va a abrir.
 */
class PropuestaController extends Controller
{
    /** GET /mi-ficha/{token} — el formulario, con lo que ya hay en la ficha. */
    public function mostrar(string $token)
    {
        $propuesta = Propuesta::with('place.localidad')->where('token', $token)->first();

        if (! $propuesta || ! $propuesta->place) {
            // 404 sin explicar por qué: un enlace inválido no tiene por qué
            // revelar si el token existió alguna vez.
            abort(404);
        }

        return view('propuesta.formulario', [
            'propuesta' => $propuesta,
            'ficha' => $propuesta->place,
        ]);
    }

    /** POST /mi-ficha/{token} — guarda lo enviado. No toca la ficha. */
    public function guardar(Request $request, string $token)
    {
        $propuesta = Propuesta::where('token', $token)->first();

        if (! $propuesta || ! $propuesta->place) {
            abort(404);
        }

        $datos = $request->validate([
            'nombre' => ['nullable', 'string', 'max:120'],
            'tel' => ['nullable', 'string', 'max:40'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'como' => ['nullable', 'string', 'max:500'],
            'horario' => ['nullable', 'string', 'max:200'],
            // La ubicación llega del botón "usar mi ubicación" del navegador, o
            // vacía si no la usó. Se acota a la Patagonia austral con holgura:
            // un punto en Santiago no es un pin impreciso, es un error.
            'lat' => ['nullable', 'numeric', 'between:-49.5,-40.5'],
            'lng' => ['nullable', 'numeric', 'between:-75.5,-70.5'],
        ]);

        // La latitud sin la longitud (o al revés) deja el pin en el mar: o van
        // las dos o no va ninguna.
        if (! isset($datos['lat']) || ! isset($datos['lng'])) {
            unset($datos['lat'], $datos['lng']);
        }

        $propuesta->update([
            'datos' => array_intersect_key($datos, array_flip(Propuesta::CAMPOS)),
            'estado' => 'respondida',
            'respondida_en' => now(),
        ]);

        return view('propuesta.gracias', ['ficha' => $propuesta->place]);
    }
}
