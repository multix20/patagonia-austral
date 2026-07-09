# Estado del proyecto y pendientes — PWA Turismo Cochrane

Licitación ID **3797-37-LE26** (I. Municipalidad de Cochrane).
Stack según bases: **React 18 (Vite) + Laravel (PHP 8.x) + PostgreSQL 16**, PWA offline-first + CMS municipal (Filament).

Repo: https://github.com/multix20/cochrane-turismo — rama `main`.

> Fechas clave licitación: **cierre 13-07-2026**, adjudicación 27-07-2026.
> Presupuesto máx **$10.000.000 CLP** IVA incl. Contrato **150 días**. Soporte +
> hosting + mantención hasta **31-jul-2028**, luego traspaso al municipio.

---

## Entorno local ya instalado y funcionando

- **PHP 8.4.23** y **Composer 2.10.1** vía **Laravel Herd** (Windows). `php` y `composer` en el PATH.
- **PostgreSQL 16** nativo (servicio de Windows). Base: `cochrane_turismo`, usuario `cochrane`, pass `cochrane_dev`, host `127.0.0.1:5432`.
- **Laravel 13** + **Filament v3.3.54** en `app/backend/`.
- Docker NO instalado (por eso PostgreSQL nativo). **Ojo: las bases exigen Docker** (ver pendientes).

## Qué quedó FUNCIONANDO (verificado)

1. **API pública** (la consume la PWA): `GET /api/places` (15 lugares bilingües), `GET /api/notices`.
2. **CMS Filament** en `/admin`: CRUD de **Lugares** y **Avisos**, bilingüe ES/EN.
3. **PostgreSQL** con datos semilla (15 places + avisos).
4. **PWA conectada a la API en vivo** ✅ (pendiente #1 hecho) — lugares y avisos se
   sincronizan a IndexedDB; editar en `/admin` se refleja en la PWA al recargar.
5. **Web Push (VAPID)** ✅ (pendiente #2 hecho) — suscripción desde la PWA, envío
   al publicar un aviso (inmediato y **programado a futuro**), limpieza de
   suscripciones caducadas. Notificación nativa del SO (probado en Windows/Edge).

## Cómo levantar el entorno

```powershell
# Backend
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\backend
php artisan serve            # -> http://localhost:8000  (API en /api, CMS en /admin)
php artisan schedule:work    # OTRA terminal: despacha avisos programados (Web Push)

# Frontend
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\frontend
npm install                  # solo la primera vez
npm run dev                  # o: npm run build && npm run preview (para probar el SW/push)
```

Config local en `frontend/.env.local` (VITE_API_URL + VITE_VAPID_PUBLIC_KEY).
PostgreSQL corre solo como servicio. Verificar: `Get-Service postgresql*`.

---

## Cambios de sesiones anteriores (para no repetirlos)

- `bootstrap/app.php`: `api: routes/api.php` en `withRouting()` + `trustProxies('*')`.
- `.env`: PostgreSQL, `APP_URL`, `FRONTEND_URL`, `APP_TIMEZONE=America/Santiago`, claves VAPID.
- Seeders idempotentes (`updateOrCreate` / guard por `count()`).
- **PWA↔API**: `frontend/.env.local` con `VITE_API_URL`; `client.js` sincroniza places y avisos a IndexedDB (`db.js` v2 con store `avisos`).
- **Web Push**: `minishlink/web-push`; tablas `push_subscriptions` + columna `notificado_en`; `PushController` (`/api/push/*`); `WebPushSender`; `NoticeObserver`; comando `avisos:despachar` planificado cada minuto; `push-listener.js` en el SW; botón "Activar notificaciones" en la PWA. CORS ahora permite POST.
- `User.php` implementa `canAccessPanel()` (necesario para Filament en producción).
- Despliegue preparado (demo): `render.yaml`, `backend/Dockerfile`, `DEPLOY.md`.
- **Badge de avisos en vivo (09-jul-2026)**: al recibir un Web Push, el SW hace
  `postMessage({tipo:'nuevo-aviso'})` a las ventanas abiertas; `App.jsx` escucha
  con `navigator.serviceWorker.addEventListener('message', …)` y recarga
  `obtenerAvisos()`, así la campanita/contador se actualiza al instante junto con
  la notificación del SO, sin refrescar. Archivos: `frontend/public/push-listener.js`,
  `frontend/src/App.jsx`.

---

## PENDIENTES — en orden de valor

### ✅ 1. Conectar la PWA con la API — HECHO
### ✅ 2. Web Push (VAPID) — HECHO

### ✅ 3. Contenerización con Docker — HECHO Y PROBADO EN VIVO (08-jul-2026)
Levantado con `docker compose -f docker-compose.prod.yml up -d --build`: 5
contenedores OK, PWA en `https://localhost` "En línea" con datos reales del CMS.
Fixes de la prueba: PHP 8.4 + extensión `gmp` en `Dockerfile.fpm`; `chown www-data`
de `storage/` y `bootstrap/cache` en el entrypoint (php-fpm atiende como www-data).
Las bases exigen solución **desplegable con Docker Compose** (backend, frontend,
PostgreSQL y reverse proxy). **Creado (08-jul-2026):**
- `docker-compose.prod.yml` — db (postgres16) · app (Laravel php-fpm) · scheduler
  (Web Push cada minuto) · frontend (build Vite) · web (Caddy: reverse proxy + SSL
  automático). Red interna, volúmenes persistentes, healthchecks.
- `backend/Dockerfile.fpm` + `backend/docker/entrypoint.fpm.sh` (migra/siembra/
  publica assets Filament; refresca public/ y storage/).
- `frontend/Dockerfile` (compila la PWA a volumen compartido).
- `docker/Caddyfile` (SSL Let's Encrypt automático + cabeceras de seguridad;
  enruta /api,/admin,/up al backend y sirve la PWA en /).
- `.env.prod.example` (variables por ambiente) y `docker/README-DESPLIEGUE.md`
  (manual: despliegue local/EC2, backup/restore, actualización, rollback).

Validado estáticamente (YAML, shell, variables). **Pendiente:** instalar Docker
Desktop y correr `docker compose -f docker-compose.prod.yml up -d --build` para la
prueba en vivo (API, /admin, PWA, push). Se decidió **Caddy** (no Nginx) por HTTPS
automático; frontend servido desde el compose (mismo origen, sin CORS).

### 4. Despliegue en la nube
- **Frontend**: Netlify (listo `netlify.toml`); apuntar `VITE_API_URL` al backend.
- **Backend + PostgreSQL gestionado**: demo gratis lista en **Render** (`DEPLOY.md`).
  Para producción definitiva: nube grande (AWS/Azure/GCP) según las bases.
- Requisitos de las bases a cubrir en prod: dominio/subdominio, **SSL/TLS**,
  variables por ambiente, **respaldos + restauración**, **logs y monitoreo**,
  **almacenamiento de imágenes en la nube** (S3), documentación de despliegue.

### 5. Certificación cloud del oferente  ← NUEVO (requisito de las bases)
Se exige que el oferente o un profesional del equipo acredite una certificación
cloud vigente: **AWS CLF-C02 / Azure AZ-900 / Google Cloud Digital Leader /
Oracle OCI Foundations / IBM Cloud Advocate**. No es código; hay que obtenerla.
Las más rápidas/baratas: AZ-900 o GCP Digital Leader.

### Menores
- Categorías del directorio: las bases nombran "rutas patrimoniales" y "comercios
  locales" como filtros; hoy: atractivo/alojamiento/comida/servicio/evento/emergencia.
- Confirmar peso inicial de la PWA **< 20 MB** (requisito de instalabilidad).
- La **oferta técnica (Anexo 4)** debe incluir: arquitectura, plan de contingencia
  offline, UI/UX y **propuesta de seguridad**.

---

## Archivos clave

- CMS: `app/backend/app/Filament/Resources/{PlaceResource,NoticeResource}.php`
- API: `app/backend/app/Http/Controllers/Api/{Place,Notice,Push}Controller.php`
- Modelos: `app/backend/app/Models/{Place,Notice,PushSubscription,User}.php`
- Web Push: `app/backend/app/Services/WebPushSender.php`, `app/Observers/NoticeObserver.php`, `app/Console/Commands/{DespacharAvisos,PushTest}.php`
- Rutas: `app/backend/routes/api.php`, `routes/console.php`
- Frontend: `app/frontend/src/{api/client.js,push.js,db.js,App.jsx}`, `public/push-listener.js`
- Despliegue: `app/render.yaml`, `app/backend/Dockerfile`, `app/DEPLOY.md`, `app/PUSH.md`
