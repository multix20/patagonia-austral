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

## Dónde quedamos — para retomar (23-ago-2026)

### Pipeline para tomar los contactos de carretera-austral.cl

**Qué se hizo.** Quedó escrito el tercer pipeline de carga externa del proyecto,
en `scripts/carretera-austral/` (los dos anteriores: SERNATUR y el mapa
municipal de Tortel). Toma de [carretera-austral.cl](https://carretera-austral.cl/)
—guía comercial de la ruta, hecha en WordPress— los **datos de contacto** de los
servicios que lista, y los deja como fichas **en borrador** para curar y publicar
desde el CMS. Tres piezas: `1_extraer.py` (red), `2_a_places.py` (decisiones
editoriales) y `CarreteraAustralPlaceSeeder` (ids desde **5000**, no registrado
en `DatabaseSeeder`).

**La línea que se trazó, y es la decisión de fondo: hechos sí, prosa no.** Del
sitio entran nombre, teléfono, WhatsApp, correo, web, dirección, horario y
coordenada. Un teléfono no es de nadie —es el mismo número en cualquier guía, en
la puerta del local y en la boleta—. Las **descripciones no se copian**: son obra
de esa guía, que además vende sus propios paquetes, y llevárselas sería quedarse
con su trabajo y no con un dato público. El paso 1 guarda el HTML en `crudos/`
para poder LEER el original al curar, pero el JSON de salida no arrastra una
línea de texto descriptivo; las descripciones salen de plantillas bilingües,
igual que en SERNATUR y en Tortel. Por lo mismo se excluyen las páginas
`/producto/…`: son el catálogo que el sitio vende, no dato de servicio de la ruta.

Y una razón que no es de derecho sino de calidad: **el dato de una guía ajena
también envejece**. El proyecto no se diferencia por copiar rápido sino por
tener el teléfono que contesta, así que nada de este lote se publica sin
verificar.

**Lo que se aprendió de los dos lotes anteriores quedó incorporado de entrada**,
en vez de tener que repararlo después:

- **Comercio sin teléfono ni WhatsApp no entra** (post-mortem de Tortel). No
  aplica a `atractivo` ni a `emergencia`, que no necesitan teléfono.
- **Lo que no se sabe clasificar no cae a `servicio` por defecto**: se descarta y
  se lista en el informe. Un `else` silencioso es lo que en Tortel habría
  enterrado las emergencias del pueblo.
- **El seeder copia `whatsapp` y `horario`.** Es la regla que salió de las
  barcazas: al agregar una columna, BD, CMS, API **y seeder**.
- **Deduplica también por teléfono**, con los últimos 8 dígitos, para que el
  mismo número escrito con y sin `+56` colisione igual. El sitio lista al mismo
  negocio en varias secciones, y el proyecto ya tiene fichas cargadas a mano.
- **Todo en borrador, sin flag por-lugar en el seeder.** Un flag habría sido la
  puerta para publicar el lote entero sin querer — que es literalmente lo que
  pasó con Tortel.

**Se escribió a ciegas, y por eso el informe manda.** Desde una sesión web de
Claude Code no hay salida de red hacia carretera-austral.cl: la bloquea el proxy
del entorno (`403` al CONNECT), igual que con `tortel.cl`. Así que los scripts
son defensivos y cuentan todo lo que encuentran. La primera corrida de verdad es
`--explorar`, que no baja contenido: dice qué secciones existen y cuántas URLs
tiene cada una. El extractor va por la **API REST de WordPress** (`/wp-json`)
antes que por el sitemap, y saca los datos con tres estrategias —`json-ld`
(alta confianza), `encabezado+contacto` (heurística de listado) y
`pagina-completa`—; el informe dice cuántas fichas salió por cada una, y esa
cifra es la que decide cuánto hay que revisar a ojo.

**Falta acción manual: correrlo en local.** Respeta `robots.txt`, espera 3–6 s
entre páginas y cachea todo, así que una segunda corrida no le pide nada al
sitio. Instrucciones completas en `scripts/carretera-austral/README.md`.
Antes de publicar cualquier ficha del lote: verificar el teléfono, corregir el
pin si quedó en el centro del pueblo, escribir la descripción de verdad en ES y
EN, y respetar **un servicio publicado por localidad y categoría**.

### La app tiene tipografía propia, y el asistente tiene cara

**El punto de partida.** La app se veía correcta y anónima. Dos causas
concretas: `styles.css` le fijaba `'Segoe UI'` a **todos** los elementos con el
selector universal —marca, número de ruta y nombres de pueblo incluidos—, así
que no había una sola letra que fuera de esta app y no del sistema operativo; y
el asistente se abría desde un círculo blanco con un **bocadillo de chat**, el
icono que tiene cualquier app y que no promete nada.

Lo segundo era además un descuido: `components/Huemul.jsx` existe hace tiempo y
su propio comentario dice que es *"identidad animada del asistente (FAB y avatar
del chat)"*, pero el FAB dibujaba un `message-circle`. El personaje estaba
escrito y solo se veía dentro de la conversación.

**Lo que se hizo.**

- **Fuente de marca: Archivo**, variable 100–900, subconjunto latino, **35 KB en
  un archivo**, autoalojada en `frontend/public/fonts/`. La usa lo que **nombra**
  algo (marca, píldora de la ruta, rótulos del mapa, título de ficha, nombre del
  asistente, botón de reportar); el texto corrido se queda con la fuente del
  sistema. Elegida por su parentesco con la rotulación vial: la app es una guía
  de camino y ahora se lee como los letreros de afuera.
- **El huemul sale del chat al mapa.** El FAB del asistente es un círculo verde
  pleno con el huemul en blanco. En el chat el asistente dejó de llamarse
  "Asistente Turístico" —que es como se llama el chatbot de cualquier
  municipalidad— y pasa a ser **Huemul · tu copiloto de ruta**. El saludo que ya
  tenía ("Soy tu copiloto de la Carretera Austral") calzaba con eso desde antes.
- **Reportar es una píldora con palabra**, no un "+" pelado: el signo solo no
  dice qué se agrega, y lo que se agrega (peligro, accidente, faena) es la razón
  de ser del crowdsourcing.
- **Se borraron 70 líneas de CSS muerto**: `.fab-chat` y `.fab-iconos`, con su
  animación de crossfade, no los renderizaba ningún nodo desde que el asistente
  se mudó al rail.

**Tres reglas que salieron de hacerlo:**

- **Una fuente por CDN no existe sin señal.** El `<link>` a
  `fonts.googleapis.com` es el camino de todos los tutoriales y es exactamente
  el equivocado acá: la app se abre en la ruta, y la letra de marca caería al
  respaldo del sistema justo en el viaje para el que se hizo. Autoalojada en
  `public/` entra sola al precache, porque el glob de Workbox ya incluye woff2.
- **Un cambio de fuente cambia los anchos, y hay medidas escritas que dependen
  de eso.** El comentario de `.loc-pill .tx` fija 14,5 px/700 porque
  "Puerto Río Tranquilo" —el topónimo más largo de la ruta— entraba "con cuatro
  píxeles de sobra". Se midió en el navegador antes de dar nada por bueno:
  Archivo es **más angosta** que Segoe UI (143 px contra 167,2), así que el
  caso peor pasó a tener ~28 px de holgura. **Y cae la razón por la que
  «RUTA 7» estaba en caja mixta**: el techo del texto en la píldora son 173 px y
  en versales mide 63,6. Se puso en versales el mismo día (medido después: 64 px
  reales, sin cortarse, en 360 y 390). Las mayúsculas van por CSS y no por la
  cadena de i18n, porque esa cadena arma también el nombre accesible del botón y
  varios lectores de pantalla deletrean lo que está escrito todo en mayúsculas
  ("erre-u-te-a"). Dentro de un pueblo la píldora vuelve a caja mixta: ahí
  muestra un topónimo, no un letrero.
- **Agrandar un control flotante le quita sitio al mapa, y el mapa tiene datos
  ahí.** `places.js` decía de Puerto Yungay que "a la derecha el mapa está
  limpio hasta la frontera" — dejó de serlo al convertir el botón de reportar
  en píldora. Tapaba **Villa O'Higgins** (el topónimo que da título a la app) y,
  en pantallas de 360 px, **Puerto Yungay** (el cruce de la barcaza). Se probaron
  las cuatro combinaciones midiendo los rectángulos reales de los rótulos en el
  navegador, en 360, 390 y 414 px: la única sin choques es Tortel `izq alta`,
  Yungay `izq` y Villa O'Higgins `izq`.

**Lo que queda por hacer.** Nada bloqueante. Queda una sola cosa fuera:

- **Logotipo en el header** — era el cuarto frente de esta sesión y no se tomó;
  "Patagonia Austral" sigue siendo texto plano sobre verde, y la coherencia con
  el icono PWA y la vista previa al compartir está sin revisar.

### El panel ya dice DESDE DÓNDE entran (y por qué nunca va a decir quién)

**El punto de partida.** El 23 de agosto la app la abrió, por primera vez,
alguien que no era el fundador. El panel de Analítica mostraba el movimiento
—197 aperturas, 40 fichas vistas, 11 contactos— pero no podía contestar la
única pregunta que importaba ese día: **¿quién fue, y desde dónde?** No era un
widget que faltara: el dato no existía. La analítica se diseñó anónima (rollup
diario `(tipo, referencia, día) → cantidad`, sin usuario, sesión, dispositivo ni
IP), así que no había NADA en la base con que responder.

**La decisión.** No se tocó la anonimidad. "Quién" queda sin respuesta —para
contestarlo harían falta cuentas o una cookie de seguimiento, y eso cambia el
producto—, pero **"desde dónde" sí se puede contestar sin espiar a nadie**, y
para decidir suele ser lo mismo: no es igual que las 30 aperturas de la semana
vengan de Chile a que vengan de Alemania.

**Lo que se hizo.** Dos contadores nuevos, que se suman en cada apertura junto a
`app_abierta` (así los rankings totalizan lo mismo que las aperturas y se leen
como porcentaje):

| Señal | De dónde sale | Qué contesta |
|---|---|---|
| `origen_pais` | zona horaria del navegador (`Intl…timeZone`), reducida a país en el servidor | dónde está el **teléfono** |
| `origen_idioma` | `navigator.language`, canonizado a `xx` / `xx-YY` | de dónde viene la **persona** |

Hacen falta las dos: el alemán que ya va por Coyhaique manda `America/Santiago`
(su teléfono cambió de hora al aterrizar) **y** `de-DE`. Con una sola señal
aparecería como chileno. Y `es-AR` separa al argentino del chileno, que en la
Austral son dos públicos distintos.

En `/admin` → Analítica → Interacciones aparecen abajo dos rankings nuevos:
**"Desde qué países entran"** e **"Idioma del visitante"**. Código:
`backend/app/Support/Origen.php` (normalización y nombres),
`frontend/src/analitica.js` → `contarOrigen()`.

**Tres reglas que salieron de hacerlo:**

- **Una referencia de texto libre hay que canonizarla contra un conjunto
  cerrado.** Estos dos son los únicos eventos cuya referencia no es un id
  nuestro sino texto del navegador, y entran por un endpoint que **escribe sin
  login**. Si se guardara tal cual, cualquiera podría mandar referencias
  inventadas hasta hacer crecer la tabla sin techo — justo la propiedad por la
  que esto es un rollup y cabe en el plan gratis. Se reduce a país / `xx-YY`
  contra la base de PHP y **lo que no existe se descarta en silencio**, sin
  responder 422: un 422 haría que la PWA tirara el lote entero, y con él las
  fichas y contactos del día (ver el manejo del 422 en `analitica.js`).
- **Un dato nuevo llega con su propia fecha de estreno.** Un ranking que empezó
  ayer, puesto al lado de un contador que lleva meses, se lee como "casi nadie
  hizo esto" cuando la verdad es "casi nadie fue medido todavía". Por eso
  `Interaccion::primerDia()` ahora acepta tipos y el widget dice "se mide desde
  el dd/mm" cuando su primer día cae dentro de la ventana. Es el mismo "cero vs
  sin medir" de agosto, aplicado por familia de eventos.
- **La respuesta honesta a "quién" es que no se sabe.** Conviene dejarlo escrito
  para no reabrirlo cada vez que aparezca la curiosidad: el día que se quiera
  saber quién, la conversación es sobre cuentas y seguimiento, no sobre agregar
  un widget.

**Ojo con el orden del despliegue.** El frontend (Netlify) publica en un par de
minutos y el backend (Render, imagen Docker) tarda más. En esa ventana la PWA
nueva manda `origen_pais` a un backend que todavía no conoce el tipo → 422 → la
app descarta ese lote. Son unos pocos contadores de unos pocos minutos, pero es
la forma general del problema: **un tipo de evento nuevo hay que desplegarlo
primero en el backend**.

---

## Dónde quedamos — para retomar (21-ago-2026)

### Las barcazas ya traen horario, tarifa y teléfono

**El punto de partida.** Las nueve fichas de cruces y terminales de la app
—las dos rampas del bimodal (Hornopirén y Caleta Gonzalo), La Arena–Puelche,
Yungay–Río Bravo, Chile Chico–Ibáñez, la barcaza del río Palena y los
terminales de Chaitén, Chacabuco y Puerto Montt— **describían el trayecto pero
no servían para planificarlo**: ni zarpes, ni valores, ni un número donde
reservar. En la Austral la barcaza es lo que decide el día: perder el último
zarpe cuesta una jornada entera, y el viajero decide en la ruta, sin señal. Era
justo el dato que faltaba.

**Lo que quedó cargado** (búsqueda web de agosto de 2026, sitios de los
operadores y guías de ruta):

| Cruce | Zarpes | Valor referencial | Reserva |
|---|---|---|---|
| Hornopirén ↔ Caleta Gonzalo (Somarco) | 10:00 subsidiado; 18:00 y 02:00 comerciales · desde Caleta Gonzalo 12:30 y 20:00 | auto $72.650 · pasajero $12.100 · moto $18.200 · bici $8.050 | barcazas.cl · +56 65 221 7413 · oficina Ingenieros Militares 450 |
| La Arena ↔ Puelche (Transportes del Estuario) | cada ~30 min de día, cada 1½ h de madrugada | pasajeros liberados · auto $11.510 · furgón $15.210 · moto $8.280 · bici $3.130 | sin reserva, por orden de llegada |
| Yungay ↔ Río Bravo (Fiordo Mitchell) | 10:00 · 12:00 · 16:00 · 18:00 (desde Río Bravo 11:00 · 13:00 · 17:00 · 19:00) | **gratuito** | sin reserva |
| Chile Chico ↔ Ibáñez (Naviera Austral) | diario; 1 h antes a pie, 2 h con vehículo | pasajero $2.510 · vehículo ≤5 m $21.270 | navieraustral.cl · +56 600 401 9000 |
| Río Palena (Raúl Marín) | verano 08:30–13:00 y 13:30–18:30; invierno hasta 17:30 | **gratuito** | sin reserva |
| Terminales Chaitén / Chacabuco / Pto. Montt | itinerario semanal | Pto. Montt–Chaitén desde $35.000 · Quellón–Chaitén $30.000 + $140.000 vehículo · Quellón–Chacabuco $23.650 + $191.100 | navieraustral.cl · +56 600 401 9000 · Angelmó 1673 |

Los zarpes van en la columna `horario` (chip de la tarjeta, se ve sin abrir la
ficha), el contacto en `tel` y las tarifas y direcciones dentro del texto
bilingüe. Producción se actualiza con la migración
`2026_08_21_000001_datos_barcazas` (reversible entera: `down()` devuelve los
textos anteriores tal cual).

**Tres reglas que salieron de hacerlo:**

- **Un valor que caduca se escribe FECHADO.** Todas las tarifas dicen "valores
  referenciales ago-2026" en el propio texto. Las fija el decreto de subsidio y
  cambian de temporada en temporada: un número sin fecha envejece mintiendo,
  uno fechado sigue sirviendo de orden de magnitud —saber si el cruce cuesta
  diez mil o setenta mil pesos es lo que decide el itinerario— y la ficha
  remite igual al operador para confirmar.
- **Sin dato real no se inventa el campo.** La Arena, Yungay y la del río
  Palena quedaron **sin teléfono**: son cruces sin reserva, donde el número no
  sirve de nada, y rellenarlo con cualquier cosa habría sido peor que dejarlo
  vacío.
- **El sembrado se comía dos columnas.** `PlaceSeeder::sembrar()` no copiaba
  `whatsapp` ni `horario` —existen como columna desde `add_contacto_a_places`,
  pero nadie las había sembrado todavía—, así que un horario escrito en
  `places.json` se perdía en silencio. Corregido. Ojo con esto cada vez que se
  agregue una columna: la columna, el CMS, la API **y el seeder**.

**Lo que queda por hacer.** Los datos se juntaron desde fuera (el entorno de
esta sesión no alcanza `barcazas.cl` ni `navieraustral.cl`), así que **hay que
darles una pasada contra la fuente oficial**, sobre todo:

1. Los **teléfonos de Somarco** en Hornopirén: se encontraron dos juegos
   (+56 65 221 7413/7414 en Ingenieros Militares 450, y +56 65 229 4855/4858
   con un móvil de rampa +56 9 4007 4900). Se publicó el primero y el central
   como respaldo; conviene confirmar cuál contesta.
2. Los **zarpes de invierno** del bimodal (abril–noviembre): lo cargado es el
   cuadro de temporada.
3. **Quién opera hoy Chile Chico–Ibáñez**: las fuentes se contradicen entre
   Naviera Austral (barcaza La Tehuelche) y Somarco. Se publicó Naviera
   Austral, que es quien la lista en su sitio.

Y en diciembre, antes de la temporada, toca **revisar la tabla entera**: es el
momento en que cambian tarifas y frecuencias.

---

## Dónde quedamos — para retomar (19-ago-2026)

### La píldora del mapa dice RUTA 7 y se ve

**El punto de partida.** Arriba del mapa flotaba una tarjeta blanca que decía
"Patagonia Austral" con el subtítulo "RUTA COMPLETA". Dos problemas: sobre un
mapa lleno de tarjetas blancas (campanita, idioma, barra de categorías) no
destacaba, y lo que decía —el nombre del producto— no le resuelve nada a quien
va manejando. El nombre de la app ya lo sabe: la tiene instalada.

**Lo que dice ahora.** Una sola cosa: **Ruta 7**, que es lo que dicen los
letreros de afuera. La referencia de diseño fue Waze: dejó de ser una tarjeta y
pasó a ser un **objeto encendido** — verde de color pleno con degradado, brillo
superior, un barrido de luz que la cruza cada 4,4 s y un punto lima que late
mientras estás en la ruta. Dentro de un pueblo cambia de trabajo y de color: se
pone coral, muestra el nombre del pueblo y es el botón de volver (ahí no hay
barrido ni punto — no hay ruta en curso que latir).

**Cuatro decisiones que vale la pena no volver a discutir:**

- **El glifo va en `--acento` (#d85a30), no en verde.** Es exactamente el color
  con que `MapView` dibuja la Ruta 7 sobre el mapa. La píldora y la línea del
  camino son la misma cosa, y eso se dice con el color en vez de con un rótulo.
- **El rótulo es la clave `marcaMapa`, con el MISMO valor en los dos idiomas.**
  Nadie debe traducirlo a "Route 7": el extranjero que va manejando compara
  contra la señalética de afuera, que dice RUTA 7 en los dos casos. Va en caja
  mixta ("Ruta 7") porque el chip lo compone a 16,5px/800 y en versales no
  cabe. Se eliminó la clave `rutaSub` ("Ruta completa"), que era el subtítulo y
  ya no existe.
- **El halo va en un envoltorio, no en el botón.** El botón necesita
  `overflow: hidden` para recortar el brillo y el barrido; el resplandor se sale
  del borde a propósito. Los dos no caben en el mismo nodo, de ahí `.lp-wrap`.
- **El estado "pueblo" se midió contra el caso peor real.** "Puerto Río
  Tranquilo" es el topónimo más largo de la ruta y a 16,5px/800 quedaba en
  "Puerto Río Tr…" — el diseño viejo lo mostraba entero, así que cortarlo era
  perder algo que ya funcionaba. Se resolvió con 14,5px/700 y techo de 244px
  (232 reales, 12 de sobra). Cuando entre una localidad nueva de nombre largo,
  ese es el número a revisar.

**Ojo con el historial de este día.** El mismo 19-ago se mergeó a `main` una
versión MÍNIMA de este cambio (PR #90: la tarjeta blanca de siempre, con el
texto cambiado a «RUTA 7» y sin subtítulo). Este trabajo llegó después, por
otra rama, y la reemplaza: dos sesiones tomaron el mismo encargo en paralelo.
De ahí que el rótulo se llame `marcaMapa` —la clave la creó aquella— y que la
entrada de más abajo, "Sobre el mapa manda el camino, no la marca", describa el
paso intermedio y no lo que hay hoy en pantalla.

Hay `prefers-reduced-motion`: se apagan las tres animaciones y quedan el color y
el relieve. Tres cosas moviéndose en bucle arriba de la pantalla son tres cosas
que marean a quien las pidió apagadas.

**Las cuatro direcciones que se exploraron** (placa de señalética, Waze vivo,
cinta de asfalto y vidrio esmerilado) quedaron dibujadas sobre la pantalla real
en `diseno/ruta-7/`, cada una con su argumento a favor y su costo. Se eligió
**Waze vivo**. Si mañana hay que rediscutir el elemento, el material está ahí y
se regenera con `node gen.mjs`.

---

## Dónde quedamos — para retomar (15-ago-2026)

### Iconografía de guía de ruta: el icono como DATO, y la llama de recomendado

Dos cambios de UX/UI sobre las fichas, los dos con la misma idea de fondo: en una
guía de ruta el dibujo no es decoración, **es información** — es lo único que el
viajero lee del servicio antes de tocarlo.

**1. Icono por subtipo, no por categoría** (`frontend/src/data/iconos.js`). Hasta
ahora las seis categorías tenían un icono cada una, así que el mapa **afirmaba
cosas falsas**: el taller mecánico, la barcaza, el cajero y el aeropuerto se
dibujaban los cuatro con un surtidor de bencina, y la carpa y la cabaña eran la
misma cama (dos cosas que se deciden distinto a las siete de la tarde en la
ruta). Ahora el icono sale del **nombre** de la ficha —carpa, cabaña, barcaza,
llave de taller, buseta, cajero, avión, mirador, sendero, glaciar, parque…— y si
no se reconoce nada, cae al de la categoría, que es el comportamiento de siempre.

Decisiones que vale la pena no volver a discutir:
- Se deduce del **nombre**, no de la descripción: el nombre de un servicio de la
  Austral casi siempre dice qué es ("Camping Los Ñires"), mientras que la
  descripción menciona de pasada cosas que no son la ficha ("a 200 m del camping").
- Se deduce **en el cliente**: sirve igual para la semilla empaquetada y para lo
  que llega de la API, y no agrega un campo al CMS que alguien tenga que
  mantener a mano ficha por ficha.
- El subtipo se usa donde el dibujo representa a UNA ficha (el pin, el icono
  grande de la tarjeta y de la ficha) y **no** en la etiqueta de categoría ni en
  la barra de filtros: ahí el icono representa al grupo y tiene que seguir
  siendo el mismo, o la barra deja de servir de leyenda del mapa.
- Las reglas se contrastaron contra las 234 fichas de la semilla; de ahí
  salieron dos correcciones: las **áreas protegidas van antes que el agua**
  (media docena de reservas llevan el lago en el nombre y salían dibujadas como
  laguna) y el **aeropuerto antes que los buses** (Balmaceda es "aeropuerto —
  traslados", y traslados ganaba).

**2. La llama: sello de recomendado.** Se **enciende sola** sobre las fichas con
**4,5 estrellas o más y al menos 3 opiniones**, en dormir, comer y qué visitar.
Se ve en el pin del mapa (sello ámbar + halo cálido), en la bolita del grupo si
adentro hay alguna, en la tarjeta rápida y en la ficha, con la regla escrita al
lado. Criterios:
- **Se gana, no se compra.** El sello comercial sigue siendo otro (`destacado`,
  la estrella): mezclarlos le quitaría el valor al que se gana.
- **Piso de 3 opiniones**, porque un 5,0 con una opinión no es una
  recomendación, es una anécdota — y así es como las notas de otras plataformas
  se vuelven imposibles de creer.
- **Nada en servicios ni emergencias**: ahí el viajero no elige, usa lo que hay,
  y una llama sobre un hospital diría algo que esta app no debe decir. Los
  eventos también quedan fuera (un sello ganado en la fiesta del año pasado no
  ayuda a decidir la de este).
- **Las fichas `preliminar` no se recomiendan**: no se puede recomendar algo cuyo
  nombre y teléfono todavía estamos confirmando.
- El grupo (cluster) **hereda la llama**: sin eso, agrupar escondía justo lo que
  la llama quería contar — al alejarse un paso, el único lugar recomendado del
  pueblo desaparecía dentro de un número.

**Cuarta trampa del mapa, en la misma familia que las tres de agosto.** El sello
se dibujaba **debajo de su propio pin**, comido por la mitad, con un `z-index: 2`
que en cualquier otro contexto habría bastado: el CSS de Leaflet trae
`.leaflet-map-pane svg { z-index: 200 }`, o sea que **todo svg dentro del mapa
sube a 200** — y la gota es un svg. El sello va en `z-index: 300`. Regla general:
dentro del mapa, cualquier cosa que deba tapar a un pin compite contra 200, no
contra 0.

**De paso**, las formas extra de los iconos (círculos y rectángulos) quedaron
**declaradas una sola vez**: vivían duplicadas, una versión JSX para el
componente y otra en string para los pines de Leaflet, y ya se habían
desincronizado — `search`, `share` y `clock` salían mutilados dentro de un pin y
enteros en el resto de la app.

### Sobre el mapa manda el camino, no la marca (19-ago-2026)

La píldora de arriba del mapa decía **«Patagonia Austral / RUTA COMPLETA»**.
Ahora dice **«RUTA 7»**, sin subtítulo: sobre el mapa lo que ubica al viajero es
el camino en el que está, no el nombre del producto — y «Ruta completa» debajo
del rótulo no agregaba nada.

Tres cosas que quedaron decididas con esto:

- **Es solo la píldora.** El nombre de la app sigue siendo Patagonia Austral en
  la pestaña del navegador, en la app instalada y en la vista previa al
  compartir. Por eso la cadena nueva se llama `marcaMapa` y NO se tocó `titulo`:
  si algún día se renombra la marca de verdad, hay que tocar `index.html`, el
  manifest de `vite.config.js` y regenerar el OG con `scripts/generar-og.py`.
- **El subtítulo sigue existiendo dentro de un pueblo** («VOLVER A LA RUTA»):
  ahí no es decorativo, es la única pista de que la píldora es un botón.
  *(Superado el mismo día: en el rediseño visual esa pista pasó a ser la flecha
  y el cambio de color a coral, y el subtítulo se fue del todo. Ver la entrada
  de arriba.)*
- `rutaSub` («Ruta completa» / «Whole route») se borró del diccionario: era su
  único lector.

### El asistente pasa de buscador a copiloto (y ya se puede reservar)

**El punto de partida.** El chat respondía bien "¿qué hay en este pueblo?", pero
el viajero no está en un pueblo: está en el camino, decidiendo dónde parar. Y
cuando decidía, la app lo dejaba a medias — copiar un teléfono a mano.

**Lo que ahora hace el bot.** Con cuatro toques arma el **perfil de viaje**
(cuántos van, cuántos días, en qué vehículo, hacia dónde), lo guarda y lo usa
para todo:

- **"¿Dónde estoy?"** — el pueblo más cercano, a cuántos km, y qué viene en cada
  sentido.
- **"Plan de hoy"** — hasta dónde llega **hoy** según el ritmo real de su
  vehículo, qué pueblos hay en el camino (con un atractivo de cada uno), qué
  desvíos existen y **cuántas barcazas** cruza. Todo calculado con el trazado y
  las localidades que ya viajaban empaquetados: **funciona sin señal**.
- **"Mi itinerario"** — el viaje repartido en etapas por los días que tiene, y le
  dice cuántos días le sobran para quedarse en vez de sumar kilómetros.
- **"Pedir disponibilidad"** — abre WhatsApp con el mensaje **ya escrito**
  ("¿tienen disponibilidad para 2 personas esta noche?"), con el nombre del
  negocio y mencionando la app. Sin cobertura **se guarda** y se le recuerda al
  entrar al primer pueblo con señal.

**El bot NO reserva, y el copy nunca dice que sí.** Los negocios chicos de la
Austral no tienen sistema de reservas —contestan un WhatsApp— y consultar
disponibilidad sin señal es imposible por definición. Prometer una reserva que
nadie confirmó es la forma más rápida de quemar la confianza con el primer
viajero que llegue a una cabaña ocupada, y con el dueño que lo recibe.

**Dos campos nuevos en la ficha: `whatsapp` y `horario`.**

> **El hallazgo que ordenó el trabajo: no faltaba bot, faltaba dato.** La tarjeta
> del mapa leía `lugar.whatsapp`, `lugar.hrs` y `lugar.abierto` desde que se
> escribió, contra campos que **no existían en ninguna parte** — ni columna, ni
> API. El botón de WhatsApp nunca se dibujó en producción, y el chip de horario,
> al evaluar un `abierto` siempre indefinido, habría anunciado **CERRADA** toda
> ficha con horario. Ahora las columnas existen y viajan en `/api/places`; el
> chip muestra el horario **sin afirmar si está abierto** (es texto libre como
> "en invierno hasta las 20": decir "abierto" sobre eso manda a alguien a manejar
> 40 km de ripio hasta una puerta cerrada).

El WhatsApp se pide **también en el formulario de los dueños**, y se hizo ahora
por calendario: la campaña de correos estaba por salir, y volver a escribirle a
todos después es el costo caro. Es el mismo argumento que ya estaba escrito para
`horario`, que por fin tiene columna propia.

**Un fijo no tiene WhatsApp.** El número se valida antes de ofrecer el botón
(móvil chileno de 9 dígitos que parte en 9, o un internacional explícito). Antes
se limpiaba el teléfono a dígitos y se armaba el enlace igual: un fijo de
Cochrane habría abierto un chat inexistente, y el viajero se habría quedado
esperando una respuesta que nadie iba a leer.

**Precisión de las distancias — lo que se midió.** El trazado empaquetado es una
aproximación, así que se contrastó contra distancias conocidas: Puerto Montt →
Villa O'Higgins da **1.033 km** (reales ~1.058) y Cochrane → Tortel **129 km**
(reales ~125). Donde falla es el tramo más sinuoso: Coyhaique → Cochrane, **244
km contra ~340 reales**, porque el trazado semilla resuelve el rodeo del lago
General Carrera con cuatro rectas. **No se subió el factor de corrección**:
arreglaría ese tramo y arruinaría los otros dos. La solución de verdad ya existe
y es correr `scripts/ruta7/generar_ruta7.mjs` **en local** (Overpass está
bloqueado en el entorno web), que reemplaza el trazado por la geometría real de
OSM — el día que se corra, estas cifras mejoran solas. Mientras tanto: todo se
rotula como aproximado y el ritmo diario lleva un 10% de colchón, porque
subestimar distancias es lo que manda a alguien a manejar de noche en ripio.

**Los ramales no son paradas del camino.** Puerto Aysén, Chacabuco, Futaleufú,
Palena, Raúl Marín, Puerto Cisnes, Balmaceda, Chile Chico y Caleta Tortel están
**fuera** de la Ruta 7, y la primera versión los ponía como meta de etapa: un
viaje al sur terminaba el día 3 en Puerto Aysén, a 56 km al lado de su ruta. Se
detectan por la distancia al trazado (>15 km) y se ofrecen como lo que son —un
**desvío** con sus kilómetros aparte, que se elige.

**Con GPS, las listas van por cercanía.** "¿Dónde dormir?" en la vista de toda la
ruta devolvía los alojamientos de los 27 pueblos en el orden de la API, con
Puerto Montt arriba mientras la persona está parada en Cochrane. Ahora se ordena
por distancia, se muestran los 8 más cercanos y **se dice que se recortó**.

**Analítica**: tres tipos nuevos (`consulta_reserva`, `consulta_guardada`,
`perfil_viaje`), y el primero entra al grupo "contacto a un negocio" — es la
métrica más cercana a una venta que puede medir un directorio, y la que se le
muestra a un negocio para venderle la ficha destacada. Ojo con el detalle que lo
haría fallar en silencio: la lista de tipos es **cerrada y validada**, así que un
tipo que la PWA manda y el backend no conoce devuelve 422 y tira abajo el **lote
entero**, incluidas las métricas que sí eran válidas.

**Verificado en navegador** (Chromium + GPS simulado en Cochrane), no solo por
build: perfil de 4 pasos, plan del día, itinerario, lista por cercanía, apertura
de WhatsApp con el texto correcto (`wa.me/56950206647?text=Hola Cabañas El
Peregrino, los vi en la app Ruta Austral…`), encolado sin señal y recordatorio al
volver la cobertura. Backend: 79 tests en verde, 4 nuevos en
`ContactoReservaTest`.

**Lo que queda de este frente:**
- Correr `scripts/ruta7/generar_ruta7.mjs` en local para la geometría real (es lo
  que arregla el tramo Coyhaique–Cochrane).
- Cargar los WhatsApp reales en el CMS: hasta que haya números, el botón solo
  aparece donde el teléfono ya es un móvil.
- El panel del CMS todavía no grafica los tipos nuevos aparte (se cuentan dentro
  de "contacto"); vale una tarjeta propia cuando haya datos.

---

## Dónde quedamos (14-ago-2026)

### Propuestas de ficha: que el dato lo mande su dueño

**El problema que resuelve.** Los datos que faltan —teléfono real, ubicación
exacta, horario— había que pedirlos por correo o WhatsApp, leerlos a mano y
transcribirlos al CMS. Eso no escala más allá de unas decenas y convierte al
administrador en intermediario a tiempo completo.

Ahora cada ficha tiene un **enlace personal** (`rutaaustral.cl/mi-ficha/xxxx`).
El dueño lo abre en su teléfono, **parado en su local**, toca "usar mi ubicación"
y corrige lo que esté mal. Lo que manda cae en `/admin` → **Propuestas de
fichas** con el ANTES y el DESPUÉS lado a lado, y un botón para aplicarlo.

**Por qué el dato viene del dueño y no de una API de mapas.** Se evaluó usar
Google Places y se descartó por dos razones, en este orden:

1. **La tesis del proyecto es que los servicios chicos de la Austral están
   incompletos o equivocados en las plataformas globales.** Google es una de
   ellas. Ir a buscar el dato ahí es heredar el mismo error que la app viene a
   corregir.
2. **Los términos de Google Maps Platform no permiten almacenar y republicar el
   contenido de Places** (solo el `place_id` de forma indefinida). Un directorio
   comercial construido sobre esa fuente choca de frente con esa cláusula.

> La clave de Google sigue sirviendo, pero como herramienta de **contraste**, no
> de origen: detectar fichas marcadas como cerradas, o pines que difieren mucho
> del de Google para revisarlos a mano. Eso es uso legítimo y barato.

**Tres decisiones de diseño que conviene no deshacer:**

- **Lo que llega NO toca la ficha.** El endpoint es público —el token del enlace
  es toda la credencial— así que lo enviado es una sugerencia hasta que alguien
  la revisa. Si esto se rompiera, cualquiera con un enlace edita el directorio.
- **Lista blanca cerrada de campos** (`Propuesta::CAMPOS`). Sin ella una
  propuesta podría traer `publicado` o `destacado` y saltarse la curación. Lo
  editorial no se delega, ni siquiera al dueño del negocio.
- **La traducción al inglés no se inventa.** El dueño escribe en español y se
  conserva el inglés que ya estaba. Un texto a medio traducir es menos dañino que
  una traducción automática sin revisar en una app que se vende por el dato.

**Nada es obligatorio en el formulario**: quien solo quiera corregir el teléfono
manda eso y listo. Un formulario que exige diez campos se abandona en el tercero.

**Pendientes de este frente**, en orden:

- **Fotos en el formulario.** Quedaron fuera de la primera versión a propósito:
  subir a R2 desde un endpoint público es superficie de ataque, y el dato que
  bloquea la campaña es la ubicación y el contacto, no la foto. Se piden por
  correo mientras tanto.
- **Columna `horario` en `places`.** El formulario ya lo PREGUNTA y lo guarda en
  `datos`, pero no hay dónde volcarlo. Se pregunta igual porque el dato caro es
  conseguirlo, no guardarlo: teniendo las respuestas, agregar la columna después
  es media hora; al revés habría que volver a escribirle a todos.
- **Recordatorio a quien no responde.** La tabla ya sabe quién no contestó
  (`estado = 'enviada'`), así que es solo redactar el segundo correo.

### Ubicar el pin con una foto (EXIF GPS)

En el CMS, junto a "Pegar desde Google Maps", hay ahora **"Ubicar con una foto"**:
se sube una foto sacada EN el lugar y las coordenadas se completan solas desde el
GPS que la cámara dejó en el EXIF (precisión de 5–10 m).

Por qué hace falta habiendo ya el campo de Maps: **no todos los dueños de
servicios de la Austral tienen su negocio en Google Maps, ni saben copiar un
enlace.** Sacar una foto parado en la puerta lo hace cualquiera. Y le gana a una
dirección escrita, que muchas veces ni existe ("camino a Tortel km 3, casa azul").

**La foto NO se guarda**: se lee el punto y se descarta. Es deliberado — la foto
que sirve para ubicar (una puerta, un cartel) casi nunca es la que uno quiere
publicar, y esas van en la sección Fotos.

> **La trampa, y hay que decirla en la campaña: WhatsApp borra el EXIF.**
> Recomprime la imagen al mandarla *como foto* y en esa pasada se pierden las
> coordenadas. Sobreviven si el archivo viaja intacto: como **documento** en
> WhatsApp, adjunto en un **correo**, o AirDrop. Cuando no encuentra GPS, el CMS
> lo dice con esas palabras en vez de un "no se pudo": el problema casi nunca es
> la foto, es el camino que tomó.
>
> **Lo mejor sigue siendo pedir la ubicación de WhatsApp** ("Enviar ubicación"),
> que manda coordenadas directas y lo sabe hacer cualquiera. El EXIF es la red de
> seguridad para las fotos que sí lleguen enteras.

**El extractor (`App\Support\ExifGps`) está hecho para NO inventar**, y esa es la
propiedad que cuidan sus ocho tests: un pin mal puesto manda a alguien media hora
de ripio en la dirección equivocada, así que ante cualquier duda devuelve `null`.
Rechaza el (0,0) —la "isla nula" frente a África, que no la produce una cámara
sino un GPS que no alcanzó a fijar posición—, las fracciones con denominador
cero, y las coordenadas fuera de rango.

> **Un bug que encontró el propio test**, y vale la pena recordarlo: la primera
> versión decidía el hemisferio con "¿es la letra negativa? si no, positiva". Con
> una referencia corrupta —el byte nulo de un EXIF a medio escribir— eso daba
> **+47,25: una foto de Cochrane con el pin en Siberia**. Ahora se exige que la
> referencia sea exactamente una de las dos letras válidas. La regla general: no
> uses "distinto de X" para decidir entre dos opciones cuando existe una tercera
> posibilidad, que es que el dato esté malo.

Pendiente relacionado: `ext-exif` ya está en el Dockerfile de producción, así que
no hay nada que instalar.

## Dónde quedamos — para retomar (12-ago-2026)

### Sesión del 12-ago-2026 — el lote de Tortel en producción, y lo que destapó

**El contenido de Tortel YA ESTÁ EN PRODUCCIÓN.** Se corrieron los dos seeders
contra Neon: **106 fichas** importadas (10 se omitieron por duplicadas — ya
estaban del lote SERNATUR, y el deduplicador hizo su trabajo) y **9 trazados**.
Publicadas por tandas desde el CMS: primero emergencias y servicios, que son dato
duro; dormir y comer quedan en borrador hasta tener texto propio.

**Cuatro cosas que solo se ven al hacerlo de verdad**, todas anotadas porque
vuelven a pasar:

1. **`config:cache` congela el `.env` entero.** El primer intento importó 0
   fichas con el mensaje "Localidad no encontrada" repetido 116 veces: Laravel
   seguía en SQLite local aunque el `.env` dijera `pgsql`, porque había una
   configuración cacheada. `php artisan config:clear` antes de cualquier
   importación.
2. **Antes de escribir, comprobar a QUÉ base se está escribiendo.** Una línea:
   `config('database.default')` + contar localidades. Si dice 27, es producción;
   si dice 2, es la base local vieja. Los seeders son defensivos y no escriben
   basura, pero el rato perdido no lo devuelve nadie.
3. **Rotar la clave de Neon deja la API caída hasta actualizar Render.** Es
   obvio dicho así y no lo es a las dos horas de trabajo: el backend deja de
   conectar, la app muestra lo cacheado y parece que la importación no funcionó.
4. **`migrate:fresh` y `db:wipe` no se escriben nunca con el `.env` apuntando a
   Neon**, ni siquiera para probar. Quedaron en el historial del terminal y solo
   la carpeta equivocada evitó que borraran la base.

**Credenciales de Neon — rotadas el 12-ago-2026.** Durante la importación la
cadena de conexión quedó a la vista dos veces (pegada en el chat y visible en
capturas de pantalla del dashboard). **Las claves expuestas ya no sirven**: se
rotó en Neon y se actualizó `DB_URL` en Render. Vale la pena dejarlo escrito
porque las capturas viejas siguen existiendo y no hay que asustarse al
encontrarlas — y porque el reflejo correcto es el que se aplicó: rotar primero,
seguir trabajando después.

> **Cómo comprobar que Render quedó con la clave nueva** (es la trampa 3 de
> arriba, y el síntoma es mudo: la PWA sigue mostrando lo que tiene cacheado):
>
> ```bash
> curl -s -o /dev/null -w "%{http_code}\n" https://patagonia-austral-api.onrender.com/api/places
> ```
>
> `200` = el backend está conectando a Neon. `500` = quedó con la clave vieja.
> Desde una sesión web de Claude **no se puede correr**: el proxy del entorno
> bloquea `onrender.com`.

**Un bug real que salió de ahí — IndexedDB v5 partida en dos.** Las fichas
estaban publicadas, la API las devolvía, la app corría el build del día, y el
mapa no dibujaba los trazados. Causa: las stores nuevas de dos ramas distintas
compartieron el número de versión, y se desplegaron con un día de diferencia.
Quien abrió la app en el medio subió a la v5 **sin `rutas`** y nunca volvió a
pasar por el `upgrade`, que en IndexedDB corre solo cuando **sube** el número.
Y el fallo era mudo: guardar reventaba dentro de un `try`, leer reventaba fuera,
la promesa se rechazaba y la capa quedaba vacía sin un error en consola.
→ **Regla: si se agrega un store, sube la versión, aunque el número ya se haya
usado ese mismo día.** Repetir el `upgrade` es gratis (todos los
`createObjectStore` van con guard) y es la única forma de alcanzar a quien ya
pasó por el número anterior. Arreglado en la v6, y `obtenerRutas` ya no se come
el error.

**Mapa y UI, a partir de verlo con contenido real:**

- **Fuera el menú ☰.** Tenía ocho filas: tres duplicaban algo que ya estaba a un
  toque (volver a la ruta, asistente, idioma), **dos no tenían siquiera un
  `onClick`** —"Modo sin conexión" y "Acerca de", filas que se ven tocables y no
  hacen nada— y de las tres útiles, la que más pesa estaba enterrada. Esa es la
  **campanita**, que ahora ocupa el lugar del ☰: es donde ya vivía el punto de no
  leídos, así que el indicador y su destino pasan a ser la misma cosa. El
  buscador lo sigue abriendo la píldora del centro; la versión de la app se mudó
  al pie del panel de avisos.
- **Los pines de lugar vuelven a agruparse.** El clustering existía desde el
  21-jul y se perdió en algún rediseño; con 106 fichas nuevas en cuatro cuadras,
  Tortel era un muro de gotas superpuestas. El grupo lleva el **color de la
  categoría dominante**, así responde la pregunta útil de un vistazo ("acá hay
  doce donde dormir"). Medido: 119 pines sueltos → **13 grupos + 10 sueltos**.
- **Mapa/Satélite pasa a solo-icono.** El rótulo ocupaba una barra entera sobre
  el mapa para nombrar dos estados que el propio mapa muestra. El nombre sigue en
  `title` y `aria-label`.
- **Estilo de cercanía: `alidade_smooth` → `outdoors`.** El diagnóstico de la
  sesión anterior sigue en pie (los POI ajenos de OSM no pueden competir con las
  fichas curadas), pero la cura fue peor: al acercarse quedaba una lámina gris
  sin calles ni relieve. `outdoors` es del mismo proveedor y la misma key, trae
  senderos, curvas de nivel y calles —el lenguaje de una guía de ruta— y sigue
  cargando muy poco POI comercial. **No se pudo ver en el navegador desde la
  sesión web** (el proxy bloquea las teselas): si no convence, es cambiar una
  sola cadena.
- **Ruta 7 corregida entre Puerto Río Tranquilo y Bertrand.** El punto intermedio
  del trazado estaba a **2,2 km de Puerto Guadal**, así que la línea parecía
  entrar al pueblo — y Guadal es un desvío por la Ruta X-83, no parte de la
  Ruta 7. Los puntos nuevos pasan al oeste: **5,9 km** de distancia mínima.
- **La barra de categorías pasa a ser también la leyenda del mapa.** Los seis
  botones eran seis azulejos grises idénticos mientras los pines del mapa son
  morado / naranja / verde / azul / rosa / rojo: el color estaba definido en
  `CATEGORIAS` y la barra no lo usaba, así que no había cómo saber de qué era el
  pin morado sin abrirlo. Ahora cada botón lleva **su** color (tinte apagado,
  fondo pleno encendido) y el color viene por variable desde `CATEGORIAS`, así
  que agregar una categoría no obliga a tocar el CSS. De paso:
  **las categorías sin fichas en el pueblo abierto se ven apagadas** —hasta ahora
  tocarlas dejaba el mapa en blanco sin explicar nada, que se lee como app
  rota—, el estado activo viaja en `aria-pressed`, y los botones ahora encogen
  (`flex: 1 1`), que era lo que hacía aparecer scroll horizontal en pantallas de
  320 px. Se borró además el bloque muerto `.barra-cat`/`.cat-btn.activo`: la
  barra vieja ya no la usa ningún JSX, pero como el botón conservó el nombre de
  clase le seguía metiendo padding y tipografía a la barra viva.

### Limpieza de Tortel: no eran duplicados, era volumen (14-ago-2026)

El lote municipal dejó **123 fichas publicadas en un pueblo de ~500 habitantes** y
el mapa se volvió ilegible. La sospecha era "hay muchos duplicados"; al medirlo,
el diagnóstico resultó ser otro.

**Duplicados literales: cuatro.** El grave era **la posta de salud dos veces** —
ficha 21 (hecha a mano, tel 131) y ficha 4024 "Posta Salud Rural" (del mapa
municipal, celular local), a 112 m, las dos como `emergencia` y **con teléfonos
distintos**. Ante una urgencia el mapa ofrecía dos fichas y dos números. Los
otros tres: un mirador mapeado dos veces a 93 m, y "Hospedaje Giselle 1 y 2"
(mismo teléfono, 13 m). Ojo con los falsos positivos: las cuatro "Plaza de
juegos" están a 200–1000 m unas de otras (son cuatro plazas reales con nombre
genérico) y "Cabaña Cony"/"Cabañas Ámbar" comparten teléfono pero están a 625 m
(mismo dueño, dos lugares).

**Lo que saturaba era el volumen:** 17 de los 33 "atractivos" eran mobiliario
municipal (seis plazas, cuatro plazas de juegos, dos plazoletas, paradero,
gimnasio, pérgola, plaza de deportes) y había once miradores compitiendo entre
sí. Nadie viaja a Tortel a ver una plaza de juegos, y esas fichas enterraban las
pasarelas y los miradores que sí son motivo de viaje.

Aplicado por migración de datos (`limpiar_fichas_tortel`, el mismo patrón que
`publicar_un_servicio_por_localidad`): **123 → 97 publicadas**, atractivos
**33 → 9**, emergencias 4 → 3 sin duplicado y con el celular local. Nada se
borra: todo queda `publicado: false` y `down()` lo revierte entero.

> **La migración compara el nombre además del id.** Los ids vienen del lote
> (4000+), pero al importar a producción diez fichas se omitieron por duplicadas,
> así que la numeración de allá no tiene por qué calzar con una base local.
> Actuar solo por id podía despublicar una ficha distinta de la revisada — en
> emergencias, sacar del mapa la posta equivocada.

**Lo que NO se pudo hacer desde la sesión web:** verificar cuáles siguen
operando. SERNATUR y `aysenpatagonia.cl` están bloqueados por el proxy del
entorno, y el proyecto no tiene clave de Google Maps (`GoogleMaps.php` solo
parsea enlaces pegados a mano). Queda pendiente contrastar el listado contra el
registro SERNATUR corriendo `scripts/sernatur/` en local.

**Segunda pasada, el mismo día** (`afinar_fichas_tortel`), con dos correcciones:

1. **Vuelven cinco miradores.** La primera pasada dejó tres de once por criterio
   propio; el alcance acordado después era más corto —duplicados y mobiliario
   municipal— así que lo recortado de más se republica. Un mirador sin teléfono
   es normal: no es un negocio, es un lugar.
2. **Regla de calidad del dato, solo para el COMERCIO.** Una ficha de
   alojamiento, comida o servicio comercial sin teléfono no permite hacer nada
   —ni reservar ni preguntar— y sale hasta tener el dato. Se aplica solo ahí a
   propósito: con la misma vara habrían desaparecido las pasarelas y los
   miradores. Salen seis, y **tres son el relleno del propio proyecto**
   (`preliminar: true`, "cupo reservado sin teléfono a reemplazar cuando llegue
   la información oficial"): llegó, Tortel tiene hoy 31 alojamientos y 16
   comidas reales con teléfono. La tercera, "Abastecimiento en Caleta Tortel",
   nunca fue un negocio sino el nombre de una categoría.

> **Excepción deliberada:** biblioteca, CONAF, municipalidad, registro civil y
> **estación de combustible** se quedan sin teléfono. Ahí la ficha vale por la
> ubicación, y en la Austral saber dónde hay bencina es información de seguridad.

Estado final: **96 publicadas** (atractivos 14, alojamiento 30, comida 15,
servicio 33, emergencia 3, evento 1). El relleno despublicado se marcó también
en `places.js`, que es el respaldo offline de la PWA.

**Dos cosas para revisar a ojo**, que salieron de paso:

- **"Isla de los Muertos" está sin publicar** (ficha 20) — y es probablemente el
  sitio más icónico de Tortel. No se tocó porque venía así de antes y no era el
  encargo, pero conviene mirarlo.
- **"El Mercadito" y "Plaza de Armas"** entraron en el barrido del mobiliario. Si
  en el pueblo funcionan como referencia o como lugar de compra, merecen volver
  (la primera quizá como `servicio`, no como `atractivo`).

### Mapa: la ruta ocupaba la mitad de la pantalla por un redondeo (14-ago-2026)

En la vista general sobraba un montón de espacio por encima de Puerto Montt y
por debajo de Villa O'Higgins. La causa es aritmética, no de diseño.

La Carretera Austral mide **7,0° de latitud por 1,33° de longitud** — 779 km de
alto por 105 de ancho, **siete veces más alta que ancha**—, así que el encuadre
siempre lo manda la altura. Para que quepa entera hace falta un zoom de **6,8**,
pero `L.map()` se creaba sin `zoomSnap`, o sea con el valor por defecto **1**:
`fitBounds` solo puede elegir zooms ENTEROS y tiene que redondear **hacia abajo,
a 6**. Resultado: la ruta ocupaba poco más de la mitad del alto disponible.

Con `zoomSnap: 0.25` Leaflet puede encuadrar en 6,75. Medido a 412×900:

| | zoom | la ruta ocupa | vacío arriba | vacío abajo |
|---|---|---|---|---|
| antes | 6 | 477 px — **53%** | 212 px | 211 px |
| ahora | 6,75 | 664 px — **74%** | 116 px | 120 px |

`zoomDelta` se deja en 1 para que el pellizco y los botones sigan moviéndose de
nivel en nivel; lo fraccionario es solo para encuadrar. El precio es que la
tesela se escala en vez de dibujarse a tamaño nativo, y a un cuarto de nivel no
se nota.

El relleno del encuadre pasó además a ser **asimétrico** (`RELLENO_RUTA`): la
cabecera y la barra de categorías FLOTAN sobre el mapa, no le quitan espacio, así
que con relleno parejo los dos extremos de la ruta quedaban justo debajo de
ellas. Lo que sobra ahora arriba y abajo no es desperdicio: es el hueco exacto
de la píldora del título y de la barra.

### Mapa: el bug del tamaño rancio (14-ago-2026)

Tres síntomas que parecían tres problemas y eran **uno solo**: el mapa "saltaba a
un lugar indeterminado" al cambiar de capa después de volver de una localidad, se
"perdía espacio en los bordes", y la barra de categorías "se bajaba un tercio"
mientras el mapa cargaba.

**Leaflet mide el contenedor UNA vez y guarda ese tamaño.** Solo lo revisa si le
llega un `resize` de `window` (su `trackResize`), y en un teléfono el contenedor
cambia de alto sin que eso pase: `100dvh` se recalcula cuando la barra del
navegador se pliega o se despliega, y ahí no hay evento de window que valga. El
código llamaba a `invalidateSize()` **una sola vez, 200 ms después de montar**, y
nunca más.

Medido: al crecer el contenedor de 700 a 900 px sin `resize`, quedaban **37 px de
franja sin ninguna tesela** — el "espacio perdido en los bordes" — y el centro
real dejaba de coincidir con el que Leaflet cree que tiene, así que cualquier
cosa que redibujara (cambiar de capa, volver de un pueblo) mostraba un encuadre
que no era el esperado. Arreglado con un **`ResizeObserver`** sobre el div del
mapa: cualquier cambio de tamaño, venga de donde venga, se le avisa a Leaflet.
Verificado con la misma medición: ahora las teselas cubren el contenedor entero
al crecer y al encoger.

**La barra que se hundía es la otra cara de lo mismo.** Los controles flotantes
se anclan al fondo de `.app`, que mide `100dvh`; pero `dvh` sigue al viewport de
LAYOUT, y con `viewport-fit=cover` ese layout se extiende por debajo del área que
de verdad se ve. Ahora `App.jsx` calcula desde `visualViewport` cuánto del fondo
está tapado y lo publica en **`--piso-extra`**, que suman las siete reglas
ancladas abajo (`.catbar`, `.qcard`, `.rcard`, `.instalar`, `.tarjeta-push`,
`.fab-chat`, `.rail`). Normalmente vale `0px` y no cambia nada.

> Se sube la BARRA, no se encoge la app, a propósito: encogerla haría que el mapa
> pegara un salto de tamaño cada vez que aparece el teclado.

Verificado: con 120 px del fondo tapados, `--piso-extra` pasa a `120px` y la barra
sube exactamente eso, quedando justo en el borde de lo visible.

### Mapa: encuadre por categoría, y un bug de gestos que apareció al probarlo (13-ago-2026)

**Al filtrar por categoría el mapa ahora se abre hasta que quepan todos los
puntos de esa categoría, más el centro del pueblo.** Un pueblo se abre con zoom
fijo sobre su centro, y eso dejaba fuera justo lo que hace viajar: la
Confluencia de los ríos Baker y Neff está a 22 km de Cochrane, así que al tocar
"Qué visitar" se veía la plaza y ninguno de los atractivos que justifican el
desvío — la categoría quedaba respondida a medias, con el pin existiendo fuera
de pantalla. El centro del pueblo entra en el encuadre a propósito: sin esa
ancla el mapa vuela a un valle a media hora y se pierde la referencia de dónde
queda una cosa respecto de la otra, que es lo que hace falta para decidir si se
va. Soltar el filtro devuelve el mapa al pueblo. Medido en Cochrane: zoom 13 →
**11** al filtrar "Visitar", y de vuelta a 13 al soltarlo.

**Y probándolo apareció un bug preexistente y serio: el mapa perdía los gestos
táctiles.** Leaflet se agrega sus propias clases al montar (`leaflet-container`,
`leaflet-touch`, `leaflet-grab`…) escribiendo el DOM directo, pero ese mismo div
tenía el `className` controlado por React. En cuanto React re-renderizaba con un
className distinto —basta con que aparezcan las etiquetas al acercarse— **las
borraba todas**. Con `leaflet-container` se iban `touch-action: none` y
`overflow: hidden`, así que **en un teléfono el navegador se quedaba los gestos
y el mapa dejaba de responder al pellizco y al arrastre**. Medido: al entrar a
una localidad, `touch-action` pasaba de `none` a `auto`.

> **La regla general, que vale para cualquier librería que toque el DOM:** un
> nodo lo controla React **o** lo controla la librería, nunca los dos. Ahora son
> dos divs — el de fuera lleva las clases de tema (capa, terreno, `labels-on`) y
> es de React; el de dentro (`.mapa-lienzo`) es de Leaflet y React no lo toca.
> Los selectores `.mapa-full.capa-x .leaflet-*` siguen funcionando porque los
> panes quedan igual de descendientes.
>
> El comentario viejo del código decía justo lo contrario ("las controla React
> en el className, no con classList, si no un re-render las borraría"): el miedo
> era real pero la solución estaba al revés, y de paso creó este bug.

### Analítica: de lista cruda a PANEL (13-ago-2026)

`/admin` → Analítica → Interacciones era la tabla del rollup tal cual sale de la
base, y **esa tabla no puede contestar ninguna de las preguntas por las que se
construyó**: como se guarda una fila por `(tipo, referencia, DÍA)`, la misma
ficha aparece repetida una vez por jornada y "qué localidad se mira más" hay que
sumarlo a ojo. Ordenar por "Veces" tampoco sirve — ordena días sueltos, no
totales. Ahora arriba van las cifras ya agregadas y la lista queda abajo como el
detalle al que se baja cuando algo llama la atención:

- **Cuatro tarjetas comparadas contra el periodo anterior** — aperturas, fichas
  vistas, **contactos a un negocio** (cómo llegar + llamar + compartir, lo más
  parecido a una venta que puede medir un directorio) y aportes de viajeros.
  La comparación es el punto: "87 aperturas" no se puede interpretar solo, y
  esta pantalla existe para contestar *"¿el volante movió la aguja?"*, que es
  una pregunta sobre la diferencia entre dos periodos.
- **Actividad por día** (líneas): alcance y profundidad sobre **un solo eje**
  —las dos series cuentan eventos, así que comparten escala honestamente— con
  los días sin actividad rellenados en cero. Sin ese relleno el gráfico pondría
  el lunes al lado del jueves con la misma separación que dos días seguidos: no
  estaría incompleto, estaría mintiendo sobre el ritmo.
- **Dos rankings**: localidades más abiertas y fichas más miradas, esta última
  con el desglose *N vistas · M contactos* — que es exactamente el dato vendible
  de la capa comercial ("tu ficha se vio N veces este mes").
- **Un solo selector de periodo (7 / 30 / 90 días) para TODA la página**,
  widgets y lista incluidos, y guardado en la URL. Tenerlo por widget habría
  dejado las tarjetas y la lista contando ventanas distintas: cada número
  correcto por separado y ninguno cuadrando con el otro, que es la peor forma
  de mentir en un panel.
- **"Sobre qué" ya no muestra slugs.** Traduce según el tipo: nombre de ficha,
  nombre de localidad, "Trabajos en la vía", "Español", "5 estrellas". Antes
  solo resolvía fichas y el resto salía crudo (`caleta-tortel`, `es`, `faena`).
- El resumen quedó además en el **Dashboard**, reemplazando la tarjeta de
  Filament que solo mostraba su propia versión y un enlace a su sitio.
- La URL pasó de `/admin/interaccions` a `/admin/interacciones` (Filament
  pluralizaba en inglés).

**Tres cosas aprendidas, por si vuelven a aparecer:**

1. **Filament arma las acciones de cabecera en `booted`, o sea ANTES de que
   corra la acción.** Un botón rotulado con el estado actual se queda mostrando
   el anterior. Por eso el periodo vigente se dice en el **subtítulo** (que sí
   se recalcula en cada render) y el botón se llama "Cambiar periodo" a secas.
2. **Los widgets necesitan `#[Reactive]`** para recibir el periodo de la página:
   sin el atributo, Livewire monta el widget una vez y se queda con el valor del
   primer render — el selector "funciona" y no cambia nada.
3. **El CSS del panel viene precompilado del paquete de Filament**, y solo trae
   las clases que Filament usa. Una clase utilitaria inventada en un Blade
   propio puede no existir —`tabular-nums` y `items-baseline` no están— y el
   fallo es mudo. La vista de los rankings va con `style` en línea y solo toma
   prestados los tokens de texto.

Las consultas nuevas (`Interaccion::total/serie/ranking`) y la traducción de
referencias tienen tests: `backend/tests/Feature/InteraccionPanelTest.php`.

---

## Dónde quedamos — para retomar (11-ago-2026)

### Sesión del 11-ago-2026 — recorte del crowdsourcing, calificaciones y analítica

Sesión grande, pedida de una vez. Ocho cambios, todos en la misma rama
(`claude/crowdsourcing-module-9bnkf8`) porque tocan frontend y backend juntos:

1. **Reportes: de once tipos a TRES.** Quedan `peligro`, `accidente` y
   `faena` ("trabajos en la vía"), los tres con **24 h** de vigencia. Once
   botones eran un formulario, no algo que se conteste de un toque con el auto
   detenido en la berma. Los tipos retirados **no se borran**: los reportes
   vivos se siguen dibujando hasta caducar (`TIPOS_HISTORICOS` en
   `data/reportes.js`, etiquetas "(retirado)" en el CMS) y el histórico de la
   tabla se conserva.
2. **El pin va donde está el viajero, punto.** Se quitó el respaldo que corría
   el reporte al centro de la localidad abierta cuando el GPS no era creíble. Un
   derrumbe a 40 km del pueblo dibujado EN el pueblo no es un dato aproximado,
   es un dato falso. Sin ubicación no se reporta y se dice por qué.
3. **Calificaciones (nuevo).** Estrellas 1–5 + comentario sobre las fichas, sin
   login, con cola offline y moderación en el CMS. El promedio va
   **desnormalizado** en `places` y viaja con `/api/places`, así que las
   estrellas se ven **sin señal**. Una calificación por dispositivo y ficha;
   volver a calificar **edita** la anterior. Las fichas de `emergencia` no se
   califican.
4. **Analítica de interacciones (nuevo).** Rollup diario
   `(tipo, referencia, día) → cantidad`: 10.000 aperturas de ficha en un día son
   UNA fila. Sin usuario, sin sesión, sin dispositivo, sin IP y sin orden de los
   eventos — no se puede reconstruir el recorrido de nadie porque el dato no se
   genera. Se acumula en IndexedDB y se manda por lotes. Panel nuevo en el CMS
   (grupo "Analítica"). **Esto es el prerrequisito que la sección "Publicitar la
   app" ya pedía: la analítica va antes del primer volante.**
5. **El asistente reemplaza al botón de GPS** en el rail del mapa, y **el
   idioma reemplaza a la lupa** en la barra superior (el buscador sigue en la
   píldora central y ahora también en el menú).
6. **Etiqueta de Puerto Cisnes** al fiordo: chocaba con Villa Amengual justo
   encima del tronco de la Carretera.
7. **Trazado Puerto Yungay ↔ Río Bravo corregido.** Era el peor error del mapa:
   las rampas estaban **34 km y 28 km** fuera de lugar, o sea que la barcaza se
   dibujaba tierra adentro. Ahora van con coordenada real —Yungay
   `-47.9351,-73.3238` (publicada en UTM 18S: 625183 E, 4689555 N) y Río Bravo
   `-47.9682,-73.2236`—, y la comprobación es que la travesía da **8,3 km = 4,5
   millas náuticas** contra las 4,7 que publica el servicio.
8. **POIs ajenos en el mapa cercano** (ver el punto propio más abajo).

Suite backend: **42/42** (10 de reportes, 7 de calificaciones, 4 de analítica).
`npm run build` y `npm run lint` en verde.

### Sesión del 11-ago-2026 — mapa turístico de Tortel y capa de trazados

De dónde salió el contenido que el 12-ago se subió a producción: el **mapa
turístico oficial de la Municipalidad de Tortel**
(`tortel.cl/mapa-turismo-tortel-2024`), 19 capas y 340 elementos.

- **Pipeline reproducible en `scripts/tortel/`** (3 pasos, solo biblioteca
  estándar). El mapa carga una variable JS por capa y no tiene endpoint único; el
  README trae el **snippet de consola** que las captura todas de una vez, que es
  lo que evita bajarlas archivo por archivo.
- **Tres cosas que solo se vieron con el dato real:** el origen viene con el
  **UTF-8 leído como Latin-1** ("Hospedaje RÃ­o Bravo"), lo que además rompía los
  nombres de los campos y hacía perder el teléfono; los **nombres de las capas no
  son los de los archivos** (el mapa llama `cama` a los alojamientos, y apareció
  una capa `rural` que no estaba en ninguna lista); y un mismo número venía hasta
  tres veces, con un campo `Teléfono` que traía los dos juntos en una cadena.
- **`puntos_fijos` se mapea por SUBTIPO y no por capa.** Es la única así: adentro
  conviven la posta, Carabineros y Bomberos con la bencina, la oficina de turismo
  y las plazas. Mandarla entera a `servicio` habría enterrado las **tres
  emergencias** de Tortel, que es el dato que se busca con urgencia.
- **Tabla `rutas` (nueva).** `places` guarda un punto y Caleta Tortel **no tiene
  calles**: se recorre por pasarelas, que son geometría de líneas. La geometría
  va como **GeoJSON en jsonb** y no con PostGIS a propósito — acá no se hacen
  consultas espaciales, solo se dibuja en Leaflet. Piezas: migración, modelo
  `Ruta`, `GET /api/rutas`, `RutaSeeder`, `RutaResource` en el CMS, store `rutas`
  en IndexedDB y dibujo en `MapView` (solo dentro de una localidad).
- **La simplificación es lo que hace viable la capa.** El glaciar Steffen traía
  **17.115 vértices — 669 KB en un solo polígono**, cuando el precache entero de
  la PWA son ~666 KB. Con Douglas-Peucker por tipo (0 en las pasarelas, que se
  miran de cerca; 60 m en los glaciares, que se miran de lejos) y redondeo a 5
  decimales: **812 KB → 41 KB**. Además la capa **no entra al bundle**: se baja la
  primera vez que hay señal, porque sirve en 1 de las 27 localidades.
- **Las 214 pasarelas se funden en una sola ruta**: venían como tramos del
  inventario municipal con su estado de conservación (dato de mantención, no de
  viaje). El dibujo queda idéntico y el CMS no se llena de 214 filas.
- **Los JSON generados no van al repo** (traen 40 correos personales de dueños de
  negocios). Se regeneran con los scripts desde el volcado del mapa.

**Puerto Yungay entró como localidad 27** (orden 185, entre Caleta Tortel y Villa
O'Higgins) con tres fichas publicadas: la barcaza, la Cafetería El Peregrino y
las Cabañas El Peregrino (mismo dueño, dato real del mapa municipal). No es un
pueblo sino la **rampa del cruce obligatorio**, y es un hito de decisión del
viaje. Esas dos fichas se **excluyen** del lote de Tortel para que no salgan
duplicadas: el deduplicador compara nombre + localidad, y viven en
`puerto-yungay`.

> **Corrección posterior, del mismo día:** las coordenadas de la rampa deducidas
> acá estaban **34 km fuera de lugar** (se ancló en la cafetería, lo único que
> traía el mapa municipal del sector). Las corrigió la sesión de crowdsourcing
> con la coordenada publicada del servicio — ver el punto 7 de la sesión
> anterior. Queda anotado porque es la clase de error que produce un dato
> razonable pero deducido, y no avisa.

### El mapa de cerca mostraba datos ajenos y viejos — qué se evaluó

**El síntoma:** en Cochrane el mapa dibujaba "Buses Cordillera", un negocio que
ya no está donde dice. **El problema de fondo no es el estilo, es de quién es el
dato:** el basemap callejero venía renderizando los POI de OpenStreetMap, y los
datos de los servicios chicos de la Austral están incompletos o equivocados en
las plataformas globales — que es, literalmente, la tesis que vende este
producto. Peor: esos POI ajenos salían con el mismo peso visual que nuestras
fichas curadas, así que el viajero no tenía cómo saber cuál de los dos rótulos
creer.

**Opciones evaluadas:**

| Opción | Costo | Veredicto |
|---|---|---|
| **A. Corregir los POI en OpenStreetMap** | $0, trabajo manual | **Sí, como tarea continua.** Es lo único que arregla el dato de verdad, y sirve para TODOS los proveedores a la vez porque todos leen la misma base. El fundador vive en la ruta: sabe cuál es la verdad. |
| **B. Basemap pensado como fondo, no como directorio** | $0 | **Hecho.** Se cambió el estilo de cercanía de `osm_bright` a `alidade_smooth` (mismo proveedor, misma key, cero integración nueva). Conserva calles y nombres, baja mucho el ruido de POIs ajenos. El mapa pasa a ser escenario y nuestros pines protagonistas. |
| **C. MapTiler / Mapbox con estilo propio** | ~25 €/mes (MapTiler) | **No por ahora.** Permite apagar la capa de POI del todo, pero **siguen siendo datos de OSM**: pagar no corrige "Buses Cordillera", solo lo esconde — y eso ya lo consigue la opción B gratis. Si algún día se quiere control fino del estilo, **MapTiler antes que Mapbox**, porque los términos de Mapbox para teselas ráster restringen el cacheo offline y esta PWA precachea teselas. |
| **D. Google Maps Platform** | por uso, escala con el tráfico | **Descartada, y no por precio.** Es el POI más fresco de Chile, pero sus términos **prohíben cachear teselas para uso sin conexión**: choca de frente con lo innegociable de este producto. Un mapa que no funciona sin señal no sirve en la Austral. |

> **Ojo, decisión visual:** `alidade_smooth` es más apagado que `osm_bright`. La
> vuelta atrás es **una sola cadena** (`ESTILO_CERCA` en `MapView.jsx`). Conviene
> mirarlo en el preview de Netlify antes de dar el cambio por bueno.

### Antes de esta sesión

**Lo anterior** fue el **6-ago-2026** (PR #66, mergeado a `main` y
desplegado): el bloque de crowdsourcing quedó cerrado en su parte de vista —
filtro de reportes por tramo, agrupación de pines, tipo `faena` para la temporada
de obras— **más las tres correcciones que salieron de probarlo en producción** (el
chip que contaba reportes que el mapa no mostraba, el reporte que se podía crear
fuera de la Austral, y el pin que tapaba el punto del pueblo). Detalle completo en
"Crowdsourcing", más abajo. **Desde entonces no se tocó el repo**: `main` y esta
rama están a la par, sin cambios sueltos, y la última suite corrida quedó en
**31/31**.

**Dónde está parado el producto, en números verificables** (contados el
10-ago-2026 sobre `backend/database/seeders/data/places.json`):

| | |
|---|---|
| Localidades | **27**, Puerto Montt → Villa O'Higgins |
| Fichas en el seed | **234** |
| Fichas publicadas | **159** (una por localidad y categoría; 27 localidades) |
| De esas, `preliminar: true` | **75** — el **48%** de lo publicado, sin teléfono |
| Fichas destacadas | **0** |
| Fichas con foto | **0** — pero el almacenamiento quedó **operativo el 10-ago** |

Esa tabla es el estado real y explica sola cuál es el trabajo que viene: **no
falta software, falta dato**. La app hace lo que promete; casi la mitad de lo que
muestra todavía dice "por confirmar".

**Lo que cambió de foco (10-ago-2026): empieza el frente de difusión.** Hasta
ahora todo el plan apuntaba a un solo destinatario —municipios y dueños de
servicios, para conseguir el dato— y el viajero quedaba para después. Se suma
ahora el segundo frente: **publicitar la app**. No reemplaza al primero, y el
orden entre los dos importa (está discutido en la sección nueva "Publicitar la
app", más abajo): **la campaña de correos va antes que la difusión masiva**,
porque un anuncio lleva gente a un directorio donde la mitad de "dónde dormir"
está por confirmar, y esa primera impresión se gasta una sola vez.

> **Nota sobre lo que esta sesión NO pudo comprobar:** el entorno de trabajo tiene
> bloqueada la salida a `rutaaustral.cl` y a `patagonia-austral-api.onrender.com`,
> así que **el estado en vivo de producción no está verificado acá**. Todo lo
> técnico de abajo se verificó contra el repo y el build local. Lo de producción
> (fotos, always-on, scheduler) lo comprobó el fundador desde su lado ese mismo
> día, con las salidas pegadas en la sesión.

### ⚡ Cierre del día: la infraestructura quedó sin pendientes (10-ago-2026)

Los **dos pendientes de infraestructura que el proyecto arrastraba se activaron
el mismo día**, los dos en el dashboard y sin deuda de código detrás:

| | Estado | Qué cambia |
|---|---|---|
| **Bucket Cloudflare R2** | ✅ operativo | las fichas ya admiten fotos (probado CMS → R2 → API → PWA) |
| **Backend *always-on*** | ✅ Render Starter US$7 | se acabó el arranque en frío de ~50 s y el 419 al guardar |
| **Scheduler** | ✅ encendido | los avisos programados a futuro por fin se despachan solos |

**Con eso el cuello de botella del proyecto deja de ser técnico.** Lo que queda
antes de mostrarle la app a gente es **dato** (75 fichas `preliminar`) y
**medición** (analítica en cero). Ninguno de los dos se resuelve con código.

**Una regla que salió de activarlo, y que vale para cualquier variable futura:**
una variable de entorno que enciende código nuevo **solo sirve después de que ese
código está en `main`** — Render despliega desde ahí. Al revés no da error: la
variable queda puesta y no ocurre nada. Primero el merge, después el interruptor.

---

## Lo que depende de TI — acciones manuales (al 12-ago-2026)

> **Cerrado el 12-ago:** importar el lote de Tortel a Neon. 106 fichas y 9
> trazados, publicados por tandas desde el CMS. Ver la sesión del 12-ago.

Todo lo de abajo está **fuera del alcance de una sesión de Claude**: pide tarjeta,
dashboard, una decisión tuya o acceso a la BD de producción. Está ordenado por lo
que desbloquea, no por dificultad. Cuando algo se haga, marcar la casilla acá.

> **El reloj manda.** Temporada alta de Aysén = **diciembre–marzo**. La fecha
> límite real no es diciembre sino **septiembre**, porque lo que viene después de
> la campaña de correos tiene latencia propia (2–3 semanas de respuestas, edición
> de fichas, y un eventual viaje de fotos que conviene hacer en primavera).

**Orden acordado (4-ago-2026)** — los puntos de abajo están ordenados por lo que
desbloquean, no por el orden en que conviene hacerlos. El orden de ejecución es:

1. ~~**Buzón `contacto@rutaaustral.cl`**~~ (punto 1) — ✅ **montado**
   (5-ago-2026). Queda de él un solo paso, que **no** es montarlo: medir la
   entregabilidad con mail-tester antes de mandar la campaña.
2. ~~**Nombre y WhatsApp en la landing**~~ (punto 5) — ✅ hecho el 4-ago, y el
   **copy quedó corregido el 5-ago**. La landing ya no tiene deuda.
3. ~~**Infraestructura, toda junta y antes de la pasada de contenido**~~ — ✅
   **R2 (punto 2) y *always-on* (punto 4) hechos el 10-ago-2026**. Queda solo
   **Sentry** (punto 9), que no bloquea nada: es para enterarse de los errores
   cuando haya usuarios de verdad.
4. **Curar el contenido** (las 156 fichas publicadas, de las cuales **75 son
   `preliminar`**; acá caen los puntos 7 y 8).
5. **Campaña de correos** (punto 6). Antes de mandarla, medir la entregabilidad
   del buzón con mail-tester (`DEPLOY.md` §2.4.1, paso 8).
6. **Difusión al viajero** (10-ago-2026, frente nuevo) — va **después** de la
   campaña de correos, no en paralelo: el correo es lo que convierte las 75
   fichas `preliminar` en dato real, y anunciar antes gasta la primera impresión
   sobre un directorio a medio confirmar. Lo único que sí conviene adelantar es
   **medir** (sin analítica no se sabe qué canal sirvió). Plan completo, canales
   y calendario: **"Publicitar la app"**, la sección siguiente.

El 3 va antes que el 4 por dos razones concretas, no por gusto: con R2 andando,
cada ficha que abras para curar se puede cargar con su foto en la misma pasada
(al revés hay que recorrer las 156 dos veces), y el *always-on* evita que el
servicio se duerma a los 15 min y te devuelva un **419 al guardar**, justo
después de escribirlo todo.

### 1. Dominio `.cl` + correo — ~CLP 10.000/año — desbloquea la campaña entera
- [x] **Decidir el nombre** → **`rutaaustral.cl`** (3-ago-2026).
- [x] Registrarlo en **NIC Chile** (`nic.cl`), con los nameservers de Netlify
      (`dns*.p06.nsone.net`). **Sin secundario de NIC y sin DNSSEC**: Netlify
      (NS1) no soporta transferencia de zona ni firma.
- [x] DNS a Netlify + dominio personalizado + SSL (`DEPLOY.md` §2.4).
- [x] `FRONTEND_URL=https://rutaaustral.cl` cargado en Render.
- [x] Key de Stadia restringida también a `rutaaustral.cl` (**Add Domain**, con
      *Allow All Subdomains*; no editar la entrada de Netlify, que sigue
      sirviendo a los `deploy-preview-*`).
- [ ] Registrar las variantes que se confunden al dictarlo por teléfono
      (`ruta-austral.cl`, `rutasaustral.cl`) — solo redirigen a la principal.
- [x] **Buzón `contacto@rutaaustral.cl` — MONTADO** (confirmado por el fundador
      el 5-ago-2026). El `mailto:` de la landing ya no rebota. Los MX van en el
      panel de **Netlify DNS**, no en NIC.
      **Paso a paso completo: `DEPLOY.md` §2.4.1** (4-ago-2026), incluida la
      verificación con `spf=pass`/`dkim=pass` y las precauciones de
      entregabilidad para que la campaña no caiga en spam.
- [ ] **Medir la entregabilidad con mail-tester** (paso 8 de `DEPLOY.md` §2.4.1)
      — es un paso **distinto** de montar el buzón y sigue pendiente. Purelymail
      se eligió asumiendo el riesgo de IPs compartidas; un correo que sale pero
      cae en la carpeta de spam de una cuenta municipal falla igual que uno que
      rebota, solo que sin avisar. Si el puntaje sale bajo, se migra a Google
      Workspace en una tarde y recién ahí se paga.
      **Zoho quedó descartado (4-ago-2026)**: el dominio está reclamado por una
      organización Zoho del dueño anterior del `.cl` (el asistente rebota antes
      del checkout, se destraba solo con un ticket a soporte) y, además, el plan
      gratis no tiene SMTP ni reenvío, así que no podría mandar la campaña.
      **Proveedor decidido (4-ago-2026): Purelymail, ~US$10/año** — tiene SMTP e
      IMAP, tarifa plana con dominios ilimitados (sirve después para los negocios
      del fundador) y reglas de *routing* para reenviar al Gmail de siempre, que
      es lo que evita la segunda bandeja olvidada. Se eligió por sobre Google
      Workspace (~US$84/año) porque **cambiar de proveedor es cambiar los MX**:
      no es puerta de una sola vía, y el gasto dobla el presupuesto anual del
      proyecto. El riesgo asumido es la entregabilidad a cuentas municipales
      desde IPs compartidas de un proveedor chico → **se mide con mail-tester
      antes de la campaña** (paso 8 de §2.4.1); si sale bajo, se migra a
      Workspace en una tarde y recién ahí se paga.

  Ya hecho en el repo (3-ago-2026): `render.yaml` (`FRONTEND_URL` + `APP_URL`),
  comodín de `rutaaustral.cl` en `backend/config/cors.php`, correo y `canonical`
  en la landing `/proyecto`, y el paso a paso en **`DEPLOY.md` §2.4**.

  **Trampa que costó una caída:** el merge que tocó `render.yaml` resincronizó el
  blueprint en Render, y eso activó `FOTOS_DISK=r2` con las cinco `R2_*` todavía
  vacías → `/api/places` devolvió 500 hasta que se arregló. Ya no puede repetirse
  (ver "Fotos" en el punto 2), pero vale la advertencia: **tocar `render.yaml`
  aplica TODO el blueprint**, no solo la línea que cambiaste.

### ✅ 2. Bucket R2 + variables en Render — **HECHO (10-ago-2026)**
- [x] Registrar **tarjeta en Cloudflare** (la exige aunque el uso sea gratis).
- [x] Crear el bucket `patagonia-austral`, habilitar el **Public Development URL**
      (`r2.dev`) y crear el **Account API token** con *Object Read & Write*
      acotado a ese bucket y **sin expiración**.
- [x] Cargar en Render: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
      `R2_ENDPOINT`, `R2_URL`.
- [x] **Verificado en producción por el fundador**: se subió una foto a un lugar
      en `/admin`, salió la miniatura en el listado y la foto **llegó hasta la
      ficha en la PWA** (Cochrane → "Confluencia ríos Baker y Neff"). O sea el
      ciclo completo: subida → conversión a WebP → R2 → API → app.

  Paso a paso (por si hay que rehacerlo o migrar de cuenta): **`DEPLOY.md` §2.5**.

  **Tres cosas que aparecieron al hacerlo y quedan anotadas para la próxima:**
  - **Son CINCO variables nuevas, no seis.** `FOTOS_DISK=r2` ya venía declarada
    en `render.yaml`, así que Render rechaza agregarla otra vez con un
    *"Duplicate key is not allowed"* que parece un error y no lo es.
  - **`R2_ENDPOINT` no lleva el nombre del bucket.** El campo "S3 API" que
    muestra Cloudflare termina en `/patagonia-austral`; esa parte se corta. Con
    el bucket pegado, las subidas fallan.
  - **"Manage API tokens" no está dentro del bucket**, sino un nivel más arriba
    (`/r2/api-tokens`). Y hay que elegir **Account API token**, no *User API
    token*: el de usuario se desactiva si se sale de la organización, y con él
    las fotos se caerían sin aviso.

  **Lo que esto desbloquea, y es el punto:** ahora la segunda pasada sobre las
  156 fichas se hace **una sola vez por ficha** — dato y foto juntos. Y el filtro
  **"Con foto / Solo SIN foto"** del CMS, cruzado con el de localidad, es la
  lista de trabajo para pedir fotos.

  > **Cuidado mientras el backend siga en el plan free** (punto 4): la foto que
  > arrastras queda primero en una carpeta temporal del contenedor y **se evapora
  > si el servicio se duerme entre subir y guardar**. Subir y guardar de
  > inmediato, una ficha a la vez (`DEPLOY.md` §2.7). Es otro argumento para el
  > always-on justo ahora que empieza la carga de fotos.

  **Pendiente menor, para cuando haya tráfico de temporada:** el dominio público
  `r2.dev` tiene *rate limit* y no pasa por la CDN completa — Cloudflare lo dice
  en la misma pantalla. Se resuelve con un subdominio propio apuntando al bucket
  (`fotos.rutaaustral.cl`), y es **cambiar `R2_URL` y nada más**: en la BD se
  guardan rutas relativas, no URLs.

### 3. `DEPLOY_PUSH_TOKEN` + webhook de Netlify — ~10 min — cierra lo del 31-jul
- [ ] Generar el token (`openssl rand -hex 24`) y cargarlo en Render.
- [ ] Crear el *outgoing webhook* en Netlify (evento **Deploy succeeded**).
- [ ] Probarlo con el `curl` de la guía.

  Paso a paso: **`DEPLOY.md` §2.6**. Sin esto el aviso de versión funciona con la
  app abierta, pero **no** con la app cerrada — que era el punto.

### ✅ 4. Backend *always-on* — **HECHO (10-ago-2026)**
- [x] **Render Starter (US$7/mes)** activado. Se eligió por sobre el VPS no por
      ser mejor técnicamente —el VPS da más por el mismo dinero— sino porque **no
      migra nada**: misma imagen, misma base en Neon, mismas variables, mismo
      dominio; es un desplegable en el dashboard. La base autoalojada
      (`docker-compose.prod.yml` + `docker/README-DESPLIEGUE.md`) sigue ahí para
      migrar más adelante sin perder nada.
- [x] **Scheduler encendido** con `SCHEDULER_EN_CONTENEDOR=true`, dentro del
      mismo contenedor (un *background worker* aparte en Render se cobra por
      separado). Los **avisos programados a futuro ya se despachan solos** —
      pendiente arrastrado desde el principio del proyecto.
- [x] **Verificado en producción**, las tres cosas:
      - `php artisan schedule:work` aparece en la lista de procesos del contenedor.
      - `/admin` respondió en **500 ms** tras un rato de inactividad (con el plan
        free eran ~50 s). **Se acabó el arranque en frío.**
      - La tanda de avisos pendientes se despachó sola y **los avisos eran los
        esperados** (confirmado por el fundador).
- [x] Keep-alive externo: **no hace falta** y se descarta. Era el parche para el
      plan free.

  Paso a paso (y las tres opciones comparadas): **`DEPLOY.md` §2.9**.

  **La trampa de secuencia que costó una vuelta, para no repetirla:** se cargó
  `SCHEDULER_EN_CONTENEDOR=true` en Render **antes** de que el `start.sh` con el
  bloque del scheduler estuviera en `main`. Render despliega desde `main`, así que
  la variable estaba puesta y **no pasaba nada**: el contenedor corría el arranque
  viejo, que ni la miraba. No da error de ninguna clase — simplemente no ocurre.
  **Regla: primero mergear el código, después encender la variable.**

  **Lo que esto cierra:**
  - **419 al guardar** en el CMS y fotos que se evaporaban entre subir y guardar
    (`DEPLOY.md` §2.7): las dos eran consecuencia de que el servicio durmiera.
    Ahora se puede curar contenido sin miedo a perder lo escrito.
  - **Arranque en frío de ~50 s** en el primer clic — el que se iba a comer la
    respuesta de una encargada de turismo en la campaña de correos.
  - **Avisos programados**, que nunca habían funcionado en producción.

  **Lo que habilita para construir después:** el **push de "hay un reporte
  cerca"** necesita una **cola** (`queue:work`), no el scheduler. Ahora es
  posible: se agrega igual que el scheduler —otra línea en `start.sh` detrás de
  su propio interruptor— porque el contenedor ya no duerme. Cruza con los avisos
  segmentados por zona: conviene construir ese rail una sola vez para los dos.

  > **Matiz que conviene conservar:** el arranque en frío nunca dejó la app en
  > blanco al viajero. La PWA trae la semilla empaquetada y `client.js` cae en
  > ella cuando la API no responde. Lo que se caía eran los **reportes de ruta**,
  > el CMS y la campaña. Queda anotado porque explica por qué se podía difundir
  > "la guía" pero no "el estado de la ruta en vivo" — y ahora ya se puede
  > prometer lo segundo.

### 5. Landing `/proyecto` — depende del punto 1
Los **tres marcadores en rojo** quedaron cerrados:
- [x] **Correo** → `contacto@rutaaustral.cl` (3-ago-2026).
- [x] **WhatsApp** → `56951569704` (4-ago-2026). Va **solo como botón**, sin el
      número escrito en la página, para no dejarlo indexado en texto plano; el
      enlace `wa.me` lleva mensaje prellenado para reconocer de dónde llega el
      contacto.
- [x] **Firma** → Juan Pablo Monsalve Suazo (4-ago-2026), en "Quién está detrás".

Ver `BRIEF_LANDING.md` §9.

- [x] **Copy corregido según el brief (5-ago-2026).** Se reescribió el cuerpo de
      `frontend/public/proyecto.html` para que el argumento sea el que manda desde
      la corrección de conectividad: **la calidad del dato primero**, el offline
      segundo y ubicado donde de verdad ocurre (la decisión se toma en la ruta,
      antes de llegar). Lo que cambió:
      - **`<h1>`** — "…aunque no haya señal" → **"Su localidad ya está en la
        guía. Los datos correctos solo los tienen ustedes."** El titular ahora
        pide lo que la página vino a pedir.
      - **"El problema"** — se eliminó *"En gran parte de la Carretera Austral no
        hay señal … no puede buscar en Google"*. Abre con que el viajero **sí
        busca** y lo que encuentra está incompleto o vencido; el tramo sin
        cobertura queda como segundo párrafo, entre pueblo y pueblo.
      - **"La propuesta"** — las tres capacidades se reordenaron: 01 ficha por
        localidad (curada, no descargada de otra plataforma), 02 sirve donde se
        corta la cobertura, 03 estado de la ruta. El reporte se describe como se
        comporta de verdad: se escribe sin señal y **sale solo al llegar al
        pueblo**, que es la cola offline ya implementada.
      - **`<title>`, meta description y Open Graph** — decían "la guía offline";
        ahora encabezan con el dato correcto.
      - **"Lo que reciben"** — "sin depender de que tenga señal" → "tenga o no
        señal en ese momento".
      - **Verificado:** build + lint OK; `proyecto.html` **sigue fuera del
        precache** del service worker (19 entradas / 624,22 KiB, sin él);
        navegador (Playwright 390×844 y 1280×900): sin scroll horizontal, sin
        elementos desbordados, sin errores JS, cero marcadores en rojo. Las
        cuatro menciones a la señal que quedan se revisaron una por una y todas
        dicen lo correcto (hay señal en el pueblo, falta entre pueblos).

> **Lo que sigue pendiente de la landing, y no es copy:** la **entregabilidad**
> del buzón está sin medir. Purelymail se eligió asumiendo el riesgo de IPs
> compartidas, con el compromiso de comprobarlo con **mail-tester antes** de la
> campaña (`DEPLOY.md` §2.4.1, paso 8). Un `mailto:` que existe pero cae en spam
> falla igual que uno que rebota, solo que sin avisar.

### 6. Campaña de correos — depende de 1 y 5, y es la que decide el producto
- [ ] Mandarla a las 26 encargadas de turismo municipal + dueños de alojamiento
      y comida. Es lo que convierte las **75 fichas `preliminar`** en dato real.
      (Cifra verificada el 5-ago-2026 contra los seeds: 231 lugares en total, 156
      publicados —26 localidades × 6 categorías—, de los cuales 75 son
      `preliminar`. Antes este documento decía 76 acá y 83 más abajo.)

  *Yo puedo redactar los dos correos y armar la lista de contactos —
  hoy no existe en el repo— para que salga el mismo día que llegue el dominio.*

### 7. Tus dos fichas reales (las primeras destacadas de verdad)
- [ ] Datos de la **hamburguesería del km 1020**: nombre, horario, teléfono, fotos.
- [ ] Ídem del **transporte + encomiendas Tortel↔Cochrane**.
- [ ] Cargarlas en `/admin` y marcarlas `destacado`.

### 8. Contenido SERNATUR, cuando toque republicar
- [ ] Correr el pipeline + `SernaturPlaceSeeder` **en local contra Neon**: el CSV
      fuente vive fuera del repo y desde la web no hay acceso a la BD de
      producción. Ver `scripts/sernatur/README.md`.

### 9. Sentry (free)
- [ ] Crear la cuenta. Cuesta cero y conviene **antes** de tener usuarios reales,
      para que el primer bug en la ruta no llegue como "no me funcionó" por
      WhatsApp y sin forma de reproducirlo.

---

## Publicitar la app — qué está listo y qué falta (10-ago-2026)

Frente nuevo. Hasta acá el proyecto le habló a **quien tiene el dato** (municipios
y dueños de servicios); esta sección es sobre hablarle a **quien lo usa**: el
viajero. Se escribe entera porque el error caro en difusión no es elegir mal el
canal, es **anunciar antes de tiempo**: la atención de un grupo de Facebook de la
Carretera Austral se pide una vez, y si el que entra encuentra medio directorio
"por confirmar", no vuelve ni cuando esté bueno.

### Lo que ya está listo (no hay que construir nada)

- **Dominio propio con SSL** (`rutaaustral.cl`), que es lo que hace que el enlace
  se pueda dictar por teléfono y no parezca spam.
- **PWA instalable de verdad**: manifest correcto, iconos por plataforma
  (incluido `apple-touch-icon`, sin el cual iOS guardaba una captura),
  `beforeinstallprompt` atrapado en el `<head>` y aviso de versión nueva.
- **Contenido publicado**: 27 localidades, 159 fichas, mapa offline, chatbot,
  reportes de ruta.
- **Landing `/proyecto`** con el copy corregido, correo y botón de WhatsApp — es
  para municipios y dueños, pero sirve de respaldo cuando alguien pregunta "¿y
  quién está detrás de esto?".
- **QR imprimible** (`/qr-rutaaustral.svg` y `.png`, descargables desde la
  landing), listo para pegar en un mesón.
- ✅ **Tarjeta de vista previa al compartir — HECHO HOY (10-ago-2026).** Ver
  abajo; era el único bloqueo de código real que quedaba para poder difundir.

### ✅ Lo hecho hoy: que el enlace se pueda compartir (10-ago-2026)

**El problema.** `index.html` —o sea, lo que sirve `rutaaustral.cl`, la app misma—
**no tenía ninguna etiqueta Open Graph**. Curiosamente la landing `/proyecto` sí
las tenía (título, bajada, `canonical`), pero **sin imagen**. Consecuencia
concreta: mandar el enlace de la app por WhatsApp, pegarlo en un grupo de
Facebook o ponerlo en la bio de Instagram producía **una línea de texto azul**,
sin imagen, sin nombre y sin explicación. En un grupo donde compiten veinte
mensajes al día, ese enlace no lo abre nadie. No es cosmética: es el primer
contacto de todo canal de difusión que existe.

**Qué se hizo:**

- **`frontend/scripts/generar-og.py`** — genera `public/og-rutaaustral.png`
  (1200×630, el formato 1.91:1 que piden Open Graph y Twitter; 91 KB). Es un
  **PNG y no el SVG que ya existía** porque WhatsApp, Facebook e Instagram no
  renderizan SVG en la vista previa. El script **importa `generar-iconos.py`** y
  reusa su dibujo: el badge de la tarjeta es **exactamente** el icono de la PWA,
  así que la imagen que alguien ve en WhatsApp es la misma marca que después le
  queda en el lanzador del teléfono. Lo único propio es la composición
  horizontal (el icono es cuadrado, la tarjeta es panorámica, así que la
  cordillera se dibuja con otras proporciones). Las fuentes se buscan en una
  lista de candidatas por sistema (DejaVu en el contenedor de CI, Segoe/Arial en
  el Windows del fundador, Helvetica en Mac) para que el generador corra igual en
  los tres lados.
- **Etiquetas en `index.html`**: `og:type/site_name/locale/url/title/description`,
  `og:image` con **URL absoluta** (los rastreadores no resuelven rutas relativas),
  `og:image:width/height/alt`, `twitter:card = summary_large_image` y `canonical`.
  La bajada le habla al **viajero**, no al municipio, y respeta la corrección de
  conectividad: dice que sirve "en los tramos de ruta sin señal", no que los
  pueblos estén incomunicados.
- **Etiquetas en `proyecto.html`**: se le sumó la **imagen** que le faltaba (la
  misma), porque ese enlace se pega en correos y WhatsApp municipales.
- **Fuera del precache** (`globIgnores` en `vite.config.js`, junto a
  `proyecto.html` y el QR): la imagen la piden los **rastreadores**, el viajero no
  la ve nunca. Precargarla sería hacer que cada teléfono baje 91 KB para nada.

**Verificado:** `npm run lint` y `npm run build` limpios; el build deja
`og-rutaaustral.png` en `dist/` pero el precache **sigue en 19 entradas** y no la
incluye (revisadas una por una en `dist/sw.js`); las etiquetas llegan al
`dist/index.html` final. La imagen se revisó a ojo: badge sin las escuadras
negras del primer intento (las esquinas redondeadas son transparentes y hay que
pegarlas con su alfa como máscara, si no Pillow las rellena de negro).

**Acción manual al desplegar** (no se puede hacer desde acá): WhatsApp y Facebook
**cachean la vista previa por URL**, así que si alguien ya compartió el enlace
antes de este cambio le va a seguir saliendo pelado. Se fuerza el re-escaneo con
el *Sharing Debugger* de Facebook (`developers.facebook.com/tools/debug`), y para
probar en WhatsApp basta mandarse el enlace con un parámetro cualquiera
(`rutaaustral.cl/?v=2`), que para su caché es otra URL.

### Lo que falta antes de gastar la primera impresión, en orden

1. **Medir — y esto va PRIMERO, antes del primer volante.** Hoy la analítica es
   **cero**: no sabemos cuánta gente entra, desde dónde, si instala la app ni si
   vuelve. Difundir sin eso es gastar el mes de trabajo sin saber qué canal
   funcionó, que es exactamente el "volar a ciegas" que el `ROADMAP.md` pone
   como objetivo n.º 1. No hace falta nada grande: sirve un contador propio
   (mismo criterio que ya se acordó para medir la contribución al crowdsourcing).
   **Es lo único de esta lista que conviene hacer ya.**
2. **Las 75 fichas `preliminar`** (48% de lo publicado). Es el motivo por el que
   la difusión masiva va **después** de la campaña de correos, no antes.
3. **Fotos.** Ya **no están bloqueadas**: el bucket R2 quedó operativo el
   10-ago-2026 y las fichas admiten fotos. Lo que falta es cargarlas — un
   directorio donde ninguna ficha tiene foto se comparte mal: en redes, la foto
   *es* el anuncio. Va en la misma pasada que las fichas `preliminar`.
4. ~~**Always-on**~~ — ✅ **hecho el 10-ago-2026**, así que este punto sale de la
   lista de bloqueos de la difusión: ya se puede anunciar también **el estado de
   la ruta en vivo**, no solo la guía. Se conserva el razonamiento porque explica
   qué se podía prometer antes y por qué:
   > Este documento venía diciendo que el arranque en frío de ~50 s se comería el
   > primer clic. Para la **campaña de correos** era cierto. Para la **app** no
   > tanto: la PWA trae la semilla empaquetada (`data/places.js`) y `client.js`
   > cae en ella cuando la API no responde, así que quien llegaba por un anuncio
   > **veía las 156 fichas igual**, con backend dormido. Lo que sí se caía eran
   > **los reportes de ruta** (tardaban ~50 s en aparecer) y el primer envío del
   > día. Traducción de entonces: se podía anunciar **la guía**, pero no "el
   > estado de la ruta en vivo".

### Canales, del que más rinde al que menos (todos gratis)

- **El QR impreso donde ya hay gente cautiva y en tema**: la hamburguesería del
  km 1020 y el furgón Tortel↔Cochrane. Es el mejor canal que tiene el proyecto y
  no depende de ningún algoritmo — el viajero está detenido, con el tema en la
  cabeza, y el QR ya existe. Suma las OIT y los mesones de los alojamientos (eso
  se pide en el mismo correo de la campaña).
- **Grupos de Facebook de la Carretera Austral / Aysén / camperos y
  overlanders.** Alta intención, cero costo. Regla: entrar aportando (responder
  preguntas de ruta con el dato) y no como aviso — un enlace suelto en un grupo
  se borra o se ignora.
- **Instagram de los negocios del fundador**, que ya tienen público de la zona.
- **Las encargadas de turismo municipal**: son las que recomiendan en persona.
  Es la misma campaña B2B, y por eso conviene que el correo pida las dos cosas —
  el dato y que difundan.
- **Google: no contar con esto por ahora, y conviene decirlo claro.** La app es
  una SPA con **una sola URL indexable**, sin `sitemap.xml` ni `robots.txt`, y el
  contenido lo pinta JavaScript. Sumar esos dos archivos es media hora y está
  bien hacerlo, pero **no va a traer tráfico**: para aparecer en búsquedas de
  "dónde dormir en Cochrane" haría falta una página por ficha renderizada en el
  servidor, que es un proyecto entero y hoy no toca.

### El reloj (temporada alta = diciembre–marzo)

- **Agosto**: analítica + campaña de correos + sembrar los primeros reportes con
  el furgón.
- **Septiembre**: cerrar las fichas con lo que llegue por correo; fotos.
- **Octubre–noviembre**: difusión, que es **cuando el viajero planifica** el
  viaje de temporada. Llegar en diciembre es llegar tarde: en diciembre ya
  decidió dónde para.
- **Diciembre–marzo**: temporada, medir, y recién ahí decidir si el crowdsourcing
  se refuerza o se archiva.

### La regla que no hay que romper al escribir un anuncio

Vale para todo lo que salga a la calle, y ya está en `CLAUDE.md`: **no escribir
copy que insinúe que los pueblos están incomunicados.** En los pueblos hay señal,
y buena. Lo que falta es cobertura **entre** pueblo y pueblo, y lo que falta de
verdad es **el dato correcto de los servicios chicos**. Lo va a leer gente que
vive ahí.

---

## Crowdsourcing (reportes de ruta) — pendientes (al 5-ago-2026)

El **PMV está implementado y desplegado** desde el 27-jul-2026 (detalle técnico
completo en Fase 3, más abajo): reportar, ver en el mapa, votar "¿sigue ahí?",
caducidad por tipo evaluada al leer, cola offline en IndexedDB y moderación en el
CMS. Lo que sigue está acá, junto, porque hasta ahora estaba repartido en tres
lugares del documento y no se veía como una sola lista de trabajo.

> **La pieza que falta no es una feature, es gente reportando.** El código ya
> permite el ciclo completo; lo que no está probado es que alguien lo use. Por eso
> los dos primeros puntos van antes que cualquier mejora de la vista.

### A. Lo que decide si el sistema vive (arranque en frío)

- [ ] **Sembrar los primeros reportes con el propio operador.** El furgón
      Tortel↔Cochrane hace ese tramo cada semana: es el único reportero sistemático
      disponible hoy y cubre justo el tramo con menos información. Sin una base de
      reportes, el primer viajero abre el mapa, no ve nada y no vuelve.
- [ ] **Medir la contribución.** Hoy no hay analítica: no sabemos cuántos reportes
      se crean, cuántos se votan ni cuántos se leen. Sin esos tres números no se
      puede decidir si el crowdsourcing se refuerza o se archiva — que es
      exactamente lo que pide la disciplina PMF/APM del roadmap. Basta un contador
      propio en el CMS (los datos ya están en `reportes` y `reporte_votos`); no
      hace falta una herramienta externa.
      **Subió de prioridad el 10-ago-2026**: es la **misma pieza** que necesita el
      frente de difusión para no anunciar a ciegas (ver "Publicitar la app",
      punto 1). Conviene construirla una sola vez, sirviendo a los dos: cuánta
      gente entra e instala (difusión) y cuántos reportan y votan (crowdsourcing).

### ✅ B. Lo que estaba bloqueado por infraestructura — DESBLOQUEADO (10-ago-2026)

**Este grupo se vació el 10-ago**: el bucket R2 y el backend *always-on* se
activaron el mismo día (puntos 2 y 4 de "Lo que depende de TI"). Nada de acá
espera ya a la infraestructura; lo que queda es trabajo de código, y por eso
todo pasa al grupo C.

- [x] ~~**Arranque en frío de ~50 s.**~~ **Resuelto.** Era lo más grave de este
      grupo y no por comodidad: el reporte se hace detenido en la ruta con una
      barra de señal, y con 50 s de espera **no se hace**. El keep-alive que
      figuraba como parche ya no hace falta.
- [ ] **Push "hay un reporte cerca"** → **pasa al grupo C**. Sigue necesitando una
      **cola** (`queue:work`), que es una pieza distinta del scheduler ya
      encendido, pero ya no es un bloqueo: se agrega igual que el scheduler, otra
      línea en `backend/docker/start.sh` tras su propio interruptor, porque el
      contenedor no duerme. Es lo que convierte los reportes de "algo que veo si
      abro la app" en "algo que me entero". Cruza con los **avisos segmentados
      por zona**: conviene construir ese rail una sola vez para los dos.
- [ ] **Foto en el reporte** (un derrumbe se entiende en una foto) → **pasa al
      grupo C**. Desbloqueado por R2; reusa `ImagenServicio`/`GuardarFoto`, que
      ya convierten a WebP en la petición.

### C. No bloqueado — se puede construir cuando toque

- [x] **Filtrar los reportes por tramo/localidad** en la vista, como ya se filtran
      los lugares. **HECHO (6-ago-2026)** — ver el detalle abajo.
- [x] **Agrupar pines de reportes** cuando hay varios en el mismo punto.
      **HECHO (6-ago-2026)** — ver el detalle abajo.
- [x] **Reportes de la temporada de obras.** Revisado: los diez tipos **no**
      alcanzaban. Se sumó `faena` con 168 h. **HECHO (6-ago-2026)** — ver abajo.

#### ✅ Los tres puntos del grupo C — HECHOS (6-ago-2026)

**1. Filtro por tramo/localidad** (`App.jsx`, `styles.css`, `i18n.jsx`). Dos
reglas, una por vista, porque el viajero pregunta cosas distintas en cada una:

- **Dentro de un pueblo**: solo los reportes de ese pueblo (`r.localidad ===
  localidad`), igual que los lugares. Sin control nuevo: lo decide la localidad
  abierta.
- **En la ruta completa**: fila de chips `Todos · Norte · Centro · Sur` con el
  **número de reportes de cada tramo**, reusando las macrozonas del buscador
  (`macrozonaDe`). Solo aparece si hay reportes, y va en una segunda fila a la
  derecha (`.rep-tramos`, top +110px) para no pelearse el ancho con el selector
  de capas ni con el chip de "sin conexión".
- **Los reportes sin localidad no se pierden.** La API solo atribuye un pueblo si
  hay uno a menos de 60 km, y en la Austral el reporte más valioso —el del camino
  entre pueblos— es justo el que cae fuera de ese radio. El tramo de esos se
  calcula en el cliente con haversine contra la localidad más cercana.
- Todo el filtrado es en el cliente sobre lo que ya está en IndexedDB: **anda sin
  señal**, que es cuando se decide dónde parar.
- Detalle de UX: al enviar un reporte se sueltan los chips (`setTramo(null)`), o
  el pin recién creado podía caer fuera del filtro puesto y el viajero leía
  "enviado" sin ver nada aparecer.

**2. Agrupación de pines de reportes** (`MapView.jsx`, `styles.css`). Los
reportes se apilan en los mismos puntos (el muelle de la barcaza, la bomba de
bencina, el tramo en obras) y sueltos **solo se podía tocar el de encima**. Ahora
van en un `L.markerClusterGroup` (`leaflet.markercluster`, que ya estaba en
`package.json` desde el clustering de lugares del 21-jul, pero **había quedado
sin usar** tras el rediseño map-first: hoy los lugares no se agrupan, solo los
reportes). Radio chico (36 px) para juntar lo que está en el mismo punto sin
mezclar dos puntos distintos del pueblo; `spiderfyOnMaxZoom` para el caso de dos
reportes con la MISMA coordenada. El icono del grupo es el mismo rombo con el
número y **el color del tipo dominante** (empate resuelto por el orden de
`data/reportes.js`, de lo más grave a lo más liviano), así el grupo dice de qué
se trata antes de abrirlo.

**3. Tipo `faena` para la temporada de obras** (backend + PWA + CMS). La revisión
dio que **faltaba**: lo más cercano era `camino`, que caduca en 24 h, y una faena
del Plan Ruta Austral dura **semanas** en el mismo punto — el dato se apagaba
cada noche y el que venía detrás se encontraba la obra sin aviso. Se sumó
`'faena' => 168` (7 días) a `Reporte::VIDA_HORAS`, con su etiqueta bilingüe
(`repFaena`: "Faena / desvío" / "Roadworks / detour"), icono propio de cono
(`cone` en `Icon.jsx`) en rojo para no confundirlo con el amarillo de "camino
malo", y su entrada en el CMS (`ReporteResource::TIPOS`). No hizo falta
migración: `tipo` es un `string(24)`, no un enum.

> **Bug que destapó el tipo nuevo — el tope de extensión acortaba los reportes.**
> Confirmar ("¿sigue ahí?") aplicaba `min(expira_en + 3 h, now + 24 h)`: para
> cualquier tipo de vida mayor a 24 h eso **recortaba** la vigencia. Ya pasaba
> con `camping` y `evento` (72 h → 24 h al primer voto): la comunidad enterraba
> el reporte justo por darle la razón. Con `faena` (168 h) habría sido siete
> veces peor. Ahora el tope depende del tipo
> (`Reporte::topeExtensionHoras()` = "una vida entera por delante", con el mínimo
> de 24 h de siempre) y además **una confirmación nunca puede acortar**. Cubierto
> por `test_confirmar_no_acorta_un_reporte_de_vida_larga`.

**Verificado**: `npm run lint` y `npm run build` limpios; `php artisan test` en
verde; y en navegador (Playwright, 412×900) con 6 reportes de prueba repartidos
en los tres tramos: los chips contaron `Todos 6 · Norte 1 · Centro 2 · Sur 3`
(el 3 del sur incluye el reporte **sin localidad**, ubicado por cercanía), el
filtro dejó en el mapa solo lo del tramo elegido, dos reportes en el mismo punto
quedaron en un grupo con "2" que se abre al tocarlo, entrar a Cochrane escondió
los chips y dejó únicamente sus dos reportes, y la hoja de reportar mostró los
diez tipos con "Faena / desvío" entre ellos. Sin errores de JS.

#### ⚠→✅ Corrección del filtro tras probarlo en producción (6-ago-2026)

**El fundador lo probó apenas se desplegó y no se entendía nada.** Creó 4
reportes desde la app y el chip decía `Norte 4`, pero el mapa **no mostraba
nada**. Vale escribirlo completo porque el error es del tipo que no aparece en
ningún test verde:

- **Qué pasó.** Los reportes se crearon **fuera de la Carretera Austral**: sin
  GPS en la ruta, el navegador ubica por IP y los mandó a ~1.000 km al norte. La
  API los guardó **sin localidad** (su radio es de 60 km), y entonces entró el
  fallback del cliente —"búscale la localidad más cercana"—, que **no tenía
  límite de distancia**: un punto en Santiago igual "ganaba" Puerto Montt y se
  contaba como Norte. Pines dibujados a mil kilómetros del encuadre = chip con
  número y mapa vacío.
- **La lección**: un conteo que no se corresponde con lo que se ve en pantalla es
  peor que no mostrar el conteo. El fallback estaba pensado para rescatar el
  reporte del camino entre pueblos, y terminó inventando pertenencia.
- **Arreglado así**: (1) el fallback ahora tiene tope, `RADIO_TRAMO_KM = 200`, y
  lo que cae más lejos **no pertenece a ningún tramo y no se dibuja ni se
  cuenta** (`reportesEnRuta`); (2) el control lleva **título visible**
  ("Reportes de la ruta" / "Road reports") — antes era una fila de números
  sueltos sobre el mapa, imposible de interpretar sin que alguien la explicara;
  (3) **elegir un tramo lleva el mapa hasta esos reportes**
  (`encuadrarReportes()` en `MapView`), porque el chip era mudo: se tocaba y
  nada se movía; (4) un tramo **en 0 queda apagado y no se puede tocar**, en vez
  de dejar el mapa en blanco sin explicación.
- **Verificado** reproduciendo el caso exacto: fixture con 6 reportes en la ruta
  **+ 4 en Santiago**. Los chips cuentan `Todos 6` (no 10) y Norte no se infla;
  con un tramo vacío, su chip sale deshabilitado. Lint y build limpios.

**Y el arreglo de raíz: fuera de la Austral no se reporta.** Esconder los
reportes de más era tratar el síntoma; el problema es que se pudieran crear.
Ahora hay un radio de ruta (`RADIO_RUTA_KM = 150`, generoso a propósito) en los
**dos lados**:

- **En la app** (`reportar()`): si el punto está más lejos que eso, sale
  "Estás fuera de la Carretera Austral: el reporte no se envía" y no se manda ni
  se encola. Se comprueba en el cliente para que el aviso llegue **sin señal**,
  que es justo donde se reporta.
- **En la API** (`ReporteController::store`): 422 con `error: fuera_de_ruta`. La
  API es pública y una PWA cacheada puede ser vieja, así que el servidor no
  puede confiar en el cliente. La PWA ya no reintenta los 422, así que el
  reporte rechazado no queda dando vueltas en la cola de salida; y el motivo
  viaja hasta el toast para no decir "no se pudo enviar" (que invita a
  reintentar algo que nunca va a entrar).

> **La distinción que hay que no perder**: "fuera del radio de un pueblo" (60 km,
> el reporte se guarda **sin localidad**) y "fuera de la Carretera Austral"
> (150 km, se rechaza) son cosas distintas. El reporte del camino ENTRE pueblos
> es la razón de ser del crowdsourcing y no puede rebotar jamás. El test
> `test_reporte_fuera_de_radio_queda_sin_localidad` usaba coordenadas de
> Santiago para probar el primer caso; se corrigieron a un punto real de la ruta
> (camino Cochrane→Tortel), porque con la regla nueva Santiago ya no es "lejos
> del pueblo": es otra cosa. Suite completa: **31/31**.

**Y una consecuencia del bloqueo que había que resolver: sembrar desde un
computador.** El pin de un reporte queda —y sigue quedando— en la posición del
viajero. Pero **un computador no tiene GPS**: el navegador ubica por IP, y eso
deja el punto en la ciudad del proveedor aunque estés parado en Cochrane. Con el
radio de ruta a secas, el fundador no podía crear ni un reporte desde el
escritorio, justo cuando el punto A de esta lista (sembrar los primeros reportes)
depende de que pueda hacerlo. Regla final en `reportar()`:

1. GPS **en la ruta** → el pin va ahí (el caso normal, el del viajero).
2. GPS fuera de la ruta **pero con una localidad abierta** → se usa el centro de
   ese pueblo. Es la misma regla que ya existía para cuando no hay GPS ninguno.
3. Sin GPS utilizable y sin localidad abierta → no se envía, con aviso.

Verificado en navegador con GPS simulado, los tres casos: desde Santiago sin
localidad salen **cero peticiones** y aparece el aviso; desde Cochrane entra
normal; y desde Santiago **con Cochrane abierto** entra ubicado en el pueblo,
que es el camino para sembrar.

**Y el efecto colateral de sembrar así: el reporte tapaba el pueblo.** Un reporte
creado con la localidad abierta cae en el **centro exacto** del pueblo, y el
rombo del reporte (32×32, centrado en su coordenada) quedaba justo encima del
punto de la localidad — que es lo **único tocable** de un pueblo en la vista de
ruta: mide 26×26 px y su etiqueta lleva `pointer-events: none`. Resultado: **no
se podía entrar a la localidad**. Lo detectó el fundador probando la app.
Arreglado con dos medidas que se refuerzan:

- El pin de reporte va **anclado por abajo**, no centrado: queda ENCIMA del
  punto, señalándolo, y deja el punto libre. Es lo que ya hacía la gota de los
  lugares (`pinCategoria`, anclada en su punta) — el rombo centrado era la
  excepción, no la regla.
- Los marcadores de localidad suben a `zIndexOffset: 600`, por encima de los
  reportes (500): entrar al pueblo es la **navegación principal** del mapa y no
  puede bloquearla un pin temporal que le cayó encima.

Verificado con un reporte clavado en la coordenada exacta de Cochrane:
`elementFromPoint` sobre el punto devuelve el punto del pueblo (no el reporte) y
el toque entra a Cochrane.

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
  - **Cupos vacíos → fichas `preliminar: true`** (**75 fichas**, en el rango de
    ids **3001–3083** — el rango tiene huecos, no son 83): nombre
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

- **✅ Landing de presentación — COPY CORREGIDO (5-ago-2026).** Página para
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
  - **✅ Marcadores cerrados (4-ago-2026):** firma, correo y WhatsApp. Ya no
    queda ningún `[TU-…]` en el archivo. La regla CSS `.pendiente` (que los
    pintaba en rojo) **se dejó en el archivo a propósito**, por si más adelante
    se agrega un dato por rellenar.
  - **✅ Copy reescrito según el brief (5-ago-2026).** Lo que quedaba pendiente
    era esto y ya está: la página abre por la **calidad del dato** y el offline
    pasó a segundo lugar, ubicado entre pueblo y pueblo, que es donde de verdad
    falta cobertura. Detalle de los cambios en el punto 5 de "Lo que depende de
    TI", arriba. **El encargo de `BRIEF_LANDING.md` §2 quedó cumplido**; el brief
    sigue siendo la referencia de estructura, datos verificados y prohibiciones
    para cualquier pasada futura.
  - **Verificado (5-ago-2026):** build + lint OK; `proyecto.html` **fuera del
    precache** del service worker (19 entradas / 624,22 KiB — la cifra vieja de
    "10 entradas / 573,62 KiB" ya no aplica: el precache creció con la app, y lo
    que hay que revisar es que la landing no esté en la lista, no el total); y
    navegador (Playwright 390×844 y 1280×900): sin desborde horizontal, sin
    errores JS, cero recursos externos cargados.

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
  - **✅ MapView (menores) — HECHO (30-jul-2026):** (a) **feedback del botón
    *ubicarme***: `MapView` reporta el estado del GPS (`onEstadoGeo`:
    `buscando`/`ok`/`sin`) y el botón del rail **ya no se deshabilita** — mientras
    busca fix muestra un **spinner** (`aria-busy`), y al tocarlo sin ubicación
    responde con un **toast** que dice si está buscando o si falta el permiso (en
    el celular el `title` no se ve, y un botón gris y mudo no explica nada);
    (b) **fade de la línea de ruta**: la Ruta 7 se dibuja en un **pane propio**
    (`ruta7`, z 400) con `transition` de opacidad, así se **desvanece** al entrar
    a un pueblo y vuelve con fundido de entrada, en vez del parpadeo de antes; la
    capa se saca del mapa recién al terminar la transición.
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

**Dominios `.cl` — PENDIENTE, y es el gasto #1 del plan de inversión
(anotado 31-jul-2026).** Cuesta ~CLP 10.000/año y **no se compra para la app: se
compra para el correo**. La campaña a encargadas de turismo municipal y a dueños
de alojamiento —la que decide cuántas de las 75 fichas `preliminar: true` se
vuelven reales— se responde si sale de `@<dominio>.cl` con un sitio detrás; desde
Gmail apuntando a `netlify.app` parece spam. Por eso va **antes** que el
always-on, aunque técnicamente el always-on valga más.

- **Dónde:** NIC Chile (`nic.cl`), registro directo. Un `.cl` exige RUT o
  representante en Chile — el fundador lo tiene, así que no hay fricción.
- **Nombre elegido (3-ago-2026): `rutaaustral.cl`.** Dice qué es sin explicar
  nada, se dicta por teléfono sin deletrear y no se pisa con el nombre del
  producto en la app ("Patagonia Austral"), que sigue igual.
- **Cuáles registrar:** el elegido **más las variantes que se confunden al
  dictarlo por teléfono**: `ruta-austral.cl` (con guion) y `rutasaustral.cl`
  (plural). Es el único momento barato para hacerlo: después, si el proyecto
  camina, la variante la compra un revendedor. Las secundarias solo redirigen a
  la principal, no se despliega nada en ellas.
- **Qué hay que tocar cuando esté comprado** (ninguno es automático):
  1. **Netlify** → dominio personalizado + SSL (Let's Encrypt automático).
  2. **`FRONTEND_URL` en Render** → la URL nueva. **Esta es la trampa:**
     `backend/config/cors.php` tiene patrones comodín solo para `netlify.app` y
     `onrender.com`; un dominio `.cl` **no calza con ninguno**, así que si no se
     actualiza esa variable la PWA queda servida pero **sin datos**, y el error
     sale como CORS en la consola, no como caída.
  3. **`VITE_API_URL`** si además la API pasa a `api.<dominio>.cl` — es
     **build-time**: hay que **redesplegar Netlify**, no basta con guardarla.
  4. **`APP_URL`** en Render (Laravel la usa para las URLs absolutas).
  5. **`R2_URL`** → subdominio propio del bucket (`fotos.<dominio>.cl`): saca las
     fotos del rate limit de `r2.dev` y evita migrar filas después, porque en la
     BD se guarda la ruta, no la URL completa (`DEPLOY.md` §2.5).
  6. **Key de Stadia** → restringirla al dominio nuevo (`DEPLOY.md`, paso del
     basemap de terreno), o el basemap deja de cargar.
  7. ✅ **Correo del dominio** — que es el motivo de todo esto. **Purelymail**
     (decidido 4-ago-2026, ~US$10/año); **buzón montado y confirmado el
     5-ago-2026**. Paso a paso en `DEPLOY.md` §2.4.1. Queda solo medir la
     entregabilidad (paso 8) antes de mandar la campaña.
- **Ojo con la PWA:** cambiar de origen (`netlify.app` → `.cl`) es un origen
  nuevo para el navegador. Quien ya tenga la app instalada conserva la vieja con
  su IndexedDB y su suscripción de push apuntando al origen viejo; conviene dejar
  el sitio de Netlify redirigiendo y no darlo de baja el mismo día.

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
- **✅ Rótulos del mapa: costeros al agua y los dos pasos del este — HECHO
  (31-jul-2026):** a pedido tras revisar la vista general en el celular.
  - **Cinco pueblos rotulan a la IZQUIERDA** (`ETIQUETAS_LOCALIDAD`): Chaitén,
    Puyuhuapi, Puerto Aysén y Caleta Tortel se suman a Puerto Río Tranquilo. El
    criterio quedó escrito junto a la constante: la Ruta 7 corre pegada al borde
    oeste del continente, así que a la **derecha** de un pueblo costero hay
    cordillera, ruta y pueblos vecinos, y a la **izquierda** hay mar o fiordo —
    mapa vacío donde el nombre se lee limpio y no tapa nada.
  - **Puyuhuapi vuelve a tener etiqueta fija** (`LOCALIDADES_ROTULADAS`). Se
    había sacado en su momento porque su nombre chocaba con el de La Junta; el
    arreglo correcto era el **lado**, no quitarle el rótulo.
  - **Futaleufú y Palena ahora se rotulan.** Las localidades ya existían en el
    seed (orden 55 y 58) pero eran **dos puntos verdes mudos** al este de
    Chaitén: sin nombre no se entendía que son los dos desvíos al este desde
    Villa Santa Lucía / Puerto Ramírez (Ruta 235) ni que son pasos a Argentina
    (Trevelin/Esquel y Río Encuentro), algo que en la ruta se pregunta mucho. El
    borde argentino del mapa es espacio limpio, así que rotulan a la derecha.
  - **`alta` de Puerto Aysén eliminado:** existía solo para que su nombre no
    chocara con Coyhaique; al mandarlo al fiordo el choque desaparece por el
    lado, y el `alta` únicamente despegaba la etiqueta de su propio punto.
  - **Verificado en navegador** (Playwright, 390×844): los 14 rótulos fijos de la
    vista general, con su lado y su caja medidos — 5 a la izquierda, Futaleufú y
    Palena presentes, **cero solapamientos** entre pares de etiquetas y sin
    errores JS. Build + lint OK. Solo tocó `data/places.js` (constantes de
    presentación del frontend; no hay espejo en el backend).
- **✅ Actualización visible de la PWA — HECHO (30-jul-2026):** hasta ahora el
  service worker se registraba con `registerType: 'autoUpdate'`: la versión nueva
  entraba sola y **la app se recargaba sin decir nada**. En la ruta, con el mapa
  abierto, ese reinicio espontáneo parece una caída. Ahora el ciclo es explícito
  (`frontend/src/actualizacion.js`, `registerType: 'prompt'`):
  - **Indicador en el icono** de la app instalada (Badging API `setAppBadge`)
    cuando queda una versión esperando: se ve en el escritorio / pantalla de
    inicio **aunque la app esté cerrada**, y es lo que trae al usuario de vuelta.
  - **Al abrir con una versión esperando se aplica sola**, mostrando el cartel
    "Actualizando la app…" (con la nota de que los mapas y reportes guardados no
    se pierden) y, tras el reinicio, el toast "App actualizada". El reinicio deja
    de ser un parpadeo sin motivo.
  - **Si la versión llega con la app en uso NO se interrumpe**: aparece un aviso
    con el botón "Actualizar" (y el punto en el botón de menú); si no lo tocan,
    la aplica la próxima apertura. Se chequea al abrir, al volver a primer plano
    y cada hora, siempre con señal.
  - **Menú → "Versión de la app"**: fecha del build (`__VERSION_APP__`) y chequeo
    manual. Sirve para confirmar de un vistazo que la actualización sí entró.
  - Ojo: `clientsClaim: true` quedó explícito en el `workbox` del vite.config —
    lo ponía `autoUpdate` por su cuenta y sin él la primera visita se quedaba sin
    service worker (o sea, sin offline) hasta la visita siguiente.
- **✅ Aviso de versión nueva con la app cerrada — HECHO (31-jul-2026):** el punto
  en el icono de arriba solo lo pintan Windows y macOS: **Chrome en Android no
  expone la Badging API**, y ahí el puntito del lanzador sale de tener una
  **notificación activa**. Además, con la app cerrada no corre nada que pueda
  detectar la versión. Las dos cosas se resuelven con el canal que ya existía:
  - **Notificación silenciosa** al detectar la versión (`actualizacion.js`), con
    `tag` única, que se **cierra sola** al actualizar para que el punto no quede
    pegado. Nunca pide permiso: si el viajero no lo dio, se queda sin ese
    indicador y listo.
  - **Push desde el backend al desplegar**: `POST /api/version/desplegada`
    (`VersionController` + `WebPushSender::enviarNuevaVersion`), que llama el
    **webhook de Netlify** al publicar producción. Es lo único que llega con la
    app cerrada. Va con token (`DEPLOY_PUSH_TOKEN`, secreto del dashboard; vacío
    = hook cerrado), solo atiende `context: production`, tiene ventana de 15 min
    (Netlify dispara el hook más de una vez por deploy y un push va a **todos**
    los teléfonos) y rate limit por si alguien prueba el token a fuerza bruta.
    Tests: `backend/tests/Feature/VersionPushTest.php`.
  - Al tocar la notificación, el SW le pide a la app que **aplique la versión**
    (`postMessage`), no solo que se abra. Con la app abierta, el push únicamente
    avisa: la versión se busca igual contra el service worker.
  - Falta **acción manual**: crear `DEPLOY_PUSH_TOKEN` en Render y configurar el
    outgoing webhook en Netlify (`DEPLOY.md` §2.6). Sin eso, todo lo demás
    funciona salvo el aviso con la app cerrada.
- **✅ Icono nuevo y arranque de la PWA — RESUELTO (30-jul-2026):** el icono
  anterior (montaña + sol en blanco sobre verde) se confundía con el glifo de
  "imagen rota" y, sobre todo, estaba **mal declarado**: la entrada `maskable`
  del manifest apuntaba **al mismo archivo** que la normal, así que Android le
  aplicaba su máscara y le cortaba las cumbres y el sol. Además **no había
  `apple-touch-icon`**, con lo que "Agregar a pantalla de inicio" en iOS —el
  gesto que instala la app— guardaba una captura de la página en vez del icono.
  - **Diseño nuevo:** el **7 de la Ruta 7** (la Carretera Austral *es* la Ruta 7)
    en crema sobre la silueta de la cordillera, con el sol amarillo. Se eligió una
    forma sola y gruesa porque el icono se ve casi siempre a **48 px** en el
    lanzador: ahí un paisaje con detalle o un camino en perspectiva se vuelven un
    borrón (se probaron ambos antes de descartarlos).
  - **Variantes**, una por tipo de recorte: `icon-192`/`icon-512` (`any`, con
    esquinas propias), `icon-maskable-512` (a sangre, contenido dentro del círculo
    seguro del 80%), `apple-touch-icon` (180, cuadrado y **sin alfa** — iOS rellena
    de negro la transparencia) y `favicon.svg`.
  - **Reproducible:** `frontend/scripts/generar-iconos.py` (Pillow) genera las
    cuatro variantes y el SVG desde un único diseño; cambiar el icono es editar
    ese archivo y volver a correrlo, no reemplazar PNGs a mano.
  - **Arranque:** `index.html` suma `apple-mobile-web-app-capable`, título corto
    de la pantalla de inicio y un `background` en línea para que el primer pintado
    sea crema y no el destello blanco de antes.
  - **Pendiente (menor):** iOS no muestra splash real sin `apple-touch-startup-image`,
    que exige un PNG por tamaño de dispositivo. Queda anotado para la Fase 4.
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

1. **Dominio propio — ~CLP 10.000/año. Primero, y por una razón NO técnica.**
   Sirve para el **correo**, no para la app. La campaña a encargadas de turismo y
   a dueños de alojamiento se responde si sale de `@<dominio>.cl` con un sitio
   detrás; desde Gmail apuntando a `netlify.app` parece spam. La tasa de respuesta
   de esa campaña decide cuántas de las fichas `preliminar: true` se vuelven
   reales — es la variable más determinante del producto y cuesta casi nada.
   De paso habilita el subdominio para el bucket R2 (salir del `r2.dev` con rate
   limit, ver `DEPLOY.md` §2.5). **Checklist de qué tocar al comprarlo** (Netlify,
   `FRONTEND_URL`/CORS, `VITE_API_URL`, `APP_URL`, `R2_URL`, key de Stadia,
   correo): en la Fase 4, "Dominios `.cl`".

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

## Proveedor de mapas — decisión aplazada (anotado 3-ago-2026)

Queda escrito porque la decisión **no toca hasta que exista la capa comercial**,
y para entonces el razonamiento se habrá perdido. Hoy no hay nada que hacer.

### Qué usa el mapa hoy

- **Stadia Maps** (key de cliente, `VITE_STADIA_API_KEY`), repartida por zoom:
  lejos `stamen_terrain_background` (el relieve verde/pardo/blanco de toda la
  ruta), cerca `osm_bright` (**calles con nombre**, POIs, parques). Corte en
  zoom 11 (`ZOOM_CORTE_TERRENO`).
- **CARTO Voyager** como respaldo, sin rótulos y sin key.
- **Esri World Imagery** para la capa Satélite — proveedor aparte, gratis, no
  entra en esta decisión.

Los pines de localidades y lugares, y la línea de la Ruta 7, **no dependen de
ningún proveedor**: la app nunca queda inservible por esto, solo más fea y sin
nombres de calle. Lo que se pierde de verdad es lo de cerca (utilidad); el
relieve es estética.

### El problema, con fecha

El **trial de Stadia Professional vence el 8-ago-2026**. Al vencer la cuenta
**cae sola al plan gratis** (no se apaga), y ahí caben 200.000 créditos/mes —
sobra: el uso real iba en **11.257 créditos en dos semanas**. El volumen nunca
va a ser el problema.

El problema es la letra chica: **el plan gratis de Stadia es para uso NO
comercial** (desarrollo, evaluación, académico). Mientras la app sea gratis para
el turista, calza. En cuanto exista la capa comercial de la Fase 3 (fichas
destacadas, planes), deja de calzar y son ~US$20/mes.

Ese número importa por comparación: **la infraestructura completa cuesta
~US$10/mes**. Pagar el mapa la triplicaría.

### Las opciones, cuando toque

1. **Pagar Stadia** (~US$20/mes). Cero trabajo, se queda todo como está.
2. **Mapbox.** Es el único de los grandes cuyo tier gratis (50.000 cargas de
   mapa/mes) **sí permite uso comercial**. Pero es un cambio lateral: sigues
   alquilando el mapa y cambias un techo por otro.
   (MapTiler no sirve de escape: su plan gratis también es no comercial.)
3. **Protomaps / PMTiles en el bucket R2 que ya vamos a tener.** El basemap
   entero es **un archivo estático**; el navegador lee solo el trozo que necesita
   con HTTP range requests. Sin cláusula de uso comercial (es OpenStreetMap), y
   con el egress gratis de R2 el costo real es de unos pocos dólares al mes o
   cero. No hace falta el planeta: basta un extracto de la Carretera Austral.

### Por qué la 3 es la que encaja con ESTE proyecto

No por el ahorro, sino por coherencia con lo que la app promete: **hoy el mapa
offline es verdad a medias**. El service worker cachea las teselas que el viajero
ya pidió con señal, así que el tramo que no visitó antes aparece en blanco justo
donde no hay cobertura — el escenario central del producto. Un archivo regional
se puede **precargar entero**, y recién ahí "funciona sin señal" es literal.

**Lo que cuesta:** no es cambiar una variable. Hay que pasar a MapLibre GL (o al
plugin de pmtiles para Leaflet), generar y mantener el extracto, y se pierde el
sombreado de relieve (Protomaps es callejero; el terreno sería una capa aparte).
La latencia desde R2 es mayor (~500 ms vs ~200 ms). Un par de días de trabajo,
no una tarde.

### Veredicto

**No hacer nada ahora.** Stadia funciona y es gratis mientras la app no cobre.
Revisar cuando aparezca la primera ficha pagada — no antes, y no por el 8 de
agosto, que el mapa ya sabe sobrevivirlo.

Y al revisarlo, la pregunta no es "¿Stadia o Mapbox?" sino **"¿alquilar el mapa
o ser dueño de él?"**. Para una app que se vende como offline-first, ser dueño
tiene más sentido que el ahorro.

> **Red de seguridad ya implementada** (3-ago-2026): el basemap escucha
> `tileerror` y, tras 3 fallos con conexión, se pasa solo a CARTO Voyager. Antes
> el respaldo solo entraba si la key estaba **vacía**, así que una key *presente
> pero rechazada* dejaba el mapa en blanco — pasó al estrenar `rutaaustral.cl`,
> con la key aún restringida al dominio viejo. Los fallos sin conexión no cuentan
> (ahí falla también CARTO). Detalle en `MapView.jsx` y `DEPLOY.md` §2.

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
