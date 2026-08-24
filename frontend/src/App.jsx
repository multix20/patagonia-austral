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
  obtenerRutas,
  enviarReporte,
  sincronizarCola,
  contarCola,
  votarReporte,
  sincronizarColaCalificaciones,
} from './api/client'
import { contar, contarOrigen, contarCampana, conectarAnalitica } from './analitica'
import { activarPush, pushSoportado } from './push'
import { useActualizacion, seRecienActualizo } from './actualizacion'
import Icon from './components/Icon'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import QuickCard from './components/QuickCard'
import ChatBot from './components/ChatBot'
import Huemul from './components/Huemul'
import { kmEntre } from './viaje'
import { consultasPendientes } from './reservas'

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

// Hasta dónde se estira la ruta para darle tramo a un reporte sin localidad. La
// API atribuye pueblo solo a menos de 60 km; este radio mayor rescata el reporte
// del camino ENTRE pueblos, que es el más valioso y justo el que queda fuera.
//
// El límite existe porque sin él pasaba esto: un reporte hecho lejos de la
// Austral (probando la app desde una ciudad, o con el navegador ubicando por IP)
// igual "ganaba" la localidad más cercana y se contaba como Norte. El chip decía
// 4 y el mapa no mostraba nada, porque los pines estaban a mil kilómetros. Un
// número que no se corresponde con lo que se ve es peor que no mostrar nada.
const RADIO_TRAMO_KM = 200

// Hasta dónde se considera que el viajero está EN la Carretera Austral para
// dejarlo reportar. Mismo valor que RADIO_RUTA_KM en el backend (que es quien
// manda: la API es pública). Se comprueba también acá para poder avisar SIN
// SEÑAL — el reporte se hace en la ruta, y esperar el 422 del servidor
// significaría no decirle nada al que está sin cobertura.
const RADIO_RUTA_KM = 150


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
  // Trazados y áreas (pasarelas, senderos, glaciares). Sin semilla
  // empaquetada: se bajan la primera vez que hay señal (ver client.js).
  const [rutas, setRutas] = useState([])
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
    obtenerRutas().then(setRutas)
    contarCola().then(setEnCola)
  }, [])

  /**
   * Cuánto del fondo de la app queda FUERA de lo que se ve, en `--piso-extra`.
   *
   * La app mide `100dvh` y los controles flotantes se anclan a su fondo. Pero
   * `dvh` sigue al viewport de LAYOUT, y en un teléfono ese no es siempre el
   * que se ve: con `viewport-fit=cover` y la barra del navegador desplegada, el
   * layout se extiende por debajo del área visible. Resultado, y es lo que se
   * reportó: la barra de categorías "se baja" y queda cortada o fuera de
   * pantalla justo mientras el mapa carga y la barra del navegador se acomoda.
   *
   * `visualViewport` es lo que de verdad se ve, y avisa de cada cambio. La
   * diferencia entre los dos es exactamente lo que hay que subir los controles.
   * Normalmente es 0 y no cambia nada; solo actúa cuando de verdad hay algo
   * tapado.
   *
   * Se sube la BARRA, no se encoge la app: así el mapa sigue a sangre y no da
   * un salto de tamaño cada vez que aparece el teclado.
   */
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const aplicar = () => {
      const oculto = Math.max(0, document.documentElement.clientHeight - (vv.offsetTop + vv.height))
      document.documentElement.style.setProperty('--piso-extra', `${Math.round(oculto)}px`)
    }

    aplicar()
    vv.addEventListener('resize', aplicar)
    vv.addEventListener('scroll', aplicar)
    window.addEventListener('orientationchange', aplicar)
    return () => {
      vv.removeEventListener('resize', aplicar)
      vv.removeEventListener('scroll', aplicar)
      window.removeEventListener('orientationchange', aplicar)
    }
  }, [])

  // Analítica de uso: engancha los disparadores de envío y cuenta la apertura.
  // Todo lo que sale de aquí es anónimo y agregado por día — ver analitica.js.
  useEffect(() => {
    const desconectar = conectarAnalitica()
    contar('app_abierta')
    contarOrigen()
    contarCampana()
    return desconectar
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
    // Las calificaciones tienen su propia cola y se vacían en el mismo momento:
    // la ficha se lee y se califica en la ruta, y la señal llega toda junta al
    // entrar al pueblo. No avisan con toast — el viajero ya recibió su acuse en
    // la ficha ("guardada sin señal"), y un segundo cartel a los tres días,
    // fuera de contexto, no le dice nada.
    await sincronizarColaCalificaciones()

    // Las consultas de disponibilidad NO las manda la app: las manda la persona
    // desde su WhatsApp. Lo único que se puede hacer al recuperar señal es
    // avisarle que las tiene guardadas — el envío de un toque está en el chat.
    const pendientes = await consultasPendientes()
    if (pendientes.length > 0) {
      mostrarToast(t(pendientes.length === 1 ? 'consultaPendiente' : 'consultasPendientes').replace('{n}', pendientes.length))
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

  // Cuántas fichas tiene cada categoría en el pueblo abierto. Sirve para apagar
  // los botones que no llevan a ninguna parte: hasta ahora tocar una categoría
  // vacía dejaba el mapa en blanco sin decir por qué, y se lee como que la app
  // se rompió. Apagado se entiende antes de tocar.
  const conteoCat = {}
  lugaresLocalidad.forEach((l) => {
    conteoCat[l.cat] = (conteoCat[l.cat] || 0) + 1
  })

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
   * Tramo (norte/centro/sur) al que pertenece un reporte, o `null` si el punto
   * no está en la Carretera Austral. Primero por la localidad que le puso la
   * API; si no tiene (cayó a más de 60 km de todo pueblo), por el pueblo más
   * cercano — pero solo dentro de RADIO_TRAMO_KM. Más lejos que eso el reporte
   * no es de esta ruta y no pertenece a ningún tramo.
   */
  const tramoDeReporte = useMemo(() => {
    const porSlug = new Map(localidades.map((l) => [l.slug, l]))
    return (r) => {
      const propia = r.localidad ? porSlug.get(r.localidad) : null
      if (propia) return macrozonaDe(propia.orden)
      let cerca = null
      let mejorKm = RADIO_TRAMO_KM
      localidades.forEach((l) => {
        const km = kmEntre(r.lat, r.lng, l.lat, l.lng)
        if (km < mejorKm) {
          mejorKm = km
          cerca = l
        }
      })
      return cerca ? macrozonaDe(cerca.orden) : null
    }
  }, [localidades])

  /** Distancia en km al pueblo más cercano de la ruta (Infinity si no hay datos). */
  const kmALaRuta = (lat, lng) =>
    localidades.reduce((min, l) => Math.min(min, kmEntre(lat, lng, l.lat, l.lng)), Infinity)

  /**
   * Reportes que están EN la ruta (los únicos que el mapa puede mostrar). Los
   * que caen fuera —pruebas hechas lejos, o el navegador ubicando por IP en otra
   * ciudad— se descartan acá, una sola vez, para que el conteo de los chips y
   * los pines del mapa cuenten siempre lo mismo. Que un chip diga 4 y no se vea
   * nada es peor que no tener chip.
   */
  const reportesEnRuta = useMemo(
    () => reportes.filter((r) => tramoDeReporte(r) !== null),
    [reportes, tramoDeReporte]
  )

  // Cuántos reportes vigentes hay por tramo (el número que llevan los chips):
  // muestra dónde está pasando algo sin tener que probar tramo por tramo.
  const conteoTramos = useMemo(() => {
    const c = { norte: 0, centro: 0, sur: 0 }
    reportesEnRuta.forEach((r) => {
      c[tramoDeReporte(r)] += 1
    })
    return c
  }, [reportesEnRuta, tramoDeReporte])

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
    if (!tramo) return reportesEnRuta
    return reportesEnRuta.filter((r) => tramoDeReporte(r) === tramo)
  }, [reportes, reportesEnRuta, vista, localidad, tramo, tramoDeReporte])

  /**
   * Elegir un tramo LLEVA el mapa hasta esos reportes. Sin esto el chip era
   * mudo: se tocaba "Norte 3", el mapa se quedaba donde estaba y no había forma
   * de saber si el filtro había hecho algo. Volver a "Todos" reencuadra la ruta
   * completa.
   */
  const elegirTramo = (id) => {
    setTramo(id)
    const puntos = (id ? reportesEnRuta.filter((r) => tramoDeReporte(r) === id) : []).map((r) => [
      r.lat,
      r.lng,
    ])
    mapaRef.current?.encuadrarReportes(puntos)
  }

  const noLeidos = avisos.filter((a) => !avisosVistos.includes(a.id)).length

  // ----- Acciones de navegación -----
  const entrarLocalidad = (slug) => {
    contar('localidad', slug)
    setLocalidad(slug)
    setVista('localidad')
    setFiltro(null)
    setLugarRapido(null)
    setHoja(null)
  }

  /** Abre el buscador (píldora del centro y entrada del menú). */
  const abrirBuscador = () => {
    contar('busqueda')
    setHoja('buscar')
  }

  /** Abre el asistente (rail y entrada del menú). */
  const abrirChat = () => {
    contar('chat')
    setHoja(null)
    setChatAbierto(true)
  }

  /** Abre la ficha completa de un lugar. */
  const abrirFicha = (lugar) => {
    contar('ficha', lugar.id)
    setFichaLugar(lugar)
    setLugarRapido(null)
  }

  const cambiarIdioma = () => {
    const nuevo = lang === 'es' ? 'en' : 'es'
    contar('idioma', nuevo)
    setLang(nuevo)
  }

  /**
   * Refresca una ficha en memoria tras calificarla, para que el promedio nuevo
   * se vea también en la tarjeta rápida y al volver a abrirla sin recargar.
   */
  const actualizarLugar = (id, cambios) => {
    setLugares((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
    setFichaLugar((f) => (f && f.id === id ? { ...f, ...cambios } : f))
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
    // Categoría sin fichas en este pueblo: el botón ya se ve apagado, pero
    // sigue respondiendo para poder decir por qué. Un botón que no hace
    // absolutamente nada al tocarlo se lee como app rota.
    if (!conteoCat[clave]) {
      mostrarToast(t('sinLugaresCategoria'))
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
   * Envía un reporte de ruta. El pin va EXACTAMENTE donde está el viajero: si
   * frena en medio de la ruta, entre dos pueblos, el reporte queda ahí. Esa es
   * la regla y no admite sustitutos.
   *
   * Hasta ago-2026 había un respaldo que, cuando el fix no era creíble, corría
   * el punto al centro de la localidad abierta. Se quitó: un derrumbe a 40 km
   * del pueblo dibujado EN el pueblo no es un dato aproximado, es un dato falso
   * — manda a frenar donde no hay nada y deja sin marcar el lugar donde sí lo
   * hay. Justo el tramo entre pueblos es el que importa.
   *
   * Lo único que se sigue comprobando es que la posición sea creíble para esta
   * app: sin GPS de verdad (un computador, o el permiso denegado) el navegador
   * ubica por IP y el punto puede caer a cientos de kilómetros — pasó probando
   * la app, con cuatro reportes que aterrizaron en Santiago.
   */
  const reportar = async (tipo, k) => {
    if (!posMapa) {
      // El GPS ya no tiene botón propio en el rail, así que este toast es el
      // ÚNICO lugar donde el viajero se entera de que la app no lo está
      // ubicando. Por eso distingue "todavía buscando" (espera y reintenta) de
      // "no hay permiso" (hay que ir a arreglarlo), en vez de un mensaje único.
      mostrarToast(estadoGeo === 'buscando' ? t('buscandoUbicacion') : t('reporteSinUbicacion'))
      return
    }

    // El GPS deja el punto fuera de la Austral: no se manda ni se encola. Se
    // avisa acá, en el cliente, para que el mensaje llegue también SIN SEÑAL —
    // que es donde de verdad se reporta.
    if (kmALaRuta(posMapa[0], posMapa[1]) > RADIO_RUTA_KM) {
      mostrarToast(t('reporteFueraDeRuta'))
      return
    }
    const texto = comentario.trim()

    setHoja(null)
    setComentario('')
    const r = await enviarReporte({
      tipo,
      lat: posMapa[0],
      lng: posMapa[1],
      comentario: texto || null,
    })

    if (r.enviado) {
      contar('reporte', tipo)
      // Optimista: el reporte que devolvió la API entra al mapa al instante.
      setReportes((prev) => [r.reporte, ...prev.filter((x) => x.id !== r.reporte.id)])
      // Y se sueltan los chips de tramo: con un filtro puesto, el reporte recién
      // hecho podía caer fuera y el viajero veía "enviado" sin ver su pin.
      setTramo(null)
      mostrarToast(`${t(k)} · ${t('reporteEnviado')}`)
    } else if (r.encolado) {
      // Se cuenta igual que uno enviado: el viajero hizo el reporte, y que la
      // señal llegue tres horas después no cambia que la app se usó ahí.
      contar('reporte', tipo)
      setEnCola(await contarCola())
      mostrarToast(t('reporteEncolado'))
    } else {
      // El servidor manda: si rechazó por estar fuera de la ruta, se dice eso y
      // no "no se pudo enviar" (que invita a reintentar algo que nunca va a
      // entrar). Cubre a quien tenga una versión vieja de la app cacheada.
      mostrarToast(t(r.motivo === 'fuera_de_ruta' ? 'reporteFueraDeRuta' : 'reporteFalla'))
    }
  }

  /** Voto "¿sigue ahí?" / "ya no está" sobre el reporte abierto. */
  const votar = async (confirma) => {
    const actual = reporteSel
    setReporteSel(null)
    const actualizado = await votarReporte(actual.id, confirma)
    mostrarToast(actualizado ? t('graciasVoto') : t('reporteFalla'))
    if (actualizado) {
      contar('voto', confirma ? 'confirma' : 'descarta')
      setReportes(await obtenerReportes())
    }
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
        rutas={rutas}
        onEntrarLocalidad={entrarLocalidad}
        onSeleccionarLugar={setLugarRapido}
        onSeleccionarReporte={setReporteSel}
        onPos={setPosMapa}
        onEstadoGeo={setEstadoGeo}
        lang={lang}
      />

      {/* Barra superior flotante */}
      <div className="topbar">
        {/* Campanita, en el lugar que ocupaba el menú ☰ (eliminado el 12-ago-2026).
            El menú tenía ocho filas: tres duplicaban algo que ya estaba a un
            toque (volver a la ruta, asistente, idioma), dos no hacían nada al
            tocarlas, y de las tres útiles esta era la que más pesa — es el canal
            por donde llega un corte de camino. Enterrarla detrás de un menú era
            justo al revés de lo que necesita: el punto de no leídos ya vivía en
            este botón, así que ahora el punto y su destino son la misma cosa. */}
        <button
          className="fab-sq"
          onClick={abrirPanelAvisos}
          aria-label={t('menuAvisos')}
        >
          <Icon nombre="bell" tam={21} color="var(--tinta)" />
          {noLeidos > 0 && <span className="fab-dot" />}
        </button>

        {/* Píldora de la ruta. Dejó de llevar la marca ("Patagonia Austral ·
            Ruta completa", 12-ago-2026) y dice UNA sola cosa: en qué camino
            está parado quien mira. Sobre el mapa, el nombre del producto no le
            resuelve nada al que va manejando — el número de la ruta sí, porque
            es lo que dicen los letreros de afuera.
            El envoltorio existe para el halo: el resplandor se dibuja en su
            ::before, fuera del botón, que va con overflow:hidden para recortar
            el brillo y el barrido de luz. */}
        <span className={`lp-wrap ${vista === 'localidad' ? 'en-pueblo' : ''}`}>
          <button
            className={`loc-pill ${vista === 'localidad' ? 'en-pueblo' : ''}`}
            onClick={() => (vista === 'localidad' ? volverRuta() : abrirBuscador())}
            // El nombre accesible CONTIENE el texto visible y le agrega a dónde
            // lleva el toque: la píldora no dice lo que hace (abre el buscador,
            // o vuelve a la ruta) y sin esto un lector de pantalla anuncia solo
            // "Ruta 7", que no es una acción.
            aria-label={
              vista === 'localidad' && locActiva
                ? `${locActiva.nombre[lang]} — ${t('volverRuta')}`
                : `${t('marcaMapa')} — ${t('aDondeVas')}`
            }
          >
            <span className="lp-brillo" aria-hidden="true" />
            {vista !== 'localidad' && <span className="lp-barrido" aria-hidden="true" />}
            <span className="zn">
              <Icon
                nombre={vista === 'localidad' ? 'arrow-left' : 'route'}
                tam={20}
                color={vista === 'localidad' ? 'var(--claude-osc)' : 'var(--acento)'}
              />
            </span>
            <span className="tx">
              {vista === 'localidad' && locActiva ? locActiva.nombre[lang] : t('marcaMapa')}
            </span>
            {/* Punto "en ruta": late solo en la vista de ruta completa. Dentro
                de un pueblo no hay nada que latir — ahí la píldora es un botón
                de volver. */}
            {vista !== 'localidad' && <span className="lp-vivo" aria-hidden="true" />}
          </button>
        </span>

        {/* Idioma en el lugar de la lupa. La búsqueda no se pierde: la píldora
            del centro ya abre el buscador en la vista de ruta, y el menú tiene
            su propia entrada. El idioma, en cambio, estaba al fondo del menú —
            el último sitio donde lo va a buscar alguien que abrió la app en
            español sin hablarlo. Cambiarlo tiene que costar un toque. */}
        <button
          className="fab-sq fab-lang"
          onClick={cambiarIdioma}
          aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
        >
          <Icon nombre="globe" tam={19} color="var(--tinta)" />
          <span className="fab-lang-tx">{lang === 'es' ? 'EN' : 'ES'}</span>
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
          sumarle un control al mapa cuando no hay reportes.
          Lleva título: sin él es una fila de números sueltos sobre el mapa y no
          hay forma de adivinar que cuentan reportes de viajeros. */}
      {vista === 'ruta' && reportesEnRuta.length > 0 && (
        <div className="rep-tramos" role="group" aria-label={t('filtrarReportesTramo')}>
          <div className="rt-titulo">
            <Icon nombre="alert" tam={12} color="var(--acento)" />
            <span>{t('reportesTitulo')}</span>
          </div>
          <div className="rt-chips">
            {[{ id: null, lbl: t('tramoTodos'), n: reportesEnRuta.length }]
              .concat(TRAMOS.map(([id, lbl]) => ({ id, lbl: t(lbl), n: conteoTramos[id] })))
              .map((c) => (
                <button
                  key={c.id || 'todos'}
                  type="button"
                  // Un tramo sin reportes no se puede elegir: tocarlo solo dejaba
                  // el mapa en blanco, sin decir por qué.
                  className={`rt-chip ${tramo === c.id ? 'on' : ''} ${c.n === 0 ? 'vacio' : ''}`}
                  aria-pressed={tramo === c.id}
                  disabled={c.n === 0}
                  onClick={() => elegirTramo(c.id)}
                >
                  {c.lbl} <span className="rt-n">{c.n}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Rail derecho. Aquí vivía el botón de "centrar en mi ubicación"; lo
          reemplaza el asistente. El botón de GPS resolvía un problema que el
          mapa ya no tiene (el punto "estás aquí" sigue dibujándose y la vista
          arranca encuadrada en la ruta), mientras que el asistente estaba
          enterrado en el menú — dos toques para lo único que responde preguntas
          sin señal. Ahora es el vecino permanente del botón de reportar. */}
      <div className="rail">
        {/* El asistente lleva la CARA del huemul, no un bocadillo de chat. El
            bocadillo es el icono que tiene cualquier app y no promete nada; el
            huemul —emblema de Aysén— es de acá, y es el mismo dibujo que sale
            de avatar al abrir la conversación, así que el botón y quien
            contesta se reconocen como la misma cosa. El SVG ya existía: hasta
            ahora solo se veía dentro del chat. */}
        <button
          className="fab-round fab-asistente"
          onClick={abrirChat}
          aria-label={`${t('chatNombre')} — ${t('chatRol')}`}
        >
          <Huemul tam={27} color="#fff" />
        </button>
        <button
          className="fab-round fab-report"
          onClick={() => setHoja('reportar')}
          aria-label={t('railReportarAria')}
        >
          <Icon nombre="plus" tam={22} color="#fff" />
          <span>{t('railReportar')}</span>
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
            className={[
              'cat-btn',
              filtro === clave ? 'on' : '',
              vista === 'localidad' && !conteoCat[clave] ? 'vacia' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            // Cada botón lleva el color de SU categoría, el mismo del pin en el
            // mapa: así la barra hace de leyenda sin ocupar espacio. Con los seis
            // en gris no había forma de saber de quién era cada pin.
            style={{ '--cc': c.color, '--cf': c.fondo }}
            onClick={() => toggleCat(clave)}
            // Barra solo de iconos: el nombre de la categoría deja de dibujarse
            // (mapa más limpio) pero sigue disponible para lectores de pantalla
            // y como tooltip al mantener el cursor.
            aria-label={t(CAT_LABEL[clave])}
            aria-pressed={filtro === clave}
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
          onVerFicha={() => abrirFicha(lugarRapido)}
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
          {/* Detalle opcional: viaja con el tipo que se toque. Ya no hay un
              "dejar comentario" como tipo aparte — con tres tipos, un cuarto
              botón que en realidad era texto libre solo competía con ellos. */}
          <textarea
            className="rep-texto"
            rows={2}
            maxLength={280}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={t('comentarioPh')}
          />
          {/* Tres tipos, tres botones grandes: se contesta de un toque con el
              auto detenido en la berma, que es la situación real. */}
          <div className="rep-grid rep-grid-3">
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
      {fichaLugar && (
        <PlaceDetail
          lugar={fichaLugar}
          onCerrar={() => setFichaLugar(null)}
          onActualizar={actualizarLugar}
        />
      )}

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
            {/* Versión y chequeo manual, al pie. Vivían en el menú y ese menú ya
                no existe. No es un control para el viajero —la app se actualiza
                sola al abrirla— pero sí es como se comprueba de un vistazo que
                una versión nueva entró, y eso hizo falta más de una vez. Va
                discreto y al final, no compitiendo con los avisos. */}
            <button className="pa-version" onClick={revisarActualizaciones}>
              <Icon nombre="download" tam={12} />
              <span>
                {__VERSION_APP__} · {estadoAct === 'lista' ? t('updBoton') : t('menuVersionSub')}
              </span>
            </button>
          </div>
        </div>
      )}

      <ChatBot
        abierto={chatAbierto}
        onCerrar={() => setChatAbierto(false)}
        lugares={vista === 'localidad' ? lugaresLocalidad : lugares}
        localidadNombre={locActiva ? locActiva.nombre[lang] : null}
        // El copiloto necesita el viaje entero, no solo el pueblo activo: la
        // posición para ubicarse en la ruta, las localidades para saber qué
        // viene, y todas las fichas para contar qué hay en el camino y a quién
        // se le puede escribir en el pueblo donde va a terminar el día.
        pos={posMapa}
        localidades={localidades}
        todosLugares={lugares}
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
