<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // El seeder corre en cada arranque del contenedor (migrate --seed).
        if (app()->isProduction()) {
            // Sin credencial de prueba en producción: si alguna vez quedó
            // sembrada, se elimina aquí (no hay Shell en el plan free de Render).
            User::where('email', 'test@example.com')->delete();

            // Admin real desde variables de entorno del dashboard:
            // definir ADMIN_EMAIL y ADMIN_PASSWORD (y opcional ADMIN_NAME),
            // dejar que arranque una vez, y luego BORRAR ADMIN_PASSWORD del
            // dashboard (el usuario ya creado no se toca en arranques futuros).
            if (env('ADMIN_EMAIL') && env('ADMIN_PASSWORD')) {
                User::firstOrCreate(
                    ['email' => env('ADMIN_EMAIL')],
                    ['name' => env('ADMIN_NAME', 'Admin'), 'password' => bcrypt(env('ADMIN_PASSWORD'))]
                );
            }
        } else {
            // Usuario de prueba solo para desarrollo local.
            User::firstOrCreate(
                ['email' => 'test@example.com'],
                ['name' => 'Test User', 'password' => bcrypt('password')]
            );
        }

        $this->call(PlaceSeeder::class);
    }
}
