# Backend Laravel — PWA Turismo Cochrane

Esta carpeta contiene los archivos propios del proyecto (migraciones, modelos,
API, seeders). Se instalan **sobre** un proyecto Laravel base.

## Requisitos en tu máquina

- PHP 8.3+ ([Herd](https://herd.laravel.com/windows) es lo más simple en Windows: instala PHP + Composer + Laravel de una vez)
- Composer
- PostgreSQL 16 (o Docker: ver `docker-compose.dev.yml` en la carpeta `app/`)

## Instalación (PowerShell)

```powershell
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app

# 1. Crear proyecto Laravel base en carpeta temporal
composer create-project laravel/laravel laravel-base

# 2. Copiar la base SIN sobrescribir nuestros archivos
robocopy laravel-base backend /E /XC /XN /XO
Remove-Item -Recurse -Force laravel-base

cd backend

# 3. Habilitar rutas API (si pregunta por sobrescribir routes/api.php: NO)
php artisan install:api

# 4. Instalar Filament (el CMS municipal)
composer require filament/filament:"^3.2"
php artisan filament:install --panels

# 5. Configurar entorno
copy .env.example .env
php artisan key:generate
# Editar .env: credenciales de PostgreSQL (ver sección siguiente)

# 6. Migrar y sembrar datos
php artisan migrate --seed

# 7. Crear usuario administrador del CMS
php artisan make:filament-user

# 8. Levantar
php artisan serve
```

- API: http://localhost:8000/api/places y /api/notices
- CMS: http://localhost:8000/admin

## Configuración .env

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=cochrane_turismo
DB_USERNAME=cochrane
DB_PASSWORD=cochrane_dev

FRONTEND_URL=https://cochrane-turismo.netlify.app
```

Para levantar PostgreSQL con Docker sin instalarlo:

```powershell
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app
docker compose -f docker-compose.dev.yml up -d
```

## Registrar el seeder

En `database/seeders/DatabaseSeeder.php` agrega dentro de `run()`:

```php
$this->call(PlaceSeeder::class);
```

## Conectar la PWA

En Netlify (Site configuration → Environment variables) o en
`frontend/.env` local:

```
VITE_API_URL=http://localhost:8000
```

La PWA sincroniza `/api/places` a IndexedDB automáticamente cuando hay conexión.

## Próximos pasos

1. Recursos Filament para Places y Notices (CRUD del CMS)
2. Web Push (VAPID) al publicar un aviso
3. docker-compose de producción con Nginx + SSL
