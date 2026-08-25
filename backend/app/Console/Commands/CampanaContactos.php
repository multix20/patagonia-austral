<?php

namespace App\Console\Commands;

use App\Support\ListaCampana;
use Illuminate\Console\Command;

/**
 * Arma la lista de envío de la ola 2 de la campaña por consola.
 *
 * La lógica vive en `App\Support\ListaCampana`, compartida con el botón
 * «Descargar lista de la campaña» del CMS. Dos puertas al mismo dato: la
 * consola para quien está en el PC con la base a mano, el botón para el
 * teléfono. Si cada una armara su propia consulta, entregarían listas distintas
 * y no habría forma de saber cuál se mandó.
 *
 * Correr esto CREA las invitaciones que todavía no existan y reusa las que ya
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

    public function handle(): int
    {
        $filtros = [
            'cat' => $this->option('cat'),
            'localidad' => $this->option('localidad'),
            'sin_telefono' => (bool) $this->option('sin-telefono'),
        ];

        $cuantas = ListaCampana::fichas($filtros)->count();

        if ($cuantas === 0) {
            $this->warn('Ninguna ficha calza con esos filtros.');

            return self::SUCCESS;
        }

        $csv = ListaCampana::csv($filtros, conEnlace: ! $this->option('seco'));

        if ($destino = $this->option('salida')) {
            file_put_contents($destino, $csv);
            $this->info("{$cuantas} fichas escritas en {$destino}.");
        } else {
            $this->line($csv);
        }

        if ($this->option('seco')) {
            $this->warn('Corrida en seco: no se creó ninguna invitación, la columna del enlace va vacía.');
        }

        return self::SUCCESS;
    }
}
