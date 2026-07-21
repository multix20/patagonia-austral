<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 3 — Capa comercial: un lugar puede marcarse como "destacado" (ficha
// comercial resaltada en la app). Aditivo y compatible hacia atrás: la PWA
// desplegada ignora el campo nuevo, y los lugares existentes quedan en false.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->boolean('destacado')->default(false)->index()->after('publicado');
        });
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn('destacado');
        });
    }
};
