# Patagonia Austral — contexto del proyecto

PWA de turismo **offline-first** de la Carretera Austral completa (Puerto Montt
a Villa O'Higgins). **Proyecto personal/comercial propio** — NO se rige por bases de
licitación (nació como fork de `multix20/cochrane-turismo`, que sigue vivo y
desplegado por separado; no interferir con sus servicios).

> **Cómo se cuenta el producto (corregido jul-2026, dato del fundador que vive en
> la ruta).** **En los pueblos hay señal, y buena** (sobre todo Entel); la falta de
> cobertura está **en la ruta entre pueblos y en las afueras**. Así que el
> argumento **no** es "no puedes buscar": es que **el dato de los servicios chicos
> de la Austral está incompleto o equivocado** en las plataformas globales, y que
> **la decisión de dónde parar se toma en la ruta, antes de llegar**. El
> offline-first sigue siendo innegociable a nivel técnico (y le da coherencia al
> crowdsourcing: el reporte se hace sin señal y se entrega al llegar al pueblo),
> pero **no es el titular de venta**. No escribir copy que insinúe que los pueblos
> están incomunicados — lo va a leer gente que vive ahí.

## Stack y estructura

- `frontend/` — React 18 + Vite, PWA (vite-plugin-pwa/Workbox), IndexedDB,
  Leaflet, bilingüe ES/EN. Sin TypeScript. Lint: `npm run lint` (oxlint).
- `backend/` — Laravel (PHP 8.4) + Filament v3 (CMS en `/admin`), API pública
  `/api/places`, `/api/notices`, `/api/reportes` (crowdsourcing),
  `/api/calificaciones` (estrellas) e `/api/interacciones` (analítica). Los tres
  últimos **escriben sin login** → todos van con rate limit.
  Web Push VAPID (`minishlink/web-push`).
- PostgreSQL 16. `docker-compose.prod.yml` (Caddy+SSL) para producción autoalojada.

## Deploy (producción actual — todo gratis)

| Pieza | Dónde | Clave |
|---|---|---|
| PWA | Netlify | `netlify.toml`; vars `VITE_API_URL`, `VITE_VAPID_PUBLIC_KEY`, `VITE_STADIA_API_KEY` (opcional, basemap terreno) (build-time: redeploy al cambiarlas) |
| Backend | Render web service `patagonia-austral-api` | blueprint `render.yaml`; secretos con `sync: false` |
| PostgreSQL | Neon (externa) | `DB_URL` como secreto en Render, con `?sslmode=require` |

Guía completa: `DEPLOY.md`. Push a `main` = redeploy automático de Render y Netlify.

## Reglas del proyecto

- **Secretos NUNCA en el repo** (aprendido a la mala: hubo que rotar claves).
  APP_KEY, VAPID_PRIVATE_KEY, DB_URL y ADMIN_PASSWORD viven solo en dashboards.
- **Idioma**: código y docs en español; contenido de la app bilingüe ES/EN
  (diccionario en `frontend/src/i18n.jsx`).
- **Flujo git**: rama de trabajo → **Pull Request** hacia `main` → CI (build +
  lint) en verde → merge (rebase, historial lineal). El merge a `main` despliega.
  CI en `.github/workflows/ci.yml`.
- **Estructura y dónde trabajar**: **monorepo único** (`frontend/` + `backend/`
  van siempre juntos; un cambio que toca ambos = un solo PR atómico) — no dividir
  en repos separados. Se puede desarrollar **en local** (ideal para lo que necesita
  la app corriendo: backend, Postgres, probar push/SW, sembrar Neon con el pipeline
  SERNATUR) **o en la web (Claude Code)** para delegar tareas; ambos empujan a las
  mismas ramas del mismo repo. Regla para no chocar: **una rama = un tema**, partir
  siempre de `main` actualizado (`git checkout main && git pull`), y pushear/pullear
  antes de tocar en paralelo el mismo archivo desde los dos lados.
- El usuario semilla `test@example.com` solo existe fuera de producción; el
  seeder lo elimina en producción y crea el admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Push: el permiso se pide al instalar la PWA (`appinstalled`) + red de
  seguridad al abrir instalada. No reintroducir botones de activación visibles.
- Los avisos se envían UNA vez (`notificado_en`). Los **programados a futuro sí
  se despachan solos** desde el 10-ago-2026: el scheduler corre dentro del
  contenedor (`SCHEDULER_EN_CONTENEDOR=true` + plan Starter). Antes, con Render
  free, no corría — de ahí las notas viejas que dicen lo contrario.
- Antes de commitear frontend: `npm run build --prefix frontend` debe pasar.
- No tocar `frontend/dev-dist/` (artefacto regenerado; revertir si aparece en el diff).
- **Vista previa al compartir**: `og-rutaaustral.png` (1200×630) la genera
  `frontend/scripts/generar-og.py` reusando el dibujo del icono. Si cambia la
  marca, se regenera con ese script — no se reemplaza el PNG a mano. Va **fuera
  del precache** (la piden los rastreadores, el viajero no la ve).

## Estado y objetivos

Historial y decisiones: `ESTADO_Y_PENDIENTES.md`. Roadmap (README):
- ✅ Fase 0 base · ✅ deploy Netlify+Render+Neon
- ✅ Fase 1 — Multi-localidad (modelo `Localidad`, selector, filtros)
- ✅ Fase 2 — Contenido (9 localidades, 67 lugares, tramo Coyhaique→Villa O'Higgins)
  y su UX (chatbot filtrado por localidad, "Toda la ruta" por GPS, selector con búsqueda)
- ✅ Fase 2.5 — Contenido tramo norte (Coyhaique→Puerto Montt): 15 localidades y
  125 lugares nuevos (24 localidades, 192 lugares en total), barcazas del tramo
  e identidad actualizada a "Puerto Montt a Villa O'Higgins".
- **EN CURSO**: Fase 3 — arranca con **siembra gratis** (jul-2026): se publican
  los **10 alojamientos con mejores datos por localidad** (fuente SERNATUR),
  y se quitaron los 44 "(ejemplo)" para sembrar solo con datos reales.
  Desde el 27-jul-2026 rige **un servicio publicado por localidad y categoría**
  (una ficha por cupo, 6 categorías × las localidades que haya): el foco es la
  CALIDAD del dato antes del volumen. Lo que
  sale de circulación queda con `publicado: false` (no se borra) y los cupos sin
  dato real llevan una ficha `preliminar: true` sin teléfono, a reemplazar con
  data oficial (correo a encargadas de turismo / dueños, o fuentes públicas).
  Luego: capa comercial (fichas destacadas, planes, analítica) + crowdsourcing
  tipo Waze. Primeras fichas reales: los negocios del fundador.
  **Frente nuevo (10-ago-2026): difusión al viajero.** Va **después** de la
  campaña de correos (anunciar sobre 75 fichas `preliminar` gasta la primera
  impresión), y la **analítica va antes que el primer volante**. Plan, canales y
  calendario en `ESTADO_Y_PENDIENTES.md` → "Publicitar la app".
- Fase 4 — Producción definitiva (dominio propio, respaldos, monitoreo).
  ✅ **Almacenamiento de imágenes adelantado (29-jul-2026)**: fotos de las fichas
  en **Cloudflare R2** (disco `r2`, `FOTOS_DISK`), conversión a WebP al subir,
  `FileUpload` en el CMS y foto en `PlaceDetail`/`QuickCard`. Se adelantó porque
  bloqueaba la segunda pasada de contenido. Falta **acción manual**: crear el
  bucket y cargar las variables en Render (`DEPLOY.md` §2.5).

**Datos de negocio**: ruta completa ~100.000–150.000 turistas/año (audiencia
amplia). Temporada alta 2026 en Aysén (Dic25–Mar26, fuente Red de Informadores
Turísticos): 16.998 personas (grupo de viaje), 6.357 atendidas en OIT.
**Cochrane es el destino #1 de la región por atenciones OIT (1.312)** → la zona
del proyecto es la más consultada de Aysén. Prov. Capitán Prat
(Cochrane/O'Higgins/Tortel) = 5.477 personas; pico ene–feb. Tortel solo 21
atenciones OIT pese a ser icónico → oportunidad: la app como "OIT digital" donde
no hay oficina fuerte. Detalle y desglose en `ESTADO_Y_PENDIENTES.md`.

**Negocios reales del fundador** (primeras fichas destacadas reales de Fase 3,
reemplazan los "(ejemplo)"): hamburguesería en el km 1020 (entre Caleta Tortel y
Cochrane) y un servicio de transporte (furgón 12 pax) + encomiendas Tortel↔Cochrane
(por lanzar). El transporte/encomiendas es además un caso real del problema de
conectividad que la app aborda.

**Fase 3 — idea central**: crowdsourcing tipo Waze (los viajeros reportan bencina,
cortes de camino, clima, barcazas) sobre el sistema de avisos, aplicando disciplina
de **PMF/APM** (segmento → validar problema → PMV mínimo → medir/pivotar; ojo con el
arranque en frío). Detalle en `.claude/agents/roadmap.md`.
**PMV ya implementado (27-jul-2026)**: reportes persistidos con caducidad
evaluada AL LEER (por eso anda en Render free, sin worker ni scheduler), votos
"¿sigue ahí?" que extienden u ocultan, cola offline en IndexedDB que se vacía al
recuperar señal, y moderación en el CMS. Falta el push de "reporte cerca", que sí
necesita el worker de la Fase 4. Tests: `backend/tests/Feature/ReporteApiTest.php`.

**Recorte y ampliación (11-ago-2026)** — ver detalle en `ESTADO_Y_PENDIENTES.md`:
- **Solo TRES tipos de reporte**: `peligro`, `accidente` y `faena` (trabajos en la
  vía), los tres con **24 h**. Los tipos viejos ya no se crean pero se siguen
  dibujando hasta caducar (`TIPOS_HISTORICOS` en `frontend/src/data/reportes.js`).
- **El pin queda en la posición GPS exacta del viajero**, nunca en el centro del
  pueblo más cercano: el reporte del camino ENTRE pueblos es el que importa.
- **Calificaciones** (`/api/calificaciones`): estrellas 1–5 + comentario sobre las
  fichas, sin login, una por dispositivo y ficha (volver a calificar edita), con
  cola offline y moderación en el CMS. El promedio va desnormalizado en `places`
  y viaja con `/api/places` → las estrellas se ven **sin señal**. Las fichas de
  `emergencia` no se califican.
- **Analítica** (`/api/interacciones`): rollup diario `(tipo, referencia, día) →
  cantidad`, enviado por lotes desde IndexedDB. **Anónima por diseño** — sin
  usuario, sesión, dispositivo, IP ni orden de eventos. Panel en el CMS.
  Es el prerrequisito de la difusión al viajero (la analítica va antes del
  primer volante). Desde el 23-ago-2026 cuenta además **país e idioma del
  visitante** (`origen_pais`, `origen_idioma`), y eso **no rompe la anonimidad**:
  siguen sin existir usuario, sesión, dispositivo ni IP — es un contador diario
  por país. Ver más abajo.

**Contexto estratégico — Plan Ruta Austral** (MOP, anunciado 30-abr-2026;
fuente: mop.gob.cl). Inversión ~$800 mil millones CLP **2026–2030 enfocada en la
Región de Aysén** (244 km, límite regional→Lago Juncal): 150,4 km de pavimentación
definitiva, puentes Palena y Rosselot, **2 nuevas barcazas (lagos General Carrera y
O'Higgins)**, puerto Yungay. Contexto amplio: la Carretera Austral (1.058 km, Puerto
Montt→O'Higgins) está pavimentada al 58% (faltan 443,5 km). Viento a favor para el
producto — y las obras 2026–2030 caen **justo en Aysén, donde la app ya tiene todo
su contenido** → generan cortes/desvíos que agudizan el problema que el crowdsourcing
resuelve. (Ojo: es un plan regional de Aysén, NO pavimentar todo Puerto Montt→O'Higgins
para 2030.)

**Alcance norte — COMPLETADO (Fase 2.5, jul-2026)**: la app cubre **toda la
Carretera Austral, de Puerto Montt a Villa O'Higgins**, barcazas incluidas. La
identidad ya dice "Puerto Montt a Villa O'Higgins" en i18n, manifest e
index.html. La fase cerró con 24 localidades y 192 lugares; después se sumaron
Raúl Marín Balmaceda y Balmaceda (22-jul) y **Puerto Yungay (11-ago)**, así que
**hoy son 27 localidades**.

> **Los recuentos de fichas NO se anotan acá, a propósito.** Cambian cada vez que
> se publica o se cura algo, así que un número escrito en un documento está
> garantizado a mentir a la semana siguiente — y ya pasó: esta línea decía "26
> localidades y 234 fichas, 159 publicadas" mucho después de que dejara de ser
> cierto. El número vivo está en **`/admin` → Lugares** (y el de uso, en
> Analítica → Interacciones). Lo que sí se escribe son los hechos históricos, que
> no rotan: cuánto tenía una fase al cerrarse, o qué se hizo en una sesión.

Detalle en `ESTADO_Y_PENDIENTES.md`.

**Las barcazas traen horario, tarifa y contacto (21-ago-2026).** Los nueve
cruces y terminales de la app llevan zarpes en `horario`, teléfono de reserva en
`tel` y las tarifas dentro del texto. Tres reglas que salieron de cargarlos:

- **Un valor que caduca se escribe FECHADO** — las tarifas dicen "valores
  referenciales ago-2026" en el propio texto. Las fija el decreto de subsidio y
  cambian por temporada: sin fecha el número envejece mintiendo; con fecha
  sigue sirviendo de orden de magnitud, que es lo que decide el itinerario.
- **Sin dato real no se rellena el campo** — los cruces sin reserva (La Arena,
  Yungay, río Palena) quedaron sin teléfono a propósito.
- **Una columna nueva hay que sembrarla también** — `whatsapp` y `horario`
  existían en la BD y en el CMS, pero `PlaceSeeder` no las copiaba y el dato de
  `places.json` se perdía en silencio. Al agregar una columna: BD, CMS, API **y
  seeder**.

**La app tiene letra propia y el asistente tiene cara (23-ago-2026).** La
tipografía de marca es **Archivo** (OFL, variable 100–900, subconjunto latino,
35 KB), **autoalojada** en `frontend/public/fonts/`. La usa lo que **nombra**
algo —marca, píldora de la ruta, rótulos del mapa, título de ficha, nombre del
asistente, botón de reportar—; el texto corrido sigue con la fuente del sistema.
El asistente dejó de ser un bocadillo genérico: es el **huemul** (el SVG ya
existía en `Huemul.jsx`, solo se veía dentro del chat) y se llama **Huemul · tu
copiloto de ruta**. Reportar es una píldora con palabra, no un "+" pelado. Tres
reglas que salieron de hacerlo:

- **Una fuente por CDN no existe sin señal.** El `<link>` a Google Fonts es el
  camino de todos los tutoriales y el equivocado acá. Autoalojada en `public/`
  entra sola al precache (el glob de Workbox ya incluye woff2).
- **Cambiar de fuente cambia los anchos, y hay medidas escritas que dependen de
  eso.** Se miden en el navegador antes de dar nada por bueno. Archivo resultó
  más angosta que Segoe UI, así que el caso peor de la píldora
  ("Puerto Río Tranquilo") ganó holgura en vez de romperse — y **caducó la razón
  de ancho por la que «RUTA 7» estaba en caja mixta**: hoy va en versales, como
  el letrero de la carretera. Las mayúsculas las pone el CSS (`text-transform`),
  nunca la cadena de i18n: esa misma cadena arma el nombre accesible del botón y
  varios lectores de pantalla deletrean una palabra escrita toda en mayúsculas.
  Dentro de un pueblo la píldora vuelve a caja mixta — ahí muestra un topónimo,
  y un nombre propio en versales grita.
- **Agrandar un control flotante le quita sitio al mapa, y el mapa tiene datos
  ahí.** La píldora de reportar tapó Villa O'Higgins y Puerto Yungay, con
  `places.js` afirmando por escrito que ese lado estaba limpio. Al agrandar algo
  anclado sobre el mapa hay que revisar `ETIQUETAS_LOCALIDAD` midiendo los
  rótulos reales en 360, 390 y 414 px.

**Infraestructura — SIN PENDIENTES desde el 10-ago-2026.** Los dos que quedaban
se cerraron ese día:
- **Bucket Cloudflare R2** operativo — foto probada de punta a punta
  (CMS → R2 → API → PWA). Las fichas ya admiten fotos.
- **Backend *always-on*** — Render **Starter** (US$7/mes), con el **scheduler
  dentro del contenedor** (`SCHEDULER_EN_CONTENEDOR=true`). Se acabaron el
  arranque en frío de ~50 s y el 419 al guardar, y los avisos programados por
  fin se despachan solos. Detalle en `DEPLOY.md` §2.9.

**Regla que salió de activarlo:** una variable de entorno que enciende código
nuevo solo sirve **después** de que ese código está en `main` — Render despliega
desde ahí. Al revés no da error: simplemente no ocurre nada.

**Analítica — panel, no lista (ago-2026).** `/admin` → Analítica → Interacciones
ya no es la tabla cruda del rollup: arriba van cifras agregadas (aperturas,
fichas vistas, **contactos a un negocio** = cómo llegar + llamar + compartir,
aportes de viajeros), evolución diaria y rankings de localidades y fichas, todo
con **un solo selector de periodo para la página entera**. Dos reglas que salieron
de construirlo y valen para cualquier panel futuro:

- **"Cero" y "sin medir" no son lo mismo.** El gráfico afirmaba 0 aperturas en
  fechas anteriores a que existiera la tabla. No dibujar nada anterior al primer
  día registrado (`Interaccion::primerDia()`).
- **Un filtro por página, no por widget.** Con un periodo por tarjeta, cada
  número queda correcto por separado y ninguno cuadra con el otro.

Hay un botón **"Poner en cero"** para no arrastrar las cifras de las pruebas
propias a la primera campaña. Borra por FECHA, no "mis pruebas": la analítica es
anónima por diseño, así que el dato que permitiría distinguirlas no existe.

**De dónde entran, sin IP (23-ago-2026).** El panel agrega dos rankings —
**"Desde qué países entran"** e **"Idioma del visitante"**— que se cuentan en
cada apertura, junto a `app_abierta`. Las dos señales salen del navegador, no
del servidor: la **zona horaria** (`Intl…timeZone`) dice dónde está el TELÉFONO
y el **idioma del sistema** (`navigator.language`) de dónde viene la PERSONA —
el alemán que ya va por Coyhaique manda `America/Santiago` **y** `de-DE`, y por
eso hacen falta las dos. La PWA manda la zona cruda y el servidor la reduce a
país (`App\Support\Origen`; la tabla IANA→país ya viene en PHP y no hay que
empaquetar 400 zonas en un bundle que se precachea). Tres cosas que fija esto:

- **"Quién" no se puede contestar y no se va a poder.** No hay cuentas, sesión,
  dispositivo ni IP; lo más cerca que se llega es "hoy entraron 4 desde
  Alemania", que no reconstruye el recorrido de ninguna de las 4. Si algún día
  se pide "quién", la respuesta es esa, no una cookie.
- **Una referencia de texto libre hay que canonizarla contra un conjunto
  cerrado.** Es el único campo que llega libre del navegador a un endpoint que
  escribe **sin login**: sin reducirlo a país / `xx-YY` —y descartar lo que no
  exista— la tabla dejaría de estar acotada por el catálogo, que es la propiedad
  por la que el rollup cabe en el plan gratis.
- **Un dato nuevo llega con su propia fecha de estreno.** Un ranking que empezó
  ayer, al lado de un contador que lleva meses, se lee como "casi nadie hizo
  esto"; por eso el widget dice "se mide desde el dd/mm" cuando su primer día cae
  dentro de la ventana (`Interaccion::primerDia($tipos)`). Es el mismo "cero vs
  sin medir" de más arriba, aplicado por familia de eventos.

**El proyecto tiene posicionamiento escrito, y la campaña sale con código
(24-ago-2026).** Qué dice el proyecto de sí mismo —categoría, contra qué se
compite, las pruebas y lo que **no** se dice nunca— vive en `POSICIONAMIENTO.md`;
los correos listos para copiar y el instructivo de envío, en `docs/campana/`.
Léelos antes de escribir cualquier copy que salga a la calle. Tres cosas que
fijan:

- **La categoría es "una OIT que viaja en el bolsillo"**, no "una app de
  turismo": está vacía en la ruta, le sirve al municipio como extensión de su
  oficina y es lo que explica que se publique **un servicio por localidad y
  categoría**. Se compite contra el **dato equivocado**, nunca contra una marca.
- **Todo enlace que se reparte lleva código de canal** (`rutaaustral.cl/?c=muni`,
  `?c=qr-furgon`). La lista es cerrada (`Interaccion::CANALES`) por la misma
  razón que el país y el idioma —referencia libre en un endpoint sin login— y lo
  que no está se descarta **en silencio**: el enlace anda igual y el canal queda
  sin medir, así que el código se agrega y se despliega **antes** de repartir el
  enlace. El código se borra de la URL apenas se cuenta, para que el enlace
  reenviado no le regale la visita al canal equivocado. Mide **llegadas**, no
  personas: el efecto se lee en el embudo (aperturas → fichas vistas →
  contactos), no ficha por ficha.
- **La lista de contactos de la campaña no va al repo** (`.gitignore`): son
  correos personales de dueños y de funcionarias municipales. En el repo queda
  solo `docs/campana/contactos.ejemplo.csv`.

**El asistente es un copiloto, y ya se puede reservar (15-ago-2026).** Con un
**perfil de viaje** de cuatro toques (personas, días, vehículo, sentido) y el GPS,
el bot responde "¿dónde estoy?", "plan de hoy" (hasta dónde llega según el ritmo
real del vehículo, qué hay en el camino, qué desvíos, cuántas barcazas) y "mi
itinerario" por etapas — todo calculado con el trazado y las localidades ya
empaquetados, o sea **sin señal**. Motor en `frontend/src/viaje.js`; consultas en
`frontend/src/reservas.js`. Tres reglas que salieron de construirlo:

- **El bot NO reserva: deja el mensaje escrito.** Abre WhatsApp con el texto ya
  armado y lo manda la persona. Los negocios chicos no tienen sistema de reservas
  y sin señal no se puede confirmar nada; el copy dice "pedir disponibilidad",
  nunca "reservar". Sin cobertura la consulta se guarda y se recuerda al llegar
  al pueblo.
- **Un campo que la app consume tiene que llegar por la API.** `whatsapp`, `hrs`
  y `abierto` se leían en `QuickCard` sin existir en ninguna parte: el botón de
  WhatsApp nunca se dibujó, y el chip habría dicho **CERRADA** en toda ficha con
  horario. Hoy `whatsapp` y `horario` son columnas y viajan en `/api/places`; el
  horario se **muestra sin afirmar** si está abierto (es texto libre).
- **Los ramales no son paradas del camino.** Puerto Aysén, Chile Chico, Tortel y
  compañía están fuera de la Ruta 7 (>15 km del trazado): se ofrecen como
  **desvío** con sus km aparte, nunca como meta de una etapa. Y las distancias
  son aproximadas —el trazado semilla se salta el rodeo del lago General Carrera—
  hasta que se corra `scripts/ruta7/generar_ruta7.mjs` en local.

**Tres trampas del mapa, todas descubiertas en producción (ago-2026).** Las tres
son invisibles en un navegador de escritorio y rompen la app en un teléfono:

1. **Un nodo del DOM lo controla React o lo controla la librería, nunca los dos.**
   Leaflet se agrega sus clases al montar escribiendo el DOM directo; si React
   maneja el `className` de ese mismo div, se las borra en el siguiente render —
   y con ellas `touch-action: none`, o sea el pellizco y el arrastre. Por eso hay
   dos divs: `.mapa-full` (React) y `.mapa-lienzo` (Leaflet).
2. **Leaflet mide el contenedor una vez.** Solo lo revisa con un `resize` de
   `window`, y en un teléfono `100dvh` cambia sin que eso pase. Sin
   `ResizeObserver` quedan franjas sin teselas y el encuadre deja de coincidir
   con lo que Leaflet cree que muestra.
3. **`fitBounds` redondea el zoom hacia abajo.** Con el `zoomSnap: 1` por
   defecto y una ruta siete veces más alta que ancha, la Austral ocupaba la mitad
   de la pantalla. `zoomSnap: 0.25` lo arregla.

Y para lo que se ancla al fondo de la pantalla: `100dvh` sigue al viewport de
LAYOUT, que con `viewport-fit=cover` se extiende por debajo de lo visible. La
variable `--piso-extra` (calculada desde `visualViewport`) es lo que hay que
sumar para que la barra de categorías no se pierda abajo.

**El nombre del pueblo abre el pueblo (24-ago-2026).** En la vista de ruta se
entra a una localidad tocando el **punto verde o su nombre**: el rótulo era
decoración (`pointer-events: none`) y el viajero apuntaba a la palabra —lo
grande y legible— para que el toque le cayera al mapa. Tres reglas de esto:

- **Clickable y visible son la misma condición → la misma regla CSS.** Un rótulo
  apagado que reciba toques es una franja transparente robándole el gesto al
  arrastre y a los pines vecinos, y en la vista general hay más apagados que
  encendidos.
- **Un área tocable se agranda con un `::after`, no con `padding`.** Los costados
  de cada rótulo están medidos uno por uno en `ETIQUETAS_LOCALIDAD`: engordar la
  píldora invalida esa tabla entera.
- **Leaflet promete un botón que no cumple.** A cada marcador le pone
  `tabindex="0"` y `role="button"`, pero no le da nombre accesible (su `alt`
  solo aplica a iconos `<img>`) ni le ata Enter (solo escucha esa tecla para
  abrir popups). Un marcador nuevo necesita las dos cosas a mano, o el foco
  recorre botones mudos que no responden.

**Lo que flota sobre el mapa se come el mapa (24-ago-2026).** El rail de botones
es un flex column con hijos de anchos distintos (huemul 48 px, píldora de
reportar 123), así que su caja medía 123×111 px y **el 37% no era ningún botón**:
franja transparente que se tragaba el toque y el arrastre, justo encima del
rótulo de Cochrane en 360 y 390 px. Regla: **todo contenedor anclado sobre el
mapa va con `pointer-events: none` y sus hijos con `auto`.**

Y dos del mapa que valen para cualquier marcador nuevo:

- **Arreglar el pin no sirve si lo que está delante sigue mudo.** Las bolitas de
  agrupación tienen el mismo agujero de Leaflet que los pines, y son las que se
  ven cuando hay fichas juntas. Se etiquetan por `layeradd` del mapa filtrando
  `L.MarkerCluster`.
- **Un pin dentro de un `markerClusterGroup` no está en el DOM al crearse** — el
  grupo lo saca y lo mete en cada zoom, con elemento nuevo cada vez. El nombre
  accesible y la tecla se ponen en el evento `add`, no en el `forEach`.

**Antes de "agregar" una localidad al mapa, mirar si ya está.** De las seis que
se pidieron el 24-ago, cinco ya existían como pin: eran puntos verdes mudos sin
rótulo fijo. Lo que faltaba era la etiqueta, no la localidad. Las que rotulan
fijo están en `LOCALIDADES_ROTULADAS`; el lado del rótulo, en
`ETIQUETAS_LOCALIDAD`, **se mide en el navegador en 360, 390 y 414** (Raúl Marín
Balmaceda parecía condenado a salirse de pantalla por la izquierda y resultó ser
la única posición limpia). Una localidad nueva va en `places.js` **y** en
`LocalidadSeeder.php`. `ICONOS_LOCALIDAD` cambia el punto verde por un dibujo
(el avión de Balmaceda): la lista se mantiene corta, porque el disco es más
grande que el punto y le quita sitio al mapa.

Para trabajo de roadmap, usar el agente `roadmap` (`.claude/agents/roadmap.md`).
