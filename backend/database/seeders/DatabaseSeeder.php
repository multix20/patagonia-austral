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
        // Usuario de prueba SOLO fuera de producción: el seeder corre en cada
        // arranque del contenedor, y en producción esta credencial conocida
        // sería una puerta de entrada al CMS. El admin real se crea con
        // `php artisan make:filament-user` (ver DEPLOY.md).
        if (! app()->isProduction()) {
            User::firstOrCreate(
                ['email' => 'test@example.com'],
                ['name' => 'Test User', 'password' => bcrypt('password')]
            );
        }

        $this->call(PlaceSeeder::class);
    }
}
