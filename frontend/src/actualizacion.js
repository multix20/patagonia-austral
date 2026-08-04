// Ciclo de actualización de la PWA — sin pedirle nada al viajero.
//
// Historia, porque esto ya dio dos vueltas. Primero era `autoUpdate`: la página
// se recargaba sola y sin aviso, y con el mapa abierto en la ruta eso asusta.
// Se pasó entonces a un aviso con botón "Actualizar", y apareció el problema
// contrario y peor: la gente no lo toca. Quedaban teléfonos con versiones
// viejas por semanas, con los arreglos ya publicados pero sin llegar a nadie.
//
// El ciclo de ahora se queda con lo bueno de los dos: actualiza solo, pero
// nunca encima del viajero.
//
//   1. Se busca versión nueva al abrir, al volver a primer plano y cada hora
//      mientras la app esté abierta con señal.
//   2. Si aparece recién abierta la app, se aplica al tiro con el cartel
//      "Actualizando la app…": el reinicio ocurre antes de que el viajero se
//      haya puesto a hacer algo, y el cartel explica por qué se reinicia.
//   3. Si aparece con la app EN USO no se interrumpe nada ni se le avisa: se
//      espera a que la app quede en segundo plano y se aplica ahí, callada.
//      Cuando el viajero vuelve, ya está en la versión nueva.
//   4. Si nunca queda en segundo plano, la aplica la próxima apertura (2).
//
// O sea que no hay ningún caso en que haya que tocar algo para actualizar. En
// el menú queda igual "Buscar actualizaciones", para forzarla a mano si se
// quiere, pero ya no es el camino por el que llega la versión nueva.
//
// La recarga la dispara `registerSW` (de vite-plugin-pwa) cuando el service
// worker nuevo toma el control; aquí solo se le pide el relevo.
import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Sobrevive a la recarga (misma pestaña) para poder confirmar al volver.
const CLAVE_APLICANDO = 'pa-actualizando'
// Intentos de aplicar sin lograrlo. Si el relevo del service worker falla, la
// recarga de rescate devuelve la app al mismo punto (versión esperando + app
// recién abierta) y sin este freno quedaría recargándose en bucle.
const CLAVE_INTENTOS = 'pa-act-intentos'
const MAX_INTENTOS_AUTO = 2
// Ventana de "recién abierta": si la versión nueva aparece dentro de este rato
// desde que cargó la app, se aplica sola en vez de esperar un toque.
const MS_VENTANA_APERTURA = 12000
// Cada cuánto se pregunta por una versión nueva con la app abierta.
const MS_ENTRE_CHEQUEOS = 60 * 60 * 1000
// Piso entre chequeos: al alternar apps, `visibilitychange` se dispara seguido.
const MS_MINIMO_ENTRE_CHEQUEOS = 60 * 1000
// El cartel "Actualizando…" alcanza a leerse antes de que la página se recargue.
const MS_CARTEL = 900
// Si el relevo del service worker no llega (raro, pero dejaría el cartel
// pegado), se recarga igual: peor que actualizar tarde es quedarse en blanco.
const MS_RESCATE = 8000

// 'idle' (nada que hacer) · 'lista' (versión esperando) · 'aplicando' (cartel + recarga)
let estado = 'idle'
const oyentes = new Set()
const abiertaEn = Date.now()

let aplicarSW = null // la entrega `registerSW`
let registroSW = null
let ultimoChequeo = 0
let iniciado = false

function emitir(nuevo) {
  estado = nuevo
  oyentes.forEach((fn) => fn(nuevo))
}

// Punto en el icono de la app instalada, vía Badging API. Solo lo pintan
// Windows y macOS con la PWA instalada: en Linux el soporte es parcial y
// **Chrome en Android no expone la API** — para Android está la notificación de
// más abajo. Nunca puede romper el resto del flujo.
function marcarIcono(hay) {
  try {
    if (hay) navigator.setAppBadge?.(1)
    else navigator.clearAppBadge?.()
  } catch {
    /* navegador sin Badging API */
  }
}

// Ya no se emite ninguna notificación de "hay versión nueva": no hay nada que
// pedirle al viajero, la versión entra sola. La etiqueta y el borrado siguen
// aquí para LIMPIAR las que dejó la versión anterior de la app, que sí las
// emitía — si no, ese puntito en el icono se queda pegado para siempre en los
// teléfonos que vienen del ciclo viejo.
const ETIQUETA_NOTIF = 'actualizacion-app'

function borrarAvisoDelIcono() {
  if (!registroSW?.getNotifications) return
  registroSW
    .getNotifications({ tag: ETIQUETA_NOTIF })
    .then((lista) => lista.forEach((n) => n.close()))
    .catch(() => {})
}

// sessionStorage puede no existir (Safari en privado); sin él solo se pierden el
// aviso de "listo" y el freno de intentos, no el ciclo.
function leerSesion(clave) {
  try {
    return sessionStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribirSesion(clave, valor) {
  try {
    if (valor === null) sessionStorage.removeItem(clave)
    else sessionStorage.setItem(clave, valor)
  } catch {
    /* sin sessionStorage */
  }
}

const intentos = () => Number(leerSesion(CLAVE_INTENTOS) || 0)

/**
 * Aplica la versión que está esperando: relevo del service worker y recarga.
 *
 * Con `silencioso` no se muestra el cartel ni se espera a que se lea: es el
 * camino de la app en segundo plano, donde no hay nadie mirando la pantalla y
 * un cartel solo retrasaría el relevo.
 */
export function aplicarActualizacion({ silencioso = false } = {}) {
  if (estado === 'aplicando') return
  if (!silencioso) emitir('aplicando')
  escribirSesion(CLAVE_APLICANDO, '1')
  escribirSesion(CLAVE_INTENTOS, String(intentos() + 1))
  marcarIcono(false)
  borrarAvisoDelIcono()
  setTimeout(() => {
    // `aplicarSW` pide el relevo; la recarga la dispara registerSW cuando el
    // service worker nuevo toma el control.
    Promise.resolve(aplicarSW?.(true)).catch(() => window.location.reload())
    setTimeout(() => window.location.reload(), MS_RESCATE)
  }, silencioso ? 0 : MS_CARTEL)
}

/**
 * Deja la versión aplicándose en cuanto la app quede en segundo plano.
 *
 * Es el reemplazo del aviso con botón "Actualizar". La recarga ocurre cuando el
 * viajero está en otra app o con la pantalla apagada, así que no le interrumpe
 * nada: al volver se encuentra la versión nueva ya andando. Si nunca la deja en
 * segundo plano, la aplica la próxima apertura, que es el camino de siempre.
 */
function aplicarAlQuedarOculta() {
  // El freno de intentos vale igual acá: si el relevo no prende, esto se
  // repetiría en cada cambio de pestaña.
  if (intentos() >= MAX_INTENTOS_AUTO) return
  const alOcultarse = () => {
    if (document.visibilityState !== 'hidden') return
    document.removeEventListener('visibilitychange', alOcultarse)
    aplicarActualizacion({ silencioso: true })
  }
  if (document.visibilityState === 'hidden') alOcultarse()
  else document.addEventListener('visibilitychange', alOcultarse)
}

/**
 * Chequeo manual (menú de la app). Devuelve true si quedó una versión nueva
 * bajando o esperando; el cartel/aviso lo dispara `onNeedRefresh`.
 */
export async function buscarActualizacion() {
  if (estado === 'lista') return true
  if (!registroSW) return false
  ultimoChequeo = Date.now()
  try {
    await registroSW.update()
  } catch {
    return false // sin señal: se reintenta solo al volver la conexión
  }
  return Boolean(registroSW.waiting || registroSW.installing) || estado === 'lista'
}

function programarChequeos(registro) {
  const revisar = () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return
    if (Date.now() - ultimoChequeo < MS_MINIMO_ENTRE_CHEQUEOS) return
    ultimoChequeo = Date.now()
    registro.update().catch(() => {})
  }
  setInterval(revisar, MS_ENTRE_CHEQUEOS)
  document.addEventListener('visibilitychange', revisar)
  window.addEventListener('online', revisar)
}

/** Registra el service worker y arranca el ciclo. Se llama una vez, en main.jsx. */
export function iniciarActualizaciones() {
  if (iniciado) return
  iniciado = true
  // El indicador del icono ya cumplió su función al traer al usuario hasta acá.
  marcarIcono(false)

  aplicarSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Ya se está aplicando una: lo que viene es la recarga, y bajar el cartel
      // para poner un aviso dejaría la app a medio relevo. Cualquier versión
      // posterior se detecta sola al volver a abrir.
      if (estado === 'aplicando') return
      // Recién abierta: se aplica sola con el cartel, sin pasar por el icono
      // (marcarlo para borrarlo en el mismo instante no le sirve a nadie). Si ya
      // se intentó y no prendió, se deja de insistir sola y se ofrece el botón.
      if (Date.now() - abiertaEn < MS_VENTANA_APERTURA && intentos() < MAX_INTENTOS_AUTO) {
        aplicarActualizacion()
        return
      }
      // Llegó con la app en uso. No se avisa ni se interrumpe: queda anotada
      // (el menú la muestra, para quien quiera forzarla) y se aplica sola en
      // cuanto la app pase a segundo plano.
      emitir('lista')
      aplicarAlQuedarOculta()
    },
    onRegisteredSW(_url, registro) {
      if (!registro) return
      registroSW = registro
      // Limpia lo que haya dejado el ciclo viejo (notificación de "versión
      // nueva" que ya no se emite), ahora que hay registro para consultarla.
      borrarAvisoDelIcono()
      programarChequeos(registro)
    },
  })

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (ev) => {
      // Toque en la notificación con la app ya abierta: push-listener.js la trae
      // al frente y manda este recado para que se aplique sola, sin otro toque.
      if (ev.data?.tipo === 'aplicar-actualizacion' && estado === 'lista') {
        aplicarActualizacion()
        return
      }
      // Push del hook de despliegue con la app abierta: el push solo avisa que
      // se publicó algo, la versión hay que ir a buscarla igual.
      if (ev.data?.tipo === 'nueva-version') {
        ultimoChequeo = 0 // este aviso manda por sobre el piso entre chequeos
        buscarActualizacion()
      }
    })
  }

  // Si la app lleva un rato andando sin nada esperando, el ciclo cerró bien: se
  // olvidan los intentos para no arrastrarle el freno a la próxima versión.
  setTimeout(() => {
    if (estado === 'idle') escribirSesion(CLAVE_INTENTOS, null)
  }, MS_VENTANA_APERTURA + 3000)
}

/** true una sola vez, en la carga que viene después de aplicar la actualización. */
export function seRecienActualizo() {
  if (leerSesion(CLAVE_APLICANDO) !== '1') return false
  escribirSesion(CLAVE_APLICANDO, null)
  return true
}

/** Estado del ciclo para la UI, más las dos acciones que necesita. */
export function useActualizacion() {
  const [actual, setActual] = useState(estado)
  useEffect(() => {
    oyentes.add(setActual)
    setActual(estado) // por si cambió entre el primer render y este efecto
    return () => oyentes.delete(setActual)
  }, [])
  return { estadoAct: actual, aplicar: aplicarActualizacion, buscar: buscarActualizacion }
}
