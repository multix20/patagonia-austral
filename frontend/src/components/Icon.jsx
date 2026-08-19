import { createElement } from 'react'

// Set de iconos SVG (estilo Lucide, trazo 2px) — sin dependencias externas
const RUTAS = {
  mountain: 'm8 3 4 8 5-5 5 15H2L8 3z',
  'arrow-left': 'm12 19-7-7 7-7M19 12H5',
  x: 'M18 6 6 18M6 6l12 12',
  'message-circle': 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
  send: 'm22 2-7 20-4-9-9-4ZM22 2 11 13',
  cross:
    'M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z',
  'map-pin': 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z',
  phone:
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  'check-circle': 'M21.801 10A10 10 0 1 1 17 3.335M9 11l3 3L22 4',
  // Visto simple (voto "sigue ahí" del crowdsourcing)
  check: 'M20 6 9 17l-5-5',
  bed: 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9',
  utensils:
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  fuel: 'M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5',
  calendar: 'M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01',
  'calendar-rect': '',
  'wifi-off':
    'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M12 20h.01',
  plane:
    'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  map: 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0zM15 5.764v15M9 3.236v15',
  car: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17h6',
  smartphone: 'M12 18h.01',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  landmark: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4l8-5',
  bot: 'M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2',
  globe: 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  locate: 'M2 12h3M19 12h3M12 2v3M12 19v3',
  'chevron-down': 'm6 9 6 6 6-6',
  search: 'm21 21-4.35-4.35',
  // Asterisco de 8 puntas (estilo "spark" de Claude Code) — avatar del chatbot
  spark: 'M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36',
  // Estrella (sello de ficha destacada — capa comercial Fase 3)
  star: 'M11.5 2.3a.6.6 0 0 1 1 0l2.6 5.3 5.8.8a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.9.6L12 17.3l-5.2 2.7a.6.6 0 0 1-.9-.6l1-5.8L2.7 9.5a.6.6 0 0 1 .3-1l5.8-.8 2.6-5.3z',
  // Compartir (nodos conectados, estilo Lucide share-2)
  share: 'M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98',
  // ---- Rediseño map-first (Sprint UX/UI) ----
  menu: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 6v6l4 2',
  route: 'M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 16h6a3 3 0 0 0 0-6H9',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 19.5h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6 1.65 1.65 0 0 0 10 2.09V2a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 8v.09',
  alert: 'm10.29 3.86-8.4 14.53A2 2 0 0 0 3.71 21h16.58a2 2 0 0 0 1.82-2.61l-8.4-14.53a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  snow: 'M12 2v20M4 6l16 12M20 6L4 18M12 6l3-2M12 6 9 4M12 18l3 2M12 18l-3 2',
  anchor: 'M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  tent: 'M3.5 21 14 3M20.5 21 10 3M15.5 12 18 21M8.5 12 6 21M2 21h20',
  cloud: 'M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 15.7M8 19v2M12 19v3M16 19v2',
  paw: 'M11 14c-2.5 0-4 1.6-4 3.5S8.5 21 11 21s4-1.6 4-3.5S13.5 14 11 14z',
  // Cono de faena (reporte "faena / desvío" — obras del Plan Ruta Austral):
  // triángulo con dos franjas y la base apoyada en el suelo.
  cone: 'm12 3-6 15h12L12 3zM3 21h18M9.6 10.5h4.8M8 15h8',

  // ---- Iconografía de guía de ruta (ago-2026) ----
  // La llama: sello de "recomendado por los viajeros". Va SOLO aquí como forma;
  // quién la enciende lo decide `data/iconos.js`, no el dibujo.
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  // Subtipos de "dónde dormir": la cabaña/casa (la carpa ya existe arriba).
  house:
    'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  // Subtipos de "dónde comer".
  coffee:
    'M10 2v2M14 2v2M6 2v2M4 8h14a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1zM19 11h1a3 3 0 0 1 0 6h-1',
  beer:
    'M17 11h1a3 3 0 0 1 0 6h-1M9 12v6M13 12v6M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1-.14-5A3.5 3.5 0 0 1 9.5 2c1.5 0 2 .5 3 .5s1.5-.5 3-.5A3.5 3.5 0 0 1 19 5.5a2.5 2.5 0 0 1-2.5 2.5c-.78 0-1.72-.5-2.5-.5z',
  // Subtipos de "qué visitar".
  eye: 'M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0z',
  footprints:
    'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0zM20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0zM16 17h4M4 13h4',
  droplet:
    'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
  waves:
    'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  tree: 'm17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17zM12 22v-3',
  // Subtipos de "servicios".
  ship:
    'M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.4 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.3 2.8 7.8M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M12 10V6',
  bus: 'M8 6v6M15 6v6M4 12h16M18 18h2a1 1 0 0 0 1-1V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1h2M10 18h4',
  wrench:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  'shopping-bag': 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  banknote: 'M6 12h.01M18 12h.01',
  info: 'M12 16v-4M12 8h.01',
  // Subtipo de "emergencias": carabineros / policía.
  shield:
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
}

/**
 * Formas adicionales (círculos/rects) por icono, en UN SOLO lugar.
 *
 * Antes esto vivía dos veces: una como JSX para el componente y otra como
 * string para `iconoHTML` (los pines de Leaflet). Los dos mapas se
 * desincronizaron —`search`, `share` y `clock` tenían su círculo solo en la
 * versión JSX—, así que esos iconos salían mutilados dentro de un pin y
 * enteros en el resto de la app. Declarando la forma una vez y generando las
 * dos salidas, eso no puede volver a pasar.
 */
const FORMAS = {
  'map-pin': [['circle', { cx: 12, cy: 10, r: 3 }]],
  calendar: [['rect', { width: 18, height: 18, x: 3, y: 4, rx: 2 }]],
  car: [
    ['circle', { cx: 7, cy: 17, r: 2 }],
    ['circle', { cx: 17, cy: 17, r: 2 }],
  ],
  smartphone: [['rect', { width: 14, height: 20, x: 5, y: 2, rx: 2, ry: 2 }]],
  bot: [['rect', { width: 16, height: 12, x: 4, y: 8, rx: 2 }]],
  globe: [['circle', { cx: 12, cy: 12, r: 10 }]],
  search: [['circle', { cx: 11, cy: 11, r: 8 }]],
  locate: [
    ['circle', { cx: 12, cy: 12, r: 7 }],
    ['circle', { cx: 12, cy: 12, r: 1.5 }],
  ],
  share: [
    ['circle', { cx: 18, cy: 5, r: 3 }],
    ['circle', { cx: 6, cy: 12, r: 3 }],
    ['circle', { cx: 18, cy: 19, r: 3 }],
  ],
  clock: [['circle', { cx: 12, cy: 12, r: 10 }]],
  // Huella: los cuatro dedos van como círculos (pin de reporte "fauna en ruta").
  paw: [
    ['circle', { cx: 5.5, cy: 9, r: 1.7 }],
    ['circle', { cx: 9, cy: 6, r: 1.7 }],
    ['circle', { cx: 15, cy: 6, r: 1.7 }],
    ['circle', { cx: 18.5, cy: 9, r: 1.7 }],
  ],
  eye: [['circle', { cx: 12, cy: 12, r: 3 }]],
  banknote: [
    ['rect', { width: 20, height: 12, x: 2, y: 6, rx: 2 }],
    ['circle', { cx: 12, cy: 12, r: 2 }],
  ],
  info: [['circle', { cx: 12, cy: 12, r: 10 }]],
  bus: [
    ['circle', { cx: 7, cy: 18, r: 2 }],
    ['circle', { cx: 17, cy: 18, r: 2 }],
  ],
}

export default function Icon({ nombre, tam = 16, color = 'currentColor', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {RUTAS[nombre] && <path d={RUTAS[nombre]} />}
      {FORMAS[nombre]?.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  )
}

// Versión string para usar dentro de divIcon de Leaflet
export function iconoHTML(nombre, tam = 14, color = '#fff') {
  const extras = (FORMAS[nombre] || [])
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')}/>`
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RUTAS[nombre] || ''}"/>${extras}</svg>`
}
