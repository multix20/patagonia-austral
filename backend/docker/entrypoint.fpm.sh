#!/usr/bin/env sh
# Arranque del contenedor backend en PRODUCCIÓN (php-fpm detrás de Caddy).
# PWA Turismo Cochrane · Licitación ID 3797-37-LE26.
set -e

echo "==> Entrypoint backend (php-fpm) — $(date)"

# public/ y storage/ son volúmenes persistentes/compartidos. En cada arranque
# refrescamos public/ con la versión de la imagen (para que Caddy sirva assets
# actualizados tras un redeploy) y sembramos storage/ si el volumen está vacío.
if [ -d /opt/public-src ]; then
  echo "==> Sincronizando public/ desde la imagen"
  rsync -a --delete --exclude 'storage' /opt/public-src/ /var/www/html/public/
fi
if [ -z "$(ls -A /var/www/html/storage 2>/dev/null)" ] && [ -d /opt/storage-src ]; then
  echo "==> Inicializando storage/ (primer arranque)"
  rsync -a /opt/storage-src/ /var/www/html/storage/
fi
# Espera activa a PostgreSQL antes de migrar.
echo "==> Esperando a PostgreSQL en ${DB_HOST:-db}:${DB_PORT:-5432}"
until php -r "exit(@fsockopen(getenv('DB_HOST')?:'db', (int)(getenv('DB_PORT')?:5432)) ? 0 : 1);" 2>/dev/null; do
  sleep 2
done

# Migraciones + datos semilla (seeders idempotentes: no duplican al reiniciar).
php artisan migrate --force --seed

# Assets del panel Filament (CSS/JS de /admin) + symlink de storage público.
php artisan filament:assets
php artisan storage:link || true

# Config limpia (hay rutas closure; no usamos route:cache).
php artisan config:clear
php artisan optimize:clear

# Permisos FINALES: tras los comandos artisan (que corren como root), php-fpm
# atiende como www-data y debe poder escribir en storage/ y bootstrap/cache.
# Debe ir aquí, al final, o el panel /admin da 500 al compilar vistas.
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

echo "==> Backend listo. Ejecutando: $*"
exec "$@"
