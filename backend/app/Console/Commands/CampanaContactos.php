<?php

namespace App\Console\Commands;

use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Console\Command;

/**
 * Arma la lista de envío de la ola 2 de la campaña: una fila por ficha, con el
 * ENLACE PERSONAL del dueño ya pegado al lado del negocio.
 *
 * Por qué existe. Sin esto el flujo es entrar al CMS, seleccionar fichas, copiar
 * cada enlace y pegarlo en una planilla junto al nombre. Es una tarde entera y,
 * peor, es donde se cuela el error caro: **mandarle a alguien el enlace de otro
 * negocio**, que le da acceso a editar una ficha que no es suya. Acá el enlace y
 * el nombre salen de la misma consulta y no se pueden cruzar.
 *
 * Las columnas son las de `docs/campana/contactos.ejemplo.csv`, así que el CSV
 * se abre, se le pega el correo de cada dueño —ese dato no está en la BD, sale
 * de los pipelines de carga— y se manda.
 *
 * Correr esto CREA las invitaciones que todavía no existan. Reusa las que ya
 * estén sin responder (ver `Propuesta::invitar`), así que correrlo dos veces no
 * genera dos enlaces para el mismo negocio. Con `--seco` no escribe nada.
 */
class CampanaContactos extends Command
{
    protected $signature = 'campana:contactos
        {--cat= : Categoría: alojamiento, comida, servicio, atractivo o evento}
        {--localidad= : Slug de una localidad (cochrane, caleta-tortel…)}
        {--sin-telefono : Solo las fichas publicadas que no tienen teléfono ni WhatsApp}
        {--seco : Muestra la lista sin crear ninguna invitación}
        {--salida= : Archivo donde escribir el CSV (por defecto, la pantalla)}';

    protected $description = 'Arma el CSV de la campaña: una fila por ficha publicada, con su enlace personal.';

    /**
     * Qué correo de `docs/campana/correo-2-negocios.md` le toca a cada
     * categoría. `servicio` queda a propósito sin resolver: adentro conviven la
     * bencinera, el taller y el furgón, y cuál es cuál se decide mirando el
     * nombre, no el campo.
     */
    private const CORREO_POR_CAT = [
        'alojamiento' => 'alojamiento',
        'comida' => 'gastronomia',
        'servicio' => 'revisar: combustible o transporte',
        'atractivo' => 'guias',
        'evento' => 'comercio',
    ];

    private const COLUMNAS = [
        'localidad', 'cat', 'rubro_correo', 'negocio', 'tel', 'whatsapp', 'horario',
        'correo', 'enlace_ficha', 'ola', 'enviado_en', 'recordado_en', 'respondido_en',
        'estado', 'notas',
    ];

    public function handle(): int
    {
        $fichas = $this->fichas();

        if ($fichas->isEmpty()) {
            $this->warn('Ninguna ficha calza con esos filtros.');

            return self::SUCCESS;
        }

        $filas = $fichas->map(fn (Place $ficha) => $this->fila($ficha))->all();
        $csv = $this->aCsv($filas);

        if ($destino = $this->option('salida')) {
            file_put_contents($destino, $csv);
            $this->info(count($filas)." fichas escritas en {$destino}.");
        } else {
            $this->line($csv);
        }

        if ($this->option('seco')) {
            $this->warn('Corrida en seco: no se creó ninguna invitación, la columna del enlace va vacía.');
        }

        return self::SUCCESS;
    }

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
     */
    private function fichas()
    {
        return Place::query()
            ->with('localidad')
            ->where('publicado', true)
            ->where('cat', '<>', 'emergencia')
            ->when($this->option('cat'), fn ($q, $cat) => $q->where('cat', $cat))
            ->when($this->option('localidad'), fn ($q, $slug) => $q->whereHas(
                'localidad',
                fn ($l) => $l->where('slug', $slug)
            ))
            // "Sin teléfono" es lo más cerca que se puede estar de `preliminar`
            // mirando la base: ese flag vive en el seed, no en una columna. Y da
            // igual el nombre: la ficha sin teléfono es exactamente la que la
            // campaña existe para arreglar.
            ->when($this->option('sin-telefono'), fn ($q) => $q
                ->where(fn ($s) => $s->whereNull('tel')->orWhere('tel', ''))
                ->where(fn ($s) => $s->whereNull('whatsapp')->orWhere('whatsapp', '')))
            ->get()
            ->sortBy([
                fn (Place $a, Place $b) => ($a->localidad->orden ?? 0) <=> ($b->localidad->orden ?? 0),
                fn (Place $a, Place $b) => $a->cat <=> $b->cat,
                fn (Place $a, Place $b) => $this->nombre($a) <=> $this->nombre($b),
            ])
            ->values();
    }

    private function fila(Place $ficha): array
    {
        return [
            'localidad' => $this->texto($ficha->localidad?->nombre),
            'cat' => $ficha->cat,
            'rubro_correo' => self::CORREO_POR_CAT[$ficha->cat] ?? '',
            'negocio' => $this->nombre($ficha),
            'tel' => (string) $ficha->tel,
            'whatsapp' => (string) $ficha->whatsapp,
            'horario' => (string) $ficha->horario,
            // El correo del dueño no está en la BD: sale de los pipelines de
            // carga, que no se versionan porque traen datos personales.
            'correo' => '',
            'enlace_ficha' => $this->option('seco') ? '' : Propuesta::invitar($ficha)->url(),
            'ola' => '2',
            'enviado_en' => '',
            'recordado_en' => '',
            'respondido_en' => '',
            'estado' => 'pendiente',
            'notas' => '',
        ];
    }

    private function nombre(Place $ficha): string
    {
        return $this->texto($ficha->nombre);
    }

    /** `nombre` viaja como {es, en}; para la planilla se usa el español. */
    private function texto(mixed $valor): string
    {
        return is_array($valor) ? (string) ($valor['es'] ?? '') : (string) $valor;
    }

    /**
     * CSV a mano y no `fputcsv` porque el destino puede ser la pantalla, y de
     * paso se fija el separador: una planilla en español abre con `,` sin
     * preguntar solo si las comillas están bien puestas.
     */
    private function aCsv(array $filas): string
    {
        $lineas = [implode(',', self::COLUMNAS)];

        foreach ($filas as $fila) {
            $lineas[] = implode(',', array_map(
                fn (string $celda) => '"'.str_replace('"', '""', $celda).'"',
                array_map('strval', array_values($fila))
            ));
        }

        return implode("\n", $lineas)."\n";
    }
}
