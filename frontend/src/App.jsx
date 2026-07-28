import { useEffect, useRef, useState } from 'react'
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
import Icon from './components/Icon'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import QuickCard from './components/QuickCard'
import ChatBot from './components/ChatBot'

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

// Macrozona por `orden` norte→sur (para el buscador). Norte (Los Lagos) hasta
// Palena; Centro (Aysén norte) hasta Balmaceda; Sur (Aysén sur) el resto.
const macrozonaDe = (orden = 0) => (orden < 65 ? 'norte' : orden < 128 ? 'centro' : 'sur')

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

  const [lugarRapido, setLugarRapido] = useState(null) // ficha rápida (pin)
  const [fichaLugar, setFichaLugar] = useState(null) // ficha completa (PlaceDetail)
  const [hoja, setHoja] = useState(null) // 'buscar' | 'menu' | 'reportar' | null
  const [zona, setZona] = useState(null) // filtro de macrozona en el buscador
  const [busqueda, setBusqueda] = useState('')
  const [chatAbierto, setChatAbierto] = useState(false)
  const [panelAvisos, setPanelAvisos] = useState(false)

  const [posMapa, setPosMapa] = useState(null)
  const [toast, setToast] = useState(null)
  const mapaRef = useRef(null)

  const [sinRed, setSinRed] = useState(!navigator.onLine)
  const offline = sinRed

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
  const [promptInstalar, setPromptInstalar] = useState(null)
  const [bannerCerrado, setBannerCerrado] = useState(
    () => localStorage.getItem('bannerInstalarCerrado') === '1'
  )

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
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
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

  const instalar = async () => {
    if (promptInstalar) {
      promptInstalar.prompt()
      await promptInstalar.userChoice
      setPromptInstalar(null)
    }
    setBannerCerrado(true)
    localStorage.setItem('bannerInstalarCerrado', '1')
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

  const centrarEnMi = () => {
    if (mapaRef.current?.centrarEnMi) mapaRef.current.centrarEnMi()
    else mostrarToast(t('centrando'))
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
        reportes={reportes}
        onEntrarLocalidad={entrarLocalidad}
        onSeleccionarLugar={setLugarRapido}
        onSeleccionarReporte={setReporteSel}
        onPos={setPosMapa}
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

      {/* Rail derecho */}
      <div className="rail">
        <button
          className="fab-round"
          onClick={centrarEnMi}
          disabled={!posMapa}
          aria-label={lang === 'es' ? 'Mi ubicación' : 'My location'}
        >
          <Icon nombre="locate" tam={22} color="var(--tinta)" />
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

      {!bannerCerrado && !instaladaStandalone && (
        <div className="instalar">
          <Icon nombre="smartphone" tam={24} />
          <div className="i-txt">
            <b>{t('instalarTitulo')}</b>
            <br />
            {t('instalarTexto')}
          </div>
          <button onClick={instalar}>{t('instalar')}</button>
          <button
            className="cerrar"
            onClick={() => {
              setBannerCerrado(true)
              localStorage.setItem('bannerInstalarCerrado', '1')
            }}
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
