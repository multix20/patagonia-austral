import { openDB } from 'idb'

// Almacenamiento local estructurado (IndexedDB) según plan de contingencia
// offline: los contenidos quedan disponibles sin conexión tras la primera visita.
const DB_NOMBRE = 'cochrane-turismo'
const DB_VERSION = 1

function db() {
  return openDB(DB_NOMBRE, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('lugares')) d.createObjectStore('lugares', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta')
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

export async function guardarMeta(clave, valor) {
  const d = await db()
  return d.put('meta', valor, clave)
}

export async function leerMeta(clave) {
  const d = await db()
  return d.get('meta', clave)
}
