import { useEffect, useMemo, useRef, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import {
  CATEGORIAS,
  LOCALIDADES_DESTACADAS,
  LOCALIDADES_ROTULADAS,
  LOCALIDADES_MENORES,
  ETIQUETAS_LOCALIDAD,
} from './data/places'
import { REPORTES, ESTILO_REPORTE } from './data/reportes'
import {
  obtenerLugares,
  obtenerAvisos,
  obtenerLocalidades,
  obtenerReportes,
  enviarReporte,
  sincronizarCola,
  contarCola,
  votarReporte,
} from './api/client'
import { activarPush, pushSoportado } from './push'
import { useActualizacion, seRecienActualizo } from './actualizacion'
import Icon from './components/Icon'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import QuickCard from './components/QuickCard'
import ChatBot from './components/ChatBot'

// Cuánto se calla el banner de instalar cuando la persona toca "Entendido" en el
// camino manual (el que solo explica el gesto, sin botón que instale). Un mes
// cubre de sobra un viaje por la ruta: si para entonces sigue sin instalarla, se
// le vuelve a ofrecer. Ver `instalar()`.
const DIAS_SILENCIO_INSTALAR = 30
const CLAVE_SILENCIO_INSTALAR = 'instalarManualEntendido'

// Etiquetas de tipo de aviso (coinciden con el CMS Filament)
const TIPOS_AVISO = {
  info: { es: 'Información', en: 'Info' },
  clima: { es: 'Clima', en: 'Weather' },
  seguridad: { es: 'Seguridad', en: 'Safety' },
  evento: { es: 'Evento', en: 'Event' },
}

// Etiqueta corta de categoría para la barra flotante (clave de i18n).
const CAT_LABEL = {
  alojamiento: 'catDormir',
  comida: 'catComer',
  atractivo: 'catVisitar',
  servicio: 'catServicios',
  evento: 'catEventos',
  emergencia: 'catEmergencia',
}

// Macrozona por `orden` norte→sur (para el buscador y para el filtro de tramo de
// los reportes). Norte (Los Lagos) hasta Palena; Centro (Aysén norte) hasta
// Balmaceda; Sur (Aysén sur) el resto.
const macrozonaDe = (orden = 0) => (orden < 65 ? 'norte' : orden < 128 ? 'centro' : 'sur')

// Los tramos del filtro de reportes, en el orden en que se recorre la ruta.
const TRAMOS = [
  ['norte', 'zonaNorte'],
  ['centro', 'zonaCentro'],
  ['sur', 'zonaSur'],
]

// Distancia aproximada en km (haversine). Se usa para darle un tramo a un reporte
// que quedó SIN localidad: la API solo se la atribuye si hay un pueblo a menos de
// 60 km, y en la Austral el reporte más valioso —el del camino entre pueblos— es
// justo el que cae fuera de ese radio. Sin esto, filtrar por tramo lo escondería.
function kmEntre(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)))
}

// Los tipos de reporte del crowdsourcing viven en data/reportes.js (los comparten
// la hoja de reportar, el mapa y la API).

// Normaliza a minúsculas sin acentos (rango de diacríticos combinantes U+0300–U+036F).
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function AppInterna() {
  const { t, lang, setLang } = useI18n()
  const [lugares, setLugares] = useState([])
  const [localidades, setLocalidades] = useState([])
  const [avisos, setAvisos] = useState([])

  // Navegación map-first: 'ruta' (toda la Carretera) ↔ 'localidad' (un pueblo).
  const [vista, setVista] = useState('ruta')
  const [localidad, setLocalidad] = useState(null) // slug o null en 'ruta'
  const [filtro, setFiltro] = useState(null) // categoría o null (sin filtro)

  // Crowdsourcing (Fase 3): reportes vigentes, el que el usuario tiene abierto,
  // el texto del comentario opcional y cuántos quedaron en cola sin señal.
  const [reportes, setReportes] = useState([])
  const [reporteSel, setReporteSel] = useState(null)
  const [comentario, setComentario] = useState('')
  const [enCola, setEnCola] = useState(0)
  // Tramo elegido para ver reportes en la vista de ruta completa (null = todos).
  // Dentro de un pueblo no se usa: ahí manda la localidad abierta.
  const [tramo, setTramo] = useState(null)

  const [lugarRapido, setLugarRapido] = useState(null) // ficha rápida (pin)
  const [fichaLugar, setFichaLugar] = useState(null) // ficha completa (PlaceDetail)
  const [hoja, setHoja] = useState(null) // 'buscar' | 'menu' | 'reportar' | null
  const [zona, setZona] = useState(null) // filtro de macrozona en el buscador
  const [busqueda, setBusqueda] = useState('')
  const [chatAbierto, setChatAbierto] = useState(false)
  const [panelAvisos, setPanelAvisos] = useState(false)

  const [posMapa, setPosMapa] = useState(null)
  // Estado del GPS que reporta MapView ('buscando' | 'ok' | 'sin'): alimenta el
  // feedback del botón "ubicarme" del rail.
  const [estadoGeo, setEstadoGeo] = useState('buscando')
  const [toast, setToast] = useState(null)
  const mapaRef = useRef(null)

  const [sinRed, setSinRed] = useState(!navigator.onLine)
  const offline = sinRed

  // Actualización de la app: 'lista' (versión esperando, se aplicará sola en
  // cuanto la app pase a segundo plano) y 'aplicando' (cartel mientras se
  // reinicia, solo en el camino de "recién abierta"). 'lista' ya no pinta nada
  // al viajero: se usa nada más para el texto del menú.
  const {
    estadoAct,
    aplicar: aplicarActualizacion,
    buscar: buscarActualizacion,
  } = useActualizacion()

  // Avisos vistos (contador de la campanita), persistido en el dispositivo.
  const [avisosVistos, setAvisosVistos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('avisosVistos') || '[]')
    } catch {
      return []
    }
  })

  // ----- Web Push + instalación (idéntico al flujo previo) -----
  const [pushEstado, setPushEstado] = useState('idle')
  const [instaladaStandalone] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  )
  const [tarjetaPushCerrada, setTarjetaPushCerrada] = useState(
    () => localStorage.getItem('tarjetaPushCerrada') === '1'
  )
  // Arranca con el evento que index.html ya pudo haber atrapado antes de que
  // React montara (ver el <script> del <head>): si se espera al useEffect, en
  // visita repetida el evento ya paso y el banner no sale nunca.
  const [promptInstalar, setPromptInstalar] = useState(() => window.__instalarPrompt || null)
  // Instalada pero abierta en una pestaña del navegador (no en standalone). Se
  // consulta al navegador, que es el unico que lo sabe. Solo existe en Chrome
  // Android/Windows; donde no, queda en false y manda la logica de siempre.
  const [instaladaSegunNavegador, setInstaladaSegunNavegador] = useState(false)
  // La cruz cierra el banner SOLO por esta vez: no se guarda nada, así que a la
  // próxima apertura vuelve a ofrecerse. Antes se persistía en localStorage y
  // una sola cruz lo silenciaba para siempre — quien lo cerraba sin pensar
  // mirando el mapa en Puerto Montt no volvía a ver la invitación en todo el
  // viaje, justo cuando más le convenía tenerla instalada. Mientras no la
  // instale se le sigue preguntando; instalada, el banner no aparece más
  // (`instaladaStandalone` / `instaladaSegunNavegador`), que es el único
  // silencio que corresponde.
  const [bannerCerrado, setBannerCerrado] = useState(false)
  // Excepción a lo anterior: el "Entendido" del camino manual SÍ se guarda. En
  // esa rama no hay prompt vivo, y sin prompt no tenemos forma de saber si la
  // app ya está instalada — `getInstalledRelatedApps` solo existe en Chrome. Así
  // que quien ya la instaló y entra por un enlace (WhatsApp, el QR) ve el banner
  // igual, y las instrucciones no lo llevan a ninguna parte: en su menú ya no
  // dice "Instalar aplicación" sino "Abrir en Patagonia Austral". Insistirle en
  // cada apertura es ruido puro. Con prompt vivo no se guarda nada: ahí el
  // navegador nos confirma que NO está instalada y se sigue ofreciendo siempre.
  const [instalarSilenciado, setInstalarSilenciado] = useState(() => {
    try {
      const desde = Number(localStorage.getItem(CLAVE_SILENCIO_INSTALAR) || 0)
      return desde > 0 && Date.now() - desde < DIAS_SILENCIO_INSTALAR * 86400000
    } catch {
      return false /* modo privado sin localStorage */
    }
  })
  // iOS no dispara `beforeinstallprompt` (no hay instalación programática), así
  // que allí el banner no puede depender de tener un prompt vivo.
  const esIOS = useMemo(
    () =>
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    []
  )
  // El camino manual ("abre el menú del navegador…") es el ÚLTIMO recurso, y
  // hasta acá se mostraba de entrada. Probado en un Android: al abrir la app el
  // banner traía las instrucciones a mano y, al aceptar el permiso de ubicación,
  // se transformaba solo en el botón "Instalar". O sea el navegador sí iba a
  // ofrecer la instalación de un toque, pero manda `beforeinstallprompt` cuando
  // considera que hubo interacción con el sitio — nunca en el primer render, que
  // es justo cuando nosotros elegíamos el texto. Resultado: a todo Android le
  // mostrábamos primero la instrucción equivocada, la más confusa de las dos.
  //
  // Ahora se le da al navegador la oportunidad de hablar antes: mientras
  // podamos estar esperando el evento, el banner no aparece. Se revela 3s
  // después de la primera interacción (que es lo que destraba el evento) o a los
  // 30s si la persona nunca toca la pantalla, para no perder la invitación. Si
  // el evento llega en cualquier momento, el banner sale con el botón — eso ya
  // funcionaba y no cambia.
  const [manualRevelado, setManualRevelado] = useState(false)

  useEffect(() => {
    // En iOS no hay evento que esperar: la instalación programática no existe,
    // así que el gesto a mano es la única verdad y se muestra de inmediato.
    if (esIOS) {
      setManualRevelado(true)
      return
    }
    let graciaTrasToque
    const alInteractuar = () => {
      graciaTrasToque = setTimeout(() => setManualRevelado(true), 3000)
    }
    // En captura y en `window`: el toque casi siempre cae sobre el mapa, que
    // maneja sus propios eventos.
    const opciones = { once: true, capture: true }
    window.addEventListener('pointerdown', alInteractuar, opciones)
    const tope = setTimeout(() => setManualRevelado(true), 30000)
    return () => {
      window.removeEventListener('pointerdown', alInteractuar, opciones)
      clearTimeout(graciaTrasToque)
      clearTimeout(tope)
    }
  }, [esIOS])

  useEffect(() => {
    obtenerLugares().then(setLugares)
    obtenerAvisos().then(setAvisos)
    obtenerLocalidades().then(setLocalidades)
    obtenerReportes().then(setReportes)
    contarCola().then(setEnCola)
  }, [])

  // Recarga de avisos al recibir un push (postMessage del service worker).
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const alMensaje = (event) => {
      if (event.data?.tipo === 'nuevo-aviso') obtenerAvisos().then(setAvisos)
    }
    navigator.serviceWorker.addEventListener('message', alMensaje)
    return () => navigator.serviceWorker.removeEventListener('message', alMensaje)
  }, [])

  // Al volver a primer plano, refrescar avisos (móvil congela en segundo plano).
  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === 'visible') obtenerAvisos().then(setAvisos)
    }
    document.addEventListener('visibilitychange', refrescar)
    window.addEventListener('focus', refrescar)
    return () => {
      document.removeEventListener('visibilitychange', refrescar)
      window.removeEventListener('focus', refrescar)
    }
  }, [])

  useEffect(() => {
    const on = () => setSinRed(false)
    const off = () => setSinRed(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Buzón de salida del crowdsourcing: al recuperar señal se envían los reportes
  // que el viajero hizo sin cobertura (el caso normal en la Carretera Austral).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vaciarCola = async () => {
    const enviados = await sincronizarCola()
    setEnCola(await contarCola())
    if (enviados > 0) {
      setReportes(await obtenerReportes())
      mostrarToast(t('colaEnviada'))
    }
  }

  useEffect(() => {
    vaciarCola()
    window.addEventListener('online', vaciarCola)
    return () => window.removeEventListener('online', vaciarCola)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const h = (e) => {
      e.preventDefault()
      setPromptInstalar(e)
    }
    // Si el evento llega mientras la app monta, index.html lo guarda y avisa.
    const recoger = () => setPromptInstalar(window.__instalarPrompt || null)
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('instalar-prompt-listo', recoger)
    return () => {
      window.removeEventListener('beforeinstallprompt', h)
      window.removeEventListener('instalar-prompt-listo', recoger)
    }
  }, [])

  // ¿La tiene instalada aunque la esté viendo en el navegador? Sin esto no hay
  // forma de distinguir "no la ha instalado" de "la instaló y entró por el
  // navegador": en los dos casos la app se ve igual. Saberlo evita ofrecerle
  // instalar algo que ya tiene, que es justo lo que confunde.
  useEffect(() => {
    if (!navigator.getInstalledRelatedApps) return
    navigator
      .getInstalledRelatedApps()
      .then((apps) => setInstaladaSegunNavegador(apps.length > 0))
      .catch(() => {})
  }, [])

  // Cada toast reinicia su propio temporizador: sin esto, el timer del toast
  // anterior borraba el nuevo antes de los 3 s (se nota al encadenar acciones,
  // p. ej. reportar y votar seguido).
  const timerToast = useRef(null)
  const mostrarToast = (msg) => {
    setToast(msg)
    if (timerToast.current) clearTimeout(timerToast.current)
    timerToast.current = setTimeout(() => setToast(null), 3000)
  }

  // Al volver de la recarga, confirmar que la actualización entró (si no se
  // dice, el reinicio de la app queda como un parpadeo sin explicación).
  useEffect(() => {
    if (seRecienActualizo()) mostrarToast(t('updListo'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Menú: aplica la versión que espera, o busca una si no hay ninguna. */
  const revisarActualizaciones = async () => {
    // Se cierra el menú siempre: la respuesta (toast o aviso de versión nueva)
    // vive fuera de la hoja, y con la hoja abierta el aviso queda tras el velo.
    setHoja(null)
    if (estadoAct === 'lista') {
      aplicarActualizacion()
      return
    }
    mostrarToast(t('updBuscando'))
    const hay = await buscarActualizacion()
    if (!hay) mostrarToast(t('updAlDia'))
  }

  const habilitarPush = async () => {
    try {
      setPushEstado('activando')
      await activarPush()
      setPushEstado('activado')
      mostrarToast(
        lang === 'es'
          ? 'Notificaciones activadas. Recibirás los avisos municipales.'
          : 'Notifications enabled. You will receive municipal alerts.'
      )
    } catch (e) {
      setPushEstado('error')
      const motivo = e?.message || 'desconocido'
      mostrarToast(
        lang === 'es'
          ? `No se pudieron activar las notificaciones (${motivo}).`
          : `Could not enable notifications (${motivo}).`
      )
    }
  }

  // Al instalar la PWA, pedir permiso de notificaciones una vez (sin botón).
  useEffect(() => {
    const alInstalar = () => {
      if (pushEstado === 'idle' && pushSoportado() && Notification.permission === 'default') {
        habilitarPush()
      }
    }
    window.addEventListener('appinstalled', alInstalar)
    return () => window.removeEventListener('appinstalled', alInstalar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Red de seguridad: app instalada + permiso concedido → asegurar suscripción.
  useEffect(() => {
    if (instaladaStandalone && pushSoportado() && Notification.permission === 'granted') {
      activarPush()
        .then(() => setPushEstado('activado'))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrarBannerInstalar = () => setBannerCerrado(true)

  // Limpia la marca que dejó la regla anterior. Sin esto no pasaría nada malo
  // (ya nadie la lee), pero quedaría para siempre en el teléfono de quien
  // alguna vez cerró el banner, confundiendo cualquier revisión futura.
  useEffect(() => {
    try {
      localStorage.removeItem('bannerInstalarCerrado.v2')
    } catch {
      /* modo privado sin localStorage */
    }
  }, [])

  const instalar = async () => {
    if (promptInstalar) {
      promptInstalar.prompt()
      await promptInstalar.userChoice
      // No se persiste el cierre: si instala, el navegador deja de disparar
      // `beforeinstallprompt` y el banner se oculta solo; si más tarde
      // desinstala, vuelve a dispararse y el banner reaparece, que es
      // justamente lo que antes no pasaba.
      setPromptInstalar(null)
      window.__instalarPrompt = null
      return
    }
    // Sin prompt (iOS, Firefox, Samsung Internet, o la app ya instalada): no hay
    // instalación que esperar ni evento que nos avise después. El "Entendido" es
    // la única señal que vamos a recibir, así que se guarda y el banner se calla
    // un mes.
    try {
      localStorage.setItem(CLAVE_SILENCIO_INSTALAR, String(Date.now()))
    } catch {
      /* modo privado sin localStorage: vale por esta sesión */
    }
    setInstalarSilenciado(true)
    cerrarBannerInstalar()
  }

  const cerrarTarjetaPush = () => {
    setTarjetaPushCerrada(true)
    localStorage.setItem('tarjetaPushCerrada', '1')
  }
  const activarPushDesdeTarjeta = async () => {
    await habilitarPush()
    cerrarTarjetaPush()
  }
  const mostrarTarjetaPush =
    instaladaStandalone &&
    !tarjetaPushCerrada &&
    pushEstado !== 'activado' &&
    pushSoportado() &&
    Notification.permission === 'default'

  // ----- Derivados -----
  const locActiva = localidades.find((l) => l.slug === localidad) || null

  // Lugares del pueblo elegido, destacados primero (capa comercial Fase 3).
  const lugaresLocalidad = lugares
    .filter((l) => (l.localidad || 'cochrane') === localidad)
    .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))

  // Localidades ancla que se resaltan en la vista ruta (mapa y buscador): set
  // curado de puertas de entrada de la Carretera Austral (ver LOCALIDADES_DESTACADAS),
  // no las que tengan una ficha comercial destacada. Se filtra contra las localidades
  // realmente cargadas para no resaltar un slug ausente.
  const destacadosSlugs = LOCALIDADES_DESTACADAS.filter((slug) =>
    localidades.some((l) => l.slug === slug)
  )

  // Localidades con etiqueta fija (segundo nivel: nombre visible siempre, sin el
  // resalte coral). No repite las que ya son ancla.
  const rotuladasSlugs = LOCALIDADES_ROTULADAS.filter(
    (slug) => !destacadosSlugs.includes(slug) && localidades.some((l) => l.slug === slug)
  )

  // Localidades menores (tercer nivel: punto chico y apagado, poca notoriedad).
  const menoresSlugs = LOCALIDADES_MENORES.filter((slug) =>
    localidades.some((l) => l.slug === slug)
  )

  /**
   * Tramo (norte/centro/sur) al que pertenece un reporte. Primero por la
   * localidad que le puso la API; si no tiene (cayó a más de 60 km de todo
   * pueblo), por el pueblo más cercano calculado acá. Así ningún reporte
   * desaparece del mapa solo por estar en medio de la nada.
   */
  const tramoDeReporte = useMemo(() => {
    const porSlug = new Map(localidades.map((l) => [l.slug, l]))
    return (r) => {
      let loc = r.localidad ? porSlug.get(r.localidad) : null
      if (!loc) {
        let mejorKm = Infinity
        localidades.forEach((l) => {
          const km = kmEntre(r.lat, r.lng, l.lat, l.lng)
          if (km < mejorKm) {
            mejorKm = km
            loc = l
          }
        })
      }
      return loc ? macrozonaDe(loc.orden) : null
    }
  }, [localidades])

  // Cuántos reportes vigentes hay por tramo (el número que llevan los chips):
  // muestra dónde está pasando algo sin tener que probar tramo por tramo.
  const conteoTramos = useMemo(() => {
    const c = { norte: 0, centro: 0, sur: 0 }
    reportes.forEach((r) => {
      const tr = tramoDeReporte(r)
      if (tr) c[tr] += 1
    })
    return c
  }, [reportes, tramoDeReporte])

  /**
   * Reportes que se dibujan en el mapa. Se filtran como los lugares, con la
   * regla propia de cada vista:
   *  - dentro de un pueblo, solo lo que está pasando en ese pueblo;
   *  - en la ruta completa, el tramo elegido (o todos, que es lo por defecto).
   * Todo en el cliente sobre lo que ya está en IndexedDB: el filtro anda igual
   * sin señal, que es cuando el viajero decide dónde parar.
   *
   * Asimetría a propósito entre las dos vistas: dentro de un pueblo, un reporte
   * SIN localidad no se muestra (aunque el filtro por tramo sí lo rescate por
   * cercanía). No es un olvido — la API solo deja `localidad` en null cuando el
   * punto está a más de 60 km de TODO pueblo, y la vista de localidad vuela al
   * pueblo: ese reporte quedaría fuera de pantalla igual. Mostrarlo solo
   * ensuciaría el conteo del pueblo con algo que pasa a una hora de camino.
   */
  const reportesVisibles = useMemo(() => {
    if (vista === 'localidad') return reportes.filter((r) => r.localidad === localidad)
    if (!tramo) return reportes
    return reportes.filter((r) => tramoDeReporte(r) === tramo)
  }, [reportes, vista, localidad, tramo, tramoDeReporte])

  const noLeidos = avisos.filter((a) => !avisosVistos.includes(a.id)).length

  // ----- Acciones de navegación -----
  const entrarLocalidad = (slug) => {
    setLocalidad(slug)
    setVista('localidad')
    setFiltro(null)
    setLugarRapido(null)
    setHoja(null)
  }
  const volverRuta = () => {
    setVista('ruta')
    setLocalidad(null)
    setFiltro(null)
    setLugarRapido(null)
  }

  const toggleCat = (clave) => {
    if (vista === 'ruta') {
      mostrarToast(t('eligeLocalidad'))
      return
    }
    setFiltro((f) => (f === clave ? null : clave))
    setLugarRapido(null)
  }

  const abrirPanelAvisos = () => {
    setPanelAvisos(true)
    setHoja(null)
    const ids = avisos.map((a) => a.id)
    setAvisosVistos(ids)
    localStorage.setItem('avisosVistos', JSON.stringify(ids))
  }

  /**
   * Centra el mapa en el viajero. Si todavía no hay fix del GPS el botón NO se
   * deshabilita: en el celular un botón gris y mudo no explica nada (el `title`
   * no existe al tocar), así que se deja tocable y responde con un toast que
   * dice si está buscando o si no hay permiso/soporte.
   */
  const centrarEnMi = () => {
    if (posMapa && mapaRef.current?.centrarEnMi) {
      mapaRef.current.centrarEnMi()
      mostrarToast(t('centrando'))
      return
    }
    mostrarToast(estadoGeo === 'buscando' ? t('buscandoUbicacion') : t('sinUbicacion'))
  }

  /**
   * Envía un reporte de ruta. La posición sale del GPS del viajero; si no lo
   * tiene concedido pero está dentro de una localidad, se usa el centro de ese
   * pueblo (mejor un reporte ubicado al pueblo que ningún reporte). Sin ninguna
   * de las dos referencias no se envía: un reporte sin lugar no sirve a nadie.
   */
  const reportar = async (tipo, k) => {
    const punto = posMapa || (locActiva ? [locActiva.lat, locActiva.lng] : null)
    if (!punto) {
      mostrarToast(t('reporteSinUbicacion'))
      return
    }
    const texto = comentario.trim()
    if (tipo === 'comentario' && !texto) {
      mostrarToast(t('reporteFaltaTexto'))
      return
    }

    setHoja(null)
    setComentario('')
    const r = await enviarReporte({
      tipo,
      lat: punto[0],
      lng: punto[1],
      comentario: texto || null,
    })

    if (r.enviado) {
      // Optimista: el reporte que devolvió la API entra al mapa al instante.
      setReportes((prev) => [r.reporte, ...prev.filter((x) => x.id !== r.reporte.id)])
      // Y se sueltan los chips de tramo: con un filtro puesto, el reporte recién
      // hecho podía caer fuera y el viajero veía "enviado" sin ver su pin.
      setTramo(null)
      mostrarToast(`${t(k)} · ${t('reporteEnviado')}`)
    } else if (r.encolado) {
      setEnCola(await contarCola())
      mostrarToast(t('reporteEncolado'))
    } else {
      mostrarToast(t('reporteFalla'))
    }
  }

  /** Voto "¿sigue ahí?" / "ya no está" sobre el reporte abierto. */
  const votar = async (confirma) => {
    const actual = reporteSel
    setReporteSel(null)
    const actualizado = await votarReporte(actual.id, confirma)
    mostrarToast(actualizado ? t('graciasVoto') : t('reporteFalla'))
    if (actualizado) setReportes(await obtenerReportes())
  }

  /** Antigüedad del reporte en texto corto ("recién", "hace 20 min", "hace 3 h"). */
  const antiguedad = (iso) => {
    if (!iso) return ''
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (min < 2) return t('reporteRecien')
    if (min < 60) return t('reporteHaceMin').replace('{n}', min)
    return t('reporteHaceH').replace('{n}', Math.floor(min / 60))
  }

  const fmtFechaAviso = (iso) =>
    new Date(iso).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  const tipoAvisoLabel = (tp) => TIPOS_AVISO[tp]?.[lang] ?? tp

  // Localidades para el buscador, agrupadas por macrozona.
  const gruposBuscador = () => {
    const g = { norte: [], centro: [], sur: [] }
    localidades.forEach((l) => {
      const mz = macrozonaDe(l.orden)
      if (zona && mz !== zona) return
      if (busqueda && !norm(l.nombre[lang]).includes(norm(busqueda))) return
      g[mz].push(l)
    })
    return g
  }

  return (
    <div className={`app mapa-app ${offline ? 'offline' : ''}`}>
      <MapView
        ref={mapaRef}
        vista={vista}
        localidades={localidades}
        lugares={lugaresLocalidad}
        destacados={destacadosSlugs}
        rotuladas={rotuladasSlugs}
        menores={menoresSlugs}
        etiquetas={ETIQUETAS_LOCALIDAD}
        filtro={filtro}
        localidadActiva={locActiva}
        reportes={reportesVisibles}
        onEntrarLocalidad={entrarLocalidad}
        onSeleccionarLugar={setLugarRapido}
        onSeleccionarReporte={setReporteSel}
        onPos={setPosMapa}
        onEstadoGeo={setEstadoGeo}
        lang={lang}
      />

      {/* Barra superior flotante */}
      <div className="topbar">
        <button
          className="fab-sq"
          onClick={() => setHoja('menu')}
          aria-label={lang === 'es' ? 'Menú' : 'Menu'}
        >
          <Icon nombre="menu" tam={22} color="var(--tinta)" />
          {/* El punto también marca la versión esperando: si cierran el aviso,
              el camino a "Actualizar" sigue señalizado desde el menú. */}
          {/* El punto ya no marca "hay actualización": esa entra sola y no
              necesita que nadie la atienda. Queda solo para avisos sin leer. */}
          {noLeidos > 0 && <span className="fab-dot" />}
        </button>

        <button
          className="loc-pill"
          onClick={() => (vista === 'localidad' ? volverRuta() : setHoja('buscar'))}
        >
          <span
            className="zn"
            style={{ background: vista === 'localidad' ? 'var(--claude)' : 'var(--verde)' }}
          >
            <Icon nombre={vista === 'localidad' ? 'arrow-left' : 'route'} tam={15} color="#fff" />
          </span>
          <span className="tx">
            <b>{vista === 'localidad' && locActiva ? locActiva.nombre[lang] : t('titulo')}</b>
            <small>{vista === 'localidad' ? t('volverRuta') : t('rutaSub')}</small>
          </span>
        </button>

        <button
          className="fab-sq"
          onClick={() => setHoja('buscar')}
          aria-label={lang === 'es' ? 'Buscar' : 'Search'}
        >
          <Icon nombre="search" tam={22} color="var(--tinta)" />
        </button>
      </div>

      {offline && (
        <div className="offline-chip">
          <Icon nombre="wifi-off" tam={13} /> {t('sinConexion')}
        </div>
      )}

      {/* Filtro de reportes por tramo (crowdsourcing, Fase 3). Solo en la vista
          de ruta completa: dentro de un pueblo los reportes ya vienen filtrados
          a ese pueblo. Aparece únicamente si hay algo que filtrar, para no
          sumarle un control al mapa cuando no hay reportes. */}
      {vista === 'ruta' && reportes.length > 0 && (
        <div className="rep-tramos" role="group" aria-label={t('filtrarReportesTramo')}>
          {[{ id: null, lbl: t('tramoTodos'), n: reportes.length }].concat(
            TRAMOS.map(([id, lbl]) => ({ id, lbl: t(lbl), n: conteoTramos[id] }))
          ).map((c) => (
            <button
              key={c.id || 'todos'}
              type="button"
              className={`rt-chip ${tramo === c.id ? 'on' : ''}`}
              aria-pressed={tramo === c.id}
              onClick={() => setTramo(c.id)}
            >
              {c.lbl} <span className="rt-n">{c.n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rail derecho */}
      <div className="rail">
        <button
          className={`fab-round fab-geo geo-${estadoGeo}`}
          onClick={centrarEnMi}
          aria-busy={!posMapa && estadoGeo === 'buscando'}
          aria-label={
            posMapa
              ? lang === 'es'
                ? 'Mi ubicación'
                : 'My location'
              : estadoGeo === 'buscando'
                ? t('buscandoUbicacion')
                : t('sinUbicacion')
          }
        >
          {!posMapa && estadoGeo === 'buscando' ? (
            <span className="geo-spinner" aria-hidden="true" />
          ) : (
            <Icon nombre="locate" tam={22} color="var(--tinta)" />
          )}
        </button>
        <button
          className="fab-round fab-report"
          onClick={() => setHoja('reportar')}
          aria-label={lang === 'es' ? 'Reportar' : 'Report'}
        >
          <Icon nombre="plus" tam={26} color="#fff" />
        </button>
      </div>

      {/* Barra de categorías flotante */}
      <nav
        className="catbar"
        aria-label={lang === 'es' ? 'Filtrar por categoría' : 'Filter by category'}
      >
        {Object.entries(CATEGORIAS).map(([clave, c]) => (
          <button
            key={clave}
            className={`cat-btn ${filtro === clave ? 'on' : ''}`}
            style={{ '--cc': c.color }}
            onClick={() => toggleCat(clave)}
            // Barra solo de iconos: el nombre de la categoría deja de dibujarse
            // (mapa más limpio) pero sigue disponible para lectores de pantalla
            // y como tooltip al mantener el cursor.
            aria-label={t(CAT_LABEL[clave])}
            title={c.nombre[lang]}
          >
            <span className="cico">
              <Icon nombre={c.icono} tam={22} />
            </span>
          </button>
        ))}
      </nav>

      {/* Ficha rápida */}
      {lugarRapido && (
        <QuickCard
          lugar={lugarRapido}
          onCerrar={() => setLugarRapido(null)}
          onVerFicha={() => {
            setFichaLugar(lugarRapido)
            setLugarRapido(null)
          }}
          onToast={mostrarToast}
        />
      )}

      {toast && <div className="toast show">{toast}</div>}

      {/* Scrim + hojas inferiores */}
      <div className={`scrim ${hoja ? 'show' : ''}`} onClick={() => setHoja(null)} />

      {/* Hoja: buscador */}
      <div className={`sheet ${hoja === 'buscar' ? 'show' : ''}`}>
        <div className="grab" />
        <div className="sheet-head">
          <h2>{t('aDondeVas')}</h2>
          <button className="x-btn" onClick={() => setHoja(null)} aria-label="Cerrar">
            <Icon nombre="x" tam={15} />
          </button>
        </div>
        <div className="searchbox">
          <Icon nombre="search" tam={18} color="var(--gris)" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('buscarPh')}
          />
        </div>
        <div className="zonas">
          {[
            ['norte', 'zonaNorte', 'zonaNorteSub'],
            ['centro', 'zonaCentro', 'zonaCentroSub'],
            ['sur', 'zonaSur', 'zonaSurSub'],
          ].map(([k, lbl, sub]) => (
            <button
              key={k}
              className={`zona ${zona === k ? 'on' : ''}`}
              onClick={() => setZona((z) => (z === k ? null : k))}
            >
              <b>{t(lbl)}</b>
              <small>{t(sub)}</small>
            </button>
          ))}
        </div>
        <div className="sheet-body">
          {['norte', 'centro', 'sur'].map((zk) => {
            const items = gruposBuscador()[zk]
            if (!items.length) return null
            const label = { norte: t('zonaNorte'), centro: t('zonaCentro'), sur: t('zonaSur') }[zk]
            return (
              <div key={zk}>
                <div className="zgrp-t">
                  <Icon nombre="map-pin" tam={13} color="var(--verde)" /> {label}
                </div>
                {items.map((l) => (
                  <div key={l.slug} className="loc-row" onClick={() => entrarLocalidad(l.slug)}>
                    <span className="r-ico">
                      <Icon nombre="map-pin" tam={18} color="var(--verde)" />
                    </span>
                    <div className="r-tx">
                      <b>{l.nombre[lang]}</b>
                      <small>
                        {destacadosSlugs.includes(l.slug) ? t('destacado') + ' · ' : ''}
                        {macrozonaDe(l.orden) === 'norte'
                          ? t('zonaNorteSub')
                          : macrozonaDe(l.orden) === 'centro'
                            ? t('zonaCentroSub')
                            : t('zonaSurSub')}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
          <div className="sheet-foot">
            {localidades.length} {t('localidadesRuta')}
          </div>
        </div>
      </div>

      {/* Hoja: menú */}
      <div className={`sheet ${hoja === 'menu' ? 'show' : ''}`}>
        <div className="grab" />
        <div className="sheet-head">
          <h2>{t('titulo')}</h2>
          <button className="x-btn" onClick={() => setHoja(null)} aria-label="Cerrar">
            <Icon nombre="x" tam={15} />
          </button>
        </div>
        <div className="sheet-body">
          <div
            className="menu-row"
            onClick={() => {
              setHoja(null)
              volverRuta()
            }}
          >
            <span className="m-ico">
              <Icon nombre="route" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuVerRuta')}</b>
              <div className="m-sub">{t('menuVerRutaSub')}</div>
            </div>
          </div>
          <div
            className="menu-row"
            onClick={() => {
              setHoja(null)
              setChatAbierto(true)
            }}
          >
            <span className="m-ico">
              <Icon nombre="message-circle" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuAsistente')}</b>
              <div className="m-sub">{t('menuAsistenteSub')}</div>
            </div>
          </div>
          <div className="menu-row" onClick={abrirPanelAvisos}>
            <span className="m-ico">
              <Icon nombre="bell" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuAvisos')}</b>
              <div className="m-sub">{t('menuAvisosSub')}</div>
            </div>
            {noLeidos > 0 && <span className="menu-badge">{noLeidos}</span>}
          </div>
          <div className="menu-row">
            <span className="m-ico">
              <Icon nombre="wifi" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuOffline')}</b>
              <div className="m-sub">{t('menuOfflineSub')}</div>
            </div>
          </div>
          <div className="menu-row">
            <span className="m-ico">
              <Icon nombre="map-pin" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuAcerca')}</b>
              <div className="m-sub">{t('menuAcercaSub')}</div>
            </div>
          </div>
          <div className="menu-row" onClick={revisarActualizaciones}>
            <span className="m-ico">
              <Icon nombre="download" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('menuVersion')}</b>
              <div className="m-sub">
                {__VERSION_APP__} · {estadoAct === 'lista' ? t('updBoton') : t('menuVersionSub')}
              </div>
            </div>
            {estadoAct === 'lista' && <span className="menu-badge">1</span>}
          </div>
          <div className="menu-row">
            <span className="m-ico">
              <Icon nombre="globe" tam={20} color="var(--verde)" />
            </span>
            <div>
              <b>{t('idioma')}</b>
              <div className="m-sub">Español · English</div>
            </div>
            <button
              className="menu-lang"
              onClick={(e) => {
                e.stopPropagation()
                setLang(lang === 'es' ? 'en' : 'es')
              }}
            >
              <Icon nombre="globe" tam={12} /> {lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>

      {/* Hoja: reportar (crowdsourcing, Fase 3) */}
      <div className={`sheet ${hoja === 'reportar' ? 'show' : ''}`}>
        <div className="grab" />
        <div className="sheet-head">
          <h2>{t('queVesRuta')}</h2>
          <button className="x-btn" onClick={() => setHoja(null)} aria-label="Cerrar">
            <Icon nombre="x" tam={15} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="rep-note">
            <Icon nombre="clock" tam={15} color="var(--verde-osc)" />
            <span>{t('reportesNota')}</span>
          </div>
          {/* Detalle opcional: viaja con el tipo que se toque, y es obligatorio
              cuando el reporte ES el comentario. */}
          <textarea
            className="rep-texto"
            rows={2}
            maxLength={280}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={t('comentarioPh')}
          />
          <div className="rep-comment" onClick={() => reportar('comentario', 'dejarComentario')}>
            <span className="rc-ico">
              <Icon nombre="message-circle" tam={20} color="var(--claude)" />
            </span>
            <div>
              <b>{t('dejarComentario')}</b>
              <small>{t('comentarioSub')}</small>
            </div>
          </div>
          <div className="rep-grid">
            {REPORTES.map((r) => (
              <button key={r.k} className="rep-item" onClick={() => reportar(r.tipo, r.k)}>
                <span className="r-badge" style={{ background: r.c }}>
                  <Icon nombre={r.icon} tam={26} color="#fff" />
                </span>
                <span>{t(r.k)}</span>
              </button>
            ))}
          </div>
          <div className="rep-preview">
            {t('reportePreview')}
            {enCola > 0 && (
              <>
                {' · '}
                <b>
                  {enCola} {t('colaPendiente')}
                </b>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta de un reporte del mapa: qué es, hace cuánto y los dos botones
          que sostienen la calidad del dato (¿sigue ahí? / ya no está). */}
      {reporteSel && (
        <div className="rcard">
          <button
            className="rc-x"
            onClick={() => setReporteSel(null)}
            aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
          >
            <Icon nombre="x" tam={14} />
          </button>
          <div className="rc-top">
            <span
              className="rc-badge"
              style={{ background: ESTILO_REPORTE[reporteSel.tipo]?.c || 'var(--gris)' }}
            >
              <Icon
                nombre={ESTILO_REPORTE[reporteSel.tipo]?.icon || 'alert'}
                tam={22}
                color="#fff"
              />
            </span>
            <div className="rc-tx">
              <b>{t(ESTILO_REPORTE[reporteSel.tipo]?.k || 'reporteDeViajero')}</b>
              <small>
                {antiguedad(reporteSel.creado_en)}
                {reporteSel.confirmaciones > 0 &&
                  ` · ${reporteSel.confirmaciones} ${t('reporteConfirmaciones')}`}
              </small>
            </div>
          </div>
          {reporteSel.comentario && <p className="rc-msg">{reporteSel.comentario}</p>}
          <div className="rc-votos">
            <button className="rc-si" onClick={() => votar(true)} disabled={offline}>
              <Icon nombre="check" tam={16} /> {t('sigueAhi')}
            </button>
            <button className="rc-no" onClick={() => votar(false)} disabled={offline}>
              <Icon nombre="x" tam={16} /> {t('yaNoEsta')}
            </button>
          </div>
        </div>
      )}

      {/* Ficha completa */}
      {fichaLugar && <PlaceDetail lugar={fichaLugar} onCerrar={() => setFichaLugar(null)} />}

      {/* Panel de avisos municipales */}
      {panelAvisos && (
        <div className="panel-avisos-overlay" onClick={() => setPanelAvisos(false)}>
          <div className="panel-avisos" onClick={(e) => e.stopPropagation()}>
            <div className="pa-head">
              <span>
                <Icon nombre="bell" tam={16} /> {t('menuAvisos')}
              </span>
              <button
                className="pa-cerrar"
                onClick={() => setPanelAvisos(false)}
                aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
              >
                <Icon nombre="x" tam={14} />
              </button>
            </div>
            <div className="pa-lista">
              {avisos.length === 0 && (
                <div className="pa-vacio">
                  {lang === 'es' ? 'No hay avisos por ahora.' : 'No alerts right now.'}
                </div>
              )}
              {avisos.map((a) => (
                <div key={a.id} className="pa-item">
                  <span className={`pa-tipo t-${a.tipo}`}>{tipoAvisoLabel(a.tipo)}</span>
                  <div className="pa-msg">{a.mensaje[lang]}</div>
                  {a.publicado_en && <div className="pa-fecha">{fmtFechaAviso(a.publicado_en)}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ChatBot
        abierto={chatAbierto}
        onCerrar={() => setChatAbierto(false)}
        lugares={vista === 'localidad' ? lugaresLocalidad : lugares}
        localidadNombre={locActiva ? locActiva.nombre[lang] : null}
      />

      {/* Acá vivía el aviso "Nueva versión lista" con su botón Actualizar. Se
          quitó porque no lo tocaban: la versión ahora entra sola cuando la app
          queda en segundo plano (ver actualizacion.js), así que no hay nada que
          avisar ni que pedir. */}

      {/* Reinicio explicado: sin esto la app se recargaba sola y sin motivo
          visible. Tapa la pantalla a propósito — dura menos de dos segundos y
          lo que sigue es un arranque en frío. */}
      {estadoAct === 'aplicando' && (
        <div className="act-overlay" role="status" aria-live="polite">
          <div className="act-caja">
            <span className="act-spinner" aria-hidden="true" />
            <b>{t('updAplicando')}</b>
            <small>{t('updAplicandoSub')}</small>
          </div>
        </div>
      )}

      {mostrarTarjetaPush && (
        <div className="tarjeta-push">
          <span className="tp-ico">
            <Icon nombre="bell" tam={22} />
          </span>
          <div className="tp-txt">
            <b>{t('pushTitulo')}</b>
            <br />
            {t('pushTexto')}
          </div>
          <button onClick={activarPushDesdeTarjeta} disabled={pushEstado === 'activando'}>
            {t('pushActivar')}
          </button>
          <button
            className="cerrar"
            onClick={cerrarTarjetaPush}
            aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
          >
            <Icon nombre="x" tam={14} />
          </button>
        </div>
      )}

      {/* Se ofrece SIEMPRE mientras no esté instalada, tenga o no el permiso del
          navegador para instalar de un toque. Antes el banner exigía tener vivo
          el `beforeinstallprompt`, y ese evento no siempre llega: en Android
          Chrome puede ofrecer "Instalar aplicación" en su menú y no mandárnoslo
          nunca, con lo que el banner no aparecía jamás en el teléfono. Un evento
          que no controlamos no puede ser la condición para invitar a instalar.

          `instaladaSegunNavegador` ya no puede tapar un prompt vivo: si el
          navegador nos mandó el evento es porque la app NO está instalada, y esa
          señal manda por sobre la consulta, que puede quedar desactualizada
          después de desinstalar — y por lo mismo tampoco la calla el "Entendido"
          del camino manual (`instalarSilenciado`) ni la espera de `manualRevelado`:
          con el evento en la mano no hay nada que esperar ni que dudar. */}
      {!bannerCerrado &&
        !instaladaStandalone &&
        (promptInstalar ||
          (!instaladaSegunNavegador && !instalarSilenciado && manualRevelado)) && (
        <div className="instalar">
          <Icon nombre="smartphone" tam={24} />
          <div className="i-txt">
            <b>{t('instalarTitulo')}</b>
            <br />
            {/* Con prompt vivo se instala de un toque. Sin él hay que explicar
                el gesto a mano, que es distinto en cada sistema: en iOS no
                existe la instalación programática, y en Android el camino es el
                menú del navegador. Un botón "Instalar" que no instala es un
                callejón sin salida — se toca, no pasa nada, y se lee como que la
                app no se puede instalar. */}
            {promptInstalar
              ? t('instalarTexto')
              : esIOS
                ? t('instalarTextoIOS')
                : t('instalarTextoMenu')}
          </div>
          <button onClick={instalar}>
            {promptInstalar ? t('instalar') : t('instalarEntendido')}
          </button>
          <button
            className="cerrar"
            onClick={cerrarBannerInstalar}
            aria-label="Cerrar"
          >
            <Icon nombre="x" tam={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppInterna />
    </I18nProvider>
  )
}
