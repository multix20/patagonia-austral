<?php

namespace App\Support;

use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Support\Collection;

/**
 * La lista de envío de la campaña: una fila por ficha publicada, con SU enlace
 * personal al lado del nombre.
 *
 * Vive acá y no dentro del comando porque tiene dos puertas: `campana:contactos`
 * en la consola y el botón «Descargar lista de la campaña» del CMS. La segunda
 * existe por una razón concreta: **el repo es público**, así que nada con datos
 * personales puede salir por GitHub —ni artefacto, ni log, ni archivo—, y el
 * enlace `/mi-ficha/<token>` es una credencial: con uno cualquiera puede
 * proponer cambios a esa ficha. El CMS ya está detrás de un login y se abre
 * igual desde el teléfono, así que es la única salida que no expone nada.
 *
 * Que las dos puertas compartan este código no es economía: es lo que evita que
 * el comando y el botón entreguen listas distintas y nadie sepa cuál mandó.
 */
class ListaCampana
{
    /**
     * Qué correo de `docs/campana/correo-2-negocios.md` le toca a cada
     * categoría. `servicio` queda a propósito sin resolver: adentro conviven la
     * bencinera, el taller y el furgón, y cuál es cuál se decide mirando el
     * nombre, no el campo.
     */
    public const CORREO_POR_CAT = [
        'alojamiento' => 'alojamiento',
        'comida' => 'gastronomia',
        'servicio' => 'revisar: combustible o transporte',
        'atractivo' => 'guias',
        'evento' => 'comercio',
    ];

    public const COLUMNAS = [
        'localidad', 'cat', 'rubro_correo', 'negocio', 'tel', 'whatsapp', 'horario',
        'correo', 'enlace_ficha', 'ola', 'enviado_en', 'recordado_en', 'respondido_en',
        'estado', 'notas',
    ];

    /**
     * Las fichas a las que se les escribe.
     *
     * Dos exclusiones que no son opcionales:
     *
     * - **`emergencia` nunca.** Posta, CESFAM, Carabineros y Bomberos son
     *   servicio público: su dato se confirma con la municipalidad en la ola 1,
     *   no pidiéndole a una posta rural que llene un formulario.
     * - **Sin publicar tampoco.** Escribirle a alguien por una ficha que nadie
     *   puede ver invita la única pregunta que no tiene buena respuesta.
     *
     * @param  array{cat?: ?string, localidad?: ?string, sin_telefono?: bool}  $filtros
     */
    public static function fichas(array $filtros = []): Collection
    {
        return Place::query()
            ->with('localidad')
            ->where('publicado', true)
            ->where('cat', '<>', 'emergencia')
            ->when($filtros['cat'] ?? null, fn ($q, $cat) => $q->where('cat', $cat))
            ->when($filtros['localidad'] ?? null, fn ($q, $slug) => $q->whereHas(
                'localidad',
                fn ($l) => $l->where('slug', $slug)
            ))
            // "Sin teléfono" es lo más cerca que se puede estar de `preliminar`
            // mirando la base: ese flag vive en el seed, no en una columna. Y da
            // igual el nombre: la ficha sin teléfono es exactamente la que la
            // campaña existe para arreglar.
            ->when($filtros['sin_telefono'] ?? false, fn ($q) => $q
                ->where(fn ($s) => $s->whereNull('tel')->orWhere('tel', ''))
                ->where(fn ($s) => $s->whereNull('whatsapp')->orWhere('whatsapp', '')))
            ->get()
            ->sortBy([
                fn (Place $a, Place $b) => ($a->localidad->orden ?? 0) <=> ($b->localidad->orden ?? 0),
                fn (Place $a, Place $b) => $a->cat <=> $b->cat,
                fn (Place $a, Place $b) => self::texto($a->nombre) <=> self::texto($b->nombre),
            ])
            ->values();
    }

    /**
     * Una fila por ficha. Con `$conEnlace` en false no se crea ninguna
     * invitación: sirve para mirar la lista sin tocar la base.
     */
    public static function fila(Place $ficha, bool $conEnlace = true): array
    {
        return [
            'localidad' => self::texto($ficha->localidad?->nombre),
            'cat' => $ficha->cat,
            'rubro_correo' => self::CORREO_POR_CAT[$ficha->cat] ?? '',
            'negocio' => self::texto($ficha->nombre),
            'tel' => (string) $ficha->tel,
            'whatsapp' => (string) $ficha->whatsapp,
            'horario' => (string) $ficha->horario,
            // Vive solo en el CMS: no viaja en `/api/places` (ver Place::toApi).
            // Sale vacío mientras nadie lo haya cargado — y esa celda vacía es
            // justamente la lista de a quién todavía no se le puede escribir.
            'correo' => (string) $ficha->email,
            'enlace_ficha' => $conEnlace ? Propuesta::invitar($ficha)->url() : '',
            'ola' => '2',
            'enviado_en' => '',
            'recordado_en' => '',
            'respondido_en' => '',
            'estado' => 'pendiente',
            'notas' => '',
        ];
    }

    /**
     * Separador: **punto y coma**, no coma.
     *
     * No es preferencia. En configuración regional española —la de quien abre
     * esta planilla— el separador de listas de Excel es `;`, así que un archivo
     * separado por comas se abre con las quince columnas apiladas dentro de la
     * primera. Pasó en la primera descarga de verdad. Google Sheets detecta las
     * dos formas, así que `;` es el que funciona en los dos lados.
     *
     * Cada celda va entre comillas igual, así que un `;` dentro de un nombre no
     * rompe nada.
     *
     * @param  array{cat?: ?string, localidad?: ?string, sin_telefono?: bool}  $filtros
     */
    public static function csv(array $filtros = [], bool $conEnlace = true): string
    {
        $filas = self::fichas($filtros)->map(fn (Place $f) => self::fila($f, $conEnlace))->all();

        $lineas = [implode(';', self::COLUMNAS)];

        foreach ($filas as $fila) {
            $lineas[] = implode(';', array_map(
                fn (string $celda) => '"'.str_replace('"', '""', $celda).'"',
                array_map('strval', array_values($fila))
            ));
        }

        return implode("\n", $lineas)."\n";
    }

    /** `nombre` viaja como {es, en}; para la planilla se usa el español. */
    public static function texto(mixed $valor): string
    {
        return is_array($valor) ? (string) ($valor['es'] ?? '') : (string) $valor;
    }
}
