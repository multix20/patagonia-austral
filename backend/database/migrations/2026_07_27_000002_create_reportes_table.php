<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 3 — Crowdsourcing tipo Waze: los viajeros reportan lo que ven en la ruta
// (bencina, cortes de camino, hielo, barcazas, clima…). Hasta ahora el panel
// "¿Qué ves en la ruta?" de la PWA era solo vista previa; esto le da persistencia.
//
// Decisión clave para que ANDE EN RENDER FREE (sin worker de colas ni scheduler):
// cada reporte nace con `expira_en` calculado según su tipo, y la API filtra por
// ese campo al LEER. Nada que barrer en segundo plano — la caducidad "ocurre" sola
// aunque el contenedor esté dormido. Los votos (¿sigue ahí?) extienden la vigencia.
//
// Privacidad: no se guarda usuario ni el id del dispositivo en claro. `dispositivo`
// es un hash (sha256 del id aleatorio que la PWA guarda en localStorage) y sirve
// solo para no contar dos veces el mismo voto y para acotar el abuso.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reportes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 24)->index();          // combustible, camino, hielo, ferry…
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            // Localidad más cercana al punto (se resuelve al crear): permite filtrar
            // los reportes del pueblo que el turista tiene abierto. Nullable porque
            // un reporte puede caer lejos de todo pueblo conocido.
            $table->foreignId('localidad_id')->nullable()->constrained('localidades')->nullOnDelete();
            $table->string('comentario', 280)->nullable(); // texto libre opcional
            $table->string('dispositivo', 64)->index();    // hash, NO el id en claro
            $table->unsignedInteger('confirmaciones')->default(0);
            $table->unsignedInteger('descartes')->default(0);
            // Moderación desde el CMS y auto-ocultado por descartes de la comunidad.
            $table->boolean('oculto')->default(false);
            $table->timestamp('expira_en')->index();
            $table->timestamps();

            // Consulta caliente de la API: vigentes y visibles, lo más nuevo primero.
            $table->index(['oculto', 'expira_en']);
        });

        // Un voto por dispositivo y reporte (la unicidad la impone la BD, no el
        // cliente): así "¿sigue ahí?" no se puede inflar recargando la app.
        Schema::create('reporte_votos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->constrained('reportes')->cascadeOnDelete();
            $table->string('dispositivo', 64);
            $table->boolean('confirma');  // true = sigue ahí, false = ya no está
            $table->timestamps();

            $table->unique(['reporte_id', 'dispositivo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reporte_votos');
        Schema::dropIfExists('reportes');
    }
};
