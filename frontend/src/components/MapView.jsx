import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
// Extiende el `L` de arriba con L.markerClusterGroup (agrupación de reportes).
// El CSS base del plugin se importa en main.jsx; el icono del grupo es nuestro.
import 'leaflet.markercluster'
import { CATEGORIAS } from '../data/places'
import { ESTILO_REPORTE } from '../data/reportes'
import { RUTA7 } from '../data/ruta7'
import Icon, { iconoHTML } from './Icon'

// Rediseño map-first (Sprint UX/UI): el mapa es el protagonista a pantalla
// completa. Dos vistas:
//  - 'ruta': puntos de localidad sobre la línea de la Carretera Austral.
//  - 'localidad': pines de categoría (gota) de los lugares del pueblo elegido.
// El control de "centrar en mi ubicación" se expone por ref para el rail de la app.

// Capas base seleccionables por el usuario (botón de capas sobre el mapa). Cada
// entrada de CAPAS es una LISTA de teselas, para poder combinar dos fuentes por
// rango de zoom.
//  - 'mapa' → depende de si hay API key de Stadia (VITE_STADIA_API_KEY):
//      · CON key → COMBINA por zoom: lejos, Stadia "Stamen Terrain" (relieve con
//        verde de bosque, estepa parda, agua celeste e hielos blancos → el look
//        "vivo" tipo Google Maps); al ACERCAR (zoom ≥ ZOOM_CORTE_TERRENO) cede a
//        Stadia `osm_bright`, un mapa CALLEJERO con nombres de calles, POIs y
//        parques (calidad Google Maps). El terreno es relieve, no callejero:
//        precioso en la vista general, pero en un pueblo plano queda casi en
//        blanco → por eso las calles toman el detalle de cerca.
//      · SIN key → solo CARTO Voyager sin rótulos (fallback): así el preview y el
//        dev local siguen andando aunque falte la key (el mapa no se rompe).
//    El terreno (lejos) va SIN rótulos: los nombres de localidad los ponen
//    NUESTROS marcadores. Al acercar, `osm_bright` sí trae rótulos de calle/POI
//    (lo que se busca). `{r}` pide teselas @2x (retina) → más nítido en el celular.
//  - 'satelite' → Esri World Imagery: fotografía satelital de alto contraste,
//    útil para ubicar geografía real (ríos, glaciares, sendas).
// Todas quedan cacheadas por el service worker (reglas `carto-tiles`,
// `stadia-tiles` y `esri-tiles` en vite.config.js) para uso sin conexión.
// La key de Stadia es una clave de CLIENTE (restringida por dominio en el panel de
// Stadia), no un secreto de servidor; se inyecta en build (VITE_) como las demás.
// NUNCA se commitea: vive en las env vars de Netlify (ver .env.example / DEPLOY.md).
const STADIA_KEY = import.meta.env.VITE_STADIA_API_KEY || ''

// Zoom en que el basemap "Mapa" pasa de terreno (lejos) a calles (cerca).
const ZOOM_CORTE_TERRENO = 11

// Teselas reutilizables (se combinan por rango de zoom en CAPAS.mapa).
const TESELA_VOYAGER = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  options: { subdomains: 'abcd', attribution: '© OpenStreetMap © CARTO', maxZoom: 20 },
}
const TESELA_TERRENO = {
  url: `https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`,
  options: {
    attribution: '© Stadia Maps © Stamen Design © OpenMapTiles © OpenStreetMap',
    maxZoom: 18,
  },
  esStadia: true,
}
// Calles de calidad "Google Maps" para la cercanía (Stadia `osm_bright`): mapa
// callejero colorido CON nombres de calles, POIs y parques — muy superior al
// Voyager sin rótulos, que se veía pelado. Solo disponible con key de Stadia; sin
// key se cae a Voyager (el fallback keyless de siempre).
const TESELA_CALLES = {
  url: `https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`,
  options: {
    attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap',
    maxZoom: 20,
  },
  esStadia: true,
}

const TESELA_SATELITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  options: {
    attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
}

// Teselas de la capa elegida. `stadiaOk` NO es lo mismo que "hay key": una key
// presente pero RECHAZADA (dominio no autorizado, plan vencido) deja el mapa en
// blanco, y eso pasó de verdad al estrenar rutaaustral.cl — la key seguía ahí,
// restringida al dominio viejo, así que el fallback por "falta la key" no
// entraba. Por eso el mapa también se cae a Voyager cuando las teselas fallan.
function teselasDe(capa, stadiaOk) {
  if (capa === 'satelite') return [TESELA_SATELITE]
  if (!stadiaOk) return [TESELA_VOYAGER]

  // Terreno hasta el corte; calles osm_bright (con rótulos) de ahí en adelante.
  return [
    { ...TESELA_TERRENO, options: { ...TESELA_TERRENO.options, maxZoom: ZOOM_CORTE_TERRENO } },
    { ...TESELA_CALLES, options: { ...TESELA_CALLES.options, minZoom: ZOOM_CORTE_TERRENO } },
  ]
}

// Cuántas teselas de Stadia tienen que fallar para dar la fuente por caída. Con
// la key rechazada fallan TODAS, así que se llega al tope de inmediato; el
// margen está para que un tropiezo suelto de red no degrade el mapa.
const FALLOS_STADIA_PARA_CAER = 3

const CENTRO_RUTA = [-45.5, -72.6]

// Pane propio de la Ruta 7 y duración del fundido al entrar/salir de un pueblo.
const PANE_RUTA = 'ruta7'
const MS_FADE_RUTA = 350

// A partir de este zoom se muestran los nombres de TODAS las localidades (como
// Google Maps: al acercar aparecen las etiquetas). Más lejos que esto solo se
// rotulan las destacadas, para no saturar la vista general de toda la ruta.
const ZOOM_ETIQUETAS = 8

// Pines con área de toque real (iconSize/iconAnchor) para tap-targets correctos.
// `loc.nombre` es bilingüe ({ es, en }): hay que rotular con el idioma activo,
// nunca el objeto crudo (si no, se ve "[object Object]" en la etiqueta).
// `tier` define la jerarquía visual del pin de localidad:
//   'rel'   = ancla (punto coral + etiqueta prominente)
//   'fija'  = hito de referencia (punto verde + etiqueta siempre visible)
//   'menor' = sector/caserío (punto chico y apagado, poca notoriedad)
//   ''      = localidad normal (punto verde, etiqueta solo al acercar)
// `extra` son clases de ajuste del rótulo ('izq', 'alta'): ver
// ETIQUETAS_LOCALIDAD en data/places.js.
function pinLocalidad(loc, tier, lang, extra = '') {
  const nombre = loc.nombre?.[lang] ?? loc.nombre?.es ?? loc.nombre ?? ''
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="pin-loc ${tier} ${extra}"><div class="lbl">${nombre}</div><div class="dot"></div></div>`,
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

// Pin de reporte del crowdsourcing: rombo con el color/icono del tipo. Se
// distingue a propósito de la gota de los lugares (un reporte es temporal y lo
// puso otro viajero, no es contenido curado del directorio).
function pinReporte(tipo) {
  const e = ESTILO_REPORTE[tipo] || { icon: 'alert', c: '#5b6b78' }
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div class="pin-rep" style="--rc:${e.c}"><span class="rombo"></span><span class="ico">${iconoHTML(e.icon, 15, '#fff')}</span></div>`,
  })
}

// Distancia (px) dentro de la cual dos reportes se agrupan. Chica a propósito:
// varios reportes en el MISMO punto (el caso real —la barcaza, el derrumbe, la
// bomba de bencina— donde se apilan y solo se puede tocar el de encima) se
// juntan, pero dos puntos distintos del pueblo siguen separados.
const RADIO_CLUSTER_REP = 36

// Icono del grupo de reportes: el mismo rombo del pin suelto, con el número y
// el color del tipo que más se repite adentro. Así el grupo dice de qué se
// trata antes de abrirlo (tres rombos rojos = faena, no "3 cosas").
function iconoGrupoReportes(cluster) {
  const marcadores = cluster.getAllChildMarkers()
  const cuenta = {}
  marcadores.forEach((m) => {
    const tp = m.options.tipoReporte
    cuenta[tp] = (cuenta[tp] || 0) + 1
  })
  // Empate resuelto por el orden de data/reportes.js (de lo más grave a lo más
  // liviano): sin este desempate el color del grupo dependía del orden interno
  // del plugin y podía cambiar entre renders con los mismos reportes.
  const prioridad = Object.keys(ESTILO_REPORTE)
  // Un tipo desconocido (reporte viejo en IndexedDB tras cambiar la lista de
  // tipos) daría indexOf = -1 y ganaría el desempate: va al final, no al frente.
  const rango = (tp) => (prioridad.indexOf(tp) + 1 || prioridad.length + 1)
  const dominante = Object.entries(cuenta).sort(
    (a, b) => b[1] - a[1] || rango(a[0]) - rango(b[0])
  )[0]?.[0]
  const color = ESTILO_REPORTE[dominante]?.c || '#5b6b78'
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div class="pin-rep grupo" style="--rc:${color}"><span class="rombo"></span><span class="n">${marcadores.length}</span></div>`,
  })
}

const MapView = forwardRef(function MapView(
  {
    vista,
    localidades,
    lugares,
    destacados = [],
    rotuladas = [],
    menores = [],
    etiquetas = {},
    filtro,
    localidadActiva,
    reportes = [],
    onEntrarLocalidad,
    onSeleccionarLugar,
    onSeleccionarReporte,
    onPos,
    onEstadoGeo,
    lang,
  },
  ref
) {
  const contRef = useRef(null)
  const mapaRef = useRef(null)
  const tileLayersRef = useRef([])
  const rutaRef = useRef(null)
  const locMarkersRef = useRef([])
  const catMarkersRef = useRef([])
  // Los reportes viven dentro de un markerClusterGroup, no sueltos en el mapa.
  const repGrupoRef = useRef(null)
  const yoRef = useRef(null)
  const [pos, setPos] = useState(null)
  // Capa base elegida por el usuario y visibilidad de las etiquetas de localidad
  // (según el zoom). Ambas se reflejan como clases del contenedor → las controla
  // React en el className, no con classList (si no, un re-render las borraría).
  const [capa, setCapa] = useState('mapa')
  const [etiquetasVisibles, setEtiquetasVisibles] = useState(false)
  // Stadia se dio por caída en esta sesión (teselas rechazadas): el basemap pasa
  // a Voyager. No se reintenta solo — si la key volvió, se arregla al recargar.
  const [stadiaCaido, setStadiaCaido] = useState(false)
  const fallosStadia = useRef(0)
  // ¿Se puede usar Stadia? Hay key Y todavía no nos rechazó. Manda el basemap de
  // terreno y también el filtro de color (clase `terreno`).
  const stadiaOk = !!STADIA_KEY && !stadiaCaido
  // Estado del GPS, para que el rail pueda dar feedback en el botón "ubicarme":
  //   'buscando' = watchPosition pedido, todavía sin fix (spinner)
  //   'ok'       = hay posición
  //   'sin'      = el navegador no tiene geolocation, o falló/denegó el permiso
  const [estadoGeo, setEstadoGeo] = useState('buscando')

  // Callbacks en refs para no re-suscribir los efectos del mapa en cada render.
  const cbEntrar = useRef(onEntrarLocalidad)
  const cbLugar = useRef(onSeleccionarLugar)
  const cbReporte = useRef(onSeleccionarReporte)
  useEffect(() => {
    cbEntrar.current = onEntrarLocalidad
    cbLugar.current = onSeleccionarLugar
    cbReporte.current = onSeleccionarReporte
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
    // Pane propio para la Ruta 7, con transición de opacidad: así la línea se
    // DESVANECE al entrar a un pueblo en vez de desaparecer de golpe. Va en su
    // propio pane (y no en el overlayPane común) para no arrastrar en el fundido
    // a nada más que se dibuje ahí.
    const paneRuta = mapa.createPane(PANE_RUTA)
    // Mismo z que el overlayPane que usaba antes: por encima de las teselas y por
    // debajo del markerPane (600), así los pines nunca quedan tapados por la línea.
    paneRuta.style.zIndex = '400'
    paneRuta.style.opacity = '1'
    paneRuta.style.transition = `opacity ${MS_FADE_RUTA}ms ease`
    // Muestra/oculta los nombres de todas las localidades según el zoom.
    const sincronizarEtiquetas = () => setEtiquetasVisibles(mapa.getZoom() >= ZOOM_ETIQUETAS)
    mapa.on('zoomend', sincronizarEtiquetas)
    sincronizarEtiquetas()
    setTimeout(() => mapa.invalidateSize(), 200)
    return () => {
      mapa.off('zoomend', sincronizarEtiquetas)
      mapa.remove()
      mapaRef.current = null
      tileLayersRef.current = []
      // El grupo de reportes muere con el mapa: si se conservara, al remontar
      // (StrictMode en dev) se reusaría un grupo atado a un mapa ya destruido.
      repGrupoRef.current = null
    }
  }, [])

  // Monta / cambia la capa base cuando el usuario elige Mapa ↔ Satélite, o
  // cuando Stadia se cae y hay que reemplazarla por Voyager.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    tileLayersRef.current.forEach((l) => mapa.removeLayer(l))
    tileLayersRef.current = []

    // Sin conexión fallan TODAS las teselas, también las de CARTO: ahí el
    // problema no es la key y cambiar de proveedor no arregla nada, solo dejaría
    // al viajero sin el terreno cuando vuelva la señal. Justo el escenario de
    // esta app, así que se ignora.
    const alFallarStadia = () => {
      if (navigator.onLine === false) return
      fallosStadia.current += 1
      if (fallosStadia.current >= FALLOS_STADIA_PARA_CAER) setStadiaCaido(true)
    }

    teselasDe(capa, stadiaOk).forEach((cfg) => {
      const l = L.tileLayer(cfg.url, cfg.options)
      l.setZIndex(0) // siempre por debajo de la ruta y los pines
      if (cfg.esStadia) l.on('tileerror', alFallarStadia)
      l.addTo(mapa)
      tileLayersRef.current.push(l)
    })
  }, [capa, stadiaOk])

  // Traza la Ruta 7 destacada (dato estático, una sola vez): línea naranja con
  // contorno blanco sobre el mapa base; los tramos en barcaza van punteados. Ya
  // no se unen los pueblos con líneas rectas.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || rutaRef.current) return
    const grupo = L.featureGroup()
    RUTA7.forEach((seg) => {
      if (seg.tipo === 'barcaza') {
        // Barcaza (ferry): parte de la Ruta 7 pero PUNTEADA para distinguir el
        // cruce marítimo. Con más cuerpo que antes para acompañar el resalte.
        L.polyline(seg.puntos, {
          pane: PANE_RUTA,
          color: '#d85a30',
          weight: 5,
          opacity: 0.9,
          dashArray: '2 12',
          lineCap: 'round',
        }).addTo(grupo)
      } else {
        // La Ruta 7 como PROTAGONISTA del mapa: halo suave (la despega del fondo
        // sin apagarlo) + contorno blanco + núcleo coral grueso.
        L.polyline(seg.puntos, {
          pane: PANE_RUTA,
          color: '#d85a30',
          weight: 14,
          opacity: 0.2,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(grupo) // halo / glow
        L.polyline(seg.puntos, {
          pane: PANE_RUTA,
          color: '#ffffff',
          weight: 9.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(grupo) // contorno blanco
        L.polyline(seg.puntos, {
          pane: PANE_RUTA,
          color: '#d85a30',
          weight: 5.5,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(grupo) // núcleo coral
      }
    })
    rutaRef.current = grupo
    if (vista === 'ruta') grupo.addTo(mapa)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La ruta destacada solo se muestra en la vista general (en 'localidad' estorba),
  // pero entra y sale con un FUNDIDO: al deseleccionar, desaparecer de golpe una
  // línea tan gruesa se lee como un parpadeo del mapa. Al salir se baja la
  // opacidad del pane y recién al terminar la transición se saca la capa (así no
  // sigue costando render dentro del pueblo).
  useEffect(() => {
    const mapa = mapaRef.current
    const grupo = rutaRef.current
    const pane = mapa?.getPane(PANE_RUTA)
    if (!mapa || !grupo || !pane) return
    if (vista === 'ruta') {
      if (!mapa.hasLayer(grupo)) grupo.addTo(mapa)
      // Doble rAF: el navegador tiene que ver el estado inicial (opacidad 0, si
      // veníamos de un fundido de salida) antes de animar hacia 1.
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          pane.style.opacity = '1'
        })
      )
      return () => cancelAnimationFrame(raf)
    }
    if (!mapa.hasLayer(grupo)) return
    pane.style.opacity = '0'
    const id = setTimeout(() => {
      if (mapa.hasLayer(grupo)) mapa.removeLayer(grupo)
    }, MS_FADE_RUTA)
    return () => clearTimeout(id)
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
      const tier = destacados.includes(loc.slug)
        ? 'rel'
        : rotuladas.includes(loc.slug)
          ? 'fija'
          : menores.includes(loc.slug)
            ? 'menor'
            : ''
      const m = L.marker([loc.lat, loc.lng], {
        icon: pinLocalidad(loc, tier, lang, etiquetas[loc.slug] || ''),
      })
        .addTo(mapa)
        .on('click', () => cbEntrar.current?.(loc.slug))
      locMarkersRef.current.push(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidades, destacados, rotuladas, menores, etiquetas, lang])

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

  // Reportes del crowdsourcing (Fase 3). Se dibujan en LAS DOS vistas: en la ruta
  // son el estado del camino de punta a punta, y dentro de un pueblo son lo que
  // está pasando ahí mismo. Van sobre los demás pines (zIndexOffset) porque son
  // información fresca y perecible.
  //
  // Van AGRUPADOS: los reportes se apilan en los mismos puntos (el muelle de la
  // barcaza, la bomba de bencina, el tramo en obras), y sueltos solo se podía
  // tocar el de encima — los de abajo eran invisibles. Agrupados se ve el número
  // y al acercar se separan; en el zoom máximo se abren en abanico (spiderfy),
  // que es lo que rescata dos reportes con la MISMA coordenada.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (!repGrupoRef.current) {
      repGrupoRef.current = L.markerClusterGroup({
        maxClusterRadius: RADIO_CLUSTER_REP,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: iconoGrupoReportes,
      })
    }
    const grupo = repGrupoRef.current
    grupo.clearLayers()
    reportes.forEach((r) => {
      const m = L.marker([r.lat, r.lng], {
        icon: pinReporte(r.tipo),
        zIndexOffset: 500,
        // Lo lee iconoGrupoReportes para pintar el grupo con el tipo dominante.
        tipoReporte: r.tipo,
      }).on('click', () => cbReporte.current?.(r))
      grupo.addLayer(m)
    })
    if (reportes.length) {
      if (!mapa.hasLayer(grupo)) grupo.addTo(mapa)
    } else if (mapa.hasLayer(grupo)) {
      mapa.removeLayer(grupo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportes])

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
    if (!('geolocation' in navigator)) {
      setEstadoGeo('sin')
      return
    }
    setEstadoGeo('buscando')
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude])
        setEstadoGeo('ok')
      },
      // `watchPosition` sigue vivo tras un error (un timeout en la ruta es
      // normal: el fix puede llegar después). Marcamos 'sin' para no dejar el
      // spinner girando eternamente, pero si más tarde entra una posición el
      // callback de éxito vuelve a poner 'ok'.
      () => setEstadoGeo((e) => (e === 'ok' ? 'ok' : 'sin')),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Avisa a la app si hay ubicación (para habilitar el botón del rail).
  useEffect(() => {
    onPos?.(pos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  // Avisa a la app del estado del GPS (spinner / mensaje del botón "ubicarme").
  useEffect(() => {
    onEstadoGeo?.(estadoGeo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoGeo])

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
      // `interactive: false`: el punto "estás aquí" es decorativo, y si captura
      // toques tapa lo que haya debajo — p. ej. un reporte hecho en ese mismo
      // lugar, que quedaría imposible de abrir.
      yoRef.current = L.marker(pos, {
        icon,
        zIndexOffset: 1000,
        keyboard: false,
        interactive: false,
      })
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
        className={`mapa-full capa-${capa} ${stadiaOk ? 'terreno' : ''} ${etiquetasVisibles ? 'labels-on' : ''}`}
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
