# Imagen de producción — PWA Turismo Cochrane (backend Laravel + Filament)
# Licitación ID 3797-37-LE26. Contenedor exigido por las bases (punto 4).
FROM php:8.4-cli-bookworm

# Dependencias del sistema y extensiones PHP requeridas por Laravel + Filament + PostgreSQL
# (gmp lo necesita la librería de Web Push / VAPID)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libicu-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libgmp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql bcmath intl zip gd exif pcntl gmp \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Dependencias PHP de producción (sin dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x docker/start.sh

# Render inyecta $PORT en tiempo de ejecución
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "docker/start.sh"]
