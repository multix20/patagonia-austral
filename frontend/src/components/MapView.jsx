import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
import { CATEGORIAS } from '../data/places'
import { RUTA7 } from '../data/ruta7'
import Icon, { iconoHTML } from './Icon'

// Rediseño map-first (Sprint UX/UI): el mapa es el protagonista a pantalla
// completa. Dos vistas:
//  - 'ruta': puntos de localidad sobre la línea de la Carretera Austral.
//  - 'localidad': pines de categoría (gota) de los lugares del pueblo elegido.
// El control de "centrar en mi ubicación" se expone por ref para el rail de la app.

// Capas base seleccionables por el usuario (botón de capas sobre el mapa):
//  - 'mapa'     → CARTO Voyager: cartografía limpia, colorida y nítida (estilo
//    Google Maps). El placeholder `{r}` pide teselas @2x (retina) en pantallas
//    de alta densidad → mucho más nítido en el celular que un topográfico raster.
//  - 'satelite' → Esri World Imagery: fotografía satelital de alto contraste,
//    útil para ubicar geografía real (ríos, glaciares, sendas).
// Ambas quedan cacheadas por el service worker (reglas `carto-tiles` y
// `esri-tiles` en vite.config.js) para uso sin conexión.
const CAPAS = {
  mapa: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      subdomains: 'abcd',
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 20,
    },
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    },
  },
}

const CENTRO_RUTA = [-45.5, -72.6]

// A partir de este zoom se muestran los nombres de TODAS las localidades (como
// Google Maps: al acercar aparecen las etiquetas). Más lejos que esto solo se
// rotulan las destacadas, para no saturar la vista general de toda la ruta.
const ZOOM_ETIQUETAS = 8

// Pines con área de toque real (iconSize/iconAnchor) para tap-targets correctos.
// `loc.nombre` es bilingüe ({ es, en }): hay que rotular con el idioma activo,
// nunca el objeto crudo (si no, se ve "[object Object]" en la etiqueta).
function pinLocalidad(loc, destacado, lang) {
  const nombre = loc.nombre?.[lang] ?? loc.nombre?.es ?? loc.nombre ?? ''
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="pin-loc ${destacado ? 'rel' : ''}"><div class="lbl">${nombre}</div><div class="dot"></div></div>`,
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
  const tileRef = useRef(null)
  const rutaRef = useRef(null)
  const locMarkersRef = useRef([])
  const catMarkersRef = useRef([])
  const yoRef = useRef(null)
  const [pos, setPos] = useState(null)
  // Capa base elegida por el usuario y visibilidad de las etiquetas de localidad
  // (según el zoom). Ambas se reflejan como clases del contenedor → las controla
  // React en el className, no con classList (si no, un re-render las borraría).
  const [capa, setCapa] = useState('mapa')
  const [etiquetasVisibles, setEtiquetasVisibles] = useState(false)

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

  // Inicializa el mapa una sola vez (la capa base la monta el efecto de `capa`).
  useEffect(() => {
    if (mapaRef.current) return
    const mapa = L.map(contRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(CENTRO_RUTA, 6)
    mapaRef.current = mapa
    // Muestra/oculta los nombres de todas las localidades según el zoom.
    const sincronizarEtiquetas = () => setEtiquetasVisibles(mapa.getZoom() >= ZOOM_ETIQUETAS)
    mapa.on('zoomend', sincronizarEtiquetas)
    sincronizarEtiquetas()
    setTimeout(() => mapa.invalidateSize(), 200)
    return () => {
      mapa.off('zoomend', sincronizarEtiquetas)
      mapa.remove()
      mapaRef.current = null
      tileRef.current = null
    }
  }, [])

  // Monta / cambia la capa base cuando el usuario elige Mapa ↔ Satélite.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (tileRef.current) mapa.removeLayer(tileRef.current)
    const cfg = CAPAS[capa] || CAPAS.mapa
    tileRef.current = L.tileLayer(cfg.url, cfg.options)
    tileRef.current.setZIndex(0) // siempre por debajo de la ruta y los pines
    tileRef.current.addTo(mapa)
  }, [capa])

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
        icon: pinLocalidad(loc, destacados.includes(loc.slug), lang),
      })
        .addTo(mapa)
        .on('click', () => cbEntrar.current?.(loc.slug))
      locMarkersRef.current.push(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidades, destacados, lang])

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

  const capas = [
    { id: 'mapa', icono: 'map', lbl: lang === 'es' ? 'Mapa' : 'Map' },
    { id: 'satelite', icono: 'globe', lbl: lang === 'es' ? 'Satélite' : 'Satellite' },
  ]

  return (
    <>
      <div
        ref={contRef}
        className={`mapa-full capa-${capa} ${etiquetasVisibles ? 'labels-on' : ''}`}
      />
      <div
        className="mapa-capas"
        role="group"
        aria-label={lang === 'es' ? 'Capa del mapa' : 'Map layer'}
      >
        {capas.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn-capa ${capa === c.id ? 'activo' : ''}`}
            aria-pressed={capa === c.id}
            onClick={() => setCapa(c.id)}
          >
            <Icon nombre={c.icono} tam={15} />
            <span>{c.lbl}</span>
          </button>
        ))}
      </div>
    </>
  )
})

export default MapView
