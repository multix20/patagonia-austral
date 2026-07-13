import { openDB } from 'idb'

// Almacenamiento local estructurado (IndexedDB) según plan de contingencia
// offline: los contenidos quedan disponibles sin conexión tras la primera visita.
const DB_NOMBRE = 'cochrane-turismo'
const DB_VERSION = 3

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
    },
  })
}

export async function guardarLugares(lista) {
  const d = await db()
  const tx = d.transaction('lugares', 'readwrite')
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

export async function guardarMeta(clave, valor) {
  const d = await db()
  return d.put('meta', valor, clave)
}

export async function leerMeta(clave) {
  const d = await db()
  return d.get('meta', clave)
}
