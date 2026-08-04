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
> Queda escrito para no volver a intentarlo dentro de tres meses:
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

**Qué proveedor — decidido: Purelymail (4-ago-2026), ~US$10/año**

| | Precio | IMAP/SMTP | Nota |
|---|---|---|---|
| **Purelymail** | **~US$10/año** | sí | **Elegido.** Tarifa plana con buzones y **dominios ilimitados**. Contra: lo lleva una sola persona sobre AWS (ha tenido caídas puntuales) y el webmail es flojo — se resuelve leyendo y escribiendo desde el Gmail de siempre (paso 7). |
| Migadu Micro | ~US$19/año | sí | Suizo, con más rodaje. Pero es **un solo dominio** y **20 envíos/día**: alcanza para la campaña en tandas, no para los dominios de los otros negocios. |
| Google Workspace | ~US$84/año | sí | La mejor entregabilidad y es el Gmail que ya se usa. Más que **dobla** el gasto anual del proyecto (~US$150). |
| Zoho Mail Lite | ~US$12/año | sí | Bloqueado por lo de arriba mientras soporte no libere el dominio. |
| ImprovMX / Cloudflare Email Routing | US$0 | **no** | Solo reenvían. No pueden **enviar** la campaña, que es para lo que se compró el dominio. |

**Por qué Purelymail y no Workspace.** Porque esto **no es una puerta de una sola
vía**: los MX se controlan desde Netlify, así que cambiar de proveedor es editar
el DNS y arrastrar el correo viejo por IMAP —a esta altura, una bandeja vacía—.
Gastar US$84 por adelantado para cubrirse de un riesgo que se mide en una tarde
(paso 8) es pagar un seguro más caro que el siniestro. La tarifa plana además
cubre los dominios de la hamburguesería y el transporte cuando toque, sin subir
de plan.

**El riesgo real, dicho claro**: la campaña va a **cuentas municipales, que
filtran fuerte**, y sale desde IPs compartidas de un proveedor chico y un dominio
recién nacido. Por eso el paso 8 —medir la entregabilidad **antes** de la
campaña— no es opcional. Si sale mal ahí, se migra a Workspace cambiando los MX;
lo que no puede pasar es enterarse con los 26 correos ya enviados.

**Ningún plan gratis sirve acá**: sin SMTP propio no se puede enviar desde
`contacto@rutaaustral.cl`.

**Pasos** — el patrón (crear cuenta → verificar el dominio → MX → SPF → DKIM →
DMARC → probar) es el mismo en cualquier proveedor; lo que cambia son los
valores, que **siempre se copian del panel**, no de aquí. La tabla del paso 3
está **confirmada contra el panel el 4-ago-2026** (salvo el token de propiedad,
que es único por cuenta).

1. **Crear la cuenta** en `purelymail.com` y pagar el año (US$10, por adelantado;
   no hay plan gratis — que acá es una ventaja: el gratis de Zoho fue justamente
   el que no servía).
2. **Agregar el dominio**: *Domains → Add domain* → `rutaaustral.cl`. El panel
   muestra los registros **antes** de dejarte guardar: hay que cargarlos en
   Netlify, darle *Check DNS records* y recién ahí *Save*. Dos ajustes en esa
   misma pantalla, que no son cosméticos:

   - **Deliver Mail To → `Purelymail`** (el valor por defecto, no tocarlo). Con
     `External Server` Purelymail entrega según los MX y **se rompe el reenvío a
     Gmail** del paso 7: las reglas de *routing* solo corren si la entrega es
     interna.
   - **Allow Account Reset → apagado.** Si se enciende, cualquiera que controle
     el DNS de `rutaaustral.cl` puede recuperar la clave del admin y quedarse con
     la cuenta entera. La clave va al gestor de contraseñas, no al DNS.

3. **Cargar los registros en Netlify DNS** (*Domains → `rutaaustral.cl` → DNS
   records*):

   | Tipo | Nombre | Valor | Prioridad |
   |---|---|---|---|
   | TXT | *(vacío)* | `purelymail_ownership_proof=…` (único de la cuenta) | — |
   | MX | *(vacío)* | `mailserver.purelymail.com` | cualquiera (50) |
   | TXT | *(vacío)* | `v=spf1 include:_spf.purelymail.com ~all` | — |
   | CNAME | `purelymail1._domainkey` | `key1.dkimroot.purelymail.com` | — |
   | CNAME | `purelymail2._domainkey` | `key2.dkimroot.purelymail.com` | — |
   | CNAME | `purelymail3._domainkey` | `key3.dkimroot.purelymail.com` | — |
   | CNAME | `_dmarc` | `dmarcroot.purelymail.com` | — |

   > **En Netlify el campo *Name* es relativo**: se escribe `purelymail1._domainkey`
   > a secas, porque Netlify le agrega `.rutaaustral.cl`. Si pegas el FQDN
   > completo queda `purelymail1._domainkey.rutaaustral.cl.rutaaustral.cl` y el
   > DKIM nunca valida. Para los tres registros del ápice, *Name* va **vacío**.
   > El **punto final** de los valores que muestra Purelymail
   > (`mailserver.purelymail.com.`) es opcional: si Netlify lo rechaza, sin punto.

   Cinco trampas más, en orden de qué tan caro sale cada una:

   > - **El SPF va como `TXT`, aunque Netlify ofrezca un tipo `SPF`.** Es la
   >   trampa más fácil de caer acá, porque el desplegable lo sugiere solito. El
   >   tipo de registro `SPF` (el 99) quedó **obsoleto en el RFC 7208, de 2014**:
   >   ningún servidor lo consulta ya, todos leen el `TXT`. Un `v=spf1` guardado
   >   como tipo `SPF` se ve perfecto en el panel y **no existe** para Gmail —
   >   resultado, `spf=fail` y la campaña al spam. Pasó el 4-ago-2026: se cargó
   >   así y hubo que rehacerlo.
   > - **Borrar cualquier otro MX** que tenga el dominio. Uno que sobre desvía
   >   parte del correo, y el síntoma es "algunos correos no llegan" — bastante
   >   peor de diagnosticar que "no llega ninguno". Con un solo MX, el número de
   >   prioridad da lo mismo.
   > - **Un solo registro SPF por dominio.** Si ya existe uno, se fusionan los
   >   `include` **dentro** del mismo; dos registros SPF = SPF inválido = spam.
   > - **Los DKIM son `CNAME`, no `TXT`.** Es el error clásico al venir de otros
   >   proveedores, que entregan una llave larga en TXT. Acá son tres alias.
   > - **DMARC: o el `CNAME` o un `TXT` propio, nunca los dos.** El `CNAME` deja
   >   la política en manos de Purelymail (`p=none`) y es cero mantenimiento. Si
   >   prefieres recibir los reportes, usa en su lugar un `TXT` en `_dmarc` con
   >   `v=DMARC1; p=none; rua=mailto:contacto@rutaaustral.cl`.

4. **Verificar el dominio** en el panel de Purelymail. Suele tomar minutos.
5. **Crear el usuario `contacto`** → queda `contacto@rutaaustral.cl`.
6. **Catch-all** (opcional, 1 minuto, conviene): *Routing* → una regla que mande
   cualquier dirección del dominio a `contacto`. Así `hola@`, `info@` o el
   inevitable `contato@` mal escrito no rebotan.
7. **Enchufarlo al Gmail que ya usas** — este paso es el que evita que el buzón
   quede como una segunda bandeja que hay que acordarse de revisar (una de las
   dos razones por las que Zoho free no servía):
   - **Recibir**: en *Routing*, una regla que reenvíe `contacto@rutaaustral.cl` a
     tu Gmail. Llega al instante, a diferencia del POP3 de Gmail, que puede
     tardar una hora — y durante la campaña las respuestas se contestan rápido.
   - **Enviar**: Gmail → *Ver todos los ajustes → Cuentas e importación → Enviar
     como → Agregar otra dirección* → `contacto@rutaaustral.cl`, servidor
     `smtp.purelymail.com`, puerto **465** con SSL (o 587 con STARTTLS), usuario
     y clave del buzón. Gmail manda un código de confirmación a esa dirección,
     que ya te llega por el reenvío del punto anterior.
   - Queda así: escribes desde el Gmail de siempre y el correo **sale por
     Purelymail**, firmado con el SPF y el DKIM del dominio. Sin esto, Gmail
     mandaría desde `@gmail.com` y la campaña perdería justamente lo que se fue
     a buscar al comprar el dominio.
   - En el teléfono, si prefieres app aparte: IMAP `imap.purelymail.com`, puerto
     `993`, SSL.

**Verificar** — no darlo por hecho hasta que estas cuatro pasen:

- Mandar un correo **desde fuera** (tu Gmail) a `contacto@rutaaustral.cl` y que
  llegue.
- Responder **con la dirección nueva** a tu Gmail, abrir el mensaje y ver
  *Mostrar original*: tiene que decir `spf=pass` y `dkim=pass`, y el `dkim` con
  `header.d=rutaaustral.cl` (si dice `gmail.com`, el paso 7 quedó a medias y
  estás enviando como Gmail disfrazado). Si sale `dkim=neutral`, falta un CNAME
  o todavía no propaga.
- Abrir `/proyecto` y probar el botón de contacto.
- **Antes de la campaña**: mandar un correo a `mail-tester.com` desde la
  dirección nueva y que dé **≥ 8/10** (lo normal con todo bien puesto es 10/10).
  Si sale bajo por reputación de IP, ahí es donde se decide migrar a Workspace
  —cambiando los MX— y no con los 26 correos ya salidos.

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
