<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 1 — Multi-localidad: pueblos de la Carretera Austral (norte → sur).
// Cada lugar del directorio pertenece a una localidad; la PWA filtra y centra
// el mapa según la localidad elegida.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('localidades', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();   // identificador estable para la PWA (ej: caleta-tortel)
            $table->jsonb('nombre');            // { es, en }
            $table->decimal('lat', 10, 7);      // centro del pueblo (para centrar el mapa)
            $table->decimal('lng', 10, 7);
            $table->unsignedSmallInteger('zoom')->default(13); // zoom inicial del mapa
            $table->unsignedSmallInteger('orden')->index();    // posición en la ruta: menor = más al norte
            $table->boolean('publicado')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('localidades');
    }
};
