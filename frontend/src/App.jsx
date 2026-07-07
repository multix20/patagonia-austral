import { useCallback, useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { CATEGORIAS, AVISOS_SEED } from './data/places'
import { obtenerLugares } from './api/client'
import Icon from './components/Icon'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import ChatBot from './components/ChatBot'

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

  // Notificaciones (demo local; en producción: Web Push desde el CMS)
  const [toast, setToast] = useState(null)
  const [iAviso, setIAviso] = useState(0)

  // Instalación PWA (beforeinstallprompt real)
  const [promptInstalar, setPromptInstalar] = useState(null)
  const [bannerCerrado, setBannerCerrado] = useState(
    () => localStorage.getItem('bannerInstalarCerrado') === '1'
  )

  useEffect(() => {
    obtenerLugares().then(setLugares)
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

  const probarPush = () => {
    setToast(AVISOS_SEED[iAviso % AVISOS_SEED.length][lang])
    setIAviso((i) => i + 1)
    setTimeout(() => setToast(null), 4500)
  }

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
        <button onClick={probarPush}>
          <span className="tag">DEMO</span>
          <span className="b-linea">
            <Icon nombre="bell" tam={14} /> {t('demoPush')}
          </span>
        </button>
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
