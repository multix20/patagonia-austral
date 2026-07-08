#!/usr/bin/env sh
# Arranque del contenedor en producción (Render).
set -e

# APP_URL con la URL pública HTTPS que Render inyecta automáticamente.
export APP_URL="${RENDER_EXTERNAL_URL:-${APP_URL:-http://localhost:8000}}"

echo "==> APP_URL=$APP_URL"

# Migraciones + datos semilla (seeders idempotentes: no duplican al reiniciar).
php artisan migrate --force --seed

# Publica los assets de Filament (CSS/JS del panel /admin).
php artisan filament:assets

# Config limpia (sin route:cache: hay rutas closure en web.php).
php artisan config:clear

# Servidor HTTP en el puerto que asigna Render.
exec php artisan serve --host 0.0.0.0 --port "${PORT:-8000}"
