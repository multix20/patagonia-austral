import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
// Extiende el `L` de arriba con L.markerClusterGroup (agrupación de reportes).
// El CSS base del plugin se importa en main.jsx; el icono del grupo es nuestro.
import 'leaflet.markercluster'
import { CATEGORIAS } from '../data/places'
import { esRecomendado, iconoDeLugar } from '../data/iconos'
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
//        un mapa CALLEJERO con nombres de calles (ver ESTILO_CERCA). El terreno
//        es relieve, no callejero: precioso en la vista general, pero en un
//        pueblo plano queda casi en blanco → por eso las calles toman el detalle
//        de cerca.
//      · SIN key → solo CARTO Voyager sin rótulos (fallback): así el preview y el
//        dev local siguen andando aunque falte la key (el mapa no se rompe).
//    El terreno (lejos) va SIN rótulos: los nombres de localidad los ponen
//    NUESTROS marcadores. Al acercar sí entran los rótulos de calle, que es lo
//    que se busca. `{r}` pide teselas @2x (retina) → más nítido en el celular.
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
/**
 * Estilo callejero para la CERCANÍA (dentro de un pueblo). Trae los nombres de
 * calle, que es lo que hacía falta: el terreno es relieve y en un pueblo plano
 * queda casi en blanco.
 *
 * Por qué `alidade_smooth` y no `osm_bright` (ago-2026). Los dos son mapas de
 * OpenStreetMap, pero `osm_bright` dibuja los POI de OSM con harta prominencia, y
 * ahí está el problema: los datos de los servicios chicos de la Austral están
 * incompletos o equivocados en las plataformas globales — es la tesis del
 * producto — y OSM no es la excepción. En Cochrane se veía "Buses Cordillera",
 * un negocio que ya no está donde dice. Eso hace dos daños a la vez: le muestra
 * al viajero un dato falso, y lo pone al lado de NUESTRAS fichas curadas con el
 * mismo peso visual, así que no hay forma de saber cuál de los dos rótulos
 * creer. Un directorio que se vende por tener el dato bueno no puede pintar el
 * dato malo de la competencia encima del suyo.
 *
 * `alidade_smooth` está pensado justamente como fondo para datos propios: mismo
 * proveedor y misma key (cero integración nueva, cero costo extra), conserva
 * calles y nombres de lugar, y baja muchísimo el ruido de POIs ajenos. El mapa
 * pasa a ser el escenario y nuestros pines los protagonistas.
 *
 * El arreglo de fondo —corregir los POI en OpenStreetMap— es gratis y sirve para
 * todos los proveedores a la vez (todos leen la misma base). Va anotado como
 * tarea continua en ESTADO_Y_PENDIENTES.
 *
 * **Corregido el 12-ago-2026: `alidade_smooth` → `outdoors`.** El diagnóstico de
 * arriba sigue en pie —los POI de OSM no pueden competir con nuestras fichas— pero
 * la cura resultó peor que la enfermedad: `alidade_smooth` es un fondo neutro para
 * dashboards, y al acercarse a un pueblo dejaba una lámina gris sin calles ni
 * relieve. Un mapa de viaje que no muestra por dónde se camina no sirve, por
 * limpio que se vea.
 *
 * `outdoors` es del mismo proveedor y la misma key, y es el estilo pensado para
 * justo esto: trae **senderos, curvas de nivel, calles y verde**, que es el
 * lenguaje de una guía de la Carretera Austral, y carga muchísimo menos POI
 * comercial que `osm_bright` — o sea, conserva lo que se ganó al salir de
 * `osm_bright` sin pagar el precio de quedarse sin mapa.
 *
 * Los tres estilos son intercambiables cambiando esta sola cadena:
 *   'outdoors'        → senderos + relieve + calles (actual)
 *   'alidade_smooth'  → fondo neutro, casi sin detalle
 *   'osm_bright'      → callejero completo, con los POI ajenos de vuelta
 */
const ESTILO_CERCA = 'outdoors'
const TESELA_CALLES = {
  url: `https://tiles.stadiamaps.com/tiles/${ESTILO_CERCA}/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`,
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
// Pane propio para los trazados y áreas importados (pasarelas, senderos,
// glaciares). Va DEBAJO del de la Ruta 7 (400) y muy por debajo del markerPane
// (600): son contexto del territorio, no navegación — no pueden taparle a nadie
// el pin que necesita tocar.
const PANE_TRAZADOS = 'trazados'

// Estilo por tipo de trazado. El coral está reservado para la Ruta 7: si las
// pasarelas usaran el mismo color, el viajero leería "por acá se maneja" sobre
// un pueblo donde no entran autos.
const ESTILO_TRAZADO = {
  // Madera: las pasarelas de Tortel son de ciprés y son las "calles" del pueblo.
  pasarela: { color: '#8b5e34', weight: 3, opacity: 0.95 },
  sendero: { color: '#0f6e56', weight: 3, opacity: 0.9, dashArray: '6 6' },
  ruta: { color: '#2f6f9f', weight: 3, opacity: 0.85 },
  area: { color: '#4a90c0', weight: 1.5, opacity: 0.8, fillColor: '#7fb3d5', fillOpacity: 0.22 },
}
const MS_FADE_RUTA = 350

/**
 * Relleno del encuadre de la ruta completa.
 *
 * ASIMÉTRICO porque la cabecera y la barra de categorías FLOTAN sobre el mapa,
 * no le quitan espacio: con relleno parejo, Puerto Montt terminaba debajo de la
 * píldora del título y Villa O'Higgins debajo de la barra — los dos extremos de
 * la ruta, justo tapados. A los lados alcanza con poco (la ruta es angosta),
 * pero no con nada: ahí van las etiquetas de las localidades.
 */
const RELLENO_RUTA = { paddingTopLeft: [36, 96], paddingBottomRight: [36, 100] }

// A partir de este zoom se muestran los nombres de TODAS las localidades (como
// Google Maps: al acercar aparecen las etiquetas). Más lejos que esto solo se
// rotulan las destacadas, para no saturar la vista general de toda la ruta.
const ZOOM_ETIQUETAS = 8

/**
 * Convierte un marcador de Leaflet en un botón de verdad.
 *
 * Leaflet deja cada marcador enfocable con Tab y le pone `role="button"`, pero
 * le faltan las dos cosas que hacen que ese botón exista:
 *  1. El NOMBRE. El `alt` que Leaflet le pone a un icono solo aplica si el icono
 *     es una etiqueta `img`, y los nuestros son `div`: sin `aria-label`, un
 *     lector de pantalla anuncia una fila de botones idénticos sin decir cuál es
 *     cuál.
 *  2. La TECLA. El navegador sintetiza el click de Enter/Espacio en los
 *     controles nativos, no en un `div` con `role="button"`; Leaflet solo
 *     escucha Enter para abrir popups, y estos pines no usan popup. Sin esto el
 *     pin se enfoca y no hace nada — peor que no ser enfocable, porque promete
 *     un botón que no responde.
 *
 * Se llama CADA VEZ que el marcador entra al mapa, no una sola vez al crearlo:
 * los pines de las fichas viven dentro del grupo de agrupación, que los saca y
 * los vuelve a meter al cambiar el zoom, y Leaflet crea un elemento nuevo en
 * cada vuelta. La marca en `dataset` evita atar dos veces la tecla si algún día
 * el elemento sí se reutiliza.
 */
function hacerBoton(marcador, nombre, alActivar) {
  const el = marcador.getElement()
  if (!el || el.dataset.botonListo) return
  el.dataset.botonListo = '1'
  el.setAttribute('aria-label', nombre)
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return
    ev.preventDefault()
    alActivar()
  })
}

// El nombre de la localidad en el idioma activo. `loc.nombre` es bilingüe
// ({ es, en }): hay que resolverlo siempre, nunca pasar el objeto crudo (si no,
// se ve "[object Object]"). Lo usan el rótulo del pin y su nombre accesible, que
// tienen que decir lo mismo.
function nombreLocalidad(loc, lang) {
  return loc.nombre?.[lang] ?? loc.nombre?.es ?? loc.nombre ?? ''
}

// Pines con área de toque real (iconSize/iconAnchor) para tap-targets correctos.
//
// El pin ENTERO abre la localidad: el punto verde y también el nombre. Antes el
// rótulo era decoración (`pointer-events: none` en el CSS), así que el viajero
// apuntaba a la palabra —que es lo grande y lo legible— y el toque le caía al
// mapa. El área tocable del punto son 26 px; la del nombre, la píldora completa
// (ver `.pin-loc .lbl` en styles.css). Un rótulo invisible NO recibe toques: se
// enciende junto con su opacidad, o si no sería una franja transparente
// robándole el toque al mapa y a los pines vecinos.
//
// `tier` define la jerarquía visual del pin de localidad:
//   'rel'   = ancla (punto coral + etiqueta prominente)
//   'fija'  = hito de referencia (punto verde + etiqueta siempre visible)
//   'menor' = sector/caserío (punto chico y apagado, poca notoriedad)
//   ''      = localidad normal (punto verde, etiqueta solo al acercar)
// `extra` son clases de ajuste del rótulo ('izq', 'alta'): ver
// ETIQUETAS_LOCALIDAD en data/places.js.
function pinLocalidad(loc, tier, lang, extra = '', icono = '') {
  const nombre = nombreLocalidad(loc, lang)
  // Marca del pin. Por defecto es el punto verde de siempre; unas pocas
  // localidades llevan un DIBUJO en su lugar (ver ICONOS_LOCALIDAD en
  // data/places.js) porque lo que las hace parada obligada no es el pueblo sino
  // una infraestructura: el avión de Balmaceda es el aeropuerto por donde entra
  // a la región medio viaje a la Austral. Es un disco más grande, así que se
  // reserva para los pocos casos en que el dato vale ese espacio en el mapa.
  const marca = icono
    ? `<div class="dot ico">${iconoHTML(icono, 11, '#fff')}</div>`
    : '<div class="dot"></div>'
  return L.divIcon({
    // La clase va en el elemento de Leaflet, que es el que recibe el foco del
    // teclado (le pone `tabindex` y `role="button"`). Ahí se dibuja el anillo de
    // foco: en el div de adentro no se puede, porque el foco no llega a él.
    className: 'marcador-loc',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="pin-loc ${tier} ${extra}"><div class="lbl">${nombre}</div>${marca}</div>`,
  })
}

/**
 * Gota de un lugar. El dibujo de adentro es el del SUBTIPO (ver
 * `data/iconos.js`): en la gota es donde más se nota, porque es lo único que el
 * viajero ve del servicio antes de tocarlo — una carpa, un taller y una barcaza
 * dicen algo distinto de lo que decía el icono único de su categoría.
 *
 * Con la llama encendida la gota lleva además el sello dorado arriba a la
 * derecha, que es la lectura de un vistazo que pedía una guía de ruta: entre
 * quince gotas naranjas del pueblo, se ve cuál vale la pena.
 */
function pinCategoria(lugar) {
  const c = CATEGORIAS[lugar.cat]
  const rec = esRecomendado(lugar)
  const sello = rec ? `<span class="llama">${iconoHTML('flame', 12, '#7a3f04')}</span>` : ''
  return L.divIcon({
    // Igual que en el pin de localidad: la clase va en el elemento de Leaflet,
    // que es el que recibe el foco del teclado, para poder dibujarle el anillo.
    className: 'marcador-lugar',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    html: `<div class="pin-cat ${rec ? 'rec' : ''}"><div class="teardrop">
      <svg class="body" width="34" height="44" viewBox="0 0 34 44"><path d="M17 43C17 43 32 25 32 15A15 15 0 1 0 2 15C2 25 17 43 17 43Z" fill="${c.color}" stroke="#fff" stroke-width="2.5"/></svg>
      <div class="ico">${iconoHTML(iconoDeLugar(lugar), 17, '#fff')}</div>
      ${sello}
    </div></div>`,
  })
}

// Pin de reporte del crowdsourcing: rombo con el color/icono del tipo. Se
// distingue a propósito de la gota de los lugares (un reporte es temporal y lo
// puso otro viajero, no es contenido curado del directorio).
//
// Va anclado por ABAJO (como la gota de los lugares), no centrado. Centrado
// tapaba por completo el punto de la localidad —que solo tiene 26×26 px
// tocables— y dejaba el pueblo imposible de abrir: el reporte sembrado desde el
// CMS o desde un computador cae justo en el centro del pueblo. Anclado abajo, el
// rombo queda ENCIMA del punto señalándolo, y el punto sigue libre.
function pinReporte(tipo) {
  const e = ESTILO_REPORTE[tipo] || { icon: 'alert', c: '#5b6b78' }
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    html: `<div class="pin-rep" style="--rc:${e.c}"><span class="rombo"></span><span class="ico">${iconoHTML(e.icon, 15, '#fff')}</span></div>`,
  })
}

// Distancia (px) dentro de la cual dos reportes se agrupan. Chica a propósito:
// varios reportes en el MISMO punto (el caso real —la barcaza, el derrumbe, la
// bomba de bencina— donde se apilan y solo se puede tocar el de encima) se
// juntan, pero dos puntos distintos del pueblo siguen separados.
const RADIO_CLUSTER_REP = 36
// Radio del grupo de LUGARES. Más chico que el de reportes: dentro de un pueblo
// los servicios están a media cuadra unos de otros y un radio grande los mete a
// todos en una sola bolita, que es tan inútil como el montón de pines.
const RADIO_CLUSTER_LUG = 44

// Icono del grupo de LUGARES. Toma el color de la categoría que más se repite
// adentro, así el grupo dice de qué se trata antes de abrirlo: una bolita
// morada con "12" es "acá hay doce donde dormir", no "acá hay doce cosas".
function iconoGrupoLugares(cluster) {
  const cuenta = {}
  cluster.getAllChildMarkers().forEach((m) => {
    const c = m.options.catLugar
    cuenta[c] = (cuenta[c] || 0) + 1
  })
  // Empate resuelto por el orden de CATEGORIAS, para que el color no cambie
  // entre renders con los mismos lugares.
  const prioridad = Object.keys(CATEGORIAS)
  const rango = (c) => (prioridad.indexOf(c) + 1 || prioridad.length + 1)
  const dominante = Object.entries(cuenta).sort(
    (a, b) => b[1] - a[1] || rango(a[0]) - rango(b[0])
  )[0]?.[0]
  const color = CATEGORIAS[dominante]?.color || 'var(--verde)'
  const n = cluster.getChildCount()
  // Si adentro hay al menos una ficha con la llama, la bolita la muestra. Sin
  // esto, agrupar ESCONDE justo lo que la llama quería contar: al alejarse un
  // paso, el único lugar recomendado del pueblo desaparecía dentro de un número.
  const rec = cluster.getAllChildMarkers().some((m) => m.options.recLugar)
  const sello = rec ? `<span class="llama">${iconoHTML('flame', 11, '#7a3f04')}</span>` : ''
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    html: `<div class="cluster-pin ${rec ? 'rec' : ''}" style="background:${color}">${n}${sello}</div>`,
  })
}

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
    iconAnchor: [18, 36], // anclado abajo, igual que el pin suelto
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
    iconos = {},
    filtro,
    localidadActiva,
    reportes = [],
    rutas = [],
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
  // Los lugares también viven dentro de un markerClusterGroup.
  const catGrupoRef = useRef(null)
  // Los reportes viven dentro de un markerClusterGroup, no sueltos en el mapa.
  const repGrupoRef = useRef(null)
  const trazadosRef = useRef(null)
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

  // Las fichas, también en un ref. El encuadre por categoría las necesita para
  // calcular los límites, pero NO puede depender de ellas: `lugares` cambia
  // cuando llega el dato de la API o cuando alguien califica, y refrescar el
  // encuadre ahí le movería el mapa al viajero mientras lo está mirando.
  const lugaresRef = useRef(lugares)

  // Callbacks en refs para no re-suscribir los efectos del mapa en cada render.
  const cbEntrar = useRef(onEntrarLocalidad)
  const cbLugar = useRef(onSeleccionarLugar)
  const cbReporte = useRef(onSeleccionarReporte)
  useEffect(() => {
    cbEntrar.current = onEntrarLocalidad
    cbLugar.current = onSeleccionarLugar
    cbReporte.current = onSeleccionarReporte
    lugaresRef.current = lugares
  })

  // Controles que la app maneja desde fuera. Aquí estaba `centrarEnMi()`, que
  // servía al botón de GPS del rail; ese botón lo reemplazó el asistente, así
  // que el método se fue con él. La ubicación se sigue vigilando (el punto
  // "estás aquí" y el pin de los reportes dependen de ella), solo que ya no hay
  // nada que la centre a mano.
  useImperativeHandle(ref, () => ({
    /**
     * Lleva el mapa a los reportes del tramo elegido (lo llama el filtro de la
     * app). Sin puntos vuelve a encuadrar la ruta completa, que es lo que
     * corresponde al soltar el filtro. El `maxZoom` evita que un solo reporte
     * deje al viajero mirando una esquina de calle sin contexto de ruta.
     */
    encuadrarReportes(puntos) {
      const mapa = mapaRef.current
      if (!mapa) return
      if (!puntos?.length) {
        if (rutaRef.current) {
          mapa.flyToBounds(rutaRef.current.getBounds(), { ...RELLENO_RUTA, duration: 0.8 })
        }
        return
      }
      mapa.flyToBounds(L.latLngBounds(puntos), {
        padding: [70, 70],
        maxZoom: 11,
        duration: 0.8,
      })
    },
  }))

  // Inicializa el mapa una sola vez (la capa base la monta el efecto de `capa`).
  useEffect(() => {
    if (mapaRef.current) return
    const mapa = L.map(contRef.current, {
      zoomControl: false,
      attributionControl: true,
      /**
       * Zoom en pasos de un cuarto, y no de uno entero (lo que trae Leaflet).
       *
       * Importa por la forma de esta ruta en concreto: la Carretera Austral
       * mide 7,0° de latitud por 1,33° de longitud —779 km de alto por 105 de
       * ancho, siete veces más alta que ancha—, así que el encuadre siempre lo
       * manda la altura. Para que quepa entera hace falta un zoom de 6,8; con
       * pasos enteros Leaflet tiene que redondear HACIA ABAJO, a 6, y la ruta
       * termina ocupando poco más de la mitad del alto disponible. Ese sobrante
       * es el vacío que se veía por encima de Puerto Montt y por debajo de
       * Villa O'Higgins.
       *
       * El precio de los pasos fraccionarios es que la tesela se escala en vez
       * de dibujarse a tamaño nativo. A un cuarto de nivel el reescalado no se
       * nota, y a cambio la ruta —que es el contenido— gana casi la mitad de
       * pantalla. `zoomDelta` se deja en 1 para que el pellizco y los botones
       * sigan moviéndose de nivel en nivel.
       */
      zoomSnap: 0.25,
      zoomDelta: 1,
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
    const paneTrazados = mapa.createPane(PANE_TRAZADOS)
    paneTrazados.style.zIndex = '390'
    // Muestra/oculta los nombres de todas las localidades según el zoom.
    const sincronizarEtiquetas = () => setEtiquetasVisibles(mapa.getZoom() >= ZOOM_ETIQUETAS)
    mapa.on('zoomend', sincronizarEtiquetas)
    sincronizarEtiquetas()
    setTimeout(() => mapa.invalidateSize(), 200)

    /**
     * Leaflet mide el contenedor UNA vez y guarda ese tamaño. Solo lo revisa de
     * nuevo si le llega un `resize` de `window` (su `trackResize`), y en un
     * teléfono el contenedor cambia de alto SIN que eso pase: `100dvh` se
     * recalcula solo cuando la barra del navegador se pliega o se despliega, y
     * ahí no hay evento de window que valga.
     *
     * Con el tamaño viejo, Leaflet dibuja teselas para una pantalla que ya no
     * existe. Medido: al crecer el contenedor de 700 a 900 px sin `resize`,
     * quedaban 37 px de franja SIN NINGUNA tesela, y el centro real del mapa
     * dejaba de coincidir con el que Leaflet cree que tiene — de ahí que al
     * cambiar de capa o de vista el mapa "saltara" a un lugar que no era.
     *
     * El observador lo arregla de raíz: cualquier cambio de tamaño del div, y
     * venga de donde venga, se le avisa a Leaflet.
     */
    const observador = new ResizeObserver(() => mapa.invalidateSize({ pan: false }))
    observador.observe(contRef.current)

    return () => {
      observador.disconnect()
      mapa.off('zoomend', sincronizarEtiquetas)
      mapa.remove()
      mapaRef.current = null
      tileLayersRef.current = []
      // El grupo de reportes muere con el mapa: si se conservara, al remontar
      // (StrictMode en dev) se reusaría un grupo atado a un mapa ya destruido.
      repGrupoRef.current = null
      catGrupoRef.current = null
      trazadosRef.current = null
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
  // Trazados y áreas importados (pasarelas de Tortel, senderos, glaciares).
  //
  // Solo se dibujan DENTRO de una localidad, igual que se filtran los lugares:
  // las pasarelas de Tortel sobre el mapa de toda la Carretera Austral serían una
  // mancha ilegible de 1.000 km de largo, y el viajero que mira la ruta completa
  // está decidiendo a qué pueblo entrar, no por qué pasarela caminar.
  //
  // Se usa L.geoJSON y no L.polyline a propósito: consume la geometría tal cual
  // viene de la API —incluidos Polygon y MultiLineString— y se encarga del orden
  // [lon, lat] del estándar, que es justo donde uno invierte las coordenadas sin
  // darse cuenta y termina dibujando en China.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return

    if (trazadosRef.current) {
      trazadosRef.current.remove()
      trazadosRef.current = null
    }
    if (vista !== 'localidad' || !localidadActiva) return

    // `localidadActiva` es el OBJETO de la localidad, no su slug: comparar
    // contra él directamente no calza nunca y la capa no se dibujaría jamás.
    const visibles = rutas.filter((r) => r.localidad === localidadActiva.slug)
    if (visibles.length === 0) return

    const grupo = L.featureGroup()
    visibles.forEach((r) => {
      const estilo = ESTILO_TRAZADO[r.tipo] || ESTILO_TRAZADO.ruta
      const capa = L.geoJSON(
        { type: 'Feature', geometry: r.geometria, properties: {} },
        { pane: PANE_TRAZADOS, style: estilo }
      )
      const nombre = r.nombre?.[lang] || r.nombre?.es
      if (nombre) {
        const km = r.largo_km ? ` · ${r.largo_km} km` : ''
        capa.bindTooltip(`${nombre}${km}`, { sticky: true })
      }
      capa.addTo(grupo)
    })
    grupo.addTo(mapa)
    trazadosRef.current = grupo

    return () => {
      grupo.remove()
      if (trazadosRef.current === grupo) trazadosRef.current = null
    }
    // Depende del SLUG y no del objeto: el objeto cambia de identidad en cada
    // render de App y volvería a dibujar la capa entera sin necesidad. La omisión
    // es deliberada y va silenciada como en el resto del archivo — si no, deja un
    // warning permanente en `npm run lint`, que es lo que hace que después nadie
    // mire la salida del linter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas, vista, localidadActiva?.slug, lang])

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
    if (catGrupoRef.current) {
      catGrupoRef.current.clearLayers()
      mapaRef.current?.removeLayer(catGrupoRef.current)
    }
  }

  // Pines de localidad (vista 'ruta').
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (vista !== 'ruta') return limpiarLoc()
    limpiarLoc()
    // Verbo del nombre accesible del pin. MapView recibe `lang`, no `t()`, así
    // que las dos cadenas van acá mismo, igual que los rótulos del selector de
    // capas de más abajo.
    const verAccion = lang === 'es' ? 'Ver' : 'View'
    localidades.forEach((loc) => {
      const tier = destacados.includes(loc.slug)
        ? 'rel'
        : rotuladas.includes(loc.slug)
          ? 'fija'
          : menores.includes(loc.slug)
            ? 'menor'
            : ''
      const m = L.marker([loc.lat, loc.lng], {
        icon: pinLocalidad(loc, tier, lang, etiquetas[loc.slug] || '', iconos[loc.slug] || ''),
        // Por encima de los reportes (que van en 500): entrar al pueblo es la
        // navegación principal del mapa y no puede quedar bloqueada por un pin
        // temporal que le cayó encima. Cinturón y tirantes con el anclaje del
        // pin de reporte, que además ya lo corre hacia arriba.
        zIndexOffset: 600,
      })
        .addTo(mapa)
        .on('click', () => cbEntrar.current?.(loc.slug))
      hacerBoton(m, `${verAccion} ${nombreLocalidad(loc, lang)}`, () =>
        cbEntrar.current?.(loc.slug)
      )
      locMarkersRef.current.push(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidades, destacados, rotuladas, menores, etiquetas, iconos, lang])

  // Pines de categoría (vista 'localidad'), según filtro.
  //
  // Van AGRUPADOS. Sueltos funcionaban con seis fichas por pueblo; con el mapa
  // municipal de Tortel cargado son más de cien en cuatro cuadras y el mapa se
  // vuelve un muro de gotas superpuestas donde no se distingue ni el pueblo ni
  // cuántas cosas hay. Agrupar además responde la pregunta útil de un vistazo
  // —"acá hay doce donde dormir"— y al acercarse se abren solas.
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    if (vista !== 'localidad') return limpiarCat()
    limpiarCat()

    if (!catGrupoRef.current) {
      catGrupoRef.current = L.markerClusterGroup({
        maxClusterRadius: RADIO_CLUSTER_LUG,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: iconoGrupoLugares,
      })
    }
    const grupo = catGrupoRef.current
    grupo.clearLayers()

    const verAccion = lang === 'es' ? 'Ver' : 'View'
    const visibles = lugares.filter((l) => !filtro || l.cat === filtro)
    visibles.forEach((l) => {
      const rec = esRecomendado(l)
      const m = L.marker([l.lat, l.lng], {
        icon: pinCategoria(l),
        // Lo recomendado va por encima de lo demás cuando dos gotas se pisan: el
        // sello no sirve de nada si queda tapado por el pin de al lado. Se queda
        // corto del +500 de los reportes, que son información perecible y mandan.
        zIndexOffset: rec ? 200 : 0,
        // Lo lee iconoGrupoLugares para pintar el grupo con la categoría dominante.
        catLugar: l.cat,
        // …y esto, para saber si el grupo lleva llama.
        recLugar: rec,
      }).on('click', () => cbLugar.current?.(l))
      // El nombre accesible lleva TAMBIÉN la categoría, porque en la pantalla esa
      // información la dan el color y el dibujo de la gota: sin ella, quien no ve
      // el pin pierde justo lo que distingue un hostal de una bomba de bencina.
      const nombre = l.nombre?.[lang] ?? l.nombre?.es ?? ''
      const cat = CATEGORIAS[l.cat]?.nombre?.[lang] ?? ''
      // En 'add' y no acá: el pin vive dentro del grupo de agrupación, que lo saca
      // y lo vuelve a meter en cada cambio de zoom. Al crearlo todavía no está en
      // el DOM, así que `getElement()` daría null.
      m.on('add', () => hacerBoton(m, [verAccion, nombre, cat].filter(Boolean).join(' · '), () => cbLugar.current?.(l)))
      grupo.addLayer(m)
    })

    if (visibles.length) {
      if (!mapa.hasLayer(grupo)) grupo.addTo(mapa)
    } else if (mapa.hasLayer(grupo)) {
      mapa.removeLayer(grupo)
    }

    // Las BOLITAS de grupo también son botones, y con el mismo agujero: Leaflet
    // las deja enfocables y anunciadas como botón, mudas y sin responder a
    // Enter. Y son las que están DELANTE de las gotas —un pueblo con fichas
    // juntas muestra la bolita, no los pines—, así que dejarlas fuera del arreglo
    // vale casi lo mismo que no haberlo hecho: el teclado llegaría a un número
    // sin nombre que no se abre. El grupo las crea y las destruye en cada cambio
    // de zoom, por eso se enganchan por evento del mapa y no en un `forEach`.
    const alAgregarCapa = (ev) => {
      const capa = ev.layer
      if (!L.MarkerCluster || !(capa instanceof L.MarkerCluster)) return
      const n = capa.getChildCount()
      const texto = lang === 'es' ? `Ver ${n} lugares agrupados` : `View ${n} grouped places`
      hacerBoton(capa, texto, () => capa.zoomToBounds({ padding: [40, 40] }))
    }
    mapa.on('layeradd', alAgregarCapa)
    return () => mapa.off('layeradd', alAgregarCapa)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, lugares, filtro, lang])

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
      mapa.flyToBounds(rutaRef.current.getBounds(), { ...RELLENO_RUTA, duration: 0.8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, localidadActiva?.slug])

  /**
   * Encuadre al filtrar por categoría.
   *
   * Un pueblo se abre con zoom fijo sobre su centro, y eso deja fuera justo lo
   * que hace viajar: la Confluencia de los ríos Baker y Neff está a 22 km de
   * Cochrane, así que al tocar "Qué visitar" el mapa mostraba la plaza y
   * ninguno de los atractivos que justifican el desvío. La categoría quedaba
   * respondida a medias — el pin existía, pero fuera de pantalla.
   *
   * Al filtrar, el mapa se abre hasta que quepan TODOS los puntos de esa
   * categoría **más el centro del pueblo**. Lo segundo no sobra: sin esa ancla
   * el mapa puede volar a un valle a media hora de camino y el viajero pierde
   * la referencia de dónde queda eso respecto del pueblo, que es exactamente lo
   * que necesita para decidir si va.
   *
   * Al soltar el filtro se vuelve a la vista del pueblo.
   */
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || vista !== 'localidad' || !localidadActiva) return

    const centro = [localidadActiva.lat, localidadActiva.lng]
    const puntos = filtro
      ? lugaresRef.current.filter((l) => l.cat === filtro).map((l) => [l.lat, l.lng])
      : []

    if (!puntos.length) {
      mapa.flyTo(centro, localidadActiva.zoom || 14, { duration: 0.7 })
      return
    }

    mapa.flyToBounds(L.latLngBounds([centro, ...puntos]), {
      // Relleno ASIMÉTRICO: la barra de categorías tapa la franja de abajo y la
      // cabecera la de arriba. Con relleno parejo, el pin más al sur quedaba
      // debajo del mismo botón que se acababa de tocar.
      paddingTopLeft: [40, 96],
      paddingBottomRight: [40, 104],
      // Tope de acercamiento: una categoría con una sola ficha en el centro del
      // pueblo, sin esto, deja al viajero mirando una esquina de calle.
      maxZoom: localidadActiva.zoom || 14,
      duration: 0.8,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, vista, localidadActiva?.slug])

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
      {/*
        DOS divs y no uno, a propósito. Las clases de tema (capa, terreno,
        labels-on) las pone React; el div de adentro es de Leaflet y React no lo
        toca nunca.

        Antes era un solo div con las dos cosas, y el resultado era un bug de
        verdad: Leaflet se agrega SUS clases al montar (`leaflet-container`,
        `leaflet-touch`, `leaflet-grab`…) escribiendo el DOM directo, y en
        cuanto React re-renderizaba con un className distinto —basta con que
        aparezcan las etiquetas al acercarse— las borraba todas. Con
        `leaflet-container` se iban `touch-action: none` y `overflow: hidden`,
        o sea que en un teléfono el navegador se quedaba los gestos y el mapa
        dejaba de responder al pellizco y al arrastre. Medido: al entrar a una
        localidad, `touch-action` pasaba de `none` a `auto`.
      */}
      <div
        className={`mapa-full capa-${capa} ${stadiaOk ? 'terreno' : ''} ${etiquetasVisibles ? 'labels-on' : ''}`}
      >
        <div ref={contRef} className="mapa-lienzo" />
      </div>
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
            aria-label={c.lbl}
            title={c.lbl}
            onClick={() => setCapa(c.id)}
          >
            {/* Solo el icono: el rótulo se quitó el 12-ago-2026. "Mapa /
                Satélite" ocupaba una barra entera sobre el mapa para nombrar dos
                estados que el propio mapa muestra —se ve si es foto o dibujo—, y
                encima competía con la barra superior justo debajo. El nombre
                sigue disponible para quien lo necesita: va en `title` y en
                `aria-label`, así que el lector de pantalla lo lee igual. */}
            <Icon nombre={c.icono} tam={17} />
          </button>
        ))}
      </div>
    </>
  )
})

export default MapView
