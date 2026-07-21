# Estado del proyecto y pendientes — Patagonia Austral

**Proyecto personal/comercial propio.** PWA de turismo offline-first para la
**Carretera Austral completa** (Puerto Montt a Villa O'Higgins) + CMS (Filament).
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

### ✅ 3. Fase 2 — Contenido — HECHO (14-jul-2026)
La ruta completa quedó poblada: **9 localidades** (norte→sur: Coyhaique 10 ·
Villa Cerro Castillo 20 · Puerto Río Tranquilo 30 · Puerto Guadal 40 ·
Chile Chico 45 · Puerto Bertrand 50 · Cochrane 60 · Caleta Tortel 70 ·
Villa O'Higgins 80) y **67 lugares** bilingües ES/EN. Chile Chico usa orden 45
(no está sobre la Carretera; es el desvío por la ribera sur del lago General
Carrera entre Guadal y Bertrand).
**Contenido nuevo (46 lugares, ids 22-67):** Coyhaique 8 · Villa Cerro
Castillo 8 · Chile Chico 8 · Puerto Guadal 7 · Puerto Bertrand 7 · Villa
O'Higgins 8. Cada pueblo cubre atractivos emblemáticos (Reserva Nacional
Coyhaique, sendero Laguna Cerro Castillo, Paredón de las Manos, R.N. Lago
Jeinimeni, nacimiento del Baker, glaciar O'Higgins, hito final de la
Carretera…), alojamiento, comida, servicios y emergencias (posta/hospital +
Carabineros en todos). Criterio conservador: nombres genéricos correctos y
datos de viaje útiles (dónde hay combustible, banco/cajero, derivaciones de
salud); los negocios no verificables van marcados **"(ejemplo)"** como en el
seed de Cochrane, para reemplazarlos por comercios reales en la Fase 3.
**Fuente de verdad de los seeds:** `frontend/src/data/places.js` →
`backend/database/seeders/data/places.json` se regenera desde ahí
(`JSON.stringify(LUGARES_SEED, null, 2)`); mantener esa dirección al editar.
`LOCALIDADES_SEED` (frontend) y `LocalidadSeeder` (backend) también en espejo.
**Verificado:** build+lint frontend OK; `php -l` OK; `migrate:fresh --seed` +
**doble re-seed sin duplicados** (idempotencia) contra PostgreSQL 16 local;
`/api/localidades` (9) y `/api/places` (67 con slug de localidad) comprobados
con `php artisan serve`. Sin cambios de API: solo datos (compatible hacia atrás).

### ✅ 4. Fase 2.5 — Contenido tramo norte (Coyhaique → Puerto Montt) — HECHA (20-jul-2026)
Extender el contenido hacia el **norte** por la Ruta 7, desde Coyhaique hasta
**Puerto Montt** (el km 0 de la Carretera Austral), completando la ruta entera.
Es una continuación directa de la Fase 2 (mismo patrón de datos), **antes** de la
capa comercial (Fase 3). Se ejecuta **por fases, pueblo por pueblo**.

**Avance (19-jul-2026) — Entrega 1: Puerto Aysén + Puerto Chacabuco.** Primeras
dos localidades del tramo (desvío oeste por la Ruta 240, el puerto marítimo de la
región): **15 lugares nuevos** (ids 68-82) — Puerto Aysén 9 (Puente Presidente
Ibáñez, R.N. Río Simpson, Laguna Los Palos, costanera/plaza, combustible+bancos,
hospital, Carabineros, ejemplos de comida/alojamiento) y Puerto Chacabuco 6
(el puerto y sus ferries a Puerto Montt/Quellón, navegación a Laguna San Rafael,
terminal, emergencias, ejemplos). **`orden` reasignado a la ruta completa**:
Puerto Aysén=110, Chacabuco=115, y toda la cadena sur corrida a 120-190
(Coyhaique=120 … Villa O'Higgins=190), dejando 10-100 reservados para los
pueblos del norte por cargar. `LOCALIDADES_SEED`/`LocalidadSeeder` y
`places.js`/`places.json` en espejo. **Verificado:** build+lint frontend OK,
`php -l` OK, ids únicos 1-82, sin lugares huérfanos, orden norte→sur correcto.
La identidad de la app sigue en "Coyhaique a Villa O'Higgins" (se cambia a
"Puerto Montt a Villa O'Higgins" al completar el tramo).

**Avance (19-jul-2026) — Entrega 2: Villa Mañihuales** (orden 100). Primer pueblo
sobre la Ruta 7 al norte del cruce a Aysén; parada de servicios clave en el largo
tramo Coyhaique → La Junta. **8 lugares nuevos** (ids 83-90): Reserva Nacional
Mañihuales (huemul), río Mañihuales (pesca con mosca), plaza/iglesia, combustible
y abastecimiento (con aviso de que al norte no hay bencina confiable hasta La
Junta, ~150 km), posta rural, Carabineros, y ejemplos de alojamiento/comida.
Total del proyecto: **12 localidades, 90 lugares**. **Verificado:** build+lint
frontend OK, `php -l` OK, ids únicos 1-90, sin huérfanos.

**Avance (19-jul-2026) — Entrega 3: Villa Amengual (90) + Puerto Cisnes (95).**
Villa Amengual: pueblo de colonización sobre la Ruta 7, **7 lugares** (ids 91-97):
iglesia de tejuela, Reserva Nacional Lago Las Torres, mirador Cerro Pirámide,
abastecimiento/combustible (informal, aviso de intermitencia), posta rural y
ejemplos de alojamiento/comida. Puerto Cisnes: capital de comuna en la costa del
canal Puyuhuapi, **desvío oeste ~35 km** por la Ruta 7, **9 lugares** (ids 98-106):
costanera/puerto, Piedra del Gato, río Cisnes (pesca con mosca de clase mundial),
P.N. Isla Magdalena, combustible+cajero (el servicio más completo del tramo),
hospital, Carabineros y ejemplos. Total: **14 localidades, 106 lugares**.
**Verificado:** build frontend OK, `php -l` OK, ids únicos 1-106, sin huérfanos.

**Avance (19-jul-2026) — Entrega 4: Puyuhuapi (80) + La Junta (70).** Cierran el
corredor norte de la **Región de Aysén**. Puyuhuapi: pueblo de herencia alemana
(1935) en el fiordo, **9 lugares** (ids 107-115) — P.N. Queulat/Ventisquero
Colgante, Termas del Ventisquero, fiordo y pueblo, Fábrica de Alfombras,
combustible, posta, Carabineros y ejemplos. La Junta: cruce a Raúl Marín
Balmaceda en la confluencia Rosselot/Palena, **9 lugares** (ids 116-124) — R.N.
Lago Rosselot, confluencia de ríos, río Palena (pesca/rafting), desvío a Raúl
Marín Balmaceda (costa/delfines), combustible+cajero confiable, hospital,
Carabineros y ejemplos. Total: **16 localidades, 124 lugares**. **Verificado:**
build frontend OK, `php -l` OK, ids únicos 1-124, sin huérfanos.
**Hito:** completo el tramo norte de Aysén (Coyhaique → La Junta). **Mergeado a
`main` y desplegado (20-jul-2026)**: el bloque Aysén completo (entregas 1-4,
verificado además en navegador con Playwright: selector con los pueblos nuevos,
búsqueda, filtrado por localidad sin fugas, sin errores JS).

**Avance (20-jul-2026) — Entrega 5: Villa Santa Lucía (50) + Futaleufú (55) +
Palena (58).** Primer clúster de la **Región de Los Lagos**: el cruce de la Ruta 7
y su ramal este (bifurcación en Puerto Ramírez). Villa Santa Lucía, **8 lugares**
(ids 125-132): el cruce y su memorial del aluvión 2017, lago Yelcho, sendero
Ventisquero Yelcho, abastecimiento (sin estación — aviso), posta, Carabineros y
ejemplos. Futaleufú, **9 lugares** (ids 133-141): río Futaleufú (rafting/kayak de
clase mundial), lago Espolón, R.N. Futaleufú, paso fronterizo a Argentina,
combustible+cajero, hospital, Carabineros y ejemplos. Palena, **8 lugares**
(ids 142-149): pueblo huaso y rodeo, alto valle del Palena (cabalgatas), paso Río
Encuentro, abastecimiento (variable — aviso), posta, Carabineros y ejemplos.
Total: **19 localidades, 149 lugares**. **Verificado:** build frontend OK,
`php -l` OK, ids únicos 1-149, sin huérfanos, cadena de `orden` correcta.

**Avance (20-jul-2026) — Entrega 6: Chaitén (40) + El Amarillo (45).** Chaitén,
**9 lugares** (ids 150-158): volcán Chaitén y sendero al cráter, costanera del
pueblo renacido tras 2008, playa Santa Bárbara, **terminal de transbordadores**
(ferries a Puerto Montt y Chiloé — la alternativa que evita las barcazas),
combustible+cajero, hospital, Carabineros y ejemplos. El Amarillo, **7 lugares**
(ids 159-165): portal sur del P.N. Pumalín, Termas El Amarillo, volcán
Michinmahuida y su ventisquero, abastecimiento básico (aviso), posta rural y
ejemplos.

**Avance (20-jul-2026) — Entrega 7 (cierre): Caleta Gonzalo/Pumalín (30) +
Hornopirén (20) + Puerto Montt (10).** Caleta Gonzalo, **7 lugares** (ids
166-172): P.N. Pumalín Douglas Tompkins, senderos Cascadas y Alerces, **rampa de
barcazas del cruce bimodal** (Caleta Gonzalo–Fiordo Largo / Leptepu–Hornopirén,
~5 h, temporada+reserva), cabañas/camping y cafetería del parque (infraestructura
real, sin "(ejemplo)"), y emergencias vía guardaparques (sin posta ni señal).
Hornopirén, **9 lugares** (ids 173-181): P.N. Hornopirén, Termas de Llancahué,
costanera/fiordos, **rampa norte del cruce bimodal**, combustible (aviso de
cajero), salud, Carabineros y ejemplos. Puerto Montt, **11 lugares** (ids
182-192): **Hito Cero de la Carretera Austral**, Angelmó, centro/costanera,
P.N. Alerce Andino, **barcaza La Arena–Caleta Puelche** (el primer cruce de la
ruta), terminales de ferries (a Chaitén y Chacabuco), últimas compras/servicios
de ciudad, hospital regional, Carabineros y ejemplos.

**Identidad actualizada (20-jul-2026):** "Coyhaique a Villa O'Higgins" →
**"Puerto Montt a Villa O'Higgins"** en `i18n.jsx` (subtítulo ES/EN),
`vite.config.js` (manifest PWA), `index.html` (meta description), README,
CLAUDE.md y el agente roadmap.

**TOTAL FINAL Fase 2.5: 24 localidades, 192 lugares** (15 localidades y 125
lugares nuevos en la fase). Cadena de `orden` norte→sur: 10 Puerto Montt …
190 Villa O'Higgins.

**Localidades de trabajo, norte→sur** (lista a afinar en la ejecución):
- **Región de Los Lagos:** Puerto Montt (km 0) · Hornopirén (comuna Hualaihué) ·
  Parque Pumalín / Caleta Gonzalo · Chaitén · El Amarillo (Termas del Amarillo) ·
  Villa Santa Lucía · Futaleufú (desvío este, rafting) · Palena (desvío).
- **Región de Aysén (norte, antes de Coyhaique):** La Junta · Puyuhuapi (P.N.
  Queulat / Ventisquero Colgante) · Villa Amengual · Puerto Cisnes (desvío oeste) ·
  Villa Mañihuales · Puerto Aysén · Puerto Chacabuco → **empalma con Coyhaique**
  (contenido actual).
- Adyacente/opcional: Puerto Varas es un hub turístico junto a Puerto Montt pero
  está sobre la Ruta 5, no la Ruta 7 — evaluar si entra como referencia.

**Notas técnicas para la ejecución:**
- **`orden` de localidades:** hoy Coyhaique = 10 es la más al norte y el esquema
  va en decenas (10, 20, … 80). Las nuevas quedan **al norte de Coyhaique**, así
  que no caben en el rango actual → hay que **reasignar el rango de `orden`** para
  toda la cadena (p. ej. Puerto Montt como la menor). La idempotencia por slug se
  mantiene; `LocalidadSeeder` (backend) y `LOCALIDADES_SEED` (frontend) siguen en
  espejo. Ojo con `localStorage.localidadSel` en clientes ya instalados (sigue
  siendo un slug, no cambia).
- **Identidad de la app:** al completar el tramo, cambiar título/subtítulo/i18n de
  **"Coyhaique a Villa O'Higgins" → "Puerto Montt a Villa O'Higgins"** (README,
  `frontend/src/i18n.jsx`, manifest/`vite.config`, este doc y `CLAUDE.md`).
- **Barcazas del tramo** (dato de viaje clave y offline): **La Arena–Caleta
  Puelche** y **Hornopirén–Caleta Gonzalo** (cruza el Parque Pumalín, ~5 h,
  estacional/con reserva). Encaja directo con el reporte "barcazas" del
  crowdsourcing de Fase 3.
- **Fuente de verdad de seeds** igual que Fase 2: editar
  `frontend/src/data/places.js` y regenerar
  `backend/database/seeders/data/places.json` desde ahí; mantener esa dirección.
- **Criterio de contenido** igual que Fase 2: nombres genéricos correctos y datos
  de viaje útiles (combustible, banco/cajero, salud, Carabineros); negocios no
  verificables marcados **"(ejemplo)"** hasta la Fase 3.

### 5. Fase 3 — Capa comercial
Fichas destacadas, planes de negocio, analítica + crowdsourcing tipo Waze.

- **✅ Fichas destacadas — base implementada (21-jul-2026):** primer ladrillo de
  la capa comercial. Un lugar puede marcarse **destacado** y en la app aparece
  **primero dentro de su localidad** y con un **sello coral "Destacado/Featured"**.
  - **Backend:** migración `2026_07_21_000001_add_destacado_to_places_table`
    (`boolean destacado default false`, indexada, aditiva/compatible hacia atrás);
    `destacado` en fillable + cast boolean del modelo `Place` y en `toApi()` (fluye
    solo a la PWA porque `client.js` guarda tal cual la respuesta de la API).
  - **CMS Filament (`PlaceResource`):** toggle en el formulario, `ToggleColumn` y
    `TernaryFilter` en la lista, y acciones en lote **Destacar / Quitar destacado**
    (junto a Publicar/Despublicar).
  - **Frontend:** `App.jsx` sube los destacados al inicio (sort estable, respeta
    grupos de localidad) y pinta el sello; icono `star` en `Icon.jsx`, textos ES/EN
    `destacado` en `i18n.jsx`, estilos `.tarjeta.es-destacado` + `.sello-destacado`
    (acento `--claude`) en `styles.css`. Los lugares sin el campo (seeds/caché
    viejos) se tratan como no destacados.
  - **Deploy:** la migración se aplica sola (`docker/start.sh` corre
    `migrate --force --seed`). **Ojo:** el seeder re-siembra en cada deploy con
    `destacado = $l['destacado'] ?? false`, así que un lugar **semilla** marcado
    destacado solo por el CMS se resetea al redesplegar (igual que ya pasa con
    `publicado`). Para que un semilla quede destacado de forma persistente, marcarlo
    en `frontend/src/data/places.js` → regenerar `places.json` (espejo). Los
    negocios reales (filas nuevas del CMS, fuera de `places.json`) no se tocan.
  - **Verificado:** build+lint frontend OK; `php -l` en los 4 PHP tocados OK;
    navegador (Playwright con API simulada): el destacado sube al primer lugar y
    muestra el sello, sin errores JS.
  - **Pendiente (siguiente):** que los negocios reales del fundador
    (hamburguesería km 1020 + transporte/encomiendas Tortel↔Cochrane) sean las
    primeras fichas destacadas reales; luego resalte también en el marcador del
    mapa y en la ficha de detalle, planes de pago y analítica.

- **Giro de arranque — siembra gratis (21-jul-2026):** antes de la capa de pago,
  poblar el directorio con datos reales gratis para vencer el arranque en frío.
  - **Selección top 10 por localidad:** el paso 2 (`2_generar_textos.py`) rankea
    cada alojamiento por completitud de datos (`3·tel + 2·dirección + 1·email`;
    desempate alfabético) y publica los **10 mejores de cada localidad**
    (`publicado=true` por-lugar en el JSON); el resto queda en borrador. Ajuste:
    `TOP_POR_LOCALIDAD` (0 = todo borrador). Emite `seleccion_gratis.csv` (reporte
    de auditoría) y suma `publicado/score/rank_loc` al Excel.
  - **Seeder por-lugar:** `SernaturPlaceSeeder` respeta el `publicado` de cada
    registro (`self::PUBLICAR` solo como respaldo para JSON antiguos).
  - **Deduplicación por nombre+localidad:** dentro del lote (conserva la ficha más
    completa) y contra lo ya cargado a mano en el CMS (Tortel/O'Higgins) — nombre
    normalizado (sin acentos/mayúsculas/espacios). Omite duplicados e informa.
  - **Solo datos reales:** se quitaron los **44 "(ejemplo)"** (22 alojamiento +
    22 comida) de `places.json` y `places.js` (en espejo); `PlaceSeeder` los purga
    también de la BD (barrido `nombre->es like '%(ejemplo)%'`, idempotente). Quedan
    los reales (Caleta Gonzalo). Los 2 eventos con "(Fecha de ejemplo)" se conservan.
  - **Para aplicarlo:** correr el pipeline + `SernaturPlaceSeeder` en local (el CSV
    fuente vive fuera del repo; el seeder escribe en Neon). El top 10 queda
    publicado sin pasar por `/admin`.

- **Contenido SERNATUR importado (20-jul-2026):** 182 servicios de alojamiento
  de la Región de Aysén (9 comunas) cargados a producción **en borrador**
  (`publicado=false`, ids 2000–2181), pendientes de revisión y publicación desde
  `/admin`. Pipeline reproducible en `scripts/sernatur/` (scraping de teléfono/
  email por ficha, generación de descripciones ES/EN + distancias, seeder
  `SernaturPlaceSeeder`). Textos base autogenerados por tipo → personalizar los
  destacados. Deshacer: `Place::whereBetween('id',[2000,2181])->delete()`.
  - **Publicados (20-jul-2026)** vía acción en lote nueva del CMS (toggle +
    "Publicar/Despublicar" en `PlaceResource`).
  - **⚠ Coordenadas placeholder:** ~41% de los servicios traían coordenadas por
    defecto de SERNATUR (repetidas, hasta ~160 km del pueblo). El script 2 ahora
    las detecta (misma coord compartida por ≥3 y a >15 km del centro) y las
    reubica al centro del pueblo con dispersión. En producción se corrigieron 67
    con SQL puntual. **Pendiente:** coordenadas reales precisas (las direcciones
    de SERNATUR son vagas, "Sector rincón s/n" → no geocodificables gratis);
    ubicar a mano al menos las fichas destacadas.
  - **Pendiente:** revisar/personalizar las descripciones base (son plantillas
    por tipo, no marketing final).

> **⚠ Bloqueo de infraestructura para el crowdsourcing:** los reportes en vivo
> (bencina, cortes, clima, barcazas) necesitan **worker de colas + scheduler**,
> que en **Render free NO corren**, y el arranque en frío (~50s al dormirse a los
> 15 min) es incompatible con algo casi-tiempo-real. → Requiere el always-on de
> la Fase 4 ANTES de encender la Fase 3 en serio. Parche mientras tanto:
> keep-alive con ping a `/up` cada ~10 min (cron-job.org).

### 6. Fase 4 — Producción definitiva
Dominio propio + SSL, respaldos + restauración, logs y monitoreo,
almacenamiento de imágenes en la nube (S3 o equivalente), difusión.
Base lista: `docker-compose.prod.yml` + `docker/README-DESPLIEGUE.md`.

**Plan de migración de infraestructura (anotado 20-jul-2026).** Veredicto: el
stack de frameworks (React/Vite/PWA + Laravel/Filament + Postgres) es el
adecuado — NO reescribir. La mejora real está en el deploy, y se vuelve
necesaria justo al arrancar la Fase 3:

- **Sacar el backend del plan gratis de Render a un host *always-on*.** Es la
  mejora que mueve la aguja: elimina los arranques en frío **y** habilita el
  scheduler (avisos programados) + el worker de colas (crowdsourcing).
- **Camino ya preparado:** VPS de ~5–6 USD/mes (Hetzner/DigitalOcean) con el
  `docker-compose.prod.yml` existente (Caddy+SSL) → backend + Postgres + worker
  + scheduler, sin dormirse y con control total.
- **Imágenes de reportes/fichas:** almacenamiento S3-compatible; **Cloudflare R2**
  (egress gratis) como opción más barata.
- **Observabilidad:** Sentry (free) para errores antes de tener usuarios reales.
- **Respaldos:** PITR/backups del Postgres (Neon los da parcialmente; en VPS,
  automatizar dump + retención).
- **NO hacer:** migrar a Next.js/TypeScript/backend JS (no resuelve nada real y
  tira la ventaja de Filament); ni adelantar infra que aún no se necesita.

### Menores
- **✅ UX de multi-localidad (Fase 2) — RESUELTO (14-jul-2026):**
  (a) "Toda la ruta" ahora se agrupa por localidad con encabezados de sección,
  ordenados por **cercanía al GPS** del usuario (norte→sur si no hay ubicación;
  el GPS solo se usa si el permiso ya fue concedido — sin prompt sorpresa, vía
  `navigator.permissions`); (b) el `<select>` del header se reemplazó por un
  **selector con búsqueda** (`components/SelectorLocalidad.jsx`); (c) el
  **ChatBot** ahora recibe `lugaresVisibles` + el nombre de la localidad activa
  — respuestas por pueblo con datos filtrados, y los consejos de prosa que
  estaban cableados a Cochrane (bencina de Río Maitén, teléfonos, Tamango,
  Festival Costumbrista) se generalizaron para no mentir en otros pueblos.
  Iconos `chevron-down`/`search` añadidos a `Icon.jsx`. Verificado en navegador
  (build/lint OK, Playwright: filtrado por localidad, orden GPS, buscador).
- **Contenido "(ejemplo)":** los alojamientos/restoranes marcados "(ejemplo)"
  en las 9 localidades son marcadores de posición; se reemplazan por comercios
  reales al levantar la capa comercial (Fase 3).
- **✅ Push en iOS — RESUELTO (21-jul-2026):** iOS no dispara `appinstalled` y
  exige un gesto del usuario para pedir el permiso → un iPhone instalado no tenía
  vía para suscribirse. Se añadió la **tarjeta única "¿Quieres recibir avisos?"**
  (`App.jsx` + `.tarjeta-push` en `styles.css`, textos ES/EN en `i18n.jsx`): sale
  **solo en modo standalone** (`display-mode: standalone` o
  `navigator.standalone`), con push soportado y permiso **pendiente** (`default`);
  al tocar "Activar avisos" pide el permiso (el gesto habilita `requestPermission`
  en iOS) y suscribe vía `activarPush()`; se conceda o se deniegue, la tarjeta se
  cierra y no vuelve (persistido en `localStorage.tarjetaPushCerrada`). Es
  contextual, única y descartable — **no** es el viejo botón visible de activación
  (que sigue prohibido). Sirve también como **respaldo en Android** si el flujo de
  `appinstalled` no alcanzó a pedir el permiso. De paso, el banner "Instalar" se
  oculta cuando la app ya corre instalada (antes salía dentro del standalone, sin
  sentido). Verificado en navegador (Playwright): oculta en pestaña normal,
  visible en standalone con permiso pendiente, sin errores JS; build+lint OK.
- Revisar categorías del directorio para el producto propio (¿rutas
  patrimoniales? ¿comercios locales?).
- Mantener el peso inicial de la PWA bajo (~20 MB) para instalabilidad.

---

## Datos de mercado (temporada alta 2026 — fuente: Red de Informadores Turísticos, Patagonia Chilena)

Dic 2025 – Mar 2026. Son atenciones de Oficinas de Información Turística (OIT) y
conteo de "grupo de viaje" — un indicador/muestra, NO el total de turistas (la
ruta completa mueve ~100–150 mil/año).

- **Región de Aysén:** 16.998 personas (grupo de viaje); 6.357 atendidas en OIT.
- **Atenciones por destino (Aysén):** Cochrane **1.312 (#1)**, Cisnes 1.301,
  Chile Chico 1.213, Río Ibáñez 1.024, Coyhaique 720, O'Higgins 486, Aysén 178,
  Lago Verde 102, **Tortel 21**.
- **Subdestino Provincia Capitán Prat** (Cochrane/O'Higgins/Tortel): 5.477
  personas; 1.819 atendidas (ene 653, feb 743, mar 423). Pico ene–feb.

**Lecturas estratégicas:**
- **Cochrane es el destino #1 de Aysén por atenciones OIT** → la zona base del
  proyecto es la más consultada de la región. Fuerte para la capa comercial.
- **Tortel: solo 21 atenciones OIT** pese a ser icónico → poca presencia de
  oficina física. Oportunidad clara: la app como "OIT digital" de Tortel.
- El eje **Capitán Prat** (donde opera el fundador) movió 5.477 personas en
  temporada → mercado real y concreto para sus negocios.

**Negocios reales del fundador → primeras fichas destacadas de Fase 3** (km 1020,
entre Caleta Tortel y Cochrane):
1. **Hamburguesería** (punto fijo, km 1020).
2. **Transporte** (furgón 12 pax) **+ encomiendas Tortel↔Cochrane** (por lanzar).
   Es además un caso real del problema de conectividad que la app aborda — insumo
   directo para el PMV de crowdsourcing y para validar el segmento.

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
