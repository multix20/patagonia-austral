# Estado del proyecto y pendientes — Patagonia Austral

**Proyecto personal/comercial propio.** PWA de turismo offline-first para la
**Carretera Austral** (Coyhaique a Villa O'Higgins) + CMS (Filament).
Stack: **React 18 (Vite) + Laravel (PHP 8.x) + PostgreSQL 16**.

Repo: https://github.com/multix20/patagonia-austral — rama `main`.

> **Aclaración importante (10-jul-2026):** este proyecto nació como fork de la
> PWA de Cochrane (licitación ID 3797-37-LE26, repo `multix20/cochrane-turismo`),
> pero es un **producto independiente que NO se rige por bases de licitación**.
> Toda mención a "las bases exigen…" en notas históricas de este archivo quedó
> obsoleta: los requisitos ahora los define el roadmap propio (ver README).
> El proyecto Cochrane original **sigue vivo y desplegado por separado**; los
> servicios de Render de este repo usan nombres y claves propios
> (`patagonia-austral-*`) para no interferir con los de Cochrane
> (`cochrane-turismo-*`).

---

## Entorno local (heredado de la base Cochrane)

- **PHP 8.4.23** y **Composer 2.10.1** vía **Laravel Herd** (Windows). `php` y `composer` en el PATH.
- **PostgreSQL 16** nativo (servicio de Windows).
- **Laravel 13** + **Filament v3.3.54** en `backend/`.

## Qué está FUNCIONANDO (verificado)

1. **API pública** (la consume la PWA): `GET /api/places` (lugares bilingües), `GET /api/notices`.
2. **CMS Filament** en `/admin`: CRUD de **Lugares** y **Avisos**, bilingüe ES/EN.
3. **PostgreSQL** con datos semilla (places + avisos).
4. **PWA conectada a la API en vivo** — lugares y avisos se sincronizan a
   IndexedDB; editar en `/admin` se refleja en la PWA al recargar.
5. **Web Push (VAPID)** — permiso solicitado automáticamente al instalar la PWA
   (evento `appinstalled`), envío al publicar un aviso (inmediato y programado),
   limpieza de suscripciones caducadas.
6. **Docker Compose de producción** probado en vivo (5 contenedores, Caddy+SSL).

## Cómo levantar el entorno

```powershell
# Backend
cd backend
php artisan serve            # -> http://localhost:8000  (API en /api, CMS en /admin)
php artisan schedule:work    # OTRA terminal: despacha avisos programados (Web Push)

# Frontend
cd frontend
npm install                  # solo la primera vez
npm run dev                  # o: npm run build && npm run preview (para probar el SW/push)
```

Config local en `frontend/.env.local` (VITE_API_URL + VITE_VAPID_PUBLIC_KEY).

---

## Historial técnico (decisiones que no hay que repetir)

- `bootstrap/app.php`: `api: routes/api.php` en `withRouting()` + `trustProxies('*')`.
- Seeders idempotentes (`updateOrCreate` / guard por `count()`).
- **PWA↔API**: `client.js` sincroniza places y avisos a IndexedDB (`db.js` v2 con store `avisos`).
- **Web Push**: `minishlink/web-push`; tablas `push_subscriptions` + columna
  `notificado_en`; `PushController` (`/api/push/*`); `WebPushSender`;
  `NoticeObserver`; comando `avisos:despachar` cada minuto; `push-listener.js` en el SW.
- `User.php` implementa `canAccessPanel()` (necesario para Filament en producción).
- **Badge de avisos en vivo (09-jul-2026)**: al recibir un Web Push, el SW hace
  `postMessage({tipo:'nuevo-aviso'})`; `App.jsx` recarga `obtenerAvisos()` y el
  contador se actualiza al instante. En móvil además se recarga con
  `visibilitychange`/`focus`.
- **Mejoras de mapa (09-jul-2026)**: GPS en vivo (punto azul + botón centrar),
  basemap CARTO Voyager con switch Mapa/Satélite (Esri), ruta con distancia
  (≤30 km), botón "Cómo llegar" (Google Maps). Teselas cacheadas para offline.
- **Contenerización (08-jul-2026)**: `docker-compose.prod.yml` — db (postgres16)
  · app (Laravel php-fpm) · scheduler · frontend (build Vite) · web (**Caddy**:
  reverse proxy + SSL automático). `backend/Dockerfile.fpm`, `frontend/Dockerfile`,
  `docker/Caddyfile`, `.env.prod.example`, `docker/README-DESPLIEGUE.md`.
  Se eligió Caddy (no Nginx) por HTTPS automático; frontend en el mismo origen
  (sin CORS).
- **UI minimalista (10-jul-2026)**: eliminada la barra de botones demo
  ("Simular sin conexión / Probar push / Activar notificaciones"). El permiso de
  push se pide solo al instalar la PWA (`appinstalled`); los avisos quedaron en
  una campanita minimalista en el header. Mergeado a `main`.
- **Separación de Cochrane (10-jul-2026)**: `render.yaml` renombrado a
  `patagonia-austral-api`/`patagonia-austral-db` con `APP_KEY` y par VAPID
  **nuevos y propios** (los de Cochrane quedaron solo en aquel proyecto).
  `DEPLOY.md` reescrito para este repo (todo en Render, static site + blueprint).
- **Secretos fuera del repo (10-jul-2026)**: `APP_KEY` y `VAPID_PRIVATE_KEY`
  van con `sync: false` en `render.yaml` — se ingresan en el dashboard de Render
  al aplicar el blueprint y no viven en git. Unas claves anteriores alcanzaron a
  quedar en el historial de commits: se **rotaron** (par VAPID nuevo, cuya
  pública está en `render.yaml`), así que las del historial no sirven.

---

## PENDIENTES — roadmap propio (ver README para las fases)

### ✅ 1. Desplegar este repo — Netlify + Render + Neon — HECHO (10-jul-2026)
**Frontend en Netlify**, **backend en Render** (`patagonia-austral-api`, web
service free), **PostgreSQL en Neon** (free, externa). La base va en Neon porque
Render solo permite una Postgres free por cuenta (la ocupa Cochrane) y además
las free de Render expiran a los 30 días. Guía paso a paso: `DEPLOY.md`.
**Verificado en vivo en móvil (Android/Chrome):** API + CMS escribiendo en Neon,
campanita sincronizando avisos, y **Web Push llegando con la app cerrada**
(suscripción vía `appinstalled` + red de seguridad al abrir la app instalada).
Los servicios de Cochrane quedaron intactos.
Nota Android: al instalar puede aparecer "no se pudieron activar las
notificaciones" si el POST de suscripción falla en ese momento; se autorepara
al abrir la app (el toast ahora muestra el motivo exacto entre paréntesis).

### ✅ 2. Fase 1 — Multi-localidad — HECHO (13-jul-2026)
**Backend:** modelo `Localidad` (tabla `localidades`: slug único, nombre
bilingüe jsonb, lat/lng, `zoom` inicial del mapa, `orden` norte→sur en decenas
para intercalar pueblos), `Place belongsTo Localidad` (FK nullable
`localidad_id`), recurso Filament **Localidades** (CRUD con contador de
lugares), `GET /api/localidades` y campo aditivo `localidad` (slug) en
`/api/places` — **compatible hacia atrás**: la PWA desplegada ignora el campo
nuevo, así que el backend puede desplegarse primero. La migración
`2026_07_13_000002` asigna los 15 lugares preexistentes a Cochrane (crea la
localidad si no existe; corre antes que los seeders). `LocalidadSeeder`
idempotente (updateOrCreate por slug) con Puerto Río Tranquilo (orden 30),
Cochrane (60) y Caleta Tortel (70); `PlaceSeeder` resuelve la localidad por
slug desde `data/places.json` y ahora **resetea la secuencia de PostgreSQL**
tras sembrar con ids explícitos (bug latente: crear un lugar desde el CMS
chocaba con los ids semilla).
**Frontend:** IndexedDB v3 con store `localidades` (keyPath `slug`),
`obtenerLocalidades()` en `api/client.js` (misma estrategia offline-first:
API → IndexedDB → seed empaquetado), selector de localidad en el header
(persistido en `localStorage.localidadSel`, opción "Toda la ruta"), filtro por
localidad en lista y mapa, y recentrado del mapa (`flyTo` a lat/lng/zoom de la
localidad). Lugares cacheados por versiones previas (sin campo `localidad`) se
asumen de Cochrane. Textos nuevos ES/EN en `i18n.jsx`
(`localidad`/`todaLaRuta`/`sinLugaresLocalidad`).
**Contenido:** 6 lugares reales nuevos (ids 16-21): Capillas de Mármol,
Glaciar Exploradores y posta de salud (Puerto Río Tranquilo); pasarelas,
Isla de los Muertos y posta de salud (Caleta Tortel). Seeds del frontend
(`data/places.js`) y backend (`seeders/data/places.json`) en espejo — el JSON
se regeneró desde el seed del frontend, mantener esa dirección al editar.
**Verificado:** build+lint del frontend OK; `php -l` OK; `migrate:fresh
--seed` contra PostgreSQL 16 local y respuestas reales de `/api/places` y
`/api/localidades` comprobadas con `php artisan serve`.

### 3. Fase 2 — Contenido
Poblar todas las localidades (atractivos, alojamiento, comida, servicios,
emergencias, rutas) en ES/EN.

### 4. Fase 3 — Capa comercial
Fichas destacadas, planes de negocio, analítica.

### 5. Fase 4 — Producción definitiva
Dominio propio + SSL, respaldos + restauración, logs y monitoreo,
almacenamiento de imágenes en la nube (S3 o equivalente), difusión.
Base lista: `docker-compose.prod.yml` + `docker/README-DESPLIEGUE.md`.

### Menores
- **Push en iOS (pendiente de probar):** iOS no dispara `appinstalled` y exige
  un gesto del usuario para pedir el permiso → hoy un iPhone no tiene vía para
  suscribirse. Solución diseñada: tarjeta única "¿Quieres recibir avisos?" que
  aparece solo en modo standalone con permiso pendiente (sirve también como
  respaldo en Android).
- Revisar categorías del directorio para el producto propio (¿rutas
  patrimoniales? ¿comercios locales?).
- Mantener el peso inicial de la PWA bajo (~20 MB) para instalabilidad.

---

## Archivos clave

- CMS: `backend/app/Filament/Resources/{PlaceResource,NoticeResource}.php`
- API: `backend/app/Http/Controllers/Api/{Place,Notice,Push}Controller.php`
- Modelos: `backend/app/Models/{Place,Notice,PushSubscription,User}.php`
- Web Push: `backend/app/Services/WebPushSender.php`, `app/Observers/NoticeObserver.php`, `app/Console/Commands/{DespacharAvisos,PushTest}.php`
- Rutas: `backend/routes/api.php`, `routes/console.php`
- Frontend: `frontend/src/{api/client.js,push.js,db.js,App.jsx}`, `public/push-listener.js`
- Despliegue: `render.yaml`, `backend/Dockerfile`, `DEPLOY.md`, `PUSH.md`,
  `docker-compose.prod.yml`, `docker/README-DESPLIEGUE.md`
