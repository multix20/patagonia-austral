# Datos de contacto desde carretera-austral.cl

Pipeline para tomar los **datos de contacto** de los servicios que lista
[carretera-austral.cl](https://carretera-austral.cl/) (guía comercial de la
ruta, hecha en WordPress) e incorporarlos al contenido de la app **en
borrador**, para curarlos y publicarlos desde el CMS.

Es el tercer lote externo del proyecto, después de SERNATUR y del mapa
municipal de Tortel, y sigue exactamente el mismo camino que esos dos: **rango
de ids propio, seeder aparte que no corre en el deploy, todo en borrador y
curación desde `/admin`**.

```
carretera-austral.cl ──▶ [1] 1_extraer.py ──▶ ca-fichas.json ──▶ [2] 2_a_places.py ──▶ ca_places.json
                              (red, caché         informe.txt          (categorías,        informe_places.txt
                               en crudos/)                              localidades,             │
                                                                        plantillas)               ▼
                                                                                   [3] CarreteraAustralPlaceSeeder
                                                                                       (todo en BORRADOR)
```

## La regla que gobierna todo esto: hechos sí, prosa no

Del sitio se toman **nombre, teléfono, WhatsApp, correo, sitio web, dirección,
horario y coordenada**. Un teléfono no es de nadie: es el mismo número en
cualquier guía, en la puerta del local y en la boleta.

**Los textos NO se copian.** Las descripciones de carretera-austral.cl son obra
de ese sitio —una guía ajena que además vende sus propios paquetes— y llevárselas
sería quedarse con su trabajo, no con un dato público. El paso 1 guarda el HTML
completo en `crudos/` para que quien cure la ficha pueda **leer** el original,
pero el JSON de salida no arrastra ni una línea de texto descriptivo: las
descripciones de la app se escriben acá, bilingües, como se hizo con SERNATUR y
con Tortel.

### `/producto/` es el directorio, no el catálogo

La primera versión de este pipeline excluía `/producto/` creyendo que eran los
paquetes que el sitio vende. **No lo son.** Detrás de
`/producto/camping-en-cochrane/` está el Camping Aquasol, y detrás de
`/producto/cabanas-y-tinaja-en-cochrane/` las Cabañas Patagonino: son **429
fichas de negocios**, o sea el grueso del dato útil del sitio, y estaban
quedando fuera enteras.

Los paquetes que el sitio sí vende viven en el mismo lugar
(`carretera-austral-10-dias-9-noches`, `paquete-turistico-caleta-tortel`), pero
**se caen solos**: sus slugs no nombran una localidad, y la regla de no adivinar
los descarta sin que haya que enumerarlos. Es la misma disciplina que evita
inventar categorías, haciendo de filtro sin que nadie la programara para eso.

Que sean **fichas pagadas** (el sitio vende publicación: ver
`/anunciate-en-carretera-austral/`) no cambia la regla de arriba: el teléfono
del negocio es un hecho suyo, la redacción y las fotos de la ficha son de la
guía y no se tocan.

Y una tercera cosa, que es de calidad y no de derecho: **el dato de una guía
ajena también envejece**. El proyecto no se está diferenciando por copiar
rápido sino por tener el teléfono que contesta. Nada de este lote se publica sin
verificar.

## Cómo se porta con el sitio

- Respeta `robots.txt` — si prohíbe una ruta no la pide; si prohíbe el sitio
  entero con nuestro User-Agent, se detiene y lo dice.
- Espera **3–6 s entre páginas**, en serie, nunca en paralelo.
- Se identifica: `PatagoniaAustralBot/1.0 (+https://rutaaustral.cl)`. Si quieres
  ser contactable, pon una dirección del proyecto en la constante `CONTACTO`
  arriba de `1_extraer.py` (a propósito no va ahí un correo personal: es una
  cabecera que viaja a un tercero).
- **Cachea todo en `crudos/`**: una segunda corrida no le pide nada al sitio, y
  si la primera se corta, se relanza el mismo comando y sigue donde quedó.

## Esto se corre EN LOCAL

Desde una sesión web de Claude Code **no hay salida de red hacia
carretera-austral.cl**: la bloquea el proxy del entorno (`403` al CONNECT), igual
que con `tortel.cl`. Por eso los scripts se escribieron a ciegas —defensivos, y
contando en un informe todo lo que encuentran—. La primera corrida de verdad es
`--explorar`, y **el informe es el que manda**: si el sitio no está estructurado
como se supone, ahí se ve antes de bajar nada.

Sin dependencias: solo biblioteca estándar de Python 3. No hace falta venv.

> **En Windows el comando es `py`, no `python3`.** En PowerShell, `python3` es el
> *stub* del Microsoft Store: no ejecuta nada, solo ofrece instalar Python. Los
> ejemplos de acá abajo dicen `python3` porque es lo que corre en Linux y macOS;
> en Windows reemplázalo por `py` (o `python`) y las barras por `\`:
>
> ```powershell
> py scripts\carretera-austral\1_extraer.py --explorar
> ```
>
> Si `py` tampoco existe, Python no está instalado: bájalo de python.org o
> `winget install Python.Python.3.12`, marcando **Add python.exe to PATH**.

---

## Correrlo desde el teléfono (o sin tener el PC a mano)

`.github/workflows/extraer-carretera-austral.yml` corre el pipeline **en un
runner de GitHub**, que sí tiene red hacia el sitio. Se dispara con el botón
**Run workflow** —desde la app de GitHub en el teléfono, o desde la web— con
tres campos opcionales: `explorar`, `solo` y `limite`, los mismos del script.

Lo que devuelve:

- **Los dos informes impresos en el log del job.** Es lo que permite revisar el
  resultado desde el teléfono sin descargar ni abrir un archivo.
- **`ca-fichas.json` y `ca_places.json` como artefacto** para descargar, 14 días.

Guarda `crudos/` en la caché de Actions entre corridas: sin eso, cada disparo le
volvería a pedir el sitio entero a un servidor ajeno, que es justo lo que el
script evita en local. Y corre **de a uno** (`concurrency`), por lo mismo.

> **El botón solo aparece si el archivo está en `main`.** `workflow_dispatch` se
> lee de la rama por defecto: mientras el workflow viva solo en una rama de
> trabajo, no se ve en ninguna parte. Hay que mergearlo primero.

## Paso 1 — Extraer (en local)

```bash
python3 scripts/carretera-austral/1_extraer.py --explorar     # reconocimiento, no baja contenido
python3 scripts/carretera-austral/1_extraer.py --limite 20    # prueba corta
python3 scripts/carretera-austral/1_extraer.py                # todo
python3 scripts/carretera-austral/1_extraer.py --solo visita-cochrane   # una localidad
```

**`--explorar` primero, siempre.** Lee `robots.txt`, pregunta por la API REST de
WordPress (`/wp-json/wp/v2/types`), y si no la hay se cae al sitemap; después
imprime **qué secciones existen y cuántas URLs tiene cada una**, con ejemplos.
Con eso se decide si hace falta ajustar los filtros antes de gastar una hora de
descargas.

El inventario prefiere la **API REST de WordPress** antes que el sitemap: da la
lista completa y paginada sin adivinar HTML, y son muchas menos peticiones.

Sale `ca-fichas.json` (contacto crudo ya normalizado) y `informe.txt`.

### Cómo saca los datos de una página, y por qué el informe importa

Tres estrategias, en orden. El informe dice **cuántas fichas salieron por cada
una**, y esa cifra es la que hay que mirar:

| Estrategia | Cuándo | Confianza |
|---|---|---|
| `json-ld` | La página trae schema (`LocalBusiness`, `LodgingBusiness`, `Restaurant`…), que es lo que emiten Yoast y RankMath | **Alta** — son campos declarados, no adivinados |
| `encabezado+contacto` | Un listado con varios negocios y sin schema: cada `tel:` o `wa.me` marca una tarjeta y el nombre sale del último encabezado anterior | **Heurística** — hay que revisarlas una por una |
| `pagina-completa` | La página tiene un solo contacto y ningún schema: se usa el `<title>` como nombre | Media |

Si casi todo sale por `encabezado+contacto`, conviene abrir dos o tres páginas
de `crudos/` y ver si el nombre quedó bien pegado a su teléfono antes de seguir.

Las coordenadas se buscan en el schema y, si no, en el embed de Google Maps de
la página. Todo lo que caiga **fuera de la caja Puerto Montt → O'Higgins** se
descarta: un punto fuera de ahí no es un lugar lejano, es un `lat/lng` dado
vuelta.

### Cuando una página no da nada: `ver.py`

```bash
python3 scripts/carretera-austral/ver.py whatsapp-accounts
python3 scripts/carretera-austral/ver.py servicios-gastronomicos --texto 4000
python3 scripts/carretera-austral/ver.py aysen-ranch --crudo   # vuelca el HTML
```

Cuando el extractor saca cero fichas de una página, la pregunta es siempre la
misma: **¿la página no tiene el dato, o lo tiene de una forma que el extractor
no mira?** `ver.py` responde eso leyendo el HTML que ya quedó en `crudos/` —
sin pedirle nada al sitio— y muestra para cada página el título, los tipos de
JSON-LD, los `tel:`/`wa.me`/`mailto:`, las coordenadas, y **los números que
parecen teléfono chileno aunque no estén enlazados**. Esa última línea es la
que distingue los dos casos: un teléfono escrito como texto plano existe en la
página y el extractor no lo ve.

## Paso 2 — Llevarlo al formato `places`

```bash
python3 scripts/carretera-austral/2_a_places.py
```

Acá se toman las decisiones **editoriales** (el paso 1 solo junta datos):

- **Categoría** por la ruta de la URL (`alojamientos-en-…`, `servicios-gastronomicos`,
  `transbordadores-y-barcazas`…), con el tipo de JSON-LD como respaldo. Las seis
  categorías del proyecto son fijas. **Lo que no se sabe clasificar no se
  inventa**: no cae a `servicio` por defecto, sale listado en el informe para
  agregar el patrón a `REGLAS_CATEGORIA`. Es la misma decisión que en Tortel,
  donde un `else` silencioso habría enterrado las emergencias del pueblo.
- **Localidad** por la ruta (`/visita-cochrane/…`), con una tabla de alias para
  lo que el sitio nombra distinto (`tortel` → `caleta-tortel`, `rio-tranquilo` →
  `puerto-rio-tranquilo`). Lo desconocido también se reporta en vez de adivinarse.
- **Descripciones**: plantillas bilingües honestas, que dicen lo que el dato
  sostiene y nada más. El texto bueno se escribe al curar.
- **Comercio sin teléfono ni WhatsApp, fuera.** Es la regla que quedó del
  post-mortem de Tortel: un alojamiento o un restorán sin forma de contactarlo no
  le sirve a nadie y solo satura el mapa. No se aplica a `atractivo` ni a
  `emergencia`, que no necesitan teléfono ni les hace falta.
- **Deduplicado** dentro del lote por nombre+localidad y por teléfono (el sitio
  lista al mismo negocio en varias secciones), y contra `places.json`.

Sale `ca_places.json` (forma de `places.json`, ids desde **5000**, todo
`publicado: false`) e `informe_places.txt`.

Cada ficha lleva un `_origen` con la URL, la estrategia, el segundo teléfono, el
correo y la web — lo que `places` no sabe guardar. **No lo lee el seeder**:
viaja para que al curar la ficha esté todo a mano y no haya que volver al sitio.

### Las fichas sin coordenada llevan un pin aproximado, y hay que arreglarlo

Si el origen no trae coordenada, la ficha se ubica **cerca del centro del
pueblo** (esparcida 150–450 m, de forma estable entre corridas, para que 30
fichas no se apilen en un pin inclicable). Ese pin **no es la dirección real**.
El informe dice cuántas están así, y quedan marcadas con
`_origen.coordenada = "centro_localidad"`. Corregir el pin es parte de curar la
ficha, no algo para dejar para después: la Fase 3 es calidad del dato.

## Paso 3 — Importar (seeder)

```bash
cp scripts/carretera-austral/ca_places.json backend/database/seeders/data/
cd backend && php artisan db:seed --class=Database\\Seeders\\CarreteraAustralPlaceSeeder
```

- **Todo entra en borrador**, sin excepción: el seeder ni siquiera lee un flag
  del JSON. Un flag por-lugar sería una puerta para publicar el lote entero sin
  querer, que es exactamente lo que pasó con Tortel.
- **Idempotente** (`updateOrCreate` por id) y **no registrado en
  `DatabaseSeeder`**, así que no corre en el deploy.
- **Deduplica contra la base de verdad**, no contra `places.json`: por
  nombre+localidad y por **los últimos 8 dígitos del teléfono**, para que el
  mismo número escrito con y sin `+56` colisione igual.
- Copia `whatsapp` y `horario`. Al agregar una columna: **BD, CMS, API y
  seeder** — el dato se pierde en silencio si el seeder no la copia, que es lo
  que le pasó a `PlaceSeeder` con los horarios de las barcazas.
- Reajusta la secuencia de PostgreSQL: sembrar con ids explícitos no la avanza y
  el siguiente lugar creado desde el CMS chocaría con estos ids.

### Cómo llega esto a PRODUCCIÓN

Los seeders escriben en **la base a la que apunte tu `.env`**. Desde una sesión
web no hay acceso a Neon (ni red ni credenciales, que viven en el dashboard de
Render), así que la importación a producción se corre **en local**, con `DB_URL`
apuntando a Neon (`?sslmode=require`). Igual que SERNATUR y Tortel.

Publicar es cosa del CMS: `/admin` → Lugares → filtro *Publicado: No*.

## Antes de publicar una ficha de este lote

Por orden, y ninguno es opcional:

1. **Llamar o escribir al número.** Es dato de terceros sin verificar.
2. **Corregir el pin** si `_origen.coordenada` dice `centro_localidad`.
3. **Escribir la descripción de verdad**, ES y EN. La plantilla es andamio.
4. **Respetar un servicio publicado por localidad y categoría** (regla del
   27-jul-2026). Publicar el lote completo de una vez es exactamente el error de
   Tortel: el mapa se satura y las fichas curadas quedan enterradas.

## Lo que este pipeline NO hace

- No copia textos, fotos ni reseñas del sitio.
- No importa los paquetes turísticos que el sitio vende: no nombran localidad y
  el paso 2 los descarta solo.
- No publica nada. No toca producción. No decide qué se muestra.
