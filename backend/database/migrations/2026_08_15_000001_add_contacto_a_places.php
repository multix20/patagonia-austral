<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Los dos datos que faltaban para que se pueda RESERVAR desde la app.
 *
 * `whatsapp` — en la Austral es el canal real de reserva, muy por encima del
 * teléfono: el hospedaje chico contesta el chat y no siempre la llamada. Hasta
 * hoy la PWA leía `lugar.whatsapp` (QuickCard) contra un campo que no existía
 * en ninguna parte, así que el botón de WhatsApp nunca se dibujó en producción.
 * Va en columna propia y no reusando `tel` porque muchos negocios publican un
 * fijo para llamar y un móvil distinto para el chat.
 *
 * `horario` — ya se venía PIDIENDO en las propuestas de los dueños
 * (`Propuesta::SOLO_INFORMATIVOS`) sin tener dónde guardarlo, con la nota de
 * que agregar la columna después sería media hora. Es esa media hora. Se guarda
 * como texto libre y no estructurado a propósito: lo que contesta un dueño es
 * "todos los días de 9 a 22, en invierno hasta las 20", y encajarlo a la fuerza
 * en un calendario obliga a inventar lo que no dijo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->string('whatsapp')->nullable()->after('tel');
            $table->string('horario')->nullable()->after('whatsapp');
        });
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn(['whatsapp', 'horario']);
        });
    }
};
