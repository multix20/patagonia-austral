<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fix: la tabla localidades fue creada por una versión anterior de la migración
// 2026_07_13_000001 que no incluía la columna `zoom`. Esta migración la agrega
// de forma segura (con guard por si la tabla ya la tiene).
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('localidades', 'zoom')) {
            Schema::table('localidades', function (Blueprint $table) {
                $table->unsignedSmallInteger('zoom')->default(13)->after('lng'); // zoom inicial del mapa
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('localidades', 'zoom')) {
            Schema::table('localidades', function (Blueprint $table) {
                $table->dropColumn('zoom');
            });
        }
    }
};
