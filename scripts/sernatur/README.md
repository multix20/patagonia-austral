# Extracción e importación de servicios SERNATUR

Pipeline para completar los datos que faltan de los **182 servicios de alojamiento**
de la Región de Aysén (extraídos de SERNATUR) e importarlos a la PWA.

Punto de partida: ya tienes `nombre, categoría, localidad, latitud, longitud` y la
URL de cada ficha. Faltan **teléfono, email, dirección** (solo en la ficha
individual) y los textos **descripción / cómo llegar / distancia** en ES y EN.

```
con_coordenadas.csv ─┐
                     ├─▶ [1] extraer fichas ─▶ fichas_completas.csv ─┐
                     │        (Playwright)                            │
                     └──────────────────────────────────────────────┤
                                                                      ▼
                                              [2] generar textos ─▶ servicios_completos.xlsx
                                                  (ES/EN, distancias)  sernatur_places.json
                                                                      │
                                                                      ▼
                                              [3] SernaturPlaceSeeder ─▶ base de datos / PWA
```

## Requisitos (Windows, Python 3.11+)

```bat
cd scripts\sernatur
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

Copia tus dos archivos a esta carpeta: **`con_coordenadas.csv`**
(y opcionalmente el xlsx). El CSV debe tener al menos columnas de
**ID, nombre, ciudad y URL** — los nombres exactos se autodetectan
(`ID_SERNATUR`, `nombre`, `ciudad`/`localidad`/`comuna`, `URL`, `categoria`,
`lat`/`latitud`, `lng`/`longitud`).

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

Salidas:
- **`servicios_completos.xlsx`** — todos los campos, uno por fila, para revisar y
  editar los textos a mano antes de publicar.
- **`sernatur_places.json`** — con la forma exacta de
  `backend/database/seeders/data/places.json`, para el seeder.

Ajustes al inicio del script: `BASE_ID` (id inicial, por defecto `2000`) y
`PUBLICAR` (por defecto `False` → entran como borrador).

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

- Entran como **borrador** (`publicado = false`) para que los revises en `/admin`
  y publiques cuando estén listos. Para publicarlos directo, pon
  `PUBLICAR = True` en el paso 2 **y** `self::PUBLICAR = true` en el seeder.
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
