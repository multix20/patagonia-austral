<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Fase 1 — Multi-localidad: cada lugar pertenece a una localidad.
// Migración de datos incluida: los lugares existentes (el directorio inicial)
// son todos de Cochrane, así que se crea esa localidad si no existe y se les
// asigna. Los seeders (LocalidadSeeder) completan/actualizan el resto después.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('places', function (Blueprint $table) {
            // nullable para no romper filas existentes ni el API actual;
            // el formulario del CMS la exige para contenido nuevo.
            $table->foreignId('localidad_id')
                ->nullable()
                ->constrained('localidades')
                ->nullOnDelete();
        });

        // --- Migración de datos: lugares preexistentes → Cochrane ---
        $cochraneId = DB::table('localidades')->where('slug', 'cochrane')->value('id');

        if ($cochraneId === null) {
            $cochraneId = DB::table('localidades')->insertGetId([
                'slug' => 'cochrane',
                'nombre' => json_encode(['es' => 'Cochrane', 'en' => 'Cochrane']),
                'lat' => -47.2539,
                'lng' => -72.5732,
                'zoom' => 13,
                'orden' => 60,
                'publicado' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('places')->whereNull('localidad_id')->update(['localidad_id' => $cochraneId]);
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropConstrainedForeignId('localidad_id');
        });
    }
};
