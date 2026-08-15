<?php

namespace App\Http\Controllers;

use App\Models\Propuesta;
use App\Services\AlmacenamientoFotos;
use App\Services\GuardarFoto;
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
            // Sin credenciales de R2 la subida falla al GUARDAR, o sea después
            // de que el dueño eligió la foto y llenó el formulario entero. Si el
            // almacenamiento no está en pie, mejor no ofrecer el campo.
            'aceptaFotos' => app(AlmacenamientoFotos::class)->listo(),
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
            // `image` valida el contenido, no la extensión: un .php renombrado a
            // .jpg no pasa. Es la primera de tres barreras — las otras dos son
            // el recodificado a WebP (lo que se guarda NUNCA es el archivo que
            // llegó) y la carpeta aparte, que mantiene lo no revisado fuera de
            // donde vive el contenido publicado.
            'fotos' => ['nullable', 'array', 'max:'.config('fotos.max_por_propuesta')],
            'fotos.*' => ['image', 'max:'.config('fotos.max_subida_kb')],
        ]);

        unset($datos['fotos']);

        // La latitud sin la longitud (o al revés) deja el pin en el mar: o van
        // las dos o no va ninguna.
        if (! isset($datos['lat']) || ! isset($datos['lng'])) {
            unset($datos['lat'], $datos['lng']);
        }

        $limpios = array_intersect_key($datos, array_flip(Propuesta::CAMPOS));

        // Las rutas de las fotos NO salen de la lista blanca: las genera el
        // servidor al guardar los archivos. Lo que manda el navegador son los
        // binarios, nunca una ruta — si se aceptara una ruta escrita por quien
        // envía, una propuesta podría apuntar a cualquier objeto del bucket.
        $fotos = $this->guardarFotos($request);
        if ($fotos !== []) {
            $limpios['fotos'] = $fotos;
        }

        $propuesta->update([
            'datos' => $limpios,
            'estado' => 'respondida',
            'respondida_en' => now(),
        ]);

        return view('propuesta.gracias', ['ficha' => $propuesta->place]);
    }

    /**
     * Guarda las fotos que vinieron y devuelve sus rutas.
     *
     * Van a la carpeta de propuestas, no a la de las fichas: todavía no son
     * contenido de la guía. Se mueven al aplicar (`Propuesta::aplicar`).
     *
     * Una foto ilegible se salta en silencio en vez de rechazar el envío entero:
     * el resto de lo que escribió el dueño —el teléfono, la ubicación— vale
     * igual, y hacerle perder el formulario completo por un archivo raro es la
     * forma más segura de que no lo vuelva a llenar.
     *
     * @return array<int, string>
     */
    private function guardarFotos(Request $request): array
    {
        if (! $request->hasFile('fotos') || ! app(AlmacenamientoFotos::class)->listo()) {
            return [];
        }

        $guardador = app(GuardarFoto::class);
        $carpeta = (string) config('fotos.carpeta_propuestas');

        return collect($request->file('fotos'))
            ->take((int) config('fotos.max_por_propuesta'))
            ->map(fn ($archivo) => $guardador->guardar($archivo, $carpeta))
            ->filter()
            ->values()
            ->all();
    }
}
