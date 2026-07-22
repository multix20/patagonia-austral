# Extracción e importación de servicios SERNATUR

Pipeline para completar los datos que faltan de los **182 servicios de alojamiento**
de la Región de Aysén (extraídos de SERNATUR) e importarlos a la PWA.

Punto de partida: ya tienes `nombre, categoría, localidad, latitud, longitud` y la
URL de cada ficha. Faltan **teléfono, email, dirección** (solo en la ficha
individual) y los textos **descripción / cómo llegar / distancia** en ES y EN.

## Fuentes de datos

**SERNATUR — Servicios Turísticos** (buscador oficial; de aquí sale el
`con_coordenadas.csv` de entrada). Base: `https://serviciosturisticos.sernatur.cl/nueva_busqueda.php`

| Parámetro | Valor | Significado |
|---|---|---|
| `tipo_servicio` | `1` | **Alojamiento** (lo que cubre hoy el pipeline) |
| `tipo_servicio` | `2` | **Alimentación / dónde comer** (por sumar — ver "Pendiente") |
| `region` | `11` | Región de Aysén |
| `clase_servicio` | `0` | Todas |
| `comuna` | `0` | Todas |
| `nombre` | (vacío) | Sin filtro por nombre |
| `page` | `1..N` | Paginación del listado |

- Alojamiento (Aysén): `…/nueva_busqueda.php?page=1&tipo_servicio=1&clase_servicio=0&region=11&comuna=0&nombre=`
- Dónde comer (Aysén): `…/nueva_busqueda.php?page=1&tipo_servicio=2&clase_servicio=0&region=11&comuna=0&nombre=`
- Ficha individual (contacto): `https://serviciosturisticos.sernatur.cl/{id_sernatur}-{slug}` (la visita el paso 1).

**Fuentes de contexto** (referencia, no las consume el pipeline aún):

- Estadísticas de turismo de Aysén: `https://estadisticas.aysenpatagonia.cl/`
- Planifica tu viaje (Aysén Patagonia): `https://aysenpatagonia.cl/planifica-tu-viaje`

## Pendiente — sumar "dónde comer" (`tipo_servicio=2`)

Hoy el pipeline cubre **solo alojamiento**. Para incorporar los servicios de
**alimentación** (categoría `comida` en la app): descargar el listado con
`tipo_servicio=2`, y en el **paso 2** mapear la categoría a `comida` y darle su
**descripción base** (hoy las plantillas son de alojamiento: Hotel/Hostal/Cabañas…).
El resto del flujo (fichas, distancias, selección top N, seeder) se reutiliza igual.

```
con_coordenadas.csv ─┐
                     ├─▶ [1] extraer fichas ─▶ fichas_completas.csv ─┐
                     │        (Playwright)                            │
                     └──────────────────────────────────────────────┤
                                                                      ▼
                                              [2] generar textos ─▶ servicios_completos.xlsx
                                                  (ES/EN, distancias,   sernatur_places.json
                                                   top 10/localidad)    seleccion_gratis.csv
                                                                      │
                                                                      ▼
                                              [3] SernaturPlaceSeeder ─▶ base de datos / PWA
                                                  (top 10 publicados,     (resto en borrador)
```

## Requisitos (Windows, Python 3.11+)

```bat
cd scripts\sernatur
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

Copia tu **`con_coordenadas.csv`** a esta carpeta. Los nombres de columna se
autodetectan: `id_sernatur`, `nombre`, `ciudad`/`localidad`/`comuna`,
`categoria`, `lat`/`latitud`, `lng`/`longitud` y (opcional) `URL`.

- **No hace falta columna `URL`**: si no está, la URL de la ficha se construye
  desde `id_sernatur` + un slug del nombre (SERNATUR enruta por el ID). Si tu CSV
  sí trae `URL`, se usa esa.
- Los servicios **sin `id_sernatur`** (p.ej. varios de Coyhaique y Puerto Aysén)
  no tienen ficha que visitar: se marcan `SIN_ID` y no obtienen teléfono/email,
  pero igual pasan al paso 2 con el resto de sus datos.

---

## Paso 1 — Extraer teléfono / email / dirección

```bat
python 1_extraer_fichas.py
```

- Visita la ficha de cada servicio y extrae contacto en **3 capas**: enlaces
  `mailto:`/`tel:` → etiquetas "Teléfono/Email/Dirección" → regex de respaldo.
- **Delay aleatorio 3–6 s** entre fichas para no saturar el servidor.
- **Progreso incremental**: escribe `fichas_completas.csv` tras cada ficha. Si se
  corta (o cierras la ventana), vuelve a ejecutar el mismo comando y **retoma**
  donde quedó. Los que quedaron en `ERROR` se reintentan solos; los `OK` y
  `SIN_DATOS` no se repiten.
- Ver el navegador (para depurar): cambia `HEADLESS = False` al inicio del script.

Salida `fichas_completas.csv`: `id_sernatur, nombre, url, telefono, email,
direccion, estado`. `estado` ∈ `OK | SIN_DATOS | ERROR: …`.

> Si muchas fichas salen `SIN_DATOS`, abre una con `HEADLESS = False`, mira cómo
> se muestran los datos y ajusta las etiquetas en `valor_tras([...])` o los
> selectores. La estructura real de SERNATUR puede cambiar con el tiempo.

---

## Paso 2 — Generar descripciones ES/EN, cómo llegar y distancia

```bat
python 2_generar_textos.py
```

- Combina `con_coordenadas.csv` + `fichas_completas.csv` por `ID_SERNATUR`.
- **Descripción base ES** según el tipo (Hotel/Hostal/Cabañas/Camping/…).
- **Traducción EN** automática con `deep-translator` (gratis, sin API key). Si no
  hay internet o Google limita, usa plantillas EN de respaldo (no se rompe).
- **Distancia** calculada con haversine desde el centro de la localidad usando
  **tus coordenadas** (sin Google Maps ni Nominatim).
- **Cómo llegar** a partir de la dirección + la localidad.
- **Mapeo a las 24 localidades de la app**: por nombre de ciudad cuando coincide;
  para comunas que abarcan varios pueblos (Río Ibáñez, Cisnes) se asigna por
  **cercanía de coordenadas**; Lago Verde (sin localidad propia) va a La Junta.
  Al final el script imprime cuántos se asignaron por cada método para que los
  revises. Los que quedan sin coordenadas se ubican en el centro de su localidad.

**Siembra gratis (Fase 3):** en vez de publicar todos o ninguno, de **cada
localidad** se marcan como publicados los **`TOP_POR_LOCALIDAD` (por defecto 10)**
alojamientos con la **ficha más completa** — puntaje `3·teléfono + 2·dirección +
1·email`, y a igualdad, orden alfabético. El resto entra en **borrador** para
revisar/ampliar (o vender) después. Pon `TOP_POR_LOCALIDAD = 0` para dejar todo
en borrador.

Salidas:
- **`servicios_completos.xlsx`** — todos los campos (incluye `publicado`, `score`
  y `rank_loc`), uno por fila, para revisar y editar los textos a mano.
- **`sernatur_places.json`** — con la forma exacta de
  `backend/database/seeders/data/places.json` **más un `publicado` por lugar**,
  para el seeder.
- **`seleccion_gratis.csv`** — reporte de auditoría: qué se publica en cada
  localidad y por qué (rank, score, qué datos tiene cada ficha).

Ajustes al inicio del script: `BASE_ID` (id inicial, por defecto `2000`) y
`TOP_POR_LOCALIDAD` (por defecto `10`).

> **Sobre el email:** el modelo `Place` de la PWA hoy **no tiene columna email**
> (solo `tel`). El email se conserva en el Excel y el JSON, pero el seeder no lo
> guarda. Si quieres mostrarlo en la app, ver "Añadir email" más abajo.

---

## Paso 3 — Importar a la base de datos (seeder Laravel)

1. Revisa/edita `servicios_completos.xlsx`. Si cambiaste textos ahí y quieres que
   se reflejen, edita el JSON equivalente o vuelve a correr el paso 2.
2. Copia el JSON a la carpeta de datos del backend:

   ```bat
   copy sernatur_places.json ..\..\backend\database\seeders\data\
   ```

3. Corre el seeder (idempotente, se puede repetir):

   ```bash
   cd backend
   php artisan db:seed --class=Database\\Seeders\\SernaturPlaceSeeder
   ```

- El `publicado` de cada lugar lo decide la **selección del paso 2** (top
  `TOP_POR_LOCALIDAD` por localidad = publicados; el resto en borrador). El seeder
  respeta ese flag por-lugar; `self::PUBLICAR` solo se usa como respaldo si el
  JSON no lo trae (JSON antiguos). Revisa los borradores en `/admin` y publícalos
  cuando quieras.
- Los ids arrancan en **2000** para no chocar con los ids semilla (~192) ni con
  los que crea el CMS.

---

## (Opcional) Añadir email a la PWA

El esquema actual no guarda email. Para incluirlo:

1. Migración:
   ```bash
   cd backend && php artisan make:migration add_email_to_places_table
   ```
   ```php
   // up()
   Schema::table('places', fn (Blueprint $t) => $t->string('email')->nullable());
   // down()
   Schema::table('places', fn (Blueprint $t) => $t->dropColumn('email'));
   ```
2. Añade `'email'` a `$fillable` en `app/Models/Place.php` (y al `toApi()` si lo
   quieres en la API pública).
3. En `SernaturPlaceSeeder.php`, dentro del `updateOrCreate`, agrega:
   `'email' => $l['email'] ?? null,` y en el paso 2 incluye `email` en el JSON.
4. Añade el campo en el recurso Filament del CMS y muéstralo en el frontend.

---

## Notas

- Estos scripts son **herramientas de datos de un solo uso**; no forman parte del
  build de la PWA ni del backend en producción.
- Respeta los términos de uso de SERNATUR: los datos son públicos, pero el scraper
  va con delays para no sobrecargar el sitio.
- Ninguna salida (`*.csv`, `*.xlsx`, `sernatur_places.json`) se versiona: están en
  `.gitignore` de esta carpeta.
