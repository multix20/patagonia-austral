# Manual de despliegue con Docker — Patagonia Austral

Proyecto **personal/comercial propio** (PWA de turismo de la Carretera Austral).
La solución se despliega con **Docker Compose**, replicable y auditable. El mismo
`docker-compose.prod.yml` corre en un PC local o en una instancia en la nube
(p. ej. **AWS EC2**).

---

## 1. Arquitectura

```
                 Internet (HTTPS)
                        │
              ┌─────────▼──────────┐   web  (Caddy)
              │  Reverse proxy     │   · SSL/TLS automático (Let's Encrypt)
              │  + SSL + estáticos │   · sirve la PWA (React) en /
              └───┬───────────┬────┘   · enruta /api, /admin, /up al backend
                  │ red       │ interna (privada)
        ┌─────────▼──┐   ┌────▼─────────┐   ┌───────────────┐
        │ app        │   │ db           │   │ scheduler     │
        │ Laravel    │◄─►│ PostgreSQL16 │   │ Web Push cada │
        │ php-fpm    │   │ (volumen)    │   │ minuto        │
        └────────────┘   └──────────────┘   └───────────────┘
```

Servicios (`docker-compose.prod.yml`):

| Servicio    | Imagen / build            | Rol |
|-------------|---------------------------|-----|
| `db`        | `postgres:16-alpine`      | Base de datos, con volumen persistente `pgdata`. |
| `app`       | `backend/Dockerfile.fpm`  | Laravel + Filament en php-fpm. Migra, siembra y publica assets al arrancar. |
| `scheduler` | (misma imagen que `app`)  | Ejecuta `avisos:despachar` cada minuto (notificaciones Web Push programadas). |
| `frontend`  | `frontend/Dockerfile`     | Compila la PWA y publica `dist/` en el volumen `frontend_dist`. Corre una vez. |
| `web`       | `caddy:2-alpine`          | Reverse proxy + SSL. Sirve la PWA y enruta al backend. |

**Volúmenes persistentes:** `pgdata` (datos), `app_public`, `app_storage`,
`frontend_dist`, `caddy_data` (certificados SSL), `caddy_config`.

### Checklist de la arquitectura

- [x] Contenedor **backend Laravel** (`app`, php-fpm)
- [x] Despliegue del **frontend React** (`frontend` → `web`)
- [x] **PostgreSQL** (contenedor `db` con volumen; migrable a AWS RDS)
- [x] **Servidor web / reverse proxy** (`web`, Caddy)
- [x] **SSL/TLS** automático (Let's Encrypt vía Caddy)
- [x] **Variables de entorno por ambiente** (`.env`, separado del código)
- [x] **Red interna** privada entre servicios (`interna`)
- [x] **Volúmenes persistentes**
- [x] **Ambiente de pruebas** (local) y **producción** (mismo compose, distinto `.env`)
- [x] **Manual de despliegue** (este documento) + actualización + rollback

---

## 2. Requisitos previos

- **Docker Desktop** (Windows/Mac) o **Docker Engine + Compose plugin** (Linux/EC2).
  Verifica:

  ```bash
  docker --version
  docker compose version
  ```

- Para SSL real en producción: un **dominio** propio
  apuntando (registro DNS `A`) a la IP pública del servidor, y los **puertos 80 y
  443 abiertos**.

> **Choque de puertos en local:** este stack usa el Postgres del contenedor. No
> publica el 5432 al host, así que no choca con el PostgreSQL nativo de Windows.

---

## 3. Primer despliegue

Desde la carpeta `app/`:

```bash
# 1) Configura las variables
cp .env.prod.example .env          # PowerShell: Copy-Item .env.prod.example .env
#   Edita .env: SITE_ADDRESS, APP_URL, DB_PASSWORD, ACME_EMAIL, APP_KEY...

# 2) (opcional) genera una APP_KEY nueva para producción
docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show
#   pega el valor en APP_KEY dentro de .env

# 3) Construye y levanta todo
docker compose -f docker-compose.prod.yml up -d --build

# 4) Observa el arranque (migraciones, seeders, assets)
docker compose -f docker-compose.prod.yml logs -f app
```

### Probar en local

Con `SITE_ADDRESS=localhost` (Caddy genera un certificado local):

- PWA:   `https://localhost`
- API:   `https://localhost/api/places`
- Panel: `https://localhost/admin`
- Salud: `https://localhost/up`

> El navegador puede advertir por el certificado local de Caddy; es normal en
> pruebas. En producción con dominio real el certificado es válido y automático.

### Desplegar en AWS EC2 (resumen)

1. Lanza una instancia (Ubuntu 22.04, tipo `t3.small` o superior) con los puertos
   **22, 80 y 443** abiertos en el Security Group.
2. Instala Docker: `curl -fsSL https://get.docker.com | sh`.
3. Clona el repo, entra a `app/`, crea el `.env` con el **dominio real** en
   `SITE_ADDRESS`/`APP_URL`/`FRONTEND_URL` y una `DB_PASSWORD` fuerte.
4. Apunta el DNS del dominio a la IP pública de la instancia.
5. `docker compose -f docker-compose.prod.yml up -d --build`. Caddy obtiene el
   certificado SSL solo. (Migración futura a RDS/ECS: ver sección 7.)

---

## 4. Operación diaria

```bash
# Estado de los servicios
docker compose -f docker-compose.prod.yml ps

# Logs (todos o uno)
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f app

# Detener / reanudar sin borrar datos
docker compose -f docker-compose.prod.yml stop
docker compose -f docker-compose.prod.yml start

# Ejecutar un comando artisan puntual
docker compose -f docker-compose.prod.yml exec app php artisan about
```

---

## 5. Respaldo y restauración de la base de datos

**Respaldo** (genera un archivo `.sql` con fecha):

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > backup_$(date +%F).sql
```

**Restauración** (sobre una base vacía/recreada):

```bash
cat backup_2026-07-08.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE"
```

> Recomendado: agendar el respaldo diario (cron/Task Scheduler) y copiarlo fuera
> del servidor (p. ej. Amazon S3). Las imágenes de contenido irán a S3 en la etapa
> de almacenamiento en la nube.

---

## 6. Actualización de versión

El código de la app (excepto `public/` y `storage/`) va **horneado en la imagen**,
así que actualizar es reconstruir:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Al arrancar, `app` vuelve a sincronizar `public/`, corre migraciones nuevas
(idempotentes) y republica los assets de Filament. Sin downtime perceptible para
un stack de este tamaño.

---

## 7. Rollback

**Opción A — volver a una versión anterior del código:**

```bash
git checkout <commit-o-tag-anterior>
docker compose -f docker-compose.prod.yml up -d --build
```

**Opción B — restaurar la base a un respaldo previo** (si una migración salió mal):

```bash
docker compose -f docker-compose.prod.yml stop app scheduler
cat backup_ANTERIOR.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE"
docker compose -f docker-compose.prod.yml start app scheduler
```

> Buena práctica: **respaldar SIEMPRE antes de actualizar** (sección 5). Así el
> rollback es inmediato.

---

## 8. Problemas frecuentes

| Síntoma | Causa probable / solución |
|---------|---------------------------|
| Caddy no obtiene certificado | DNS no apunta al servidor, o puertos 80/443 cerrados. Revisa `logs web`. |
| `502`/`Bad Gateway` en `/api` | `app` aún migrando. Espera al healthcheck: `logs -f app`. |
| El panel `/admin` sin estilos | No se publicaron los assets. `exec app php artisan filament:assets`. |
| La PWA no trae datos en vivo | `APP_URL` en `.env` no coincide con el dominio público; recompila `frontend`. |
| Cambié `.env` y no toma efecto | `up -d` recrea los contenedores; para `web`/`app`: `up -d --force-recreate`. |

---

## 9. Archivos de esta etapa

- `docker-compose.prod.yml` — orquestación de producción.
- `backend/Dockerfile.fpm` + `backend/docker/entrypoint.fpm.sh` — backend php-fpm.
- `frontend/Dockerfile` — build de la PWA al volumen compartido.
- `docker/Caddyfile` — reverse proxy + SSL + cabeceras de seguridad.
- `.env.prod.example` — plantilla de variables (copiar a `.env`).
- `docker/README-DESPLIEGUE.md` — este manual.
