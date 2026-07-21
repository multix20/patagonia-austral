import { useCallback, useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { CATEGORIAS } from './data/places'
import { obtenerLugares, obtenerAvisos, obtenerLocalidades } from './api/client'
import { activarPush, pushSoportado } from './push'
import Icon from './components/Icon'
import Huemul from './components/Huemul'
import MapView from './components/MapView'
import PlaceDetail from './components/PlaceDetail'
import ChatBot from './components/ChatBot'
import SelectorLocalidad from './components/SelectorLocalidad'

// Etiquetas de tipo de aviso (coinciden con el CMS Filament)
const TIPOS_AVISO = {
  info: { es: 'Información', en: 'Info' },
  clima: { es: 'Clima', en: 'Weather' },
  seguridad: { es: 'Seguridad', en: 'Safety' },
  evento: { es: 'Evento', en: 'Event' },
}

// Distancia aproximada en km (haversine) para ordenar localidades por cercanía.
function distanciaKm(a, b) {
  const R = 6371
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function AppInterna() {
  const { t, lang, setLang } = useI18n()
  const [lugares, setLugares] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [seleccionado, setSeleccionado] = useState(null)
  const [chatAbierto, setChatAbierto] = useState(false)

  // Multi-localidad (Fase 1): pueblos de la ruta sincronizados offline-first.
  // 'todas' = toda la Carretera Austral (sin filtro). Se persiste la elección.
  const [localidades, setLocalidades] = useState([])
  const [localidad, setLocalidad] = useState(() => localStorage.getItem('localidadSel') || 'todas')
  // Ubicación del usuario para ordenar "Toda la ruta" por cercanía. Solo se pide
  // si el permiso YA está concedido (no interrumpimos con un prompt sorpresa).
  const [posUsuario, setPosUsuario] = useState(null)

  // Estado de conexión real del dispositivo
  const [sinRed, setSinRed] = useState(!navigator.onLine)
  const offline = sinRed

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

  // Tarjeta de push (respaldo iOS/Android). iOS no dispara `appinstalled` y exige
  // un gesto del usuario para pedir el permiso → un iPhone instalado no tiene otra
  // vía para suscribirse. Mostramos UNA tarjeta, solo en modo standalone y con el
  // permiso pendiente; al decidir (o cerrarla) desaparece. No es el botón "Activar
  // notificaciones" de siempre: es contextual, único y descartable.
  const [instaladaStandalone] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  )
  const [tarjetaPushCerrada, setTarjetaPushCerrada] = useState(
    () => localStorage.getItem('tarjetaPushCerrada') === '1'
  )

  // Instalación PWA (beforeinstallprompt real)
  const [promptInstalar, setPromptInstalar] = useState(null)
  const [bannerCerrado, setBannerCerrado] = useState(
    () => localStorage.getItem('bannerInstalarCerrado') === '1'
  )

  useEffect(() => {
    obtenerLugares().then(setLugares)
    obtenerAvisos().then(setAvisos)
    obtenerLocalidades().then(setLocalidades)
  }, [])

  // Ubicación para ordenar por cercanía. Solo si el permiso ya fue concedido
  // (p. ej. el usuario tocó "centrar en mi ubicación" en el mapa): así no
  // disparamos un prompt de geolocalización solo para ordenar la lista.
  useEffect(() => {
    if (!('geolocation' in navigator) || !navigator.permissions) return
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((res) => {
        const pedir = () => {
          if (res.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => setPosUsuario([pos.coords.latitude, pos.coords.longitude]),
              () => {},
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
            )
          }
        }
        pedir()
        // Si el usuario concede el permiso más tarde (desde el mapa), reordenamos.
        res.onchange = pedir
      })
      .catch(() => {})
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

  // En móvil, la página se congela en segundo plano y no procesa el mensaje del
  // service worker. Al volver a primer plano (o recuperar el foco) recargamos los
  // avisos, así la campanita se actualiza sin tener que salir y reabrir la app.
  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === 'visible') {
        obtenerAvisos().then(setAvisos)
      }
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
      // El código del error (no-soportado | sin-clave | permiso-denegado |
      // registro-fallido | otro) se muestra para poder diagnosticar en móvil,
      // donde no hay consola a mano.
      const motivo = e?.message || 'desconocido'
      mostrarToast(
        lang === 'es'
          ? `No se pudieron activar las notificaciones (${motivo}).`
          : `Could not enable notifications (${motivo}).`
      )
    }
  }

  // Al instalar la app (desde nuestro banner o el propio navegador),
  // se pide el permiso de notificaciones una sola vez, sin botón visible.
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

  // Red de seguridad: si la app corre INSTALADA y el permiso ya está concedido,
  // asegura la suscripción en cada arranque. Repara dispositivos donde el flujo
  // de appinstalled no llegó a registrar la suscripción en el backend (p. ej.
  // el permiso se dio a nivel de sistema pero el POST nunca ocurrió). Silencioso
  // y sin duplicados: el backend hace updateOrCreate por endpoint.
  useEffect(() => {
    if (instaladaStandalone && pushSoportado() && Notification.permission === 'granted') {
      activarPush()
        .then(() => setPushEstado('activado'))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrarTarjetaPush = () => {
    setTarjetaPushCerrada(true)
    localStorage.setItem('tarjetaPushCerrada', '1')
  }

  // El gesto del usuario (toque) permite pedir el permiso también en iOS. Se
  // conceda o se deniegue, no volvemos a mostrar la tarjeta.
  const activarPushDesdeTarjeta = async () => {
    await habilitarPush()
    cerrarTarjetaPush()
  }

  // Solo en standalone, con push soportado y permiso PENDIENTE (default): iOS ≥16.4
  // instalado, o Android donde el flujo de `appinstalled` no llegó a pedirlo.
  const mostrarTarjetaPush =
    instaladaStandalone &&
    !tarjetaPushCerrada &&
    pushEstado !== 'activado' &&
    pushSoportado() &&
    Notification.permission === 'default'

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

  // Cambia la localidad activa: persiste la elección y cierra la ficha abierta
  // (podría ser de otro pueblo). El mapa se recentra vía props de MapView.
  const cambiarLocalidad = (slug) => {
    setLocalidad(slug)
    localStorage.setItem('localidadSel', slug)
    setSeleccionado(null)
  }

  const locActiva = localidades.find((l) => l.slug === localidad)

  // Lugares visibles según la localidad elegida. Los lugares cacheados por
  // versiones previas de la app (sin campo `localidad`) se asumen de Cochrane,
  // que era la única localidad hasta la Fase 1.
  const lugaresVisibles =
    localidad === 'todas'
      ? lugares
      : lugares.filter((l) => (l.localidad || 'cochrane') === localidad)

  // Filtra por categoría y sube los destacados al inicio (capa comercial Fase 3).
  // El sort es estable, así que dentro de cada grupo de localidad los destacados
  // quedan primero y el resto conserva su orden. Opera sobre una copia (filter +
  // sort) para no mutar `lugares`/`lugaresVisibles`.
  const lugaresFiltrados = lugaresVisibles
    .filter((l) => filtro === 'todos' || l.cat === filtro)
    .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))

  // Orden de localidades para la vista "Toda la ruta": por cercanía al GPS si
  // está disponible; si no, por `orden` (norte→sur).
  const localidadesOrdenadas = [...localidades].sort((a, b) =>
    posUsuario
      ? distanciaKm(posUsuario, [a.lat, a.lng]) - distanciaKm(posUsuario, [b.lat, b.lng])
      : (a.orden ?? 0) - (b.orden ?? 0)
  )

  const renderTarjeta = (l) => {
    const c = CATEGORIAS[l.cat]
    return (
      <div
        key={l.id}
        className={`tarjeta ${l.destacado ? 'es-destacado' : ''}`}
        onClick={() => setSeleccionado(l.id)}
      >
        <div className="icono" style={{ background: c.fondo, color: c.color }}>
          <Icon nombre={c.icono} tam={20} />
        </div>
        <div className="info">
          <div className="nombre">
            {l.nombre[lang]}
            {l.destacado && (
              <span className="sello-destacado">
                <Icon nombre="star" tam={10} /> {t('destacado')}
              </span>
            )}
          </div>
          <div className="meta">{c.nombre[lang]}</div>
          <div className="sello">
            <Icon nombre="download" tam={10} /> {t('guardadoOffline')}
          </div>
        </div>
        <div className="dist">{l.dist[lang].split('·')[0]}</div>
      </div>
    )
  }

  return (
    // Con una localidad elegida el mapa es el protagonista (`mapa-grande`):
    // ocupa la mayor parte de la pantalla y la lista queda debajo. En "Toda la
    // ruta" manda la lista agrupada por cercanía, así que el mapa queda compacto.
    <div className={`app ${offline ? 'offline' : ''} ${localidad !== 'todas' ? 'mapa-grande' : ''}`}>
      <header>
        <div className="fila-top">
          <h1>
            {t('titulo')} <small>{t('subtitulo')}</small>
          </h1>
          <div className="acciones-header">
            <button
              className="btn-campanita"
              onClick={abrirPanelAvisos}
              aria-label={lang === 'es' ? 'Avisos municipales' : 'Municipal alerts'}
            >
              <span className="campanita">
                <Icon nombre="bell" tam={16} />
                {noLeidos > 0 && <span className="badge-avisos">{noLeidos}</span>}
              </span>
            </button>
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

        {/* Selector de localidad con búsqueda (Fase 2): elige el pueblo de la ruta */}
        <SelectorLocalidad
          localidades={localidades}
          valor={localidad}
          onCambiar={cambiarLocalidad}
        />
      </header>

      {offline && (
        <div className="banner-offline">
          <Icon nombre="wifi-off" tam={14} /> {t('bannerOffline')}
        </div>
      )}

      <MapView
        lugares={lugaresVisibles}
        filtro={filtro}
        seleccionado={seleccionado}
        onSeleccionar={onSeleccionar}
        offline={offline}
        centro={locActiva ? [locActiva.lat, locActiva.lng] : null}
        zoom={locActiva?.zoom}
      />

      <div className="lista">
        {lugaresFiltrados.length === 0 && (
          <div className="lista-vacia">{t('sinLugaresLocalidad')}</div>
        )}
        {localidad === 'todas' && localidades.length > 0
          ? localidadesOrdenadas.map((loc) => {
              const items = lugaresFiltrados.filter(
                (l) => (l.localidad || 'cochrane') === loc.slug
              )
              if (items.length === 0) return null
              return (
                <div key={loc.slug} className="grupo-loc">
                  <div className="grupo-loc-titulo">
                    <span>
                      <Icon nombre="map-pin" tam={12} /> {loc.nombre[lang]}
                    </span>
                    {posUsuario && (
                      <span className="grupo-loc-km">
                        {Math.round(distanciaKm(posUsuario, [loc.lat, loc.lng]))} km
                      </span>
                    )}
                  </div>
                  {items.map(renderTarjeta)}
                </div>
              )
            })
          : lugaresFiltrados.map(renderTarjeta)}
      </div>

      {/* Barra de categorías en la zona del pulgar. "Dónde dormir" y "Dónde comer"
          van primero (orden de CATEGORIAS): es lo que más busca el turista. */}
      <nav className="barra-cat" aria-label={lang === 'es' ? 'Filtrar por categoría' : 'Filter by category'}>
        <button
          className={`cat-btn ${filtro === 'todos' ? 'activo' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          <Icon nombre="map" tam={18} />
          <span>{t('todos')}</span>
        </button>
        {Object.entries(CATEGORIAS).map(([clave, c]) => (
          <button
            key={clave}
            className={`cat-btn ${filtro === clave ? 'activo' : ''}`}
            onClick={() => setFiltro(clave)}
            style={filtro === clave ? { '--cat-color': c.color } : undefined}
          >
            <Icon nombre={c.icono} tam={18} />
            <span>{c.nombre[lang]}</span>
          </button>
        ))}
      </nav>

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
        {/* Crossfade: el huemul (emblema de Aysén) aparece y desaparece alternando con el spark */}
        <span className="fab-iconos" aria-hidden="true">
          <Huemul tam={25} />
          <Icon nombre="spark" tam={24} />
        </span>
      </button>

      <ChatBot
        abierto={chatAbierto}
        onCerrar={() => setChatAbierto(false)}
        lugares={lugaresVisibles}
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
