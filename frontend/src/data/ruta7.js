// Trazado de la Ruta 7 (Carretera Austral), Puerto Montt → Villa O'Higgins.
//
// Se usa para DESTACAR el camino real en el mapa de la vista "ruta", en vez de
// unir los pueblos con líneas rectas. El mapa base Esri topográfico ya dibuja el
// camino con precisión; esta capa lo resalta encima.
//
// IMPORTANTE — precisión: este trazado es una APROXIMACIÓN al corredor real,
// pensada para verse bien a la escala de la vista "ruta" (toda la Carretera en
// pantalla). Es un dato semilla empaquetado para que funcione sin conexión desde
// la primera visita. Para el trazado EXACTO (geometría de OpenStreetMap), corre
// en local `scripts/ruta7/generar_ruta7.mjs` (el entorno web bloquea Overpass por
// política de red, igual que la BD de producción); ese script sobrescribe este
// archivo con la geometría real simplificada.
//
// Los tramos marítimos (barcazas del cruce bimodal y del Fiordo Mitchell) van
// como `tipo: 'barcaza'`: NO son camino, así que el mapa los dibuja punteados.
// Cada tramo es una lista de puntos [lat, lng] en orden norte → sur.

export const RUTA7 = [
  // Puerto Montt → La Arena (Ruta 7 por la ribera del Reloncaví)
  {
    tipo: 'camino',
    puntos: [
      [-41.4693, -72.9424],
      [-41.5205, -72.8],
      [-41.605, -72.69],
      [-41.6925, -72.6486],
      [-41.7574, -72.656],
    ],
  },
  // Barcaza La Arena ↔ Caleta Puelche (seno de Reloncaví)
  {
    tipo: 'barcaza',
    puntos: [
      [-41.7574, -72.656],
      [-41.7799, -72.598],
    ],
  },
  // Caleta Puelche → Hornopirén
  {
    tipo: 'camino',
    puntos: [
      [-41.7799, -72.598],
      [-41.86, -72.52],
      [-41.9578, -72.4372],
    ],
  },
  // Cruce bimodal Hornopirén → Caleta Gonzalo (barcaza – Leptepu – barcaza, por
  // los fiordos; ~5 h). Se representa punteado por los fiordos.
  {
    tipo: 'barcaza',
    puntos: [
      [-41.9578, -72.4372],
      [-42.12, -72.42],
      [-42.32, -72.51],
      [-42.4633, -72.585],
      [-42.5633, -72.5989],
    ],
  },
  // Caleta Gonzalo → Chaitén → El Amarillo → Villa Santa Lucía → La Junta →
  // Puyuhuapi → Villa Amengual → Villa Mañihuales → Coyhaique → Cerro Castillo →
  // Puerto Río Tranquilo → Cruce El Maitén → Puerto Bertrand → Cochrane →
  // Puerto Yungay (tronco continuo de la Ruta 7).
  {
    tipo: 'camino',
    puntos: [
      [-42.5633, -72.5989],
      [-42.705, -72.62],
      [-42.82, -72.66],
      [-42.9169, -72.7086], // Chaitén
      [-42.93, -72.6],
      [-42.9333, -72.5333], // El Amarillo
      [-43.06, -72.45],
      [-43.24, -72.4],
      [-43.4167, -72.3667], // Villa Santa Lucía
      [-43.56, -72.38],
      [-43.72, -72.43],
      [-43.86, -72.41],
      [-43.9756, -72.4058], // La Junta
      [-44.09, -72.47],
      [-44.22, -72.53],
      [-44.3286, -72.5567], // Puyuhuapi
      [-44.42, -72.53],
      [-44.5, -72.42], // Portezuelo Queulat
      [-44.62, -72.28],
      [-44.7167, -72.1667], // Villa Amengual
      [-44.87, -72.14],
      [-45.05, -72.16],
      [-45.2103, -72.1547], // Villa Mañihuales
      [-45.34, -72.09],
      [-45.45, -72.09],
      [-45.5719, -72.0683], // Coyhaique
      [-45.67, -72.04],
      [-45.8, -71.99],
      [-45.94, -72.05],
      [-46.04, -72.12],
      [-46.1216, -72.1636], // Villa Cerro Castillo
      [-46.27, -72.22],
      [-46.42, -72.37],
      [-46.55, -72.56],
      [-46.6252, -72.6735], // Puerto Río Tranquilo
      [-46.73, -72.69],
      [-46.86, -72.72], // Cruce El Maitén
      [-46.96, -72.78],
      [-47.0219, -72.8247], // Puerto Bertrand
      [-47.11, -72.74],
      [-47.19, -72.63],
      [-47.2539, -72.5732], // Cochrane
      [-47.37, -72.62],
      [-47.52, -72.8],
      [-47.64, -72.93],
      [-47.716, -73.014], // Puerto Yungay (rampa de la barcaza)
    ],
  },
  // Barcaza Puerto Yungay ↔ Río Bravo (cruce del Fiordo Mitchell, ~45 min).
  // OJO: coordenadas APROXIMADAS ajustadas a mano (Overpass/OSM no es alcanzable
  // desde el entorno web). Para la geometría exacta, correr el script local
  // scripts/ruta7/generar_ruta7.mjs. Antes la barcaza se trazaba como una larga
  // diagonal desplazada al noreste, fuera del fiordo.
  {
    tipo: 'barcaza',
    puntos: [
      [-47.716, -73.014], // Puerto Yungay
      [-47.79, -72.95], // Río Bravo
    ],
  },
  // Río Bravo → Villa O'Higgins (fin de la Carretera Austral)
  {
    tipo: 'camino',
    puntos: [
      [-47.79, -72.95], // Río Bravo
      [-47.96, -72.85],
      [-48.14, -72.74],
      [-48.31, -72.63],
      [-48.4686, -72.5601], // Villa O'Higgins
    ],
  },
]
