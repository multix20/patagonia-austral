# Despliegue — Patagonia Austral (PWA de turismo)

Proyecto **personal/comercial propio**. Arquitectura del despliegue (todo gratis):

| Pieza | Proveedor | Cómo |
|---|---|---|
| **Frontend (PWA React)** | **Netlify** | `netlify.toml` (base `frontend/`) |
| **Backend (Laravel + Filament)** | **Render** (web service Docker, free) | blueprint `render.yaml` |
| **PostgreSQL** | **Neon** (neon.tech, free) | connection string como secreto en Render |

> **Por qué la base va en Neon y no en Render:** el plan free de Render permite
> **una sola Postgres por cuenta** y ya la ocupa el proyecto Cochrane; además
> las Postgres free de Render **expiran a los 30 días**. Neon es gratis, no
> expira y mantiene a Cochrane intacto.
>
> **Independencia del proyecto Cochrane**: este repo es un fork/evolución de
> `multix20/cochrane-turismo`, pero es un proyecto separado. El servicio de
> Render (`patagonia-austral-api`), el `APP_KEY` y las claves VAPID son
> **propios**; ambos proyectos conviven en la misma cuenta sin pisarse.

---

## 0) Base de datos en Neon (primero, porque Render la necesita)

1. Entra a <https://neon.tech> → crea cuenta (puede ser con GitHub) → **New Project**.
   - Nombre del proyecto/base: `patagonia_austral` (región: la más cercana a
     Oregon, p. ej. AWS us-west-2, para latencia baja con Render).
2. Copia la **connection string** (botón *Connect*): tiene la forma
   `postgresql://usuario:clave@ep-xxxx.us-west-2.aws.neon.tech/patagonia_austral?sslmode=require`
3. Guárdala: es el secreto `DB_URL` que pedirá Render en el paso siguiente.

## 1) Backend en Render

1. Entra a <https://dashboard.render.com> → **New → Blueprint** (o usa el
   blueprint `patagonia-austral` ya conectado → **Manual sync**).
2. Repo `multix20/patagonia-austral`, rama `main`. Render detecta `render.yaml`
   y propone crear **solo** el web service `patagonia-austral-api` (la base ya
   no va en el blueprint).
3. **Secretos** (`sync: false` — se pegan en el dashboard, nunca en el repo):
   - `APP_KEY` → generar con `php artisan key:generate --show`
   - `DB_URL` → la connection string de Neon (paso 0)
   - `VAPID_PRIVATE_KEY` → la privada del par cuya pública está en `render.yaml`
4. **Apply** y espera el primer build (≈ 5–10 min). URL resultante tipo:
   `https://patagonia-austral-api.onrender.com`
5. El arranque corre migraciones y siembra lugares + avisos en Neon. Verifica:
   - `https://patagonia-austral-api.onrender.com/api/places` → JSON con lugares.
   - `https://patagonia-austral-api.onrender.com/admin` → login de Filament.
6. **Crear tu usuario admin** (sin Shell — el plan free no la incluye):
   en **Environment** del web service agrega:
   ```
   ADMIN_EMAIL    = tu-correo@ejemplo.com
   ADMIN_PASSWORD = (contraseña fuerte)
   ADMIN_NAME     = Tu Nombre        (opcional)
   ```
   Guarda (se redespliega solo): el seeder crea ese usuario al arrancar.
   **Después borra `ADMIN_PASSWORD` del dashboard** — el usuario ya creado no
   se modifica en arranques futuros y la contraseña deja de estar a la vista.
   > En producción NO existe usuario semilla: el seeder elimina
   > `test@example.com` en cada arranque (solo se siembra en desarrollo local).
   > Para cambiar la contraseña más adelante: borra el usuario desde el SQL
   > Editor de Neon (`DELETE FROM users WHERE email='...';`) y repite este paso.

## 2) Frontend (PWA) en Netlify

1. Entra a <https://app.netlify.com> → **Add new site → Import an existing
   project** → conecta `multix20/patagonia-austral`, rama `main`.
   Netlify lee `netlify.toml` (base `frontend/`, build `npm run build`,
   publish `dist`) — no hay que configurar nada a mano.
2. **Site configuration → Environment variables**:
   ```
   VITE_API_URL          = https://patagonia-austral-api.onrender.com
   VITE_VAPID_PUBLIC_KEY = (la VAPID_PUBLIC_KEY de render.yaml)
   ```
   > `VITE_*` se resuelve en tiempo de build: si cambias una variable hay que
   > **Trigger deploy** para que la tome.
3. Si quieres URL fija: **Site configuration → Change site name** →
   `patagonia-austral` → queda `https://patagonia-austral.netlify.app`.
4. **CORS**: la variable `FRONTEND_URL` del web service en Render debe ser
   exactamente la URL pública de Netlify (el blueprint trae
   `https://patagonia-austral.netlify.app`; ajústala en el dashboard si el
   nombre del sitio termina siendo otro).

## 3) Prueba de fuego en producción

1. Abre la PWA (URL de Netlify) → cargan los lugares desde la API.
2. Entra a `…-api.onrender.com/admin`, edita un lugar, guarda.
3. Recarga la PWA → aparece el cambio. ✅
4. Publica un Aviso en el CMS → llega la notificación push a los dispositivos
   suscritos y el aviso aparece en la campanita del header.

---

## Advertencias de los planes gratuitos

- **Render (backend)**: se duerme tras 15 min sin tráfico; el primer request lo
  despierta en ~1 minuto. **No corre el scheduler**: los avisos programados a
  futuro no se despachan solos (los inmediatos sí, van por el observer).
- **Neon (base)**: 0.5 GB de almacenamiento y *autosuspend* del compute tras
  inactividad (~5 min); despierta solo en el primer query (sub-segundo a pocos
  segundos). Sin expiración a 30 días.
- **Netlify (frontend)**: 100 GB de banda/mes en free — de sobra. No se duerme
  (CDN estático).
- **Filesystem efímero en Render**: lo subido al disco se pierde al reiniciar.
  Cuando se agreguen imágenes al CMS, usar almacenamiento en la nube (S3 o
  equivalente).

---

## Producción definitiva (roadmap Fase 4)

Para el despliegue definitivo con dominio propio ya existe la base autoalojada:
`docker-compose.prod.yml` (db + app + scheduler + frontend + **Caddy** con SSL
automático), `.env.prod.example` y `docker/README-DESPLIEGUE.md`. Pendientes de
esa fase: respaldos + restauración, logs y monitoreo, almacenamiento de imágenes
en la nube, y dominio propio.
