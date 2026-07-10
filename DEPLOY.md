# Despliegue — Patagonia Austral (PWA de turismo)

Proyecto **personal/comercial propio**. Esta guía deja el sitio público en Render:

- **Backend (Laravel + Filament) + PostgreSQL** → Render (contenedor Docker +
  Postgres gestionado) vía blueprint `render.yaml`.
- **Frontend (PWA)** → Render **Static Site** (mismo proveedor, un solo dashboard).
  `netlify.toml` queda en el repo como alternativa si algún día conviene Netlify.

> **Independencia del proyecto Cochrane**: este repo es un fork/evolución de
> `multix20/cochrane-turismo`, pero es un proyecto separado. Los nombres de
> servicio en `render.yaml` (`patagonia-austral-api`, `patagonia-austral-db`),
> el `APP_KEY` y las claves VAPID son **propios**; ambos proyectos pueden
> convivir desplegados en la misma cuenta de Render sin pisarse.

---

## 1) Backend + base de datos en Render

1. Entra a <https://dashboard.render.com> → **New → Blueprint**.
2. Conecta el repo `multix20/patagonia-austral` (rama `main`). Render detecta
   `render.yaml` y propone crear: **1 Web Service** (`patagonia-austral-api`) +
   **1 PostgreSQL** (`patagonia-austral-db`).
3. **Secretos**: al aplicar, Render pide los valores marcados `sync: false` en
   el blueprint — `APP_KEY` y `VAPID_PRIVATE_KEY`. Se pegan ahí y quedan solo
   en el dashboard, nunca en el repo. (APP_KEY se genera con
   `php artisan key:generate --show`; el par VAPID debe ser el mismo cuya
   pública está en `render.yaml`.) Confirma y **Apply**.
4. Espera el primer build (≈ 5–10 min). Al terminar tendrás una URL tipo:
   `https://patagonia-austral-api.onrender.com`
5. El arranque corre migraciones y siembra los lugares + avisos automáticamente.
   Verifica:
   - `https://patagonia-austral-api.onrender.com/api/places` → JSON con lugares.
   - `https://patagonia-austral-api.onrender.com/admin` → login de Filament.
6. **Crear tu usuario admin**: en el dashboard de Render, entra al web service →
   pestaña **Shell** y ejecuta:
   ```
   php artisan make:filament-user
   ```
   (o usa el que siembra el seeder: `test@example.com` / `password`).

## 2) Frontend (PWA) como Static Site en Render

1. **New → Static Site** → conecta el mismo repo `multix20/patagonia-austral`,
   rama `main`.
2. Configuración:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Environment variables** del static site:
   ```
   VITE_API_URL         = https://patagonia-austral-api.onrender.com
   VITE_VAPID_PUBLIC_KEY = (la VAPID_PUBLIC_KEY de render.yaml)
   ```
   > `VITE_*` se resuelve en tiempo de build: si cambias una variable hay que
   > **redeploy** para que la tome.
4. **Redirects/Rewrites** (SPA): regla `/*` → `/index.html`, acción **Rewrite**.
5. Si la URL pública del frontend difiere de la puesta en `FRONTEND_URL` del
   `render.yaml`, actualiza esa variable en el web service (CORS).

## 3) Prueba de fuego en producción

1. Abre la PWA (URL del static site) → cargan los lugares desde la API.
2. Entra a `…-api.onrender.com/admin`, edita un lugar, guarda.
3. Recarga la PWA → aparece el cambio. ✅
4. Publica un Aviso en el CMS → llega la notificación push a los dispositivos
   suscritos y el aviso aparece en la campanita del header.

---

## Advertencias del plan gratuito (Render)

- **El backend se duerme** tras 15 min sin tráfico; el primer request lo despierta
  en ~1 minuto. El static site del frontend NO duerme (se sirve desde CDN).
- **La Postgres free expira 30 días** después de crearla (con 14 días de gracia
  para migrarla). Para producción real hay que subir de plan.
- **No corre el scheduler** en plan free: los avisos programados a futuro no se
  despachan solos (los inmediatos sí, van por el observer al guardar).
- **Filesystem efímero**: lo subido al disco se pierde al reiniciar. Cuando se
  agreguen imágenes al CMS, usar almacenamiento en la nube (S3 o equivalente).

---

## Producción definitiva (roadmap Fase 4)

Para el despliegue definitivo con dominio propio ya existe la base autoalojada:
`docker-compose.prod.yml` (db + app + scheduler + frontend + **Caddy** con SSL
automático), `.env.prod.example` y `docker/README-DESPLIEGUE.md`. Pendientes de
esa fase: respaldos + restauración, logs y monitoreo, almacenamiento de imágenes
en la nube, y dominio propio.
