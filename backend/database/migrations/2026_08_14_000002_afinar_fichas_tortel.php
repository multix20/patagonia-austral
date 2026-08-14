<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Segunda pasada sobre Caleta Tortel, con dos correcciones sobre la primera
 * (`limpiar_fichas_tortel`).
 *
 * 1. **Vuelven cinco miradores.** La pasada anterior dejó tres de once por
 *    criterio propio; el alcance acordado después era más corto —duplicados y
 *    mobiliario municipal, nada más—, así que los que se recortaron de más se
 *    republican. Un mirador sin teléfono es normal y no es motivo para sacarlo:
 *    no es un negocio, es un lugar.
 *
 * 2. **Se aplica la regla de calidad del dato al COMERCIO**: una ficha de
 *    alojamiento, comida o servicio comercial sin teléfono no le sirve a nadie
 *    —no se puede reservar ni preguntar—, así que sale de circulación hasta
 *    tener el dato. Se aplica solo ahí a propósito: un atractivo, un evento o un
 *    servicio público no necesitan teléfono para ser útiles, y aplicarles la
 *    misma vara habría borrado del mapa las pasarelas y los miradores.
 *
 * Tres de las que salen son las fichas de RELLENO del propio proyecto
 * (`preliminar: true` — "cupo reservado con una ficha verosímil sin teléfono, a
 * reemplazar en cuanto llegue la información oficial"). La información llegó:
 * Tortel tiene hoy 31 alojamientos y 16 comidas reales con teléfono. El relleno
 * cumplió su función y estorba.
 *
 * Como siempre: nada se borra, `down()` lo revierte entero.
 */
return new class extends Migration
{
    /**
     * Miradores que vuelven al mapa. Los recortó la pasada anterior, fuera del
     * alcance que después se acordó.
     */
    private const REPUBLICAR = [
        4092 => 'Mirador El cóndor',
        4093 => 'Mirador El ciprés',
        4096 => 'Mirador Playa',
        4097 => 'Mirador 1 Isla',
        4098 => 'Mirador 2 Isla',
    ];

    /**
     * Comercio sin teléfono. No es que el negocio no exista: es que la ficha no
     * permite hacer nada con él.
     */
    private const SIN_TELEFONO = [
        // Relleno del proyecto (preliminar), ya reemplazado por 31 alojamientos
        // reales con teléfono.
        3077 => 'Hospedaje Las Pasarelas',
        // Ídem, contra 16 fichas de comida reales.
        3078 => 'Cocinería del Cipresal',
        // No es un negocio, es el nombre de una categoría. Hoy hay 18 almacenes,
        // kioskos y minimarkets de verdad, con nombre y teléfono.
        3079 => 'Abastecimiento en Caleta Tortel',
        4029 => 'Servicio de custodia',
        4043 => 'Minimarket El negrito',
        4072 => 'Taller de artesanías',
    ];

    /**
     * Sin teléfono y AUN ASÍ se quedan: son los servicios públicos, donde la
     * ficha vale por la ubicación y no por el contacto. La estación de
     * combustible entra acá sin dudarlo — en la Carretera Austral saber dónde
     * hay bencina es información de seguridad, con teléfono o sin él.
     *
     * No se tocan en esta migración; van listados para que se vea que la
     * omisión es deliberada y no un olvido:
     *   4020 Biblioteca pública · 4022 CONAF · 4023 Municipalidad
     *   4025 Registro Civil · 4028 Estación de combustible
     */
    public function up(): void
    {
        $tortel = DB::table('localidades')->where('slug', 'caleta-tortel')->value('id');
        if (! $tortel) {
            return;
        }

        foreach (self::REPUBLICAR as $id => $nombre) {
            $this->marcar($tortel, $id, $nombre, true);
        }

        foreach (self::SIN_TELEFONO as $id => $nombre) {
            $this->marcar($tortel, $id, $nombre, false);
        }
    }

    public function down(): void
    {
        $tortel = DB::table('localidades')->where('slug', 'caleta-tortel')->value('id');
        if (! $tortel) {
            return;
        }

        foreach (self::REPUBLICAR as $id => $nombre) {
            $this->marcar($tortel, $id, $nombre, false);
        }

        foreach (self::SIN_TELEFONO as $id => $nombre) {
            $this->marcar($tortel, $id, $nombre, true);
        }
    }

    /**
     * Compara el nombre además del id, por lo mismo que la migración anterior:
     * la numeración de producción no tiene por qué calzar con la de una base
     * local (al importar el lote se omitieron diez fichas por duplicadas), y
     * publicar o despublicar la ficha equivocada es peor que no hacer nada.
     */
    private function marcar(int $tortel, int $id, string $nombre, bool $publicado): void
    {
        DB::table('places')
            ->where('id', $id)
            ->where('localidad_id', $tortel)
            ->whereRaw($this->comparadorNombre(), [$nombre])
            ->update(['publicado' => $publicado, 'updated_at' => now()]);
    }

    private function comparadorNombre(): string
    {
        return DB::connection()->getDriverName() === 'pgsql'
            ? "nombre->>'es' = ?"
            : "json_extract(nombre, '$.es') = ?";
    }
};
