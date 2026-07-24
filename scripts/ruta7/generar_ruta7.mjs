// Genera el trazado EXACTO de la Ruta 7 (Carretera Austral) desde OpenStreetMap
// y lo escribe en frontend/src/data/ruta7.js.
//
// Por qué en local: el entorno web (Claude Code) bloquea Overpass por política de
// red — igual que la BD de producción. Este script se corre en tu máquina, donde
// Overpass sí es alcanzable, y su salida (dato estático) se commitea y viaja
// offline con la PWA. Mismo patrón que el pipeline SERNATUR.
//
// Uso:
//   node scripts/ruta7/generar_ruta7.mjs
//
// Requiere Node 18+ (usa fetch global). Sin dependencias externas.
//
// Qué hace:
//  1. Pide a Overpass las vías con ref CH-7 / 7 (highway) entre Puerto Montt y
//     Villa O'Higgins, y las rutas de ferry (route=ferry) del mismo corredor.
//  2. Convierte cada vía en un tramo {tipo, puntos:[[lat,lng],...]}, simplifica
//     con Douglas–Peucker para bajar el peso, y descarta duplicados de sentido.
//  3. Escribe frontend/src/data/ruta7.js con el mismo formato que usa MapView.
//
// Nota: el resultado son TRAMOS (no una sola línea continua); MapView ya dibuja
// una lista de tramos, así que no hace falta coserlos. Revisa el mapa tras correr.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const OVERPASS = 'https://overpass-api.de/api/interpreter'

// Caja de la Carretera Austral (S, W, N, E), con holgura.
const BBOX = [-48.7, -74.2, -41.2, -71.2]

const QUERY = `
[out:json][timeout:180];
(
  way["highway"]["ref"~"^(CH-7|7)$"](${BBOX.join(',')});
  way["route"="ferry"]["motor_vehicle"!="no"](${BBOX.join(',')});
);
out geom;
`

// Tolerancia de simplificación en grados (~5–6 m). Sube para menos puntos.
const TOL = 0.00006

function perpDist(p, a, b) {
  const [x, y] = p
  const [x1, y1] = a
  const [x2, y2] = b
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1)
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(x - cx, y - cy)
}

// Douglas–Peucker sobre pares [lat, lng].
function simplificar(puntos, tol = TOL) {
  if (puntos.length < 3) return puntos
  let maxD = 0
  let idx = 0
  for (let i = 1; i < puntos.length - 1; i++) {
    const d = perpDist(puntos[i], puntos[0], puntos[puntos.length - 1])
    if (d > maxD) {
      maxD = d
      idx = i
    }
  }
  if (maxD > tol) {
    const izq = simplificar(puntos.slice(0, idx + 1), tol)
    const der = simplificar(puntos.slice(idx), tol)
    return izq.slice(0, -1).concat(der)
  }
  return [puntos[0], puntos[puntos.length - 1]]
}

const redondear = (n) => Math.round(n * 1e5) / 1e5

async function main() {
  console.log('Consultando Overpass…')
  const r = await fetch(OVERPASS, { method: 'POST', body: QUERY })
  if (!r.ok) throw new Error(`Overpass respondió ${r.status}`)
  const { elements } = await r.json()

  const vistos = new Set()
  const tramos = []
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry?.length) continue
    const esFerry = el.tags?.route === 'ferry'
    const puntos = el.geometry.map((g) => [g.lat, g.lon])
    // Deduplica vías paralelas de doble sentido por su geometría (ida/vuelta).
    const clave = puntos
      .map((p) => p.map(redondear).join(','))
      .sort()
      .join('|')
    if (vistos.has(clave)) continue
    vistos.add(clave)
    const simp = simplificar(puntos).map((p) => [redondear(p[0]), redondear(p[1])])
    tramos.push({ tipo: esFerry ? 'barcaza' : 'camino', puntos: simp })
  }

  tramos.sort((a, b) => b.puntos[0][0] - a.puntos[0][0]) // norte → sur, aprox.

  const cuerpo =
    tramos
      .map(
        (t) =>
          `  { tipo: '${t.tipo}', puntos: [${t.puntos
            .map((p) => `[${p[0]}, ${p[1]}]`)
            .join(', ')}] },`
      )
      .join('\n')

  const salida = `// Trazado de la Ruta 7 (Carretera Austral) — GENERADO por
// scripts/ruta7/generar_ruta7.mjs desde OpenStreetMap. No editar a mano.
// Regenerar: node scripts/ruta7/generar_ruta7.mjs
export const RUTA7 = [
${cuerpo}
]
`

  const destino = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../frontend/src/data/ruta7.js'
  )
  writeFileSync(destino, salida)
  console.log(`Listo: ${tramos.length} tramos escritos en ${destino}`)
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
