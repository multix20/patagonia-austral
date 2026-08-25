import { sumarMetrica, leerMetricas, descontarMetricas } from './db'

// Analítica de uso de la PWA (Fase 3).
//
// Qué se mide y por qué: sin números no se puede evaluar el primer volante de la
// campaña de difusión, ni saber qué fichas se miran, ni decirle a un negocio
// "tu ficha se vio N veces este mes" — que es lo que hace vendible la capa
// comercial. Ver ESTADO_Y_PENDIENTES → "Publicitar la app".
//
// Qué NO se mide, a propósito: no hay identificador de persona, ni de sesión, ni
// de dispositivo. No se manda la hora del evento ni su orden. Lo que sale de
// aquí es "hoy, tal cosa pasó N veces", y con eso NO se puede reconstruir el
// recorrido de nadie porque el dato para hacerlo nunca se genera. Es deliberado:
// medir el uso no obliga a vigilar a quien viaja.
//
// Cómo aguanta el plan gratis y la ruta sin señal: los contadores se acumulan en
// IndexedDB con la misma forma que la tabla del servidor (tipo, referencia, día
// → cantidad) y se mandan por lotes. Veinte fichas vistas en el camino a Tortel
// son UNA fila que sale cuando aparezca la señal, no veinte peticiones perdidas.

const API_URL = import.meta.env.VITE_API_URL || ''

// Mismo tope que `InteraccionController::MAX_EVENTOS`. Si hay más, se manda en
// varias tandas.
const MAX_EVENTOS = 100

// Cuánto se espera antes de mandar tras registrar algo. La analítica es lo menos
// urgente que hace la app: puede esperar de sobra a que el viajero termine de
// mirar, y así un paseo por seis fichas viaja en una petición y no en seis.
const MS_ESPERA_ENVIO = 30000

/** Día local en YYYY-MM-DD (no UTC: agrupa como lo vive quien viaja). */
function hoy() {
  const d = new Date()
  const mes = `${d.getMonth() + 1}`.padStart(2, '0')
  const dia = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

let temporizador = null
let enviando = false

/**
 * Registra una interacción. No devuelve promesa ni espera a nada: se llama desde
 * manejadores de toque, y medir JAMÁS puede demorar lo que la persona pidió.
 * Si IndexedDB falla (modo privado, cuota llena), se pierde el conteo en
 * silencio — perder una métrica es gratis, romper un toque no.
 */
export function contar(tipo, ref = null) {
  sumarMetrica(tipo, ref == null ? '' : String(ref), hoy())
    .then(programarEnvio)
    .catch(() => {})
}

/**
 * Cuenta DE DÓNDE se abrió la app. Se llama una sola vez, junto a
 * `app_abierta`, así que los dos rankings del panel suman lo mismo que las
 * aperturas y se pueden leer como porcentaje.
 *
 * Son dos señales porque una sola contesta a medias: la zona horaria dice dónde
 * está el TELÉFONO (el alemán que ya va por Coyhaique manda `America/Santiago`,
 * porque el sistema le cambió la hora al aterrizar) y el idioma del navegador
 * de dónde viene la PERSONA (ese mismo alemán sigue mandando `de-DE`).
 *
 * Se manda la zona horaria CRUDA y el servidor la reduce a país: la tabla IANA
 * → país ya viene dentro de PHP, y meter un mapa de 400 zonas en un bundle que
 * se precachea entero para usarlo sin señal no se paga con nada. Lo que se
 * guarda al otro lado es un contador diario por país, no la zona.
 *
 * Sigue sin haber IP, sesión ni identificador de dispositivo: "hoy entraron 4
 * desde Alemania" no permite reconstruir el recorrido de ninguna de las 4.
 */
export function contarOrigen() {
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zona) contar('origen_pais', zona)
  } catch {
    // Navegador sin zona horaria resoluble: no impide contar el idioma.
  }

  const idioma = navigator.language || navigator.languages?.[0]
  if (idioma) contar('origen_idioma', idioma)
}

function programarEnvio() {
  if (!API_URL || temporizador) return
  temporizador = setTimeout(() => {
    temporizador = null
    enviarMetricas()
  }, MS_ESPERA_ENVIO)
}

/**
 * Vacía los contadores acumulados. Se llama al abrir la app, al recuperar señal
 * y al mandarla a segundo plano (que es cuando de verdad se cierra en el
 * celular). Devuelve cuántas líneas se enviaron.
 */
export async function enviarMetricas() {
  if (!API_URL || !navigator.onLine || enviando) return 0
  enviando = true
  try {
    const pendientes = await leerMetricas()
    if (!pendientes.length) return 0

    let enviadas = 0
    for (let i = 0; i < pendientes.length; i += MAX_EVENTOS) {
      const tanda = pendientes.slice(i, i + MAX_EVENTOS)
      const r = await fetch(`${API_URL}/api/interacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          eventos: tanda.map((m) => ({ tipo: m.tipo, ref: m.ref || null, n: m.n })),
        }),
      })
      // 2xx = contabilizado. 422 = el lote no le sirve al servidor (un tipo que
      // esta versión de la app manda y esa no conoce): se descarta igual, porque
      // reintentarlo no lo va a arreglar nunca y dejaría la cola atascada para
      // siempre. Cualquier otra cosa (429, 500, red caída) se deja para después.
      if (!r.ok && r.status !== 422) break
      await descontarMetricas(tanda)
      enviadas += tanda.length
    }
    return enviadas
  } catch {
    return 0 // sin red o API caída: los contadores quedan para el próximo intento
  } finally {
    enviando = false
  }
}

/**
 * Conecta los disparadores de envío al ciclo de vida de la app. Devuelve la
 * función de limpieza que espera un `useEffect`.
 *
 * `visibilitychange` es el importante en el celular: las apps no se "cierran",
 * se mandan al fondo, y un `beforeunload` no llega. Si no se vacía ahí, lo del
 * día se queda dentro del teléfono hasta la próxima apertura.
 */
export function conectarAnalitica() {
  const alVolverSenal = () => enviarMetricas()
  const alOcultar = () => {
    if (document.visibilityState === 'hidden') enviarMetricas()
  }
  window.addEventListener('online', alVolverSenal)
  document.addEventListener('visibilitychange', alOcultar)
  enviarMetricas()
  return () => {
    window.removeEventListener('online', alVolverSenal)
    document.removeEventListener('visibilitychange', alOcultar)
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
  }
}
