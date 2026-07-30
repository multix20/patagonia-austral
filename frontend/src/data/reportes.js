// Tipos de reporte del crowdsourcing (Fase 3 — "¿Qué ves en la ruta?").
//
// `tipo` es la clave estable que comparten la PWA y la API (/api/reportes) y la
// que define la vida útil del reporte en el backend (Reporte::VIDA_HORAS): el
// clima caduca en horas, un derrumbe dura días. `k` es la clave del texto
// bilingüe en i18n.jsx, e `icon`/`c` la marca visual (pin del mapa y tarjeta).
export const REPORTES = [
  { k: 'repDerrumbe', tipo: 'derrumbe', icon: 'mountain', c: '#8a5a2b' },
  { k: 'repHielo', tipo: 'hielo', icon: 'snow', c: '#2b6cb0' },
  { k: 'repCamino', tipo: 'camino', icon: 'alert', c: 'var(--amarillo)' },
  { k: 'repCombustible', tipo: 'combustible', icon: 'fuel', c: '#185FA5' },
  { k: 'repFerry', tipo: 'ferry', icon: 'anchor', c: '#0e7c86' },
  // "Todo lleno" en el pueblo. Es el aviso que hace que el viajero siga de largo
  // o llame antes de llegar — y el más valioso mientras duren las obras del Plan
  // Ruta Austral (2026-2030), que suman cuadrillas alojadas sobre una ocupación
  // regional que ya venía en ~77% en temporada alta.
  { k: 'repAlojamiento', tipo: 'alojamiento', icon: 'bed', c: '#B3261E' },
  { k: 'repCamping', tipo: 'camping', icon: 'tent', c: '#534AB7' },
  { k: 'repTiempo', tipo: 'tiempo', icon: 'cloud', c: '#5b6b78' },
  { k: 'repFauna', tipo: 'fauna', icon: 'paw', c: '#0F6E56' },
  { k: 'repEvento', tipo: 'evento', icon: 'calendar', c: '#D4537E' },
]

// El comentario libre es un tipo más para el backend, pero no va en la grilla de
// botones (tiene su propia fila en la hoja de reportar).
export const REPORTE_COMENTARIO = {
  k: 'dejarComentario',
  tipo: 'comentario',
  icon: 'message-circle',
  c: '#D85A30',
}

/** tipo → estilo/etiqueta, para pintar un reporte que llegó de la API. */
export const ESTILO_REPORTE = Object.fromEntries(
  [...REPORTES, REPORTE_COMENTARIO].map((r) => [r.tipo, r])
)
