import { LUGARES_SEED } from '../data/places'
import { guardarLugares, leerLugares, guardarMeta, leerMeta } from '../db'

// Capa de acceso a datos con estrategia offline-first:
// 1. Si hay API configurada (backend Laravel) y conexión → red, y actualiza IndexedDB.
// 2. Si no → IndexedDB (contenido previamente sincronizado).
// 3. Primera ejecución sin red previa → datos semilla empaquetados con la app.
//
// En producción se define VITE_API_URL (p. ej. https://turismo.municochrane.cl)
const API_URL = import.meta.env.VITE_API_URL || ''

export async function obtenerLugares() {
  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/places`, { headers: { Accept: 'application/json' } })
      if (r.ok) {
        const datos = await r.json()
        await guardarLugares(datos)
        await guardarMeta('actualizadoEl', Date.now())
        return datos
      }
    } catch {
      // sin red o API caída: continuar con datos locales
    }
  }
  const locales = await leerLugares()
  if (locales.length > 0) return locales

  // Primera visita: sembrar IndexedDB con el contenido crítico empaquetado
  await guardarLugares(LUGARES_SEED)
  await guardarMeta('actualizadoEl', Date.now())
  return LUGARES_SEED
}

export async function fechaActualizacion() {
  return leerMeta('actualizadoEl')
}
