<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Marca cuándo se envió el Web Push de un aviso, para no reenviarlo al editarlo.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->timestamp('notificado_en')->nullable()->after('publicado_en');
        });
    }

    public function down(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->dropColumn('notificado_en');
        });
    }
};
