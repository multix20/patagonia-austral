# Trazado de la Ruta 7 (Carretera Austral)

Genera la geometría de la Ruta 7 para destacar el camino real en el mapa de la
PWA (vista "ruta"), en vez de unir los pueblos con líneas rectas.

## Por qué se corre en local

El entorno web (Claude Code) **bloquea Overpass/OpenStreetMap por política de
red**, igual que la BD de producción. Por eso el trazado exacto se genera en tu
máquina y se commitea como dato estático: viaja **offline** con la PWA.

`frontend/src/data/ruta7.js` ya trae un trazado **aproximado** (semilla) para que
la app funcione desde la primera visita. Este script lo **sobrescribe con la
geometría exacta** de OpenStreetMap.

## Uso

```bash
node scripts/ruta7/generar_ruta7.mjs
```

Requiere Node 18+ (usa `fetch` global). Sin dependencias.

Luego revisa el mapa (`npm run dev --prefix frontend`), y si se ve bien:

```bash
npm run build --prefix frontend   # debe pasar
git add frontend/src/data/ruta7.js
git commit -m "Ruta 7: trazado exacto desde OpenStreetMap"
```

## Cómo funciona

1. Pide a Overpass las vías con `ref` `CH-7`/`7` (`highway`) del corredor Puerto
   Montt → Villa O'Higgins, más las rutas de ferry (`route=ferry`) del tramo.
2. Cada vía se vuelve un tramo `{ tipo, puntos }`; simplifica con Douglas–Peucker
   y descarta duplicados de doble sentido.
3. Escribe `frontend/src/data/ruta7.js` (lista de tramos; los `barcaza` se dibujan
   punteados). No hay que coser las vías: `MapView` dibuja la lista de tramos.

## Ajustes

- **Menos/más detalle**: sube o baja `TOL` en el script (tolerancia de
  simplificación en grados).
- Si aparecen ramales que no son la Ruta 7 (p. ej. a Chile Chico), afina el filtro
  `ref` de la consulta Overpass.
