<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Trazados y áreas del mapa: lo que NO cabe en un punto.
//
// `places` guarda un lugar con una coordenada, y eso alcanza para un hospedaje o
// una bomba de bencina. No alcanza para Caleta Tortel: el pueblo **no tiene
// calles**, se recorre entero por pasarelas de madera, y esa red es una
// geometría de líneas. Lo mismo un sendero (un trazado, no su punto de inicio) o
// un glaciar (un área).
//
// La geometría va como **GeoJSON en jsonb** y no con PostGIS a propósito: acá no
// se hacen consultas espaciales —no se pregunta "qué senderos cruzan este
// polígono"—, solo se dibuja en Leaflet, que consume GeoJSON tal cual. Meter
// PostGIS obligaría a una extensión en Neon y a un driver especial en el modelo
// para leer lo mismo que ya se puede guardar en una columna JSON.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rutas', function (Blueprint $table) {
            $table->id();
            // pasarela | sendero | ruta | area — decide el estilo del dibujo.
            $table->string('tipo')->index();
            $table->jsonb('nombre');                       // { es, en }
            $table->jsonb('descripcion')->nullable();      // { es, en }
            $table->decimal('largo_km', 8, 2)->nullable(); // null en las áreas
            // Geometría GeoJSON: { "type": "MultiLineString", "coordinates": [...] }
            $table->jsonb('geometria');
            $table->foreignId('localidad_id')->nullable()
                ->constrained('localidades')->nullOnDelete();
            // Arranca en FALSE, al revés que `places`: esto entra por importación
            // masiva desde un mapa municipal y se revisa antes de mostrarse.
            $table->boolean('publicado')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rutas');
    }
};
