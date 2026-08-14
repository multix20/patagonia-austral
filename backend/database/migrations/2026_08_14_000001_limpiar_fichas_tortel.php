<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Saca del mapa de Caleta Tortel lo que no ayuda a decidir un viaje.
 *
 * El lote municipal de agosto dejó **123 fichas publicadas en un pueblo de ~500
 * habitantes**, y el mapa se volvió ilegible. Al revisarlo, el problema resultó
 * NO ser el que parecía: duplicados literales había apenas cuatro. Lo que sobra
 * es mobiliario municipal importado como "atractivo" —seis plazas, cuatro plazas
 * de juegos, el paradero, el gimnasio— y once miradores compitiendo entre sí.
 * Nadie viaja a Tortel a ver una plaza de juegos; viaja por las pasarelas, los
 * glaciares y la Isla de los Muertos, y esas fichas quedaban enterradas.
 *
 * NADA SE BORRA: todo queda con `publicado = false`, que es la regla del
 * proyecto desde jul-2026 para lo que sale de circulación. `down()` lo revierte
 * entero.
 *
 * **Por qué compara el nombre además del id.** Los ids vienen del lote (4000+),
 * pero al importar a producción diez fichas se omitieron por duplicadas, así que
 * la numeración de allá no tiene por qué calzar con la de una base local. Actuar
 * solo por id podría despublicar una ficha distinta de la que se revisó — en
 * emergencias, eso es sacar del mapa la posta equivocada. Si el nombre no calza,
 * la fila se deja intacta.
 */
return new class extends Migration
{
    /**
     * Mobiliario municipal que entró como "atractivo". Son lugares reales (las
     * cuatro "Plaza de juegos" están a cientos de metros unas de otras, no son
     * duplicados), pero no son motivo de viaje y tapaban a los que sí lo son.
     */
    private const MOBILIARIO = [
        4000 => 'Plaza Elicura',
        4003 => 'Plaza Morel',
        4004 => 'Plaza Orompello',
        4005 => 'Pérgola',
        4007 => 'Gimnasio comunitario',
        4008 => 'Plaza San Pedro',
        4009 => 'Plaza Kawasqar',
        4010 => 'Plaza de Armas',
        4011 => 'El Mercadito',
        4012 => 'Plaza de juegos',
        4013 => 'Paradero',
        4014 => 'Plaza de juegos',
        4015 => 'Plaza de juegos',
        4016 => 'Plazoleta Rincón bajo',
        4017 => 'Plazoleta Rincón bajo',
        4018 => 'Plaza de juegos',
        4019 => 'Plaza de deportes',
    ];

    /**
     * Miradores que salen de circulación. Quedan publicados tres —del Faro, La
     * Antena y Cascada Pisagua—: el faro y la cascada son destinos con nombre
     * propio y La Antena es la panorámica alta del pueblo. Los que se van tienen
     * nombres genéricos ("1 Isla", "2 Isla", "Playa") o repiten vista.
     */
    private const MIRADORES = [
        4092 => 'Mirador El cóndor',
        4093 => 'Mirador El ciprés',
        4096 => 'Mirador Playa',
        4097 => 'Mirador 1 Isla',
        4098 => 'Mirador 2 Isla',
    ];

    /**
     * Duplicados de verdad: la misma cosa dos veces. Se despublica el sobrante y
     * sobrevive el que se indica en el comentario.
     */
    private const DUPLICADOS = [
        // Mismo mirador mapeado dos veces, a 93 m. Sobrevive 4094.
        4095 => 'Mirador Rincón alto',
        // Mismo teléfono, a 13 m: un hospedaje con dos unidades. Sobrevive 4104.
        4105 => 'Hospedaje Giselle 2',
        // La MISMA posta de salud, a 112 m, las dos como emergencia y con
        // teléfonos distintos. Es el duplicado más grave del lote: ante una
        // urgencia el mapa mostraba dos fichas y dos números. Sobrevive la ficha
        // 21, que es la redactada a mano (mejor texto ES/EN), y se queda con el
        // celular de la posta local.
        4024 => 'Posta Salud Rural',
    ];

    /** Teléfono de la posta local, del mapa oficial de la municipalidad. */
    private const TEL_POSTA = '+56 9 9824 1609';

    public function up(): void
    {
        $tortel = DB::table('localidades')->where('slug', 'caleta-tortel')->value('id');
        if (! $tortel) {
            return;
        }

        foreach ([self::MOBILIARIO, self::MIRADORES, self::DUPLICADOS] as $lote) {
            foreach ($lote as $id => $nombre) {
                $this->despublicar($tortel, $id, $nombre);
            }
        }

        // La posta que sobrevive se queda con el celular local en vez del 131.
        // El 131 es el SAMU nacional y sirve igual desde cualquier teléfono; el
        // celular es el que contesta EN Tortel, que es lo que hace falta cuando
        // se está ahí.
        DB::table('places')
            ->where('id', 21)
            ->where('localidad_id', $tortel)
            ->where('cat', 'emergencia')
            ->update(['tel' => self::TEL_POSTA, 'updated_at' => now()]);

        // Sin la "2" al lado, el "1" del nombre no significa nada.
        DB::table('places')
            ->where('id', 4104)
            ->where('localidad_id', $tortel)
            ->whereRaw($this->comparadorNombre(), ['Hospedaje Giselle 1'])
            ->update([
                'nombre' => json_encode(['es' => 'Hospedaje Giselle', 'en' => 'Giselle Guesthouse'], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        $tortel = DB::table('localidades')->where('slug', 'caleta-tortel')->value('id');
        if (! $tortel) {
            return;
        }

        $ids = array_merge(
            array_keys(self::MOBILIARIO),
            array_keys(self::MIRADORES),
            array_keys(self::DUPLICADOS),
        );

        DB::table('places')
            ->where('localidad_id', $tortel)
            ->whereIn('id', $ids)
            ->update(['publicado' => true, 'updated_at' => now()]);

        DB::table('places')->where('id', 21)->where('localidad_id', $tortel)
            ->update(['tel' => '131', 'updated_at' => now()]);

        DB::table('places')->where('id', 4104)->where('localidad_id', $tortel)
            ->update([
                'nombre' => json_encode(['es' => 'Hospedaje Giselle 1', 'en' => 'Giselle Guesthouse 1'], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }

    private function despublicar(int $tortel, int $id, string $nombre): void
    {
        DB::table('places')
            ->where('id', $id)
            ->where('localidad_id', $tortel)
            ->whereRaw($this->comparadorNombre(), [$nombre])
            ->update(['publicado' => false, 'updated_at' => now()]);
    }

    /**
     * Compara el nombre en español guardado en el jsonb. Postgres y SQLite no
     * tienen la misma sintaxis para eso, y esta migración corre en los dos: en
     * Neon al desplegar, y en sqlite en los tests.
     */
    private function comparadorNombre(): string
    {
        return DB::connection()->getDriverName() === 'pgsql'
            ? "nombre->>'es' = ?"
            : "json_extract(nombre, '$.es') = ?";
    }
};
