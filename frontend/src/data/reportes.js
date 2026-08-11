// Tipos de reporte del crowdsourcing (Fase 3 — "¿Qué ves en la ruta?").
//
// `tipo` es la clave estable que comparten la PWA y la API (/api/reportes) y la
// que define la vida útil del reporte en el backend (Reporte::VIDA_HORAS). `k` es
// la clave del texto bilingüe en i18n.jsx, e `icon`/`c` la marca visual (pin del
// mapa y tarjeta).
//
// Recorte a TRES tipos (ago-2026). Antes había once, y once botones es un
// formulario, no un reporte hecho de un toque con el auto detenido en la berma.
// Los tres que quedan son los que cambian la decisión de quien viene detrás:
// algo peligroso, un accidente, o la vía intervenida. Todo lo demás (clima,
// bencina, camping) o se sabe al llegar al pueblo o cabe en el detalle libre.
export const REPORTES = [
  // Rojo: el color de "frena". Es el tipo comodín de los tres, así que va
  // primero y con el icono más reconocible.
  { k: 'repPeligro', tipo: 'peligro', icon: 'alert', c: '#C0392B' },
  // Morado y no otro rojo: accidente y peligro se tocan uno al lado del otro en
  // la grilla, y dos rojos vecinos se eligen mal con el pulgar.
  { k: 'repAccidente', tipo: 'accidente', icon: 'car', c: '#7A1FA2' },
  // Naranja de cono: es el código de obras que ya entiende cualquiera que
  // maneje, y separa la faena programada del peligro imprevisto.
  { k: 'repFaena', tipo: 'faena', icon: 'cone', c: '#E8871A' },
]

/**
 * Tipos que ya NO se pueden reportar pero pueden seguir vivos en el mapa: los
 * reportes creados antes del recorte caducan solos (≤ 168 h), y hasta entonces
 * hay que saber dibujarlos. Sin esto quedaban de color gris y con la etiqueta
 * genérica "Reporte de un viajero" — o sea, el dato se veía roto durante una
 * semana por un cambio nuestro. No van en la grilla de botones.
 */
const TIPOS_HISTORICOS = [
  { k: 'repDerrumbe', tipo: 'derrumbe', icon: 'mountain', c: '#8a5a2b' },
  { k: 'repHielo', tipo: 'hielo', icon: 'snow', c: '#2b6cb0' },
  { k: 'repCamino', tipo: 'camino', icon: 'alert', c: 'var(--amarillo)' },
  { k: 'repCombustible', tipo: 'combustible', icon: 'fuel', c: '#185FA5' },
  { k: 'repFerry', tipo: 'ferry', icon: 'anchor', c: '#0e7c86' },
  { k: 'repCamping', tipo: 'camping', icon: 'tent', c: '#534AB7' },
  { k: 'repTiempo', tipo: 'tiempo', icon: 'cloud', c: '#5b6b78' },
  { k: 'repFauna', tipo: 'fauna', icon: 'paw', c: '#0F6E56' },
  { k: 'repEvento', tipo: 'evento', icon: 'calendar', c: '#D4537E' },
  { k: 'dejarComentario', tipo: 'comentario', icon: 'message-circle', c: '#D85A30' },
]

/**
 * tipo → estilo/etiqueta, para pintar un reporte que llegó de la API.
 * El orden importa: los tipos vivos van PRIMERO porque `iconoGrupoReportes`
 * (MapView) usa este orden para desempatar el color de un grupo.
 */
export const ESTILO_REPORTE = Object.fromEntries(
  [...REPORTES, ...TIPOS_HISTORICOS].map((r) => [r.tipo, r])
)
