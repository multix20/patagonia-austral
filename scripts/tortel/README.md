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
entorno). Así que el paso 1 es manual:

1. Abrir el mapa en Chrome → **DevTools → Network → filtro JS**.
2. Recargar y bajar cada archivo (`Save as…` o copiar la respuesta).
3. Dejarlos en `scripts/tortel/crudos/`, con su nombre original (`alojamientos.js`,
   `pasarelas.js`, …). El nombre del archivo se usa como nombre de la **capa**.

> **Ojo con la lista completa:** el panel de Network tiene scroll. Confirmar que
> se bajaron **todos** los `.js` de datos antes de dar la recolección por cerrada;
> la primera pasada dejó fuera 2–5 archivos que no se veían en la captura.

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
