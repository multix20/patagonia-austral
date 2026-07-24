import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
import { CATEGORIAS } from '../data/places'
import { RUTA7 } from '../data/ruta7'
import { iconoHTML } from './Icon'

// Rediseño map-first (Sprint UX/UI): el mapa es el protagonista a pantalla
// completa. Dos vistas:
//  - 'ruta': puntos de localidad sobre la línea de la Carretera Austral.
//  - 'localidad': pines de categoría (gota) de los lugares del pueblo elegido.
// El control de "centrar en mi ubicación" se expone por ref para el rail de la app.

// Mapa base topográfico (relieve + caminos + etiquetas): alto contraste, ideal
// para una ruta de montaña. Host Esri (arcgisonline), ya cacheado por el service
// worker (regla `esri-tiles` en vite.config.js) para uso sin conexión.
const BASE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  options: {
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, USGS',
    maxZoom: 19,
  },
}

const CENTRO_RUTA = [-45.5, -72.6]

// Pines con área de toque real (iconSize/iconAnchor) para tap-targets correctos.
function pinLocalidad(loc, destacado) {
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="pin-loc ${destacado ? 'rel' : ''}"><div class="lbl">${loc.nombre}</div><div class="dot"></div></div>`,
  })
}

function pinCategoria(cat) {
  const c = CATEGORIAS[cat]
  return L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    html: `<div class="pin-cat"><div class="teardrop">
      <svg class="body" width="34" height="44" viewBox="0 0 34 44"><path d="M17 43C17 43 32 25 32 15A15 15 0 1 0 2 15C2 25 17 43 17 43Z" fill="${c.color}" stroke="#fff" stroke-width="2.5"/></svg>
      <div class="ico">${iconoHTML(c.icono, 17, '#fff')}</div>
    </div></div>`,
  })
}

const MapView = forwardRef(function MapView(
  {
    vista,
    localidades,
    lugares,
    destacados = [],
    filtro,
    localidadActiva,
    onEntrarLocalidad,
    onSeleccionarLugar,
    onPos,
    lang,
  },
  ref
) {
  const contRef = useRef(null)
  const mapaRef = useRef(null)
  const rutaRef = useRef(null)
  const locMarkersRef = useRef([])
  const catMarkersRef = useRef([])
  const yoRef = useRef(null)
  const [pos, setPos] = useState(null)

  // Callbacks en refs para no re-suscribir los efectos del mapa en cada render.
  const cbEntrar = useRef(onEntrarLocalidad)
  const cbLugar = useRef(onSeleccionarLugar)
  useEffect(() => {
    cbEntrar.current = onEntrarLocalidad
    cbLugar.current = onSeleccionarLugar
  })

  // Centrar en la ubicación del usuario (lo llama el rail de la app).
  useImperativeHandle(ref, () => ({
    centrarEnMi() {
      if (pos && mapaRef.current) mapaRef.current.setView(pos, 15, { animate: true })
    },
    tienePos: !!pos,
  }))

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (mapaRef.current) return
    const mapa = L.map(contRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(CENTRO_RUTA, 6)
    L.tileLayer(BASE.url, BASE.options).addTo(mapa)
    mapaRef.current = mapa
    setTimeout(() => mapa.invalidateSize(), 200)
    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  // Traza la Ruta 7 destacada (dato estático, una sola vez): línea naranja con
  // contorno blanco sobre el mapa base; los tramos en barcaza van punteados. Ya
  // no se unen los pueblos con líneas rectas.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || rutaRef.current) return
    const grupo = L.featureGroup()
    RUTA7.forEach((seg) => {
      if (seg.tipo === 'barcaza') {
        L.polyline(seg.puntos, {
          color: '#d85a30',
          weight: 3,
          opacity: 0.75,
          dashArray: '1 10',
          lineCap: 'round',
        }).addTo(grupo)
      } else {
        // Contorno blanco + línea naranja: efecto "ruta resaltada".
        L.polyline(seg.puntos, {
          color: '#ffffff',
          weight: 8,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(grupo)
        L.polyline(seg.puntos, {
          color: '#d85a30',
          weight: 4.5,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(grupo)
      }
    })
    rutaRef.current = grupo
    if (vista === 'ruta') grupo.addTo(mapa)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La ruta destacada solo se muestra en la vista general (en 'localidad' estorba).
  useEffect(() => {
    const mapa = mapaRef.current
    const grupo = rutaRef.current
    if (!mapa || !grupo) return
    if (vista === 'ruta' && !mapa.hasLayer(grupo)) grupo.addTo(mapa)
    else if (vista !== 'ruta' && mapa.hasLayer(grupo)) mapa.removeLayer(grupo)
  }, [vista])

  function limpiarLoc() {
    locMarkersRef.current.forEach((m) => mapaRef.current?.removeLayer(m))
    locMarkersRef.current = []
  }
  function limpiarCat() {
    catMarkersRef.current.forEach((m) => mapaRef.current?.removeLayer(m))
    catMarkersRef.current = []
  }

  // Pines de localidad (vista 'ruta').
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (vista !== 'ruta') return limpiarLoc()
    limpiarLoc()
    localidades.forEach((loc) => {
      const m = L.marker([loc.lat, loc.lng], {
        icon: pinLocalidad(loc, destacados.includes(loc.slug)),
      })
        .addTo(mapa)
        .on('click', () => cbEntrar.current?.(loc.slug))
      locMarkersRef.current.push(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidades, destacados])

  // Pines de categoría (vista 'localidad'), según filtro.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (vista !== 'localidad') return limpiarCat()
    limpiarCat()
    lugares
      .filter((l) => !filtro || l.cat === filtro)
      .forEach((l) => {
        const m = L.marker([l.lat, l.lng], { icon: pinCategoria(l.cat) })
          .addTo(mapa)
          .on('click', () => cbLugar.current?.(l))
        catMarkersRef.current.push(m)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, lugares, filtro])

  // Vuelo del mapa al cambiar de vista / localidad.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (vista === 'localidad' && localidadActiva) {
      mapa.flyTo([localidadActiva.lat, localidadActiva.lng], localidadActiva.zoom || 14, {
        duration: 0.9,
      })
    } else if (vista === 'ruta' && rutaRef.current) {
      mapa.flyToBounds(rutaRef.current.getBounds(), { padding: [54, 54], duration: 0.8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidadActiva?.slug])

  // Ubicación del usuario en vivo.
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Avisa a la app si hay ubicación (para habilitar el botón del rail).
  useEffect(() => {
    onPos?.(pos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  // Marcador "estás aquí".
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (!pos) {
      if (yoRef.current) {
        mapa.removeLayer(yoRef.current)
        yoRef.current = null
      }
      return
    }
    const etiqueta = lang === 'es' ? 'Estás aquí' : "You're here"
    if (yoRef.current) {
      yoRef.current.setLatLng(pos)
    } else {
      const icon = L.divIcon({
        html: '<div class="yo-punto"><span class="yo-pulso"></span></div>',
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      yoRef.current = L.marker(pos, { icon, zIndexOffset: 1000, keyboard: false })
        .addTo(mapa)
        .bindTooltip(etiqueta, {
          permanent: true,
          direction: 'top',
          className: 'yo-tip',
          offset: [0, -8],
        })
    }
  }, [pos, lang])

  return <div ref={contRef} className="mapa-full" />
})

export default MapView
