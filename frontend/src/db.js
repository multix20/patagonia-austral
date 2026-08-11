import { openDB } from 'idb'

// Almacenamiento local estructurado (IndexedDB) según plan de contingencia
// offline: los contenidos quedan disponibles sin conexión tras la primera visita.
const DB_NOMBRE = 'cochrane-turismo'
const DB_VERSION = 5

function db() {
  return openDB(DB_NOMBRE, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('lugares')) d.createObjectStore('lugares', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta')
      // v2: avisos municipales cacheados para consulta sin conexión
      if (!d.objectStoreNames.contains('avisos')) d.createObjectStore('avisos', { keyPath: 'id' })
      // v3: localidades de la Carretera Austral (Fase 1 — multi-localidad).
      // Clave por slug: es el identificador estable que comparten API y seeds.
      if (!d.objectStoreNames.contains('localidades'))
        d.createObjectStore('localidades', { keyPath: 'slug' })
      // v4 — Crowdsourcing (Fase 3). Dos stores:
      //  - `reportes`: los reportes vigentes que sirvió la API, para verlos sin
      //    señal (el caso normal en la Carretera, no la excepción).
      //  - `salientes`: BUZÓN DE SALIDA. El viajero reporta justo donde no hay
      //    red, así que el reporte se guarda aquí y se envía cuando vuelve la
      //    señal. Clave autoincremental porque no tiene id del servidor todavía.
      if (!d.objectStoreNames.contains('reportes'))
        d.createObjectStore('reportes', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('salientes'))
        d.createObjectStore('salientes', { keyPath: 'clave', autoIncrement: true })
      // v5 — Trazados y áreas del mapa: la red de pasarelas de Tortel, senderos,
      // rutas y glaciares. Van en su propio store y no en `lugares` porque no
      // son un punto: cada fila trae una geometría GeoJSON que Leaflet dibuja.
      if (!d.objectStoreNames.contains('rutas')) d.createObjectStore('rutas', { keyPath: 'id' })
    },
  })
}

export async function guardarLugares(lista) {
  const d = await db()
  const tx = d.transaction('lugares', 'readwrite')
  // clear() y no solo put(): despublicar una ficha en el CMS la saca de
  // /api/places, pero la respuesta no dice "esta se fue" — simplemente no viene.
  // Sin el clear, el lugar despublicado se quedaba PARA SIEMPRE en el IndexedDB
  // de quien ya lo tenía sincronizado. Los dos llamadores mandan la lista
  // canónica completa (respuesta de la API, o la semilla filtrada), así que
  // reemplazar es lo correcto — igual que en localidades y avisos.
  await tx.store.clear()
  await Promise.all(lista.map((l) => tx.store.put(l)))
  await tx.done
}

export async function leerLugares() {
  const d = await db()
  return d.getAll('lugares')
}

export async function guardarAvisos(lista) {
  const d = await db()
  const tx = d.transaction('avisos', 'readwrite')
  await tx.store.clear() // los avisos son volátiles: reflejar exactamente lo publicado
  await Promise.all(lista.map((a) => tx.store.put(a)))
  await tx.done
}

export async function leerAvisos() {
  const d = await db()
  return d.getAll('avisos')
}

export async function guardarLocalidades(lista) {
  const d = await db()
  const tx = d.transaction('localidades', 'readwrite')
  await tx.store.clear() // lista canónica: reflejar exactamente lo publicado
  await Promise.all(lista.map((l) => tx.store.put(l)))
  await tx.done
}

export async function leerLocalidades() {
  const d = await db()
  return d.getAll('localidades')
}

export async function guardarRutas(lista) {
  const d = await db()
  const tx = d.transaction('rutas', 'readwrite')
  await tx.store.clear() // lista canónica: despublicar una ruta tiene que borrarla
  await Promise.all(lista.map((r) => tx.store.put(r)))
  await tx.done
}

export async function leerRutas() {
  const d = await db()
  return d.getAll('rutas')
}

// ---- Crowdsourcing (Fase 3) ----

export async function guardarReportes(lista) {
  const d = await db()
  const tx = d.transaction('reportes', 'readwrite')
  await tx.store.clear() // son volátiles (caducan): reflejar exactamente lo vigente
  await Promise.all(lista.map((r) => tx.store.put(r)))
  await tx.done
}

export async function leerReportes() {
  const d = await db()
  return d.getAll('reportes')
}

/** Encola un reporte hecho sin señal, para enviarlo al volver la conexión. */
export async function encolarReporte(reporte) {
  const d = await db()
  return d.add('salientes', reporte)
}

export async function leerCola() {
  const d = await db()
  return d.getAll('salientes')
}

export async function borrarDeCola(clave) {
  const d = await db()
  return d.delete('salientes', clave)
}

export async function guardarMeta(clave, valor) {
  const d = await db()
  return d.put('meta', valor, clave)
}

export async function leerMeta(clave) {
  const d = await db()
  return d.get('meta', clave)
}
