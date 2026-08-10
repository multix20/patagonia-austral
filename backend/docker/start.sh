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

# Scheduler DENTRO del mismo contenedor (avisos programados a futuro).
#
# Por qué acá y no como servicio aparte: Render cobra cada background worker por
# separado, y lo único que hay que correr es `avisos:despachar` cada minuto
# (routes/console.php). En un contenedor que no duerme, un `schedule:work` en
# segundo plano hace exactamente el mismo trabajo y sale gratis.
#
# Por qué detrás de una variable y apagado por omisión — dos razones:
#   1. En el plan FREE no sirve: el contenedor duerme a los ~15 min y el
#      scheduler duerme con él. Peor, al despertar despacharía de golpe todo lo
#      que venció mientras dormía, y esto MANDA PUSH A TELÉFONOS REALES.
#   2. Un interruptor en el dashboard es reversible en 30 segundos, sin
#      redesplegar ni tocar el repo — que es lo que uno quiere cuando algo que
#      notifica a la gente se porta mal.
# Se enciende con SCHEDULER_EN_CONTENEDOR=true, y SOLO con el plan always-on.
# Ver DEPLOY.md §2.9.
#
# El `&` deja el proceso en segundo plano; sobrevive al `exec` de abajo (el exec
# reemplaza a la shell, pero el hijo ya lanzado sigue vivo). Si el scheduler se
# cayera, el servidor HTTP no se entera: la API sigue en pie y lo que se pierde
# son los avisos programados, no el sitio.
if [ "${SCHEDULER_EN_CONTENEDOR}" = "true" ]; then
  echo "==> Scheduler activado (avisos programados)"
  php artisan schedule:work &
fi

# Servidor HTTP en el puerto que asigna Render.
exec php artisan serve --host 0.0.0.0 --port "${PORT:-8000}"
