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
   VITE_STADIA_API_KEY   = (API key de Stadia Maps; opcional)
   ```
   > `VITE_*` se resuelve en tiempo de build: si cambias una variable hay que
   > **Trigger deploy** para que la tome.
   >
   > **`VITE_STADIA_API_KEY`** (opcional): activa el basemap de terreno verde
   > (Stamen Terrain) en la capa "Mapa". Se registra gratis en
   > https://stadiamaps.com → crea una *Property* → **Authentication → API keys**.
   > En el panel de Stadia, restringe la key a los dominios propios (la URL de
   > Netlify y, si aplica, los `deploy-preview-*.netlify.app`). Es una clave de
   > cliente restringida por dominio, no un secreto. Si se deja vacía, la capa
   > "Mapa" cae de vuelta a CARTO Voyager (el mapa no se rompe).
3. Si quieres URL fija: **Site configuration → Change site name** →
   `patagonia-austral` → queda `https://patagonia-austral.netlify.app`.
4. **CORS**: la variable `FRONTEND_URL` del web service en Render debe ser
   exactamente la URL pública de Netlify (el blueprint trae
   `https://patagonia-austral.netlify.app`; ajústala en el dashboard si el
   nombre del sitio termina siendo otro).

## 2.5) Fotos de las fichas — Cloudflare R2

Solo hace falta una vez. Sin esto el CMS **no** puede subir fotos en producción:
el disco de Render free es efímero y lo subido se pierde en el siguiente deploy.

Se usa R2 y no S3 porque el **egress es gratis**: las fotos las descarga el
navegador de cada turista, que es justo el costo que en S3 se dispara.

> **Antes de empezar:** activar R2 exige **registrar una tarjeta** en Cloudflare,
> aunque el uso caiga entero dentro del plan gratis (10 GB). Sin medio de pago en
> la cuenta, el panel no deja crear el bucket.

1. **Crea el bucket.** En el panel de Cloudflare → *R2* → *Create bucket*.
   Nombre sugerido: `patagonia-austral`. Ubicación: automática.
2. **Hazlo público.** Dentro del bucket → *Settings* → *Public access* → habilita
   el dominio `r2.dev`. Copia la URL que queda (`https://pub-<hash>.r2.dev`):
   esa es `R2_URL`, y es la que termina en el `<img>` de la PWA.
   > Sin este paso las fotos suben bien pero dan 403 al mostrarse. El síntoma
   > engaña: parece que no se subieron.
3. **Crea el token.** R2 → *Manage API tokens* → *Create API token*, permiso
   **Object Read & Write**, acotado a ese bucket. Anota `Access Key ID` y
   `Secret Access Key` — **el secreto se muestra una sola vez**.
4. **Anota el endpoint**: `https://<account_id>.r2.cloudflarestorage.com`
   (el *Account ID* está en la portada de R2).
5. **Cárgalo en Render** (dashboard del servicio → *Environment*):

   | Variable | Valor |
   |---|---|
   | `FOTOS_DISK` | `r2` |
   | `R2_ACCESS_KEY_ID` | del token |
   | `R2_SECRET_ACCESS_KEY` | del token |
   | `R2_BUCKET` | `patagonia-austral` |
   | `R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
   | `R2_URL` | `https://pub-<hash>.r2.dev` |

   Ninguna va al repo (regla del proyecto: secretos solo en dashboards).
6. **Verifica**: en `/admin` edita un lugar, sube una foto y guarda. Debe verse
   la miniatura en el listado; y en la PWA, en la cabecera de la ficha.

**En local no hace falta R2**: con `FOTOS_DISK=public` (el valor por defecto de
`.env.example`) las fotos van a `storage/app/public`; corre una vez
`php artisan storage:link`.

**Plan gratis de R2**: 10 GB de almacenamiento y 1 millón de escrituras al mes.
Una foto convertida pesa ~150 KB → 10 GB son unas 65.000 fotos, muy por encima
del techo real de la ruta (~608 fichas).

**`r2.dev` sirve para partir, pero no es el destino.** Cloudflare lo limita a
propósito: trae *rate limit* y no pasa por la CDN completa, porque está pensado
para desarrollo. Con tráfico de temporada alta conviene un **dominio propio**
apuntando al bucket (`fotos.<dominio>.cl`) — es gratis, va por la CDN y no tiene
ese tope. Entra junto con el dominio propio de la Fase 4.

Migrar después es barato **por diseño**: en la BD se guardan rutas relativas, no
URLs. Cambiar de `r2.dev` a dominio propio es editar `R2_URL` en Render y nada
más — cero migración de datos, cero fichas que tocar.

---

## 2.6) Aviso de versión nueva — webhook de Netlify → push

Opcional, pero es lo **único** que hace aparecer el indicador de actualización
con la app **cerrada**. Con la app abierta el service worker se entera solo; una
app cerrada no corre nada. Y en **Android no existe la Badging API** (Chrome no
la expone), así que el punto del lanzador solo lo pone una notificación activa.

El circuito: Netlify publica producción → llama al hook del backend → sale un
Web Push silencioso → el teléfono muestra "Nueva versión lista" y el icono queda
con el punto → al tocarlo, la PWA aplica la versión y cierra la notificación.

1. **Inventa el token** (una cadena larga al azar, tratarla como contraseña):

   ```bash
   openssl rand -hex 24
   ```

2. **Cárgalo en Render** (dashboard del servicio → *Environment*):

   | Variable | Valor |
   |---|---|
   | `DEPLOY_PUSH_TOKEN` | el token del paso 1 |

   Sin esta variable el hook responde `503` y no notifica a nadie: es la puerta
   de "avisarle a todos los dispositivos", así que **cerrada por omisión**.

3. **Configura el webhook en Netlify**: *Site configuration* → *Build & deploy*
   → *Notifications* → *Add notification* → **Outgoing webhook**, evento
   **Deploy succeeded**, URL:

   ```
   https://patagonia-austral-api.onrender.com/api/version/desplegada?token=<TOKEN>
   ```

   La URL lleva el token porque Netlify no deja mandar cabeceras propias. Por eso
   **la URL del webhook es un secreto** — no pegarla en el repo ni en un issue.

4. **Pruébalo a mano** (no necesitas desplegar):

   ```bash
   curl -X POST -H 'X-Deploy-Token: <TOKEN>' \
     https://patagonia-austral-api.onrender.com/api/version/desplegada
   ```

   Responde `{"ok":true,"enviado":true}` la primera vez y
   `{"enviado":false,"motivo":"ya-avisado"}` si repites dentro de 15 minutos —
   ese freno existe porque Netlify dispara el hook más de una vez por deploy y
   un push va a **todos** los teléfonos.

**Detalles que evitan sustos:**

- Solo notifica los deploys con `context: production`; los *deploy previews* y
  las ramas se responden con `enviado: false`.
- El push llega solo a quien **dio permiso de notificaciones** (se pide al
  instalar la PWA). Quien no lo dio ve el indicador dentro de la app y nada más.
- La notificación es **silenciosa** (sin sonido ni vibración) y usa la misma
  `tag` que la que emite la app abierta: nunca se apilan dos.
- Render free duerme tras 15 min: el primer hook puede tardar ~1 minuto en
  responder mientras despierta. No pasa nada, Netlify no reintenta en exceso.

---

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
  Por eso las fotos de las fichas van a Cloudflare R2 y no a `storage/`
  (ver el paso 2.5). Si `FOTOS_DISK` quedara en `public` en producción, las
  fotos desaparecerían en el siguiente deploy.

---

## Producción definitiva (roadmap Fase 4)

Para el despliegue definitivo con dominio propio ya existe la base autoalojada:
`docker-compose.prod.yml` (db + app + scheduler + frontend + **Caddy** con SSL
automático), `.env.prod.example` y `docker/README-DESPLIEGUE.md`. Pendientes de
esa fase: respaldos + restauración, logs y monitoreo, y dominio propio.
El almacenamiento de imágenes en la nube ya está resuelto (R2, paso 2.5); al
montar el dominio propio, apuntar también un subdominio al bucket para salir del
`r2.dev` con rate limit (basta cambiar `R2_URL`).

**Dominio `.cl` — checklist completo** (qué variable tocar en cada servicio, y
por qué el CORS es la trampa): `ESTADO_Y_PENDIENTES.md` → Fase 4, "Dominios
`.cl`". Resumen: dominio en Netlify, y luego `FRONTEND_URL` (CORS — un `.cl` no
calza con los patrones comodín de `config/cors.php`), `APP_URL`, `R2_URL` y, si
la API se muda a `api.<dominio>.cl`, `VITE_API_URL` **con redeploy** de Netlify
por ser build-time.
