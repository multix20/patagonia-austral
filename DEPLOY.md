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
   > En el panel de Stadia, restringe la key a los dominios propios
   > (`rutaaustral.cl`, `www.rutaaustral.cl`, la URL de Netlify y, si aplica, los
   > `deploy-preview-*.netlify.app`). Es una clave de cliente restringida por
   > dominio, no un secreto.
   >
   > **Si la key falta, la capa "Mapa" cae a CARTO Voyager. Y si la key está pero
   > la rechazan** —dominio no autorizado, plan vencido— **también**: el mapa
   > detecta las teselas fallidas y cambia de proveedor solo. Antes no lo hacía y
   > el mapa quedaba en blanco; pasó al estrenar `rutaaustral.cl`, con la key
   > todavía restringida al dominio viejo. Ojo con el plan: el trial de Stadia
   > Professional vence, y al vencer la key deja de servir teselas.
3. Si quieres URL fija: **Site configuration → Change site name** →
   `patagonia-austral` → queda `https://patagonia-austral.netlify.app`.
4. **CORS**: la variable `FRONTEND_URL` del web service en Render debe ser
   exactamente la URL pública del sitio. El blueprint trae el dominio propio
   (`https://rutaaustral.cl`); mientras el DNS no esté listo, la URL de Netlify
   sigue permitida por los patrones comodín de `config/cors.php`.

### 2.4) Dominio propio — `rutaaustral.cl`

Elegido el 3-ago-2026. Registrado en **NIC Chile** (`nic.cl`). Orden de los pasos
(el DNS es lo primero porque todo lo demás espera su propagación):

1. **NIC Chile → DNS**: apuntar el dominio a Netlify. En Netlify:
   **Domain management → Add a domain** → `rutaaustral.cl`. Netlify indica si
   usar sus *nameservers* (`dns1.p0X.nsone.net`, lo más simple) o registros
   `A`/`CNAME`. El SSL de Let's Encrypt se emite solo, a los minutos de propagar.
2. Dejar `www.rutaaustral.cl` **redirigiendo** al apex (Netlify lo hace solo al
   agregar el dominio; verificar que el primario sea el apex).
3. **No dar de baja el sitio `.netlify.app`**: quien ya tenga la PWA instalada la
   conserva apuntando al origen viejo, con su IndexedDB y su suscripción de push.
   Dejarlo redirigiendo un tiempo.
4. **Render → Environment**: `FRONTEND_URL = https://rutaaustral.cl`. Sin esto la
   PWA queda servida pero **sin datos**, y el error sale como CORS en consola.
   (El comodín de `config/cors.php` ya cubre el dominio y sus subdominios, así
   que esto es cinturón y tirantes — pero cargarlo igual.)
5. **Stadia Maps** → restringir la API key al dominio nuevo, o el basemap de
   terreno deja de cargar (ver el paso 2 de esta guía).
6. **Correo** — el motivo real de comprar el dominio: montar
   `contacto@rutaaustral.cl`. Paso a paso en **§2.4.1**, acá abajo.
7. **Opcional, cuando toque**: `fotos.rutaaustral.cl` como dominio público del
   bucket R2 (`R2_URL`) para salir del rate limit de `r2.dev` — paso 2.5. Y
   `api.rutaaustral.cl` para la API, que además obliga a cambiar `APP_URL` en
   Render y `VITE_API_URL` en Netlify **con redeploy** (es build-time).

### 2.4.1) Buzón del dominio — `contacto@rutaaustral.cl`

La landing `/proyecto` ya enlaza a esa casilla con un `mailto:`, así que hoy ese
botón apunta a un buzón que **no existe**. Es además el remitente de la campaña a
las 26 encargadas de turismo municipal: sin buzón no hay campaña.

**Dónde van los registros: en Netlify DNS, no en NIC Chile.** El dominio usa los
*nameservers* de Netlify (`dns*.p06.nsone.net`), así que NIC ya no resuelve nada.
Netlify → *Domains* → `rutaaustral.cl` → *DNS records* → *Add new record*.

> ## ⚠️ Zoho quedó descartado (4-ago-2026) — leer antes de seguir
>
> Se intentó la ruta de Zoho y **está bloqueada por dos motivos independientes**.
> Los pasos de abajo quedan como referencia de DNS (sirven para cualquier
> proveedor), pero **no sigas el registro en Zoho**:
>
> 1. **El dominio está reclamado por otra organización de Zoho.** Al agregarlo
>    responde `This domain is already associated with this account i*****o@r*****`
>    — una cuenta que **no es nuestra**, casi seguro del dueño anterior de
>    `rutaaustral.cl` (los `.cl` se liberan y se vuelven a registrar). El
>    asistente devuelve al paso 1 sin importar el plan elegido, así que **ni
>    siquiera se llega al checkout**. Se destraba solo con un ticket a
>    `support@zohomail.com` probando la propiedad vía WHOIS de NIC + un TXT en el
>    DNS, y el plazo depende de ellos.
> 2. **El plan gratis no sirve para esto igual.** Es solo webmail: **no tiene
>    IMAP/POP ni reenvío automático** (ambos son de pago desde 2024). O sea que
>    las respuestas de la campaña quedan encerradas en una segunda bandeja que
>    hay que acordarse de revisar, sin poder reenviarlas al Gmail de siempre.
>
> Que la cuenta ajena tenga el dominio **no es un riesgo**: el correo se enruta
> por los MX, y los MX los controlamos nosotros en Netlify. Es un papel viejo,
> no acceso.

**Qué proveedor** (pendiente de decisión al 4-ago-2026)

| | Precio | IMAP/SMTP | Nota |
|---|---|---|---|
| Google Workspace | ~US$84/año | sí | La mejor entregabilidad, y es el Gmail que ya se usa. |
| Migadu | ~US$19/año | sí | Buzones y alias ilimitados. |
| Purelymail | ~US$10/año | sí | El más barato; proyecto de una sola persona. |
| Zoho Mail Lite | ~US$12/año | sí | Solo si soporte libera el dominio. |
| ImprovMX | US$0 | **no** | Solo reenvía; no puede enviar la campaña. |

**Recomendación: Google Workspace.** La campaña va a **cuentas municipales, que
filtran fuerte**, y para 26 correos que deciden el contenido del producto la
reputación de envío de Google vale más que los ~US$65 de diferencia con Migadu.
Si hay que apretar el presupuesto, Migadu es una elección sensata.

**El plan gratis no es opción para este proyecto**, con o sin el bloqueo del
dominio: sin SMTP no se puede enviar desde `contacto@rutaaustral.cl`, que es
justamente para lo que se compró el dominio.

**Pasos** — escritos para Zoho, pero el patrón (verificar el dominio → MX → SPF →
DKIM → DMARC → probar) es idéntico en Workspace, Migadu o Purelymail; solo cambian
los valores, que **siempre se copian del panel del proveedor**, no de aquí.

1. Registrarse en Zoho Mail y elegir la opción de **dominio propio** ("Sign up
   with a domain I already own") → `rutaaustral.cl`. Ojo: **el datacenter que
   elijas (US/EU) no se cambia después**, y define los valores de los pasos
   siguientes (`zoho.com` vs `zoho.eu`).
2. **Verificar el dominio**: Zoho entrega un `TXT` (o `CNAME`). Agregarlo en
   Netlify DNS y volver a Zoho a darle *Verify*. Suele tomar minutos.
3. **Crear el usuario `contacto`** → queda `contacto@rutaaustral.cl`.
4. **MX** en Netlify DNS. Copiar los valores de la pantalla *DNS Mapping* del
   panel de Zoho; con el datacenter de EE.UU. quedan así:

   | Tipo | Nombre | Valor | Prioridad |
   |---|---|---|---|
   | MX | `@` (o vacío) | `mx.zoho.com` | 10 |
   | MX | `@` | `mx2.zoho.com` | 20 |
   | MX | `@` | `mx3.zoho.com` | 50 |

   > **Borrar cualquier otro MX** que tenga el dominio. Uno solo que sobre
   > desvía parte del correo, y el síntoma es "algunos correos no llegan" —
   > bastante peor de diagnosticar que "no llega ninguno".
5. **SPF** — un `TXT` en `@` con valor `v=spf1 include:zoho.com ~all`.
   **Un solo registro SPF por dominio**: si ya existe uno, se fusionan los
   `include` dentro del mismo, no se agrega un segundo.
6. **DKIM** — en Zoho, *Email Authentication → DKIM*, generar el par y agregar el
   `TXT` que entregue en `<selector>._domainkey` (el selector por defecto suele
   ser `zmail`). Volver a Zoho a darle *Verify*.
7. **DMARC** (opcional, 2 minutos, conviene) — `TXT` en `_dmarc` con
   `v=DMARC1; p=none; rua=mailto:contacto@rutaaustral.cl`. Con `p=none` no
   bloquea nada: sirve para enterarte si alguien suplanta el dominio, y suma un
   poco de entregabilidad.

**Verificar** — no darlo por hecho hasta que estas tres pasen:

- Mandar un correo **desde fuera** (tu Gmail) a `contacto@rutaaustral.cl` y que
  llegue al webmail.
- Responder desde Zoho a tu Gmail, abrir el mensaje y ver *Mostrar original*:
  tiene que decir `spf=pass` y `dkim=pass`. Si sale `dkim=neutral`, falta el
  paso 6 o todavía no propaga.
- Abrir `/proyecto` y probar el botón de contacto.

Propagación: los MX suelen andar en 1–2 h; SPF y DKIM pueden tardar hasta 24–48 h.

**Antes de la campaña — entregabilidad.** El dominio es de agosto de 2026: su
reputación es cero. Mandar 26 correos de golpe desde un dominio recién nacido es
justo el patrón que marca spam, y estos correos van a **cuentas municipales**,
que suelen filtrar con la mano pesada.

- Repartirlos en tandas de 5–8 a lo largo de varios días.
- Texto plano o casi, **un solo enlace**, sin adjuntos, con firma real (nombre,
  teléfono, localidad).
- Uno por uno y con el nombre de la persona. Nada de CCO masivo.
- Responder rápido a quien conteste: las respuestas construyen más reputación
  que cualquier registro DNS.

---

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

## 2.7) "This page has expired" (error 419) al guardar en el CMS

Pasa al apretar **Save changes**, típicamente después de tener la ficha abierta
un rato. Es **expiración de sesión** (Laravel responde 419 cuando el token CSRF
del formulario ya no calza con la sesión), no un problema de la foto ni de R2.

En el plan free se dispara mucho más seguido que en un servidor normal, por dos
razones que se suman:

- El servicio **duerme a los ~15 min** sin tráfico, así que el tiempo muerto se
  acumula sin que uno lo note.
- Editar contenido es lento por naturaleza: se abre la ficha, se redacta, se
  buscan datos en otra pestaña, y recién ahí se sube la foto y se guarda.

**Ya mitigado:** `SESSION_LIFETIME=480` (8 h) en `render.yaml`, en vez de las 2 h
por defecto. El CMS lo usa una sola persona, así que la sesión larga no abre un
riesgo real. **Requiere que el blueprint se sincronice** para tomar efecto.

**Si igual aparece:** *Aceptar* en el diálogo recarga la página — pero **lo
escrito en el formulario se pierde**, así que conviene recargar, volver a entrar
y rehacer el cambio de una sola pasada.

> **Trampa aparte, del mismo origen.** Las fotos que arrastras quedan primero en
> una **carpeta temporal del contenedor** (`livewire-tmp`), no en R2: el
> "Upload complete" verde es esa subida temporal. Recién al **guardar** pasan al
> disco definitivo. Como el disco de Render free es efímero, si el servicio se
> duerme entre la subida y el guardado, **el archivo temporal desaparece** y el
> guardado falla aunque la sesión siga viva. Mientras el backend no sea
> *always-on*: subir y guardar **de inmediato**, una ficha a la vez.

---

## 2.8) Los seeders y el contenido curado en el CMS

`docker/start.sh` corre `php artisan migrate --force --seed` **en cada arranque
del contenedor**, y en el plan free el servicio se duerme a los ~15 min: en la
práctica los seeders se ejecutan varias veces al día.

`PlaceSeeder` hace `updateOrCreate` con **todos** los campos de la ficha,
`publicado` y `destacado` incluidos. Sin freno, cada despertar del servicio
revertía a `places.json` lo que se hubiera curado en `/admin` — y el síntoma es
mudo: no hay error, la selección simplemente vuelve sola a la del JSON.

**Desde ago-2026 el seeder se salta si ya hay lugares en la BD.** Lo que se
edita en el CMS manda.

**Para reimportar a propósito** (contenido nuevo agregado a `places.json`):

```bash
SEMBRAR_LUGARES=1 php artisan db:seed --class=Database\\Seeders\\PlaceSeeder
```

Ojo: esa pasada **sí** pisa `publicado` y `destacado` de las 231 fichas semilla
con lo que diga el JSON. Si ya hay curación hecha en el CMS, respaldarla antes:

```sql
CREATE TABLE respaldo_publicados AS SELECT id FROM places WHERE publicado;
```

`SernaturPlaceSeeder` no corre solo (no está en `DatabaseSeeder`): es manual y
siempre lo fue.

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

**Dominio `.cl` — `rutaaustral.cl`, elegido el 3-ago-2026.** Pasos concretos en
el **§2.4** de esta misma guía; el porqué de cada decisión, en
`ESTADO_Y_PENDIENTES.md` → Fase 4, "Dominios `.cl`".
