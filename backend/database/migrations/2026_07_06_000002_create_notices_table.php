<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Avisos municipales (eventos, clima, seguridad) — base para Web Push
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->jsonb('mensaje');                    // { es, en }
            $table->string('tipo')->default('info');     // info|clima|seguridad|evento
            $table->timestamp('publicado_en')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
