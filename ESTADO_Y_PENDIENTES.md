# Estado del proyecto y pendientes — Patagonia Austral

**Proyecto personal/comercial propio.** PWA de turismo offline-first para la
**Carretera Austral completa** (Puerto Montt a Villa O'Higgins) + CMS (Filament).
Stack: **React 18 (Vite) + Laravel (PHP 8.x) + PostgreSQL 16**.

Repo: https://github.com/multix20/patagonia-austral — rama `main`.

> **Rumbo y priorización estratégica:** ver `ROADMAP.md` (visión 2026–2027, en qué
> invertir y qué **no** hacer). Este archivo es el **registro operativo** (bitácora
> fechada + backlog); aquél fija la dirección. Principio: **curar, no acumular.**

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

**En sesión web de Claude Code (contenedor efímero, sin `vendor/` ni BD).** Vale
la pena levantarlo igual: es la diferencia entre "compila" y "funciona" — así
salieron los tres bugs del crowdsourcing que `php -l` + build no ven. Receta:

```bash
cd backend
composer install --ignore-platform-req=ext-gmp   # OJO: falta ext-gmp (la usa web-push);
                                                 # sin ese flag el install falla entero
cp .env.example .env && php artisan key:generate --force
touch database/database.sqlite                   # .env ya trae DB_CONNECTION=sqlite
php artisan migrate --force --seed               # verifica migraciones Y seeders de verdad
php artisan test                                 # suite completa
php artisan serve --port=8000 &

cd ../frontend                                   # PWA apuntando a esa API real
VITE_API_URL=http://127.0.0.1:8000 npm run build && npx vite preview --port 4173
```

`config/cors.php` ya permite `localhost:4173`, y con Playwright
(`executablePath: '/opt/pw-browsers/chromium'`, permiso `geolocation`) se prueba
el ciclo completo en el navegador. `composer install` tarda ~8 min: lanzarlo en
segundo plano y seguir escribiendo código mientras baja.

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

> **✅ RESUELTO (29-jul-2026):** la alerta anterior decía que el PMV de
> crowdsourcing estaba sin fusionar en `claude/cosmetic-service-data-updates-6sq70v`.
> Ya no: entró por el **PR #34** y está en `main` y desplegado. Se verificó rama
> por rama que **todo el trabajo estaba en `main`** y se limpiaron las **27 ramas**
> que quedaban vivas — el repo tiene solo `main`. Los SHA quedaron anotados en
> `RAMAS_ARCHIVADAS.md` por si hay que revivir alguna.

- **Cuánto contenido cabe — cálculo de capacidad (27-jul-2026).** Con 26
  localidades × 6 categorías, publicar 10 por cupo daría **1.560 fichas**; hoy
  hay **156 publicadas** (1 por cupo) y **338 reales** en total (156 redactadas en
  el repo + 182 alojamientos SERNATUR en la BD). Pero 1.560 es aritmética, no
  meta: **Villa Amengual no tiene 10 restaurantes**. Con topes por tamaño real
  (2 ciudades 10 por cupo; 16 pueblos 8/5/5/3/2/3; 8 caseríos 2–3) el techo
  realista es **~608 fichas**, repartidas así: dormir 172, visitar 124, comer 116,
  servicios 76, emergencias 72, eventos 48. → **La meta razonable es ~600, no
  1.560**, y el grueso del esfuerzo es dormir + comer (288), que es justo lo que
  se pide por correo a encargadas de turismo y dueños. Eventos y emergencias
  nunca llegan a 10: un pueblo tiene una posta y un retén.

- **✅ Crowdsourcing tipo Waze — PMV implementado (27-jul-2026):** el panel
  "¿Qué ves en la ruta?" dejó de ser vista previa: los reportes se guardan,
  aparecen en el mapa de todos y la comunidad los sostiene o los entierra.
  - **Truco que lo hace posible en Render free (sin worker ni scheduler):** cada
    reporte nace con `expira_en` según su tipo (`Reporte::VIDA_HORAS`: clima y
    fauna 6 h, hielo/barcaza 12 h, camino/bencina 24 h, derrumbe 48 h, camping y
    evento 72 h) y **la caducidad se evalúa al LEER**. No hay nada que barrer en
    segundo plano: un reporte "muere" solo aunque el contenedor esté dormido.
  - **Backend:** migración `2026_07_27_000002_create_reportes_table` (tablas
    `reportes` y `reporte_votos`), modelos `Reporte`/`ReporteVoto`,
    `ReporteController` y tres rutas públicas — `GET /api/reportes` (libre),
    `POST /api/reportes` (`throttle:10,1`) y `POST /api/reportes/{id}/voto`
    (`throttle:30,1`).
  - **Calidad del dato sin moderador de turno:** confirmar suma y **estira** la
    vigencia (+3 h, tope 24 h); **3 descartes** con más descartes que
    confirmaciones **ocultan** el reporte (no se borra: queda para el CMS). Un
    voto por dispositivo, con índice único en la BD — no se infla recargando.
  - **Privacidad:** sin login. El id del dispositivo es un UUID aleatorio del
    `localStorage` y el backend guarda solo su **sha256**; no se almacena
    identidad ni historial de ubicación, solo el punto del reporte.
  - **Anti-duplicado:** mismo dispositivo + mismo tipo + ≤250 m + ≤2 h devuelve el
    reporte existente. Cubre el doble toque y, sobre todo, el reintento de la cola
    offline cuando la respuesta se perdió.
  - **Offline-first de verdad (lo importante en la Carretera):** el reporte se hace
    justo donde no hay señal, así que va a un **buzón de salida** en IndexedDB
    (store `salientes`, DB v4) y se envía al volver la conexión (evento `online`),
    con toast honesto ("Guardado sin señal…"). El SW cachea `/api/reportes` con
    **NetworkFirst** (regla antes de la genérica de `/api/`), porque con
    StaleWhileRevalidate se veía primero el estado viejo del camino.
  - **Frontend:** tipos en `data/reportes.js` (compartidos por hoja, mapa y API),
    pin **rombo** `.pin-rep` (distinto de la gota de los lugares: es temporal y lo
    puso otro viajero), tarjeta `.rcard` con antigüedad + comentario + los dos
    botones de voto, y campo de detalle opcional en la hoja. Ubicación: GPS del
    viajero, o el centro de la localidad abierta si no dio permiso.
  - **CMS:** `ReporteResource` (solo lectura + moderación): badge con los vigentes
    en el menú, filtros por tipo/vigentes/ocultos, ocultar-mostrar individual y en
    lote, y "extender 24 h" para revivir un reporte cierto.
  - **Verificado de punta a punta** (no solo `php -l`): se instaló `vendor` y se
    levantó Laravel con SQLite → **7 tests nuevos** (`ReporteApiTest`, 32
    aserciones) cubren caducidad, validación, anti-duplicado, voto único,
    auto-ocultado y atribución de localidad; y con la PWA apuntando a esa API real
    se probó en el navegador el ciclo completo: reportar → pin en el mapa → abrir
    tarjeta → votar → modo avión → cola → recuperar señal → envío automático. Sin
    errores JS.
  - **Dos bugs que aparecieron por probar de verdad** (no se habrían visto con
    `php -l` + build): `oculto` no estaba en el `$fillable` de `Reporte`, así que
    **ocultar un reporte fallaba en silencio** (auto-ocultado y CMS); y el
    marcador "Estás aquí" capturaba los toques, dejando **imposible de abrir** un
    reporte hecho en el mismo lugar (ahora `interactive: false`). De paso, el
    toast: el temporizador del anterior borraba el nuevo antes de los 3 s, y los
    mensajes largos se cortaban a la derecha (`nowrap`).
  - **Pendiente (siguiente):** avisar por **push** cuando aparece un reporte
    cerca — eso sí necesita el worker de colas del always-on (Fase 4); hoy el
    viajero ve los reportes al abrir la app. Después: filtrar por tramo/localidad
    en la vista, y agrupar pines cuando haya varios en el mismo punto.

- **✅ Un servicio publicado por localidad y categoría (27-jul-2026):** con la
  UX/UI ya pulida, el foco pasa al **dato**. El directorio queda en **156 fichas
  publicadas = 26 localidades × 6 categorías**, una sola por cupo, para poder
  salir a pedir la información oficial con un esqueleto parejo (correo a las
  encargadas de turismo municipal, correo a los dueños de alojamiento/comida, o
  extracción desde fuentes públicas / Google Maps).
  - **Nada se borra:** los 75 lugares que salen de circulación quedan en
    `places.json` / `places.js` con **`publicado: false`** (texto ya redactado,
    listos para volver cuando se abra la mano). `PlaceSeeder` ahora respeta ese
    flag en vez de forzar `publicado = true`.
  - **Cupos vacíos → fichas `preliminar: true`** (ids **3001–3083**): nombre
    verosímil **sin teléfono inventado**, con el texto diciendo que el dato está
    por confirmar. Cubren dormir/comer/eventos donde no había nada. El seeder las
    publica **solo si el cupo sigue vacío**, así un dato real (alojamiento
    SERNATUR o ficha del CMS) siempre les gana.
  - **Contenido real nuevo:** Raúl Marín Balmaceda y Balmaceda no tenían ningún
    lugar cargado — ahora tienen atractivo, servicio y emergencia reales; se
    sumaron también los `servicio` que faltaban en Puerto Río Tranquilo y Caleta
    Tortel.
  - **Criterio de selección:** se conserva el primer lugar redactado de cada
    categoría (el orden va del más icónico al más secundario), salvo dos ajustes
    (Villa Santa Lucía → lago Yelcho; Puerto Chacabuco → navegación al San
    Rafael); en `servicio` gana el enlace de la ruta (barcaza/rampa/terminal)
    cuando la localidad es un cruce, y el combustible/abastecimiento en el resto.
    En `emergencia` gana siempre salud (hospital o posta) sobre Carabineros.
  - **Producción:** migración `2026_07_27_000001_publicar_un_servicio_por_localidad`
    (pasada única) normaliza lo que el seeder no toca —los ~100 alojamientos
    SERNATUR (ids 2000+) y lo cargado a mano en el CMS— despublicando todo y
    dejando un candidato por cupo (destacado → con teléfono → id más bajo). De ahí
    en adelante manda el CMS.
  - **Frontend:** `client.js` filtra `publicado !== false` al sembrar IndexedDB,
    para que la semilla offline muestre lo mismo que sirve la API.
  - **Verificado:** build + lint frontend OK, `php -l` OK, y simulación del par
    migración + seeder (con lote SERNATUR y una ficha nueva del CMS): 156
    publicados, exactamente 1 por cupo, idempotente al reiniciar el contenedor.
  - **Pendiente (siguiente):** **segunda revisión de las 156 fichas** cuando
    llegue el dato oficial — y con **fotos**, que el CMS todavía no permite subir
    (ver el backlog: depende del almacenamiento S3/R2 de la Fase 4, porque el
    disco de Render free es efímero).

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

> **⚠ Bloqueo de infraestructura para el crowdsourcing — ACOTADO (27-jul-2026).**
> El diagnóstico original decía que los reportes en vivo necesitaban **worker de
> colas + scheduler**, que en Render free NO corren. Al construir el PMV se pudo
> **esquivar las dos piezas**: la caducidad se evalúa al leer (no hace falta
> scheduler para barrer reportes viejos) y no se despacha push por reporte (no
> hace falta worker). Lo que sigue bloqueado y sí requiere el always-on de la
> Fase 4:
>
> - **Push de "hay un reporte cerca"** (worker de colas para despachar).
> - **Avisos programados a futuro** (scheduler; ya era un pendiente conocido).
> - **Arranque en frío ~50 s** al dormirse a los 15 min: el primer reporte del día
>   se siente lento. Parche mientras tanto: keep-alive con ping a `/up` cada ~10
>   min (cron-job.org).

### Backlog de features (anotar aquí las ideas; se priorizan al planificar)

- **⚠ CORRECCIÓN DE RUMBO — la conectividad de la ruta (29-jul-2026).** Dato del
  fundador, que vive y trabaja en el tramo: **en los pueblos SÍ hay señal, y
  buena (sobre todo Entel)**. La falta de cobertura está **en la ruta entre
  pueblos y en las afueras**, no dentro de ellos. Esto corrige un supuesto que
  venía repetido en los documentos del proyecto y **cambia el argumento de venta**:
  - **El argumento fuerte pasa a ser la CALIDAD DEL DATO, no la conectividad.** El
    turista en el pueblo sí puede buscar; lo que encuentra sobre los servicios
    chicos de la Austral está incompleto, desactualizado o ausente. Ese es el
    problema que además el municipio y el dueño reconocen como propio y pueden
    resolver — que es justo lo que se les pide.
  - **El offline sigue siendo real, pero es la segunda razón y hay que ubicarla
    donde ocurre: la decisión se toma EN LA RUTA, antes de llegar** (si sigo al
    próximo pueblo, si alcanza la bencina, si conviene parar antes). Ahí no hay
    señal y no hay ninguna otra guía.
  - **El crowdsourcing gana coherencia:** el reporte se *hace* en la ruta sin señal
    y se *entrega* al llegar al pueblo con señal — que es exactamente lo que hace
    la cola offline en IndexedDB ya implementada. No es un parche: es el ciclo
    natural del viaje.
  - **✅ Documentos actualizados (29-jul-2026):** `CLAUDE.md` (cómo se cuenta el
    producto, con la regla de no escribir copy que insinúe pueblos incomunicados) y
    `ROADMAP.md` §1 (visión + apuesta estratégica: la **calidad del dato local**
    pasa a ser el diferenciador n.º 1, y el offline-first deja de ser el titular
    para quedar como lo que hace usable el resto en la ruta).

- **⚡ Presión sobre las camas por las obras (29-jul-2026) — dato nuevo, y el
  mejor argumento aparecido hasta ahora.** Verificado en fuentes públicas tras un
  dato de radio:
  - **Aysén cerró la temporada con 76,8% de ocupación hotelera en enero y 75,7% en
    febrero**, entre las más altas del país y sobre el promedio nacional (Sernatur).
  - El **alcalde de Cochrane** señala que obras de esta magnitud generan demanda de
    mano de obra "además de servicios asociados como **alojamiento**, alimentación,
    transporte y abastecimiento" (Emol, 23-may-2026).
  - Nombre oficial del plan, para citarlo bien: *Programa de Inversión Especial Red
    Austral 2026–2030*, **«Ruta Austral: Soberanía que Conecta»**, **$800.393
    millones**, anunciado el 30-abr-2026 (MOP).
  - **La lectura (nuestra, no publicada):** con la ocupación ya en ~77% en
    temporada alta no queda holgura, y en pueblos de cinco o seis hospedajes una
    cuadrilla instalada por meses se nota de inmediato. Durante cuatro temporadas,
    **"¿dónde hay dónde dormir esta noche?" pasa a ser la pregunta más valiosa de
    la ruta** — y hoy nadie la responde.
  - **Sirve para las dos audiencias con el mismo hecho:** al dueño de alojamiento
    es una buena noticia (va a haber demanda, y por eso importa más que su ficha
    exista con el teléfono correcto), y al municipio le nombra un problema que ya
    ve venir y para el que no tiene herramienta.
  - **✅ Reporte "Alojamiento lleno" — IMPLEMENTADO (29-jul-2026).** Tipo nuevo
    `alojamiento`, **12 h de vida**: cubre la decisión de esa tarde y la mañana
    siguiente, que es cuando el dato sirve para seguir de largo o llamar antes;
    pasado eso las piezas se desocupan y el aviso pasaría a mentir. Cuatro
    archivos, porque el motor ya existía: `Reporte::VIDA_HORAS` (el backend valida
    contra esa lista, así que agregar la clave habilita la API entera),
    `ReporteResource::TIPOS` en el CMS, `REPORTES` en `data/reportes.js` (icono
    `bed`, rojo `#B3261E`) e i18n ES/EN.
  - **Decisión: NO se agregó el reporte inverso ("queda alojamiento").** Tres
    razones: (a) es mucho más perecible —una pieza libre se toma en una hora— y un
    aviso vencido de disponibilidad manda al viajero a un pueblo lleno, que es peor
    que no decirle nada; (b) sería una **superficie de publicidad**: en cuanto los
    dueños noten que pueden publicar "tengo camas", el muro de reportes deja de ser
    viajero-a-viajero y se vuelve marketing, que es justo lo que sostiene la
    confianza del sistema; (c) "tengo disponibilidad" pertenece a la **capa
    comercial** —gestionado desde la ficha del negocio, con el dueño respondiendo
    por el dato— y no al feed anónimo. Si se decide igual, es una línea en
    `VIDA_HORAS` y otra en `REPORTES`.

- **Guías Chiletur (Copec) como referencia de diseño (29-jul-2026).** Editadas por
  Copesa y distribuidas por Copec hace más de 30 años; se venden en las estaciones
  de servicio y las conoce cualquier chileno que maneje. Zonas Norte/Centro/Sur
  más una guía "Rutas"; mapas ruteros (Editorial Compass), planos de ciudades,
  recorridos propuestos y listados de hoteles y restaurantes. Lo que hay que tomar
  de ellas: **lenguaje de guía de ruta y no de software** (kilometraje, simbología
  de servicios, orden geográfico norte→sur), densidad honesta —están llenas de
  información y aun así se leen— y autoridad tranquila. Aplica tanto a la landing
  como, más adelante, a cómo se presenta el directorio.

- **Mapa de Chile para promocionar la guía (29-jul-2026), por construir.** Un mapa
  del país que muestre **dónde está la Carretera Austral**, para quien no la ubica.
  Usos: portada de la landing, redes sociales, y un impreso para dejar en la
  hamburguesería, en el furgón y en las oficinas de turismo municipal. Hacerlo en
  **SVG propio y autocontenido** (nada de teselas remotas: la landing no puede
  cargar recursos externos y un impreso necesita vectores). Bien hecho sirve para
  las tres cosas con el mismo archivo. Encaja con la referencia Chiletur de arriba.

- **⚠ Landing de presentación — VERSIÓN PROVISORIA (29-jul-2026), a rehacer.** Página para
  mostrarle el proyecto a **encargadas de turismo municipal, alcaldes y dueños de
  servicios turísticos**: es el soporte de la campaña de correos, la mitad del
  cuello de botella que **no** depende de programar (que contesten). Vive en
  `frontend/public/proyecto.html`, se publica sola con el build de Netlify en
  **`/proyecto`** (regla en `netlify.toml`, puesta ANTES del catch-all del SPA
  porque gana la primera que calza).
  - **Estática y aparte de la app a propósito:** no toca `App.jsx` ni agrega
    routing (el ROADMAP dice explícitamente que no se fuerza `pages/` mientras
    haya una sola vista). Un archivo en `public/`, cero riesgo de regresión.
  - **Fuera del precache** (`globIgnores: ['proyecto.html']` en `vite.config.js`):
    sin eso el service worker la metía en el app shell y **cada turista se
    descargaba una página dirigida a alcaldes** (el precache pasaba de 10 a 11
    entradas). Se lee una vez, con señal, desde un computador de oficina.
  - **Contenido:** el problema (sin señal + Tortel con 21 atenciones OIT), la
    propuesta, las 26 localidades listadas norte→sur (que el alcalde vea su pueblo
    en la lista), el Plan Ruta Austral como razón de urgencia, y **el pedido
    separado en dos** — municipio (listado + contacto) y dueño de servicio (ficha
    + foto propia). Solo en español: el destinatario es chileno.
  - **Honestidad explícita**, porque el lector es una autoridad: dice que es un
    proyecto privado independiente, que NO es de SERNATUR ni de un municipio, que
    las fotos se usan solo con autorización, y explica por qué hay fichas que
    dicen "por confirmar" en vez de esconderlo.
  - **⚠ Falta rellenar antes de publicar:** los marcadores `[TU-NOMBRE]`,
    `[TU-CORREO]` y `[TU-WHATSAPP]` (comentario con instrucciones al inicio del
    archivo). Se pintan en rojo en la página a propósito, para que no se escape
    uno sin reemplazar. El correo idealmente del **dominio propio**, que es el
    punto 1 del plan de inversión justamente por esto.
  - **Verificado:** build + lint OK, precache de vuelta en 10 entradas /
    573,62 KiB, y navegador (Playwright 1280×900 y 390×844): sin desborde
    horizontal ni errores JS.
  - **⚠ NO MERGEAR COMO ESTÁ.** Se construyó antes de la corrección de
    conectividad de arriba y **abre con el argumento equivocado** ("el turista no
    puede buscar en Google al llegar al pueblo" — en el pueblo sí puede). Peor:
    lo va a leer alguien que vive ahí y sabe que es falso, y la credibilidad se
    pierde en el primer párrafo. Sirve como referencia de **estructura y de
    restricciones técnicas**, no de contenido. El encargo de la versión buena
    quedó escrito en **`BRIEF_LANDING.md`**, listo para pegarse como prompt a una
    IA de diseño.

- **✅ Fotos de las fichas — (a) IMPLEMENTADO (29-jul-2026); (b) pendiente.**
  El CMS ya permite subir fotos y la PWA las muestra. Se adelantó la pieza de
  almacenamiento de la Fase 4 porque era el bloqueo de todo lo demás.
  - **Almacenamiento — Cloudflare R2** (S3-compatible, **egress gratis**: las
    fotos las descarga el navegador de cada turista, que es justo el costo que en
    S3 se dispara). Disco `r2` en `config/filesystems.php`, seleccionable con
    `FOTOS_DISK` (`public` en local/CI, `r2` en producción). Receta de conexión
    paso a paso en `DEPLOY.md` §2.5. Plan free: 10 GB ≈ 65.000 fotos, muy por
    encima del techo real de la ruta (~608 fichas).
  - **Datos:** columna `imagenes` **jsonb** (lista ordenada) y no una `imagen`
    suelta — así la segunda foto no cuesta otra migración *ni otra pasada* sobre
    las fichas ya publicadas. Se guardan **rutas relativas**, no URLs: cambiar a
    dominio propio es cambiar `R2_URL`, no migrar 200 filas.
  - **Conversión al subir** (`ImagenServicio` + `GuardarFoto`, GD directo para no
    sumar dependencias al build de Render): WebP, lado máximo 1600 px, calidad 82
    → una foto de celular de 4 MB queda en ~150 KB. Endereza por EXIF (si no, las
    verticales salen acostadas). Se hace **en la petición** porque en Render free
    no hay worker: lo que no se haga ahí, no se hace nunca. Números en
    `config/fotos.php`.
  - **CMS:** `FileUpload` múltiple y reordenable en `PlaceResource` (máx. 6),
    miniatura de portada en el listado y **filtro "Con foto / Solo SIN foto"** —
    cruzado con el filtro de localidad, es la lista de trabajo para pedir fotos.
  - **PWA:** cabecera de `PlaceDetail` y miniatura de `QuickCard` usan la primera
    foto; el resto ya viaja en el JSON, listo para el carrusel. Velo inferior para
    que el título blanco se lea sobre fotos claras.
  - **Offline-first respetado:** las fotos **no** entran al precache (sigue en 10
    entradas / ~573 KiB); van por runtime caching `CacheFirst` (`fotos-fichas`,
    300 entradas, 60 días), como las teselas. Sin foto o sin red, la ficha cae en
    el degradado + icono de siempre (`onError` esconde la imagen).
  - **Ojo de arquitectura:** `toApi()` fuerza URL **absoluta**. La PWA vive en
    Netlify y la API en Render, así que una ruta relativa se resolvería contra el
    dominio equivocado y daría 404 silencioso.
  - **Verificado:** 7 tests nuevos (`FotosFichaTest`, suite 16/16) — conversión y
    reescalado reales con GD, no agrandar fotos chicas, archivo corrupto que no
    deja ficha rota, URLs en orden y `[]` cuando no hay fotos. Lint + build OK.
  - **Requiere acción manual:** crear el bucket R2 y cargar las 6 variables en
    Render (`DEPLOY.md` §2.5). Hasta que eso ocurra, el CMS en producción sigue
    sin poder guardar fotos. Además el `Dockerfile` ahora compila GD `--with-webp`
    (sin eso `imagewebp()` no existe y toda subida se descartaría).
    Ojo al activarlo: Cloudflare **pide tarjeta** para habilitar R2 aunque el uso
    quepa en el plan gratis.
  - **Pendiente menor, para la Fase 4:** el dominio público `r2.dev` viene con
    *rate limit* y sin CDN completa (Cloudflare lo limita a propósito, es para
    desarrollo). Con tráfico de temporada alta conviene un subdominio propio
    apuntando al bucket. Es **cambiar `R2_URL` en Render y nada más**, porque en
    la BD hay rutas relativas, no URLs — sin migración de datos.
  - **(b) PENDIENTE — segunda pasada sobre las 156 fichas** publicadas por la
    regla "un servicio por localidad": reemplazar las `preliminar: true` por el
    dato oficial y, ahí mismo, cargarles foto. Ahora sí se puede hacer de una sola
    vez por ficha.
  - **Fuente de las fotos:** propias o cedidas por el negocio (el correo a los
    dueños puede pedirlas junto con los datos). **No** raspar imágenes de Google
    Maps ni de sitios de terceros: son de sus autores y traen problema de licencia.

- **Avisos segmentados por zona — diseño acordado (21-jul-2026), por construir.**
  Que la campanita/push avise de "actividades en tu zona" sin rastrear a nadie.
  Puente entre los avisos actuales (el admin publica a todos) y el crowdsourcing
  (mismo rail de segmentación por el que después corren los reportes Waze).
  - **Diseño elegido — opción (b), segmentar por localidad elegida, cero GPS
    almacenado:** la suscripción push del dispositivo se **etiqueta con el slug**
    de la localidad elegida en el selector (`localStorage.localidadSel`); cambiar
    de localidad = re-registrar (el POST `/api/push/subscribe` ya hace
    `updateOrCreate` por endpoint, así que es gratis). El aviso lleva **localidad
    + radio en km** (default 100) opcionales; el backend calcula qué localidades
    caen dentro del radio (haversine entre los centros de `localidades`, que ya
    tienen lat/lng) y `WebPushSender` envía **solo** a las suscripciones de esas
    localidades. **Privacidad:** no se guarda ubicación de nadie — solo "me
    interesa la zona de X".
  - **Reglas:** aviso **sin** localidad = global (llega a todos: actualizaciones
    de la app, nuevas localidades, mapas). Suscripción con "Toda la ruta"
    (`todas`) = recibe todo. Aviso con localidad+radio = solo a la zona.
  - **Piezas:** columna `localidad_slug` (nullable) en `push_subscriptions` +
    aceptarla en `PushController`; campos `localidad_id`/`radio_km` (nullable) en
    `notices` + en el CMS (`NoticeResource`); filtro por distancia en
    `WebPushSender`; frontend re-registra la suscripción al cambiar localidad.
  - **No bloqueado por infra:** va por el envío inmediato del `NoticeObserver`
    (sin scheduler) → funciona en Render free.
  - **Decisión abierta:** el selector también se usa para *ojear* otros pueblos
    ("estoy en Chile Chico pero miro Tortel") — definir si la zona de push sigue
    al selector siempre (más simple, deriva del uso) o se fija aparte ("mi zona")
    con un control propio. Partir por la simple y medir.
  - **Panel de la campanita:** decidir al construir si muestra todos los avisos o
    solo los de la zona + globales (el push sí va filtrado; el panel puede ser más
    permisivo para no ocultar información de ruta).

- **✅ Clustering de pines — HECHO (21-jul-2026).** Ver detalle en "Menores".

- **Mejoras por componente (análisis Figma AI, 21-jul-2026), por priorizar.**
  Lote de sugerencias de UX; se irán haciendo en PRs chicos y enfocados:
  - **✅ ChatBot (🔴 alta) — HECHO (21-jul-2026):** Markdown en mensajes +
    historial en `sessionStorage` + atributos del input. Ver detalle en "Menores".
  - **✅ PlaceDetail (🟡 media) — HECHO (21-jul-2026):** CTA "Cómo llegar"
    prominente, icono de categoría grande en el gradiente y botón compartir. Ver
    detalle en "Menores".
  - **✅ SelectorLocalidad (🟢 baja) — HECHO (21-jul-2026):** highlight de
    búsqueda, contador y punto verde. Ver detalle en "Menores".
  - **Nota:** con esto queda **completo el análisis de Figma AI** (todos los
    componentes). Lo único de UX que sigue en backlog aparte son el selector por
    km / mini-mapa y la card como bottom-sheet (más abajo).
  - **MapView (menores):** feedback del botón *ubicarme* (spinner/texto mientras
    busca, porque en móvil el `title` no se ve); **fade** de la línea de ruta al
    deseleccionar.
  - **✅ Icon (trivial) — HECHO (21-jul-2026):** `locate` añadido a `EXTRAS` del
    componente React (los círculos del crosshair que ya estaban en `iconoHTML`).

- **Selector de localidad por km / mini-mapa de ruta (21-jul-2026), backlog.** Hoy
  el selector es un dropdown con búsqueda por nombre: el viajero tiene que saber
  los nombres de los pueblos. Idea: progresión por kilómetro (km 0 Puerto Montt →
  km ~1240 Villa O'Higgins) o un mini-mapa horizontal de la ruta como selector,
  más intuitivo. **Bloqueante de datos:** no tenemos el km de ruta por localidad
  (hoy solo `orden` en decenas); habría que calcularlo/cargarlo. Diseño a definir.

- **Card como bottom-sheet con swipe (21-jul-2026), backlog.** Darle a la tarjeta
  de resultado un handle de arrastre para expandirla (más alto visible, más
  jerarquía) en vez de la lista fija actual. Interacción nueva (gesto), evaluar
  contra la simplicidad actual.

- **Avisos de actualizaciones de contenido (21-jul-2026), por construir.** Avisar
  por la campanita cuando hay contenido nuevo (nueva localidad publicada, tanda de
  lugares nuevos, mejora del mapa offline). Bajo esfuerzo: disciplina editorial
  (publicar el aviso junto con el contenido) o un observer al publicar `Localidad`
  (cuidando no spamear: agrupar por tanda, no un push por lugar). Los avisos de
  este tipo son **globales** (sin zona). Funciona ya con la infraestructura
  actual.

- **Más data SERNATUR — "dónde comer" y refresco (22-jul-2026), por construir.**
  Las fuentes quedaron documentadas en `scripts/sernatur/` (README → "Fuentes de
  datos" y comentario en `1_extraer_fichas.py`): buscador SERNATUR
  `nueva_busqueda.php` con `tipo_servicio` (**1 = alojamiento**, **2 = dónde
  comer**), `region=11` (Aysén). Hoy el pipeline cubre solo alojamiento; **sumar
  comida** = descargar el listado con `tipo_servicio=2` y en el paso 2 mapear la
  categoría a `comida` con su descripción base (el resto del flujo se reutiliza).
  Fuentes de contexto (no consumidas aún): `estadisticas.aysenpatagonia.cl` y
  `aysenpatagonia.cl/planifica-tu-viaje`.

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
- **✅ Publicar top 10 de alojamientos por código — (22-jul-2026):** los
  alojamientos SERNATUR ya estaban cargados en Neon pero en **borrador**; se
  habilitan por sistema en vez de uno por uno en el CMS. La **migración**
  `2026_07_22_000001_publicar_top_alojamientos` corre una vez en el deploy
  (`migrate --force`) y publica la **selección EXACTA del pipeline**: los **102 ids**
  marcados `"publicado": true` en el `sernatur_places.json` del fundador (score
  `3·tel + 2·dirección + 1·email`, top 10 por localidad; 11 localidades — las de
  ≤10 quedan completas: Puerto Río Tranquilo 8, Puyuhuapi 4). **Aditivo**: solo
  pone `publicado=true`, no despublica nada ni toca lo curado a mano. Además queda
  el **comando reutilizable** `alojamientos:publicar-top {n=10}`
  (`PublicarTopAlojamientos.php`) para futuras cargas (ranking aproximado desde la
  BD: tel → descripción → alfabético, por si se cargan más localidades y no hay
  lista exacta). **Ojo:** la migración muta Neon en el próximo deploy (al mergear).
  Verificado: `php -l`; los 102 ids extraídos y validados contra el JSON
  (únicos, todos `alojamiento`, ninguna localidad >10).
- **✅ Localidades nuevas — (22-jul-2026):** se agregan **Raúl Marín Balmaceda**
  (orden 72, desvío costero al oeste desde La Junta, boca del río Palena) y
  **Balmaceda** (orden 125, desvío SE desde Coyhaique, aeropuerto regional) al
  `LocalidadSeeder` y su espejo `LOCALIDADES_SEED` — total **26 localidades**. Se
  despliegan solas al mergear (seeder idempotente). **Publicación de alojamientos:**
  se mantiene el **top 10 por localidad** (`TOP_POR_LOCALIDAD = 10`, sin cambio).
  Los alojamientos SERNATUR viven solo en Neon (los carga el `SernaturPlaceSeeder`
  corriendo en local; el `sernatur_places.json` está gitignoreado y ese seeder NO
  corre en el deploy), así que publicar el top 10 se hace corriendo el pipeline en
  local contra Neon; desde la web no hay acceso a la BD de producción. Detalle:
  `scripts/sernatur/README.md`.
- **✅ Mapa: pin activo llamativo + "estás aquí" por radio — RESUELTO (21-jul-2026):**
  a pedido tras revisar el preview. (a) El **pin activo** ahora resalta con un
  **halo coral pulsante** (`.pin-activo::after`, `@keyframes pin-halo`) además del
  brinco/tamaño — antes se notaba poco. (b) El marcador **"Estás aquí"** (punto del
  usuario con etiqueta `.yo-tip`) se muestra **solo si el GPS está dentro del radio
  de la localidad** que se mira (`RADIO_LOCALIDAD_KM = 35` en `MapView.jsx`); si el
  usuario está lejos, se ignora (no se dibuja). En "Toda la ruta" se muestra siempre
  que haya ubicación. Verificado en navegador (Playwright con geolocalización):
  dentro de Cochrane → marcador + etiqueta "Estás aquí"; en Santiago → 0; sin
  errores JS; build+lint OK.
- **✅ SelectorLocalidad: highlight, contador y punto — RESUELTO (21-jul-2026):**
  cierra el análisis de Figma. (a) **Highlight** en `<mark>` de la parte del nombre
  que coincide con la búsqueda (los nombres se normalizan sin tildes para comparar,
  pero cada letra acentuada del español mapea 1:1 a su base, así que los índices
  calzan con el original). (b) **Contador** sutil "N localidades en la ruta" al pie
  del panel. (c) **Punto verde** en el disparador cuando hay una localidad activa
  (vs "Toda la ruta"). Estilos `.sl-pin`/`.sl-punto`/`.sl-contador`/`.sl-opcion mark`
  en `styles.css`. Verificado en navegador (Playwright): punto con localidad activa,
  "Aysén" resaltado al buscar "aysen", contador "3 localidades", sin errores JS;
  build+lint OK.
- **✅ PlaceDetail: CTA, icono y compartir — RESUELTO (21-jul-2026):** en la ficha
  de un lugar, (a) **icono grande de la categoría** como marca de agua en el
  gradiente del encabezado (`.ficha-foto-ico`) — identidad visual mientras no hay
  fotos reales; (b) **"Cómo llegar" como CTA principal** (ocupa el ancho) junto a
  un **botón "Compartir" secundario** (`.ficha-acciones`); compartir usa
  `navigator.share` (diálogo nativo del móvil) y, si no está, copia el enlace de
  Google Maps al portapapeles con aviso "Enlace copiado". Iconos `share` y
  `locate` (círculos que faltaban en `EXTRAS` del componente) añadidos a
  `Icon.jsx`; textos ES/EN `compartir`/`enlaceCopiado` en `i18n.jsx`. Verificado
  en navegador (Playwright): icono grande, CTA y compartir presentes, sin errores
  JS; build+lint OK.
- **✅ ChatBot: Markdown, historial e input — RESUELTO (21-jul-2026):** los
  mensajes del bot se renderizan como **Markdown simple** (`**negrita**` en los
  nombres de lugares, viñetas `•`/`-` como lista, líneas en blanco como
  separación) — render propio sin dependencias (`inline`/`Markdown` en
  `ChatBot.jsx`, estilos `.msg .md-lista`/`.md-sp` en `styles.css`). **Historial
  persistente** en `sessionStorage` (`chatHistorial`): al cerrar y reabrir el chat
  la conversación se conserva (el componente se desmonta al cerrar). Input con
  `inputMode`/`autoComplete=off`/`autoCorrect=off`/`spellCheck=false` para no
  autocorregir nombres patagónicos. Verificado en navegador (Playwright): negritas
  y lista en la respuesta, 3 mensajes tras cerrar/reabrir, sin errores JS; build+lint OK.
- **✅ Clustering de pines en el mapa — RESUELTO (21-jul-2026):** en zonas densas
  los pines se agrupan en un **cluster con el número** de lugares (icono propio en
  verde de la marca); al hacer zoom se separan (spiderfy al máximo). Se usó
  `leaflet.markercluster` (libre). El **pin activo** (el que sigue a la lista) se
  dibuja **fuera del cluster** (marcador directo en el mapa) para que nunca quede
  escondido y conserve su resalte. CSS base del plugin en `main.jsx`
  (`MarkerCluster.css`); icono de cluster `.cluster-pin` en `styles.css`.
  Verificado en navegador (Playwright): 12 pines cercanos → 1 cluster "11" + el
  activo aparte; al hacer zoom se separan (9 sueltos), sin errores JS; build+lint
  OK (precache +~35 KB por el plugin, aceptable).
- **✅ Mapa sincronizado con la lista — RESUELTO (21-jul-2026):** con una
  localidad elegida (modo `mapa-grande`), la card de más arriba en la lista es la
  "activa" y **el mapa la sigue**: al hacer scroll o filtrar, panea (paneo suave,
  mismo zoom) al pin del lugar activo y lo **resalta** (pin más grande, al frente,
  con brinco). La card activa se marca con borde/fondo verde (`.es-activo`).
  `App.jsx` calcula el activo con un listener de scroll sobre `.lista` (la card
  cuyo borde superior queda más cerca del tope); `MapView.jsx` recibe `activo` y
  hace `panTo` (con guarda para no interrumpir el `flyTo` al cambiar de
  localidad). En "Toda la ruta" se apaga (ahí manda la lista agrupada).
  Verificado en navegador (Playwright): al scrollear la lista cambia el activo
  (id 1→5), el mapa panea y el pin resaltado se mueve, sin errores JS; build+lint OK.
- **✅ Pulido UX (lote quick-wins) — RESUELTO (21-jul-2026):** a partir de un
  análisis de UX. (#1) Header: subtítulo a **una sola línea sutil con elipsis**
  (`h1 small`) para que no compita con el título. (#4) Card: **nombre más grande**
  (15px/700), **distancia como chip gris neutro** (antes texto verde suelto) y
  **sello "Destacado" suavizado** (tinte coral en vez de bloque sólido). (#5) FAB
  del chat **solo-ícono** (se quitó el globito "¿Dudas?") y más pequeño (48px).
  (#6) Tab de categoría activo **más marcado**: además del color y tinte, un
  **indicador superior** (`.cat-btn.activo::before`). (#7) Offline: ya estaba
  cubierto (banner + el pill "En línea"→"Sin conexión" con color); se mantiene.
  Verificado en navegador (Playwright): header sin recortes, card, FAB y tab OK,
  sin errores JS; build+lint OK.
- **✅ UX "el mapa es la app" — RESUELTO (21-jul-2026):** rediseño de la vista
  principal para que el mapa sea el protagonista (lo que el turista más mira).
  (a) Al elegir una localidad, el mapa crece a `56vh` (clase `mapa-grande` en
  `.app`) y la lista queda de apoyo debajo; en "Toda la ruta" el mapa queda
  compacto (`230px`) porque ahí manda la lista agrupada. (b) **Pines
  rediseñados** a estilo señalética outdoor: gota SVG en el color de la categoría
  con el icono calado en blanco y sombra (`.pin-lugar` en `styles.css`,
  `MapView.jsx`), más chicos que el marcador cuadrado anterior. (c) Los filtros
  de categoría pasaron de chips arriba a una **barra inferior en la zona del
  pulgar** (`.barra-cat`/`.cat-btn`, icono + etiqueta, tinte del color de la
  categoría activa); los flotantes (FAB, banner instalar, tarjeta push) se
  elevaron sobre la barra con `--barra-cat-h`. (d) **Reordenadas las
  categorías**: "Dónde dormir" y "Dónde comer" primero (es lo que más busca el
  turista), luego "Qué visitar", servicios, eventos, emergencias — el orden sale
  del objeto `CATEGORIAS` en `data/places.js`. Verificado en navegador
  (Playwright, 390×780): ambas vistas, orden de botones, pines y sin errores JS;
  build+lint OK. Pendiente: afinar detalles visuales según revisión en el deploy
  preview.
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

## Plan de inversión (conversado 29-jul-2026)

En qué orden gastar plata en el proyecto, una vez que existan **(a)** los
contactos de las encargadas de turismo de la ruta y **(b)** el dominio propio.
Queda escrito porque el orden depende de una fecha, y esa razón se pierde si no
se anota.

**El orden lo dicta el calendario, no la tecnología.** La temporada alta de Aysén
es **diciembre–marzo**. Lo que se gaste antes de diciembre rinde esa temporada;
lo que se gaste en enero llega tarde. Todo lo de abajo está ordenado contra esa
fecha, no contra el roadmap técnico.

**Dato que reordena la pregunta:** la infraestructura completa cuesta
**~US$10/mes**, o sea que **un solo negocio auspiciador la cubre entera**. El
riesgo de este proyecto nunca fue el dinero: es el tiempo. Gastar plata sirve
donde compre tiempo.

### Orden de gasto

> **✅ DOMINIO ELEGIDO (29-jul-2026): `rutaaustral.cl` + `rutaustral.cl`.**
> Se buscó con un criterio distinto al habitual: el trabajo principal del dominio
> **no es la app, es el correo** — tiene que poder dictarse por teléfono y por
> WhatsApp a una encargada de turismo sin que se equivoque.
>
> - **La trampa que decidió todo — la doble "a".** `patagoniaaustral.cl` (y el
>   `.com`) están **ocupados**, y lo único libre era `patagoniaustral.cl`, con una
>   sola "a". Eso no es una alternativa, es una trampa: al dictar "patagonia
>   austral" la persona escribe la versión con dos aes, que es de un tercero, y
>   **la campaña de correos alimentaría el sitio de otro**. El mismo choque se
>   repite en todo el naming porque "Austral" empieza con A y lo que va antes
>   termina en A (carretera·austral, ruta·austral, mapa·austral).
> - **Por qué `rutaaustral.cl`:** es la única familia donde **las dos escrituras
>   están libres**, así que se registran ambas y `rutaustral.cl` redirige — se
>   compra la trampa en vez de caer en ella, por ~CLP 20.000/año en total. Además
>   se dicta sin ambigüedad (sin números, guiones ni tildes), describe qué es antes
>   de que abran el correo, y **resuena con el "Plan Ruta Austral" del MOP**, que es
>   el marco institucional que va a leer un municipio entre 2026 y 2030.
> - **Descartados y por qué:** `ruta7.cl` está ocupado y sus variantes obligan a
>   dictar un número ("¿siete o 7?"), que cuesta respuestas en WhatsApp;
>   `carreteraaustral.cl`, `guiaaustral.cl` y `turismoaustral.cl` están ocupados;
>   `aysenaustral.cl` contradice el alcance ya logrado (la app cubre dos regiones,
>   no solo Aysén) y además lleva tilde.
> - **Costo asumido:** el dominio dice "ruta austral" y el producto se llama
>   "Patagonia Austral". Se aceptó a conciencia: para la campaña pesa más que el
>   dominio **describa qué es** que la coherencia de marca. A cambio, la landing
>   debe dejar claro el nombre del producto en la portada.
> - **Pendiente:** verificar en **nic.cl** y registrar. La comprobación previa fue
>   por DNS, que solo dice si un dominio **resuelve** — un dominio registrado y sin
>   usar aparece como libre. Pasos de configuración (Netlify, redirección del
>   segundo, CORS, `fotos.rutaaustral.cl` para salir del `r2.dev`, buzón de correo)
>   en `DEPLOY.md` → "Dominio propio".
> - **Dato para mirar:** `carretera-austral.cl` está **ocupado, activo y alojado**.
>   Puede ser una guía que ya compite; vale revisarla antes de definir el discurso.

1. **Dominio propio — ~CLP 10.000/año (×2 = ~20.000). Primero, y por una razón NO técnica.**
   Sirve para el **correo**, no para la app. La campaña a encargadas de turismo y
   a dueños de alojamiento se responde si sale de `@<dominio>.cl` con un sitio
   detrás; desde Gmail apuntando a `netlify.app` parece spam. La tasa de respuesta
   de esa campaña decide cuántas de las fichas `preliminar: true` se vuelven
   reales — es la variable más determinante del producto y cuesta casi nada.
   De paso habilita el subdominio para el bucket R2 (salir del `r2.dev` con rate
   limit, ver `DEPLOY.md` §2.5).

2. **Backend always-on — ~US$6/mes (VPS) o ~US$7/mes (Render pago).**
   Ya estaba anotado arriba como "la mejora que mueve la aguja", pero el motivo
   de fondo es más duro que la comodidad: **el arranque en frío de ~50 s no es un
   detalle de UX, mata el bucle central del producto.** El crowdsourcing depende
   de que alguien se detenga en la ruta, con una barra de señal, y reporte un
   derrumbe. Con 50 s de espera ese reporte no se hace, y sin reportes no hay red.
   Además desbloquea las dos piezas pendientes por infra: **worker de colas**
   (push "hay un reporte cerca") y **scheduler** (avisos programados a futuro).
   Si el cuello de botella es tiempo y no plata: **Render pago**, y seguir.

3. **Fotos — el gasto más grande y el único que compra calidad de verdad.**
   Primero la vía gratis: pedirlas en el mismo correo del punto 1 (muchos dueños
   las tienen y las ceden). **No presupuestar el viaje antes de ver qué rinde esa
   campaña** — esperar 2–3 semanas y recién ahí contar cuántas fichas quedaron sin
   foto. Presupuestar antes es comprar a ciegas. (Recordatorio: no raspar de
   Google Maps ni de terceros — licencia.)

4. **Sentry (free) — cuesta cero, hacerlo ANTES de tener usuarios reales.**
   Evita que el primer bug en la ruta llegue como "no me funcionó" por WhatsApp,
   sin forma de reproducirlo.

5. **Capa comercial — aquí el dinero ENTRA, no sale.**
   El flag `destacado` ya está implementado y los dos negocios del fundador son
   las primeras fichas destacadas reales. **No construir cobros, planes ni
   facturación hasta tener 2–3 negocios que ya dijeron que sí**: transferencia y
   planilla son suficientes para los primeros diez clientes.

### Lo que NO financiar (y por qué)

- **Publicidad.** Todavía no hay señal de retención; pagar tráfico ahora es
  comprar visitas para medir nada.
- **App nativa.** La PWA es la decisión correcta justamente por offline-first;
  una nativa cuesta mucho y no arregla nada que hoy falle.
- **Reescrituras** (Next.js/TypeScript/backend JS) ni infra adelantada. Ya está
  el veredicto arriba en el plan de migración: no resuelven nada real.
- **Diseño/marca cara.** La app ya se ve bien; el diferencial es el dato.

### Resumen

Los primeros ~**US$150 del año** son: dominio + 12 meses de always-on + Sentry.
Todo lo demás es tiempo y viajes, y eso se decide **después** de ver qué contesta
la campaña de correos.

**Viento a favor con fecha:** el Plan Ruta Austral del MOP mete ~$800 mil
millones en obras **2026–2030 justo en Aysén**, donde la app ya tiene todo el
contenido. Obras = cortes y desvíos = exactamente el problema que el
crowdsourcing resuelve. Estar always-on cuando eso arranque vale más que
cualquier campaña pagada.

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
