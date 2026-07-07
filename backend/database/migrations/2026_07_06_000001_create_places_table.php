<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Directorio turístico geolocalizado — contenidos bilingües en JSONB (PostgreSQL)
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('cat')->index(); // atractivo|alojamiento|comida|servicio|evento|emergencia
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('tel')->nullable();
            $table->jsonb('nombre');       // { es, en }
            $table->jsonb('descripcion');  // { es, en }
            $table->jsonb('como');         // { es, en } — cómo llegar
            $table->jsonb('dist');         // { es, en } — distancia legible
            $table->boolean('publicado')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
