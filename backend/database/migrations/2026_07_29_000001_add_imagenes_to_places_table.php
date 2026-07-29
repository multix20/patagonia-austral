<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fotos de las fichas. Hasta ahora la ficha se veía con degradado del color de
// la categoría + icono grande: identidad decente, pero para un servicio de
// dormir o comer la foto es justo lo que el turista espera ver (como en Google
// Maps) antes de decidir.
//
// jsonb con LISTA ORDENADA y no una columna `imagen` suelta: agregar la segunda
// foto después costaría otra migración y —lo caro— una segunda pasada sobre las
// fichas ya publicadas. La app hoy usa solo la primera (cabecera y miniatura);
// el resto queda guardado y en orden, listo para el carrusel.
//
// Se guardan RUTAS relativas dentro del bucket ('fichas/xxx.webp'), no URLs
// completas: si mañana cambia el dominio público de R2 (o se pasa a dominio
// propio), se cambia una variable de entorno y no 200 filas.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->jsonb('imagenes')->nullable()->after('tel');
        });
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn('imagenes');
        });
    }
};
