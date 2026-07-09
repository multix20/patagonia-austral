import { useCallback, useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { CATEGORIAS } from './data/places'
import { obtenerLugares, obtenerAvisos } from './api/client'
import { activarPush, pushSoportado } from './push'
import Icon from './components/Icon'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import ChatBot from './components/ChatBot'

// Etiquetas de tipo de aviso (coinciden con el CMS Filament)
const TIPOS_AVISO = {
  info: { es: 'Información', en: 'Info' },
  clima: { es: 'Clima', en: 'Weather' },
  seguridad: { es: 'Seguridad', en: 'Safety' },
  evento: { es: 'Evento', en: 'Event' },
}

function AppInterna() {
  const { t, lang, setLang } = useI18n()
  const [lugares, setLugares] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [seleccionado, setSeleccionado] = useState(null)
  const [chatAbierto, setChatAbierto] = useState(false)

  // Estado de conexión real + modo demo para presentaciones
  const [sinRed, setSinRed] = useState(!navigator.onLine)
  const [demoOffline, setDemoOffline] = useState(false)
  const offline = sinRed || demoOffline

  // Avisos municipales sincronizados desde el CMS (/api/notices)
  const [avisos, setAvisos] = useState([])
  const [toast, setToast] = useState(null)
  const [panelAvisos, setPanelAvisos] = useState(false)
  // Avisos ya vistos (para el contador sobre la campanita), persistidos en el dispositivo.
  const [avisosVistos, setAvisosVistos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('avisosVistos') || '[]')
    } catch {
      return []
    }
  })

  // Web Push real (suscripción del dispositivo a los avisos municipales)
  const [pushEstado, setPushEstado] = useState('idle') // idle|activando|activado|error

  // Instalación PWA (beforeinstallprompt real)
  const [promptInstalar, setPromptInstalar] = useState(null)
  const [bannerCerrado, setBannerCerrado] = useState(
    () => localStorage.getItem('bannerInstalarCerrado') === '1'
  )

  useEffect(() => {
    obtenerLugares().then(setLugares)
    obtenerAvisos().then(setAvisos)
  }, [])

  // Cuando llega un Web Push, el service worker avisa a la app (postMessage).
  // Recargamos los avisos desde la API para que la campanita/badge se actualice
  // AL MISMO TIEMPO que la notificación del sistema, sin refrescar la página.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const alMensaje = (event) => {
      if (event.data?.tipo === 'nuevo-aviso') {
        obtenerAvisos().then(setAvisos)
      }
    }
    navigator.serviceWorker.addEventListener('message', alMensaje)
    return () => navigator.serviceWorker.removeEventListener('message', alMensaje)
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

  const instalar = async () => {
    if (promptInstalar) {
      promptInstalar.prompt()
      await promptInstalar.userChoice
      setPromptInstalar(null)
    }
    cerrarBanner()
  }

  const cerrarBanner = () => {
    setBannerCerrado(true)
    localStorage.setItem('bannerInstalarCerrado', '1')
  }

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4500)
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
      mostrarToast(
        lang === 'es'
          ? 'No se pudieron activar las notificaciones.'
          : 'Could not enable notifications.'
      )
    }
  }

  // Avisos no leídos = los que aún no se han visto (contador de la campanita)
  const noLeidos = avisos.filter((a) => !avisosVistos.includes(a.id)).length

  // Abre el panel con TODOS los avisos y los marca como vistos (limpia el contador)
  const abrirPanelAvisos = () => {
    setPanelAvisos(true)
    const ids = avisos.map((a) => a.id)
    setAvisosVistos(ids)
    localStorage.setItem('avisosVistos', JSON.stringify(ids))
  }

  const fmtFechaAviso = (iso) =>
    new Date(iso).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const tipoAvisoLabel = (tp) => TIPOS_AVISO[tp]?.[lang] ?? tp

  const onSeleccionar = useCallback((id) => setSeleccionado(id), [])
  const lugarSel = lugares.find((l) => l.id === seleccionado)

  return (
    <div className={`app ${offline ? 'offline' : ''}`}>
      <header>
        <div className="fila-top">
          <h1>
            {t('titulo')} <small>{t('subtitulo')}</small>
          </h1>
          <div className="acciones-header">
            <button
              className="btn-idioma"
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              aria-label="Cambiar idioma / Switch language"
            >
              <Icon nombre="globe" tam={12} /> {lang === 'es' ? 'EN' : 'ES'}
            </button>
            <div className="estado">
              <span className="punto" /> {offline ? t('sinConexion') : t('enLinea')}
            </div>
          </div>
        </div>
      </header>

      {offline && (
        <div className="banner-offline">
          <Icon nombre="wifi-off" tam={14} /> {t('bannerOffline')}
        </div>
      )}

      <div className="demo-bar">
        <button onClick={() => setDemoOffline((v) => !v)}>
          <span className="tag">DEMO</span>
          <span className="b-linea">
            <Icon nombre="plane" tam={14} /> {t('demoOffline')}
          </span>
        </button>
        <button onClick={abrirPanelAvisos}>
          <span className="tag">DEMO</span>
          <span className="b-linea">
            <span className="campanita">
              <Icon nombre="bell" tam={14} />
              {noLeidos > 0 && <span className="badge-avisos">{noLeidos}</span>}
            </span>
            {t('demoPush')}
          </span>
        </button>
        {pushSoportado() && (
          <button onClick={habilitarPush} disabled={pushEstado === 'activado'}>
            <span className="tag">{pushEstado === 'activado' ? 'ON' : 'PUSH'}</span>
            <span className="b-linea">
              <Icon nombre="bell" tam={14} />{' '}
              {pushEstado === 'activado'
                ? lang === 'es'
                  ? 'Notificaciones activas'
                  : 'Notifications on'
                : pushEstado === 'activando'
                  ? lang === 'es'
                    ? 'Activando…'
                    : 'Enabling…'
                  : lang === 'es'
                    ? 'Activar notificaciones'
                    : 'Enable notifications'}
            </span>
          </button>
        )}
      </div>

      <MapView lugares={lugares} filtro={filtro} onSeleccionar={onSeleccionar} offline={offline} />

      <div className="chips">
        <button
          className={`chip ${filtro === 'todos' ? 'activo' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          {t('todos')}
        </button>
        {Object.entries(CATEGORIAS).map(([clave, c]) => (
          <button
            key={clave}
            className={`chip ${filtro === clave ? 'activo' : ''}`}
            onClick={() => setFiltro(clave)}
          >
            <Icon nombre={c.icono} tam={13} /> {c.nombre[lang]}
          </button>
        ))}
      </div>

      <div className="lista">
        {lugares
          .filter((l) => filtro === 'todos' || l.cat === filtro)
          .map((l) => {
            const c = CATEGORIAS[l.cat]
            return (
              <div key={l.id} className="tarjeta" onClick={() => setSeleccionado(l.id)}>
                <div className="icono" style={{ background: c.fondo, color: c.color }}>
                  <Icon nombre={c.icono} tam={20} />
                </div>
                <div className="info">
                  <div className="nombre">{l.nombre[lang]}</div>
                  <div className="meta">{c.nombre[lang]}</div>
                  <div className="sello">
                    <Icon nombre="download" tam={10} /> {t('guardadoOffline')}
                  </div>
                </div>
                <div className="dist">{l.dist[lang].split('·')[0]}</div>
              </div>
            )
          })}
      </div>

      {lugarSel && <PlaceDetail lugar={lugarSel} onCerrar={() => setSeleccionado(null)} />}

      {toast && (
        <div className="toast visible">
          <span className="t-ico">
            <Icon nombre="landmark" tam={22} />
          </span>
          <div>
            <div className="t-titulo">{t('muni')}</div>
            <div className="t-msg">{toast}</div>
          </div>
        </div>
      )}

      {panelAvisos && (
        <div className="panel-avisos-overlay" onClick={() => setPanelAvisos(false)}>
          <div className="panel-avisos" onClick={(e) => e.stopPropagation()}>
            <div className="pa-head">
              <span>
                <Icon nombre="bell" tam={16} />{' '}
                {lang === 'es' ? 'Avisos municipales' : 'Municipal alerts'}
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

      <button className="fab-chat" onClick={() => setChatAbierto(true)} aria-label={t('chatNombre')}>
        <Icon nombre="message-circle" tam={26} />
        <span className="globito">{t('chatDudas')}</span>
      </button>

      <ChatBot abierto={chatAbierto} onCerrar={() => setChatAbierto(false)} lugares={lugares} />

      {!bannerCerrado && (
        <div className="instalar">
          <Icon nombre="smartphone" tam={24} />
          <div className="i-txt">
            <b>{t('instalarTitulo')}</b>
            <br />
            {t('instalarTexto')}
          </div>
          <button onClick={instalar}>{t('instalar')}</button>
          <button className="cerrar" onClick={cerrarBanner} aria-label="Cerrar">
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
