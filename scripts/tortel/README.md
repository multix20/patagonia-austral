# POIs del mapa turístico de Tortel

Extracción y unificación del **mapa turístico oficial de la Municipalidad de
Tortel** (`https://www.tortel.cl/mapa-turismo-tortel-2024/`) para incorporarlo al
contenido de la app.

## Por qué hay que juntar los archivos a mano

El mapa es un Leaflet que carga **una variable JavaScript por categoría**, cada
una con un `FeatureCollection` embebido:

```js
var alojamientos =
{ "type": "FeatureCollection", "name": "alojamientos", "features": [ … ] }
```

No hay un endpoint único que los devuelva todos, y **desde una sesión web de
Claude Code no hay salida de red hacia `tortel.cl`** (la bloquea el proxy del
entorno). Pero **no hace falta bajarlos uno por uno.**

### La forma corta: un volcado desde la consola del navegador

El mapa deja cada capa como una **variable global** de la página, así que se
pueden capturar todas juntas. Abrir el mapa, **encender todas las capas** del
control (una capa que nunca se muestra puede no haberse cargado), y en
**DevTools → Console** pegar:

```js
(() => {
  const capas = {}
  for (const k of Object.keys(window)) {
    try {
      const v = window[k]
      if (v && v.type === 'FeatureCollection' && Array.isArray(v.features)) capas[k] = v
    } catch (e) { /* algunas propiedades de window explotan al leerlas */ }
  }
  console.log(`${Object.keys(capas).length} capas: ${Object.keys(capas).join(', ')}`)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(capas)], { type: 'application/json' }))
  a.download = 'tortel-capas.json'
  a.click()
})()
```

Descarga **un solo archivo** con todas las capas y de paso imprime sus nombres.
Ese archivo se deja en `crudos/` (con extensión `.js` o `.json`, da igual) y el
paso 1 lo entiende: detecta si el archivo trae una capa o muchas.

Tiene tres ventajas sobre bajar archivo por archivo, y no son menores:

1. **No se escapa ninguna capa.** La lista del panel Network tiene scroll y la
   primera pasada dejó fuera varias.
2. **Los nombres son los de verdad.** Los nombres de archivo no coinciden con los
   de las capas: lo que la lista llamaba `alojamientos.js` en el mapa es la capa
   **`cama`**, y apareció una **`rural`** que no estaba en ninguna lista. Por eso
   el script toma el nombre del propio GeoJSON y no del archivo.
3. **Se acabó el problema de codificación.** Los `.js` servidos vienen con el
   UTF-8 roto (`RÃ­o Bravo`, `TelÃ©fono`); el navegador ya los decodificó bien, así
   que el volcado sale limpio. El script repara igual por si acaso, pero es una
   fuente de errores menos.

### La forma larga (si la consola no es opción)

**DevTools → Network → filtro JS**, bajar cada archivo y dejarlos en
`scripts/tortel/crudos/`. Funciona igual; solo hay que revisar la lista con
scroll para no dejar capas afuera.

`crudos/` está en `.gitignore`: son archivos de terceros y no tienen por qué
vivir en el repo. Lo que se versiona es el resultado consolidado.

## Uso

```bash
python3 scripts/tortel/1_unificar.py
```

Sin dependencias (solo la biblioteca estándar). Produce:

- **`tortel-pois.geojson`** — un solo `FeatureCollection` con todas las capas, el
  esquema de `properties` normalizado y la trazabilidad de la fuente
  (`fuente` + `fecha_extraccion`) tanto en cada feature como en `metadata`.
- **`informe.txt`** — lo que hay que mirar a ojo antes de importar nada.

## Qué normaliza (y qué no descarta)

Los archivos **no traen las mismas claves**: `alojamientos` tiene `Capacidad`,
`fono1` y `fono2`; un sendero traerá dificultad o distancia. El esquema común es
`nombre · tipo · subtipo · sector · email · links · capacidad · descripcion ·
dificultad · distancia · duracion · telefonos[] · capa`.

Dos decisiones que importan:

- **`telefonos` es una lista, no un campo.** El origen trae `fono1` y `fono2`, y
  la tabla `places` del proyecto guarda **un solo** teléfono. Cuál va es una
  decisión editorial del paso siguiente, no del extractor: perder el segundo acá
  sería irreversible.
- **Lo que no calza en el esquema se guarda en `extra`**, tal cual. Si una
  categoría trae un campo que nadie previó, aparece ahí en vez de perderse. El
  informe lista las claves de cada capa justamente para descubrirlos.

## Coordenadas

Se usan las de `geometry.coordinates` (**WGS84, orden `[lon, lat]`**) y se
**descartan** las `Coord X` / `Coord Y` de `properties`, que son redundantes.

**Huso verificado: UTM 18S.** Se reproyectó el punto de ejemplo (Camping Tortel)
y coincide con las `Coord X/Y` del archivo **al decímetro** (dX = −0,0 m,
dY = +0,0 m); contra 19S el error es de ~450 km. Eso confirma de paso que el
`lon, lat` del `geometry` está en el orden correcto y es consistente con el UTM.

El script valida además que todo caiga dentro de una **caja que contiene la
comuna con holgura** (lon −74,5…−72,3 / lat −48,6…−47,0). Un punto fuera de ahí
no es un lugar lejano: es un dato malo o un `lon/lat` invertido, y sale listado
en el informe.

## Paso 2 — llevarlo a `places` (solo los POIs puntuales)

```bash
python3 scripts/tortel/2_a_places.py
```

Escribe `tortel_places.json` con la misma forma que `places.json`. Después:

```bash
cp scripts/tortel/tortel_places.json backend/database/seeders/data/
cd backend && php artisan db:seed --class=Database\\Seeders\\TortelPlaceSeeder
```

**Todo entra en borrador** (`publicado: false`), con ids desde **4000** (libres:
1–192 y 3001–3083 son el seed a mano, 2000–2181 el lote SERNATUR). El seeder no
se registra en `DatabaseSeeder`, así que **no corre en el deploy**, y deduplica
por nombre + localidad contra lo que ya esté cargado a mano — Caleta Tortel tiene
fichas propias desde el principio. Se revisa y publica desde `/admin` (filtro:
localidad Caleta Tortel + no publicados).

El JSON generado va gitignoreado, igual que el de SERNATUR.

**El mapeo de categorías vive arriba de `2_a_places.py` y es explícito.** Una capa
que no esté en la tabla **detiene el script**: es preferible revisar tres nombres
a descubrir después que media docena de fichas quedaron mal categorizadas entre
las ~100. Cuando aparezcan las capas que todavía no vimos, se agregan ahí.

## Paso 3 — los trazados y áreas, a la tabla `rutas`

```bash
python3 scripts/tortel/3_a_rutas.py
cp scripts/tortel/tortel_rutas.json backend/database/seeders/data/
cd backend && php artisan db:seed --class=Database\\Seeders\\RutaSeeder
```

Lo que **no cabe en un punto** va a su propia tabla (ver la migración
`create_rutas_table`): la red de pasarelas, los senderos, las rutas y las áreas
protegidas. También entra todo en borrador, y se revisa en `/admin → Rutas y
áreas`.

**Dos cosas que hace este paso y conviene saber:**

- **Funde las 214 pasarelas en una sola ruta.** Vienen como tramos del inventario
  municipal ("LONGITUDINAL 10", con su estado de conservación): dato de mantención,
  no de viaje. Al turista le sirve la red dibujada, no 214 filas en el CMS.
- **Simplifica las geometrías, y es lo que hace viable la capa.** El origen trae
  15 decimales y el glaciar Steffen tiene **17.115 vértices — 669 KB en un solo
  polígono**, cuando el precache entero de la PWA son ~666 KB. Con
  Douglas-Peucker por tipo (tolerancia 0 en las pasarelas, que se miran de cerca;
  60 m en los glaciares, que se miran de lejos) más redondeo a 5 decimales:

  | | antes | después |
  |---|---|---|
  | Vértices del glaciar Steffen | 17.115 | 351 |
  | Peso de todas las geometrías | 812 KB | **41 KB** |

  La respuesta completa de `/api/rutas` pesa **47 KB**, y no entra al bundle: se
  descarga la primera vez que hay señal (`obtenerRutas` en `api/client.js`).

## Cómo llega esto a PRODUCCIÓN (y por qué no lo puede hacer una sesión web)

Los seeders escriben en **la base a la que apunte tu `.env`**. Desde una sesión
web de Claude Code no hay acceso a Neon —ni red ni credenciales, que viven solo
en el dashboard de Render—, así que la importación a producción se corre **en
local**, igual que el lote SERNATUR:

```bash
# En backend/.env, DB_URL apuntando a Neon (?sslmode=require)
php artisan db:seed --class=Database\\Seeders\\TortelPlaceSeeder
php artisan db:seed --class=Database\\Seeders\\RutaSeeder
```

Después, **publicar es cosa del CMS**, no de los scripts:

- **Lugares** → `/admin` → Lugares → filtro *Localidad: Caleta Tortel* +
  *Publicado: No* → seleccionar todo → acción en lote **Publicar**.
- **Rutas** → `/admin` → Rutas y áreas → seleccionar → **Publicar**.

> **Antes de publicar el lote entero de una vez, ojo con la regla editorial.**
> Desde el 27-jul rige *un servicio publicado por localidad y categoría*: si
> Tortel pasa a tener más de cien fichas publicadas mientras las demás
> localidades tienen 6, el directorio queda disparejo — y estas fichas todavía
> tienen la descripción de plantilla, no texto curado. Publicar por tandas
> (primero emergencias y servicios, que son dato duro y no necesitan redacción)
> deja el beneficio sin la deuda.

### Cómo terminó (ago-2026), por si el aviso de arriba llega tarde

Llegó tarde: se publicó el lote completo y el mapa de Tortel quedó saturado. La
curación posterior está en dos migraciones (`limpiar_fichas_tortel` y
`afinar_fichas_tortel`) y el detalle en `ESTADO_Y_PENDIENTES.md`. Tres cosas que
conviene saber antes de importar otro mapa municipal:

- **Duplicados literales hubo poquísimos** (tres). Lo que satura no es la
  repetición sino el **mobiliario municipal** entrando como atractivo: plazas,
  plazas de juegos, paraderos, gimnasios. Nadie viaja a ver eso, y tapa las
  pasarelas y los miradores, que es a lo que sí se va.
- **Mismo nombre no es lo mismo que duplicado.** Las cuatro "Plaza de juegos"
  están a 200–1000 m entre sí: son cuatro plazas distintas con nombre genérico.
  Sin comparar coordenadas, un deduplicador por nombre se habría comido tres.
- **La regla que sirvió al final** fue de calidad del dato y solo para el
  comercio: una ficha de alojamiento, comida o servicio comercial **sin
  teléfono** no permite hacer nada y sale. Aplicarla a todo habría borrado las
  pasarelas y los miradores, que no tienen teléfono ni falta que les hace.

## Lo que este script NO hace

No toca la base de datos ni decide categorías del proyecto. El mapeo a la tabla
`places` es un segundo paso y **depende de decisiones editoriales**, porque el
modelo del proyecto y el del mapa no calzan uno a uno:

| | Mapa de Tortel | `places` del proyecto |
|---|---|---|
| Categorías | ~12 capas (artesanías, expediciones, abarrotes, miradores…) | **6** fijas: `atractivo · alojamiento · comida · servicio · evento · emergencia` |
| Geometría | puntos **y líneas** (senderos, rutas, pasarelas) | **un punto** (`lat`/`lng`) |
| Teléfono | `fono1` + `fono2` | `tel`, uno solo |
| Correo / RRSS | `Email/RRSS` | **no existe la columna** |
| Textos | español | **bilingüe** `{es, en}` obligatorio |

Y sobre todo: desde el 27-jul-2026 rige **un servicio publicado por localidad y
categoría**. Importar ~100 fichas de Tortel publicadas rompería esa regla. El
precedente del proyecto para una carga masiva externa es el lote SERNATUR: entra
como **borrador** (`publicado: false`), en un **rango de ids propio**, con un
**seeder aparte** que no corre en el deploy, y se cura desde el CMS.
