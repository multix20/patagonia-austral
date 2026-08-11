import { LUGARES_SEED, AVISOS_SEED, LOCALIDADES_SEED } from '../data/places'
import {
  guardarLugares,
  leerLugares,
  guardarAvisos,
  leerAvisos,
  guardarLocalidades,
  leerLocalidades,
  guardarRutas,
  leerRutas,
  guardarReportes,
  leerReportes,
  encolarReporte,
  leerCola,
  borrarDeCola,
  guardarMeta,
  leerMeta,
} from '../db'

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

  // Primera visita: sembrar IndexedDB con el contenido crítico empaquetado.
  // La semilla trae también los lugares despublicados (`publicado: false`) para
  // no perder el contenido ya redactado, pero la app muestra lo mismo que sirve
  // la API: un servicio publicado por localidad y categoría.
  const publicados = LUGARES_SEED.filter((l) => l.publicado !== false)
  await guardarLugares(publicados)
  await guardarMeta('actualizadoEl', Date.now())
  return publicados
}

// Avisos municipales, misma estrategia offline-first que los lugares.
// Normaliza la respuesta de la API a { id, mensaje: {es,en}, tipo }.
export async function obtenerAvisos() {
  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/notices`, { headers: { Accept: 'application/json' } })
      if (r.ok) {
        const datos = (await r.json()).map((a) => ({
          id: a.id,
          mensaje: a.mensaje,
          tipo: a.tipo,
          publicado_en: a.publicado_en,
        }))
        await guardarAvisos(datos)
        return datos
      }
    } catch {
      // sin red o API caída: continuar con avisos locales
    }
  }
  const locales = await leerAvisos()
  if (locales.length > 0) return locales

  // Sin sincronización previa: usar los avisos semilla empaquetados
  return AVISOS_SEED.map((m, i) => ({ id: `seed-${i}`, mensaje: m, tipo: 'info' }))
}

// Localidades de la ruta (Fase 1 — multi-localidad), misma estrategia
// offline-first. Siempre se devuelven ordenadas norte → sur (`orden`).
export async function obtenerLocalidades() {
  const ordenar = (lista) => [...lista].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/localidades`, {
        headers: { Accept: 'application/json' },
      })
      if (r.ok) {
        const datos = await r.json()
        await guardarLocalidades(datos)
        return ordenar(datos)
      }
    } catch {
      // sin red o API caída (o backend sin Fase 1 aún): continuar con datos locales
    }
  }
  const locales = await leerLocalidades()
  if (locales.length > 0) return ordenar(locales)

  // Primera visita sin API: sembrar con las localidades empaquetadas
  await guardarLocalidades(LOCALIDADES_SEED)
  return ordenar(LOCALIDADES_SEED)
}

// Trazados y áreas del mapa (pasarelas, senderos, glaciares). Misma estrategia
// offline-first que el resto, con UNA diferencia: no hay semilla empaquetada.
//
// Es deliberado. La red de pasarelas y los glaciares pesan ~40 KB ya
// simplificados, y son útiles en UNA localidad de las 27: meterlos en el bundle
// haría que los 27 pueblos paguen el peso para que lo aproveche quien va a
// Tortel. Se descargan la primera vez que hay señal y de ahí quedan en
// IndexedDB, que es exactamente cuando el viajero prepara el tramo.
export async function obtenerRutas() {
  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/rutas`, { headers: { Accept: 'application/json' } })
      if (r.ok) {
        const datos = await r.json()
        await guardarRutas(datos)
        return datos
      }
    } catch {
      // sin red, o backend viejo sin /api/rutas: seguir con lo cacheado
    }
  }
  return leerRutas()
}

export async function fechaActualizacion() {
  return leerMeta('actualizadoEl')
}

// ---------------------------------------------------------------------------
// Crowdsourcing (Fase 3): reportes de ruta de los viajeros.
// ---------------------------------------------------------------------------

// Id anónimo del dispositivo: sirve para no contar dos veces el mismo voto. El
// backend lo guarda HASHEADO, nunca en claro, y no identifica a la persona.
function idDispositivo() {
  let id = localStorage.getItem('dispositivoId')
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('dispositivoId', id)
  }
  return id
}

/** ¿Caducó el reporte? La app lo filtra igual que la API, para el caso sin señal. */
const vigente = (r) => !r.expira_en || new Date(r.expira_en) > new Date()

export async function obtenerReportes() {
  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/reportes`, { headers: { Accept: 'application/json' } })
      if (r.ok) {
        const datos = await r.json()
        await guardarReportes(datos)
        return datos
      }
    } catch {
      // sin red o API caída: seguir con lo cacheado
    }
  }
  return (await leerReportes()).filter(vigente)
}

/**
 * Envía un reporte. Si no hay red (o el POST falla), queda en el buzón de salida
 * y se reintenta al recuperar señal — el viajero reporta justo donde no hay
 * cobertura, así que esto es el camino normal, no el excepcional.
 * Devuelve { enviado, reporte } para que la UI diga la verdad al usuario.
 */
export async function enviarReporte({ tipo, lat, lng, comentario = null }) {
  const cuerpo = { tipo, lat, lng, comentario, dispositivo: idDispositivo() }

  if (API_URL && navigator.onLine) {
    try {
      const r = await fetch(`${API_URL}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      if (r.ok) return { enviado: true, reporte: await r.json() }
      // 422/429: el reintento no va a arreglarlo (dato inválido o límite de
      // envíos), así que no se encola para no reintentar en vano. El `motivo`
      // permite que la UI diga POR QUÉ se rechazó (p. ej. fuera de la ruta) en
      // vez del "no se pudo enviar" genérico, que no ayuda a nadie.
      if (r.status === 422 || r.status === 429) {
        const motivo = await r
          .json()
          .then((d) => d?.error)
          .catch(() => null)
        return { enviado: false, error: r.status, motivo }
      }
    } catch {
      // sin red: cae al buzón de salida
    }
  }
  await encolarReporte({ ...cuerpo, creado_en: new Date().toISOString() })
  return { enviado: false, encolado: true }
}

/** Vacía el buzón de salida. Se llama al recuperar conexión y al abrir la app. */
export async function sincronizarCola() {
  if (!API_URL || !navigator.onLine) return 0
  const pendientes = await leerCola()
  let enviados = 0
  for (const p of pendientes) {
    const { clave, creado_en: _creado, ...cuerpo } = p
    try {
      const r = await fetch(`${API_URL}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      // 2xx = enviado; 422 = inválido (no sirve reintentarlo). En ambos casos
      // sale de la cola. Un 429 o un error de red lo deja para el próximo intento.
      if (r.ok || r.status === 422) {
        await borrarDeCola(clave)
        if (r.ok) enviados++
      }
    } catch {
      break // sin red otra vez: dejar el resto en la cola
    }
  }
  return enviados
}

export async function contarCola() {
  return (await leerCola()).length
}

/** Vota un reporte: confirma = "sigue ahí", false = "ya no está". */
export async function votarReporte(id, confirma) {
  if (!API_URL || !navigator.onLine) return null
  try {
    const r = await fetch(`${API_URL}/api/reportes/${id}/voto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ confirma, dispositivo: idDispositivo() }),
    })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}
