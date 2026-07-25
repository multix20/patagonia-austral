import { useEffect, useRef, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { CATEGORIAS, LOCALIDADES_DESTACADAS } from './data/places'
import { obtenerLugares, obtenerAvisos, obtenerLocalidades } from './api/client'
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

// Tipos de reporte del crowdsourcing (Fase 3). Hoy es una vista previa de UI:
// abre el panel y confirma con un toast, sin persistir (backend pendiente).
const REPORTES = [
  { k: 'repDerrumbe', icon: 'mountain', c: '#8a5a2b' },
  { k: 'repHielo', icon: 'snow', c: '#2b6cb0' },
  { k: 'repCamino', icon: 'alert', c: 'var(--amarillo)' },
  { k: 'repCombustible', icon: 'fuel', c: '#185FA5' },
  { k: 'repFerry', icon: 'anchor', c: '#0e7c86' },
  { k: 'repCamping', icon: 'tent', c: '#534AB7' },
  { k: 'repTiempo', icon: 'cloud', c: '#5b6b78' },
  { k: 'repFauna', icon: 'paw', c: '#0F6E56' },
  { k: 'repEvento', icon: 'calendar', c: '#D4537E' },
]

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

  useEffect(() => {
    const h = (e) => {
      e.preventDefault()
      setPromptInstalar(e)
    }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
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

  const enviarReporte = (k) => {
    setHoja(null)
    mostrarToast(t(k) + ' · ' + t('reporteEnviado'))
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
        filtro={filtro}
        localidadActiva={locActiva}
        onEntrarLocalidad={entrarLocalidad}
        onSeleccionarLugar={setLugarRapido}
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
          >
            <span className="cico">
              <Icon nombre={c.icono} tam={18} />
            </span>
            <span>{t(CAT_LABEL[clave])}</span>
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

      {/* Hoja: reportar (crowdsourcing — vista previa de UI, Fase 3) */}
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
          <div className="rep-comment" onClick={() => enviarReporte('dejarComentario')}>
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
              <button key={r.k} className="rep-item" onClick={() => enviarReporte(r.k)}>
                <span className="r-badge" style={{ background: r.c }}>
                  <Icon nombre={r.icon} tam={26} color="#fff" />
                </span>
                <span>{t(r.k)}</span>
              </button>
            ))}
          </div>
          <div className="rep-preview">{t('reportePreview')}</div>
        </div>
      </div>

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
