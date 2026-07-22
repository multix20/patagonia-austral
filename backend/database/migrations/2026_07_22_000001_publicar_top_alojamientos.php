<?php

use App\Console\Commands\PublicarTopAlojamientos;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Habilita de una vez el TOP 10 de alojamientos por localidad ya cargados en la
// BD (importación SERNATUR): corre en el deploy (migrate --force) y pone
// publicado=true en los 10 con ficha más completa de cada pueblo, sin tocar el
// CMS uno por uno. Aditivo: NO despublica nada (respeta lo ya publicado a mano).
// Reutilizable después con `php artisan alojamientos:publicar-top` (p. ej. al
// cargar más localidades).
return new class extends Migration
{
    public function up(): void
    {
        $ids = PublicarTopAlojamientos::idsTop(10);
        if (! empty($ids)) {
            DB::table('places')->whereIn('id', $ids)->update(['publicado' => true]);
        }
    }

    public function down(): void
    {
        // No se revierte: no guardamos el estado previo por registro. Para
        // despublicar, hacerlo desde el CMS.
    }
};
