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
}

// Formas adicionales (círculos/rects) por icono
const EXTRAS = {
  'map-pin': [<circle key="c" cx="12" cy="10" r="3" />],
  calendar: [<rect key="r" width="18" height="18" x="3" y="4" rx="2" />],
  car: [<circle key="a" cx="7" cy="17" r="2" />, <circle key="b" cx="17" cy="17" r="2" />],
  smartphone: [<rect key="r" width="14" height="20" x="5" y="2" rx="2" ry="2" />],
  bot: [<rect key="r" width="16" height="12" x="4" y="8" rx="2" />],
  globe: [<circle key="c" cx="12" cy="12" r="10" />],
  search: [<circle key="c" cx="11" cy="11" r="8" />],
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
      {EXTRAS[nombre]}
    </svg>
  )
}

// Versión string para usar dentro de divIcon de Leaflet
export function iconoHTML(nombre, tam = 14, color = '#fff') {
  const extras = {
    'map-pin': '<circle cx="12" cy="10" r="3"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/>',
    car: '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>',
    bot: '<rect width="16" height="12" x="4" y="8" rx="2"/>',
    globe: '<circle cx="12" cy="12" r="10"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5"/>',
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RUTAS[nombre] || ''}"/>${extras[nombre] || ''}</svg>`
}
