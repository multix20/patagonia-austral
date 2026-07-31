// Ciclo de actualización de la PWA — visible, no silencioso.
//
// Antes el service worker se registraba con `autoUpdate`: la versión nueva
// entraba sola y la página se recargaba sin avisar. Al viajero se le reiniciaba
// la app "porque sí" (y en la ruta, con el mapa abierto, eso asusta). Ahora el
// ciclo es explícito:
//
//   1. Se busca versión nueva al abrir, al volver a primer plano y cada hora
//      mientras la app esté abierta con señal.
//   2. Cuando hay una esperando se marca el icono de la app instalada con un
//      punto (Badging API): ese es el indicador que se ve en el escritorio o en
//      la pantalla de inicio, incluso con la app cerrada.
//   3. Al abrir la app con una versión esperando, se aplica sola mostrando
//      "Actualizando la app…" — se entiende qué está pasando y por qué se
//      reinicia.
//   4. Si la versión llega con la app ya en uso NO se interrumpe: aparece un
//      aviso con el botón "Actualizar"; si no lo tocan, la aplica la próxima
//      apertura.
//
// La recarga la dispara `registerSW` (de vite-plugin-pwa) cuando el service
// worker nuevo toma el control; aquí solo se le pide el relevo y se muestra el
// cartel mientras tanto.
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

// Notificación silenciosa: es el ÚNICO indicador que Android pone en el icono
// del lanzador (el puntito sale de tener una notificación activa, no de la
// Badging API). Se emite una sola —misma `tag`— y se cierra al actualizar, para
// que el punto no quede pegado. Sin sonido ni vibración: no es una urgencia de
// la ruta, es un recado.
const ETIQUETA_NOTIF = 'actualizacion-app'

// Los textos viven aquí y no en i18n.jsx porque este módulo corre fuera de
// React (no hay contexto del que leer el idioma); el idioma elegido sí está en
// localStorage, que es donde lo deja el I18nProvider.
const TEXTOS_NOTIF = {
  es: {
    titulo: 'Nueva versión lista',
    cuerpo: 'Abre Patagonia Austral para actualizarla. Demora un segundo.',
  },
  en: {
    titulo: 'New version ready',
    cuerpo: 'Open Patagonia Austral to update it. It takes a second.',
  },
}

function idioma() {
  try {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

// Nunca pide permiso: si el viajero no lo dio (o lo negó), se queda sin este
// indicador y punto. El permiso se pide una sola vez, al instalar la app.
function avisarEnElIcono() {
  if (!registroSW) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const txt = TEXTOS_NOTIF[idioma()]
  registroSW
    .showNotification(txt.titulo, {
      body: txt.cuerpo,
      tag: ETIQUETA_NOTIF,
      silent: true,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: idioma(),
      // Lo lee el `notificationclick` de push-listener.js para aplicar la
      // versión al toque, en vez de solo traer la app al frente.
      data: { tipo: 'actualizacion' },
    })
    .catch(() => {})
}

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

/** Aplica la versión que está esperando: cartel, relevo del SW y recarga. */
export function aplicarActualizacion() {
  if (estado === 'aplicando') return
  emitir('aplicando')
  escribirSesion(CLAVE_APLICANDO, '1')
  escribirSesion(CLAVE_INTENTOS, String(intentos() + 1))
  marcarIcono(false)
  borrarAvisoDelIcono()
  setTimeout(() => {
    // `aplicarSW` pide el relevo; la recarga la dispara registerSW cuando el
    // service worker nuevo toma el control.
    Promise.resolve(aplicarSW?.(true)).catch(() => window.location.reload())
    setTimeout(() => window.location.reload(), MS_RESCATE)
  }, MS_CARTEL)
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
      marcarIcono(true)
      avisarEnElIcono()
      emitir('lista')
    },
    onRegisteredSW(_url, registro) {
      if (!registro) return
      registroSW = registro
      // El registro puede llegar DESPUÉS del primer `onNeedRefresh` (el aviso
      // de una versión que ya estaba esperando sale de la propia inscripción),
      // así que la notificación se resuelve también acá: si quedó algo
      // esperando se emite ahora, y si no, se limpia la del ciclo anterior.
      if (estado === 'lista') avisarEnElIcono()
      else borrarAvisoDelIcono()
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
