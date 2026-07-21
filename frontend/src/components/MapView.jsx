import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { CATEGORIAS } from '../data/places'
import { iconoHTML } from './Icon'
import { useI18n } from '../i18n'

// Centro de Cochrane
const COCHRANE = [-47.2539, -72.5732]

// Radio máximo (km) para dibujar la línea de ruta en el mapa: solo turistas
// realmente cerca del destino. Lejos, para eso está el botón "Cómo llegar".
const RADIO_RUTA_KM = 30

// Mapas base disponibles. Las teselas se cachean en el service worker
// (CacheFirst en vite.config.js) para uso sin conexión.
const BASEMAPS = {
  mapa: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 },
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { attribution: 'Imágenes © Esri', maxZoom: 19 },
  },
}

// Distancia en km entre dos coordenadas (fórmula de Haversine).
function distanciaKm(a, b) {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// `centro`/`zoom` (opcionales) llegan de la localidad elegida en el selector:
// al cambiarla, el mapa vuela al pueblo correspondiente. Sin localidad
// ("toda la ruta") el mapa conserva su vista actual.
export default function MapView({
  lugares,
  filtro,
  seleccionado,
  onSeleccionar,
  offline,
  centro = null,
  zoom = null,
  activo = null,
}) {
  const contRef = useRef(null)
  const mapaRef = useRef(null)
  const capaRef = useRef(null) // grupo de marcadores de lugares
  const baseRef = useRef(null) // capa base (teselas) actual
  const yoRef = useRef(null) // marcador de la ubicación del usuario
  const rutaRef = useRef(null) // línea de ruta usuario → lugar
  const volandoRef = useRef(0) // timestamp del último flyTo por cambio de localidad
  const [pos, setPos] = useState(null) // [lat, lng] del usuario en vivo
  const [capa, setCapa] = useState('mapa') // 'mapa' | 'satelite'
  const { t, lang } = useI18n()

  // Inicializa el mapa una sola vez
  useEffect(() => {
    if (mapaRef.current) return
    const mapa = L.map(contRef.current, { zoomControl: false }).setView(COCHRANE, 13)
    baseRef.current = L.tileLayer(BASEMAPS.mapa.url, BASEMAPS.mapa.options).addTo(mapa)
    L.control.zoom({ position: 'topright' }).addTo(mapa)
    capaRef.current = L.layerGroup().addTo(mapa)
    mapaRef.current = mapa
    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  // Recentra el mapa al cambiar de localidad (Fase 1 — multi-localidad)
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !centro) return
    volandoRef.current = Date.now()
    mapa.flyTo(centro, zoom || 13, { duration: 0.8 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro?.[0], centro?.[1], zoom])

  // Sincronización lista → mapa: el mapa sigue (paneo suave, mismo zoom) al lugar
  // "activo" (la card de más arriba en la lista). Se omite el paneo justo tras un
  // flyTo de cambio de localidad, para no interrumpir esa animación.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !activo) return
    if (Date.now() - volandoRef.current < 1000) return
    const lugar = lugares.find((l) => l.id === activo)
    if (!lugar) return
    mapa.panTo([lugar.lat, lugar.lng], { animate: true, duration: 0.5 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo])

  // Cambia el mapa base (Mapa ↔ Satélite)
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !baseRef.current) return
    mapa.removeLayer(baseRef.current)
    baseRef.current = L.tileLayer(BASEMAPS[capa].url, BASEMAPS[capa].options).addTo(mapa)
    baseRef.current.bringToBack()
  }, [capa])

  // Sigue la ubicación del usuario en tiempo real (requiere HTTPS, ya disponible)
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {}, // permiso denegado o sin señal: el mapa sigue funcionando
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Dibuja/actualiza el punto azul del usuario
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !pos) return
    const icon = L.divIcon({
      html: '<div class="yo-punto"><span class="yo-pulso"></span></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
    if (yoRef.current) yoRef.current.setLatLng(pos)
    else yoRef.current = L.marker(pos, { icon, zIndexOffset: 1000, keyboard: false }).addTo(mapa)
  }, [pos])

  // Marcadores de lugares (según filtro de categoría)
  useEffect(() => {
    const capaLugares = capaRef.current
    if (!capaLugares) return
    capaLugares.clearLayers()
    lugares
      .filter((l) => filtro === 'todos' || l.cat === filtro)
      .forEach((l) => {
        const c = CATEGORIAS[l.cat]
        const esActivo = l.id === activo
        // Pin estilo señalética outdoor: gota SVG en el color de la categoría,
        // borde blanco fino y el icono calado en blanco. El pin activo (el que
        // sigue a la lista) se agranda y sube al frente.
        const icono = L.divIcon({
          html: `<div class="pin-lugar${esActivo ? ' pin-activo' : ''}"><svg width="24" height="31" viewBox="0 0 26 34"><path d="M13 1C6.4 1 1 6.5 1 13.1 1 22 13 33 13 33s12-11 12-19.9C25 6.5 19.6 1 13 1z" fill="${c.color}" stroke="#fff" stroke-width="1.6"/></svg><span class="pin-ico">${iconoHTML(c.icono, 11, '#fff')}</span></div>`,
          className: '',
          iconSize: [24, 31],
          iconAnchor: [12, 29],
        })
        L.marker([l.lat, l.lng], { icon: icono, zIndexOffset: esActivo ? 600 : 0 })
          .addTo(capaLugares)
          .on('click', () => onSeleccionar(l.id))
      })
  }, [lugares, filtro, onSeleccionar, activo])

  // Traza la ruta (línea + distancia) desde el usuario al lugar seleccionado
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (rutaRef.current) {
      mapa.removeLayer(rutaRef.current)
      rutaRef.current = null
    }
    const lugar = lugares.find((l) => l.id === seleccionado)
    if (!lugar || !pos) return
    const destino = [lugar.lat, lugar.lng]
    const km = distanciaKm(pos, destino)
    // Solo dibuja la ruta directa si el usuario está razonablemente cerca (en/junto
    // a Cochrane). Lejos —p. ej. en otra ciudad— una línea recta de cientos de km
    // no aporta y descuadra el mapa. Para esos casos está el botón "Cómo llegar"
    // (Google Maps) en la ficha del lugar.
    if (km > RADIO_RUTA_KM) return
    const linea = L.polyline([pos, destino], {
      color: '#0F6E56',
      weight: 4,
      opacity: 0.85,
      dashArray: '8 8',
    }).addTo(mapa)
    const txt = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
    linea
      .bindTooltip(txt, { permanent: true, direction: 'center', className: 'ruta-tip' })
      .openTooltip()
    rutaRef.current = linea
    mapa.fitBounds(linea.getBounds(), { padding: [50, 50], maxZoom: 16 })
  }, [seleccionado, pos, lugares])

  const centrarEnMi = () => {
    if (pos && mapaRef.current) mapaRef.current.setView(pos, 15)
  }

  return (
    <div className="mapa-cont">
      <div ref={contRef} className="mapa" />

      {/* Selector de mapa base */}
      <div className="mapa-capas">
        <button
          className={`btn-capa ${capa === 'mapa' ? 'activo' : ''}`}
          onClick={() => setCapa('mapa')}
        >
          {lang === 'es' ? 'Mapa' : 'Map'}
        </button>
        <button
          className={`btn-capa ${capa === 'satelite' ? 'activo' : ''}`}
          onClick={() => setCapa('satelite')}
        >
          {lang === 'es' ? 'Satélite' : 'Satellite'}
        </button>
      </div>

      {/* Botón "centrar en mi ubicación" */}
      <button
        className="btn-ubicarme"
        onClick={centrarEnMi}
        disabled={!pos}
        aria-label={lang === 'es' ? 'Centrar en mi ubicación' : 'Center on my location'}
        title={
          pos
            ? lang === 'es'
              ? 'Centrar en mi ubicación'
              : 'Center on my location'
            : lang === 'es'
              ? 'Buscando tu ubicación…'
              : 'Locating you…'
        }
      >
        <span dangerouslySetInnerHTML={{ __html: iconoHTML('locate', 18, '#0F6E56') }} />
      </button>

      {offline && (
        <div className="velo-offline">
          <span className="velo-ico">{/* icono */}</span>
          {t('veloOffline')}
        </div>
      )}
    </div>
  )
}
