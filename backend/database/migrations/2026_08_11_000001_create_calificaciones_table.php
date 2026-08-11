<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 3 — Calificaciones: el viajero puntúa con estrellas el servicio al que
// FUE (dormir, comer, un atractivo, un transporte) y puede dejar un comentario.
//
// Es el complemento natural del crowdsourcing de reportes y ataca justo la tesis
// del proyecto: el dato de los servicios chicos de la Austral está incompleto o
// equivocado en las plataformas globales. Un alojamiento de Puerto Cisnes con
// cuatro opiniones REALES de gente que pasó por la ruta vale más que el mismo
// alojamiento sin ninguna en una plataforma mundial.
//
// Dos decisiones heredadas del módulo de reportes, por las mismas razones:
//  - Sin login. `dispositivo` es el sha256 del id aleatorio que la PWA guarda en
//    localStorage: NUNCA se almacena en claro y no identifica a la persona.
//    Sirve para una cosa: un dispositivo = una calificación por ficha.
//  - Nada que barrer en segundo plano. El promedio y el total se guardan
//    DESNORMALIZADOS en `places`, así que /api/places sigue siendo un select
//    plano y la PWA se lleva la nota para verla sin señal. Recalcularlos con un
//    AVG() por cada una de las 231 fichas en cada sincronización sería pagar en
//    cada lectura lo que se puede pagar una vez al escribir — y este backend
//    duerme en Render free.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('place_id')->constrained('places')->cascadeOnDelete();
            $table->unsignedTinyInteger('estrellas');     // 1 a 5
            $table->string('comentario', 280)->nullable();
            $table->string('dispositivo', 64);            // hash, NO el id en claro
            // Moderación desde el CMS. Como en los reportes, lo que se retira no
            // se borra: una opinión oculta sigue existiendo para revisarla.
            $table->boolean('oculto')->default(false);
            $table->timestamps();

            // Un dispositivo, una calificación por ficha (la unicidad la impone la
            // BD, no el cliente). Volver a calificar EDITA la anterior: la persona
            // que vuelve al mismo hospedaje el año siguiente corrige su nota, no
            // suma una segunda.
            $table->unique(['place_id', 'dispositivo']);
            // Consulta caliente: las opiniones visibles de una ficha, lo más nuevo
            // primero.
            $table->index(['place_id', 'oculto']);
        });

        Schema::table('places', function (Blueprint $table) {
            // Promedio 0.00–5.00 y cuántas lo sostienen. Van juntos a propósito:
            // un 5,0 con una sola opinión no es lo mismo que un 4,3 con treinta, y
            // la ficha tiene que poder decirlo.
            $table->decimal('calificacion_promedio', 3, 2)->nullable();
            $table->unsignedInteger('calificaciones_total')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn(['calificacion_promedio', 'calificaciones_total']);
        });
        Schema::dropIfExists('calificaciones');
    }
};
