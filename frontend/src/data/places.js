// Datos semilla del directorio turístico (contenido de ejemplo para desarrollo).
// En producción estos contenidos provienen de la API Laravel (/api/places)
// y son administrados por funcionarios municipales desde el CMS.

// Localidades de la Carretera Austral completa, Puerto Montt → Villa O'Higgins
// (multi-localidad, Fases 1, 2 y 2.5). El slug es la clave estable que une
// lugares ↔ localidades (igual al backend). `orden` va norte → sur en decenas
// (10 Puerto Montt … 190 Villa O'Higgins) para poder intercalar pueblos.
// Los desvíos usan valores intermedios: Caleta Gonzalo (30) es el corazón de
// Pumalín entre las barcazas; Futaleufú (55) y Palena (58) son el ramal este
// desde Villa Santa Lucía; Puerto Cisnes (95) el desvío costero; Puerto Aysén
// (110) y Chacabuco (115) la Ruta 240 desde Coyhaique; Chile Chico (155) la
// ribera sur del lago General Carrera entre Guadal y Bertrand.
export const LOCALIDADES_SEED = [
  {
    slug: 'puerto-montt',
    nombre: { es: 'Puerto Montt', en: 'Puerto Montt' },
    lat: -41.4693, lng: -72.9424, zoom: 13, orden: 10,
  },
  {
    slug: 'hornopiren',
    nombre: { es: 'Hornopirén', en: 'Hornopirén' },
    lat: -41.9578, lng: -72.4372, zoom: 14, orden: 20,
  },
  {
    slug: 'caleta-gonzalo',
    nombre: { es: 'Caleta Gonzalo (Pumalín)', en: 'Caleta Gonzalo (Pumalín)' },
    lat: -42.5633, lng: -72.5989, zoom: 14, orden: 30,
  },
  {
    slug: 'chaiten',
    nombre: { es: 'Chaitén', en: 'Chaitén' },
    lat: -42.9169, lng: -72.7086, zoom: 14, orden: 40,
  },
  {
    slug: 'el-amarillo',
    nombre: { es: 'El Amarillo', en: 'El Amarillo' },
    lat: -42.9333, lng: -72.5333, zoom: 15, orden: 45,
  },
  {
    slug: 'villa-santa-lucia',
    nombre: { es: 'Villa Santa Lucía', en: 'Villa Santa Lucía' },
    lat: -43.4167, lng: -72.3667, zoom: 15, orden: 50,
  },
  {
    slug: 'futaleufu',
    nombre: { es: 'Futaleufú', en: 'Futaleufú' },
    lat: -43.1847, lng: -71.8697, zoom: 14, orden: 55,
  },
  {
    slug: 'palena',
    nombre: { es: 'Palena', en: 'Palena' },
    lat: -43.6167, lng: -71.8, zoom: 15, orden: 58,
  },
  {
    slug: 'la-junta',
    nombre: { es: 'La Junta', en: 'La Junta' },
    lat: -43.9756, lng: -72.4058, zoom: 14, orden: 70,
  },
  {
    // Desvío costero al oeste desde La Junta (Ruta X-12), boca del río Palena.
    slug: 'raul-marin-balmaceda',
    nombre: { es: 'Raúl Marín Balmaceda', en: 'Raúl Marín Balmaceda' },
    lat: -43.7783, lng: -72.9603, zoom: 15, orden: 72,
  },
  {
    slug: 'puyuhuapi',
    nombre: { es: 'Puyuhuapi', en: 'Puyuhuapi' },
    lat: -44.3286, lng: -72.5567, zoom: 14, orden: 80,
  },
  {
    slug: 'villa-amengual',
    nombre: { es: 'Villa Amengual', en: 'Villa Amengual' },
    lat: -44.7167, lng: -72.1667, zoom: 15, orden: 90,
  },
  {
    slug: 'puerto-cisnes',
    nombre: { es: 'Puerto Cisnes', en: 'Puerto Cisnes' },
    lat: -44.7422, lng: -72.6889, zoom: 14, orden: 95,
  },
  {
    slug: 'villa-manihuales',
    nombre: { es: 'Villa Mañihuales', en: 'Villa Mañihuales' },
    lat: -45.2103, lng: -72.1547, zoom: 15, orden: 100,
  },
  {
    slug: 'puerto-aysen',
    nombre: { es: 'Puerto Aysén', en: 'Puerto Aysén' },
    lat: -45.4033, lng: -72.6947, zoom: 14, orden: 110,
  },
  {
    slug: 'puerto-chacabuco',
    nombre: { es: 'Puerto Chacabuco', en: 'Puerto Chacabuco' },
    lat: -45.4667, lng: -72.8167, zoom: 15, orden: 115,
  },
  {
    slug: 'coyhaique',
    nombre: { es: 'Coyhaique', en: 'Coyhaique' },
    lat: -45.5719, lng: -72.0683, zoom: 13, orden: 120,
  },
  {
    // Desvío SE desde Coyhaique (Ruta 245); aeropuerto regional de Aysén.
    slug: 'balmaceda',
    nombre: { es: 'Balmaceda', en: 'Balmaceda' },
    lat: -45.9137, lng: -71.6947, zoom: 15, orden: 125,
  },
  {
    slug: 'villa-cerro-castillo',
    nombre: { es: 'Villa Cerro Castillo', en: 'Villa Cerro Castillo' },
    lat: -46.1216, lng: -72.1636, zoom: 15, orden: 130,
  },
  {
    slug: 'puerto-rio-tranquilo',
    nombre: { es: 'Puerto Río Tranquilo', en: 'Puerto Río Tranquilo' },
    lat: -46.6252, lng: -72.6735, zoom: 14, orden: 140,
  },
  {
    slug: 'puerto-guadal',
    nombre: { es: 'Puerto Guadal', en: 'Puerto Guadal' },
    lat: -46.8442, lng: -72.7027, zoom: 15, orden: 150,
  },
  {
    slug: 'chile-chico',
    nombre: { es: 'Chile Chico', en: 'Chile Chico' },
    lat: -46.5399, lng: -71.7288, zoom: 14, orden: 155,
  },
  {
    slug: 'puerto-bertrand',
    nombre: { es: 'Puerto Bertrand', en: 'Puerto Bertrand' },
    lat: -47.0219, lng: -72.8247, zoom: 15, orden: 160,
  },
  {
    slug: 'cochrane',
    nombre: { es: 'Cochrane', en: 'Cochrane' },
    lat: -47.2539, lng: -72.5732, zoom: 13, orden: 170,
  },
  {
    slug: 'caleta-tortel',
    nombre: { es: 'Caleta Tortel', en: 'Caleta Tortel' },
    lat: -47.7967, lng: -73.536, zoom: 15, orden: 180,
  },
  // Puerto Yungay (11-ago-2026). No es un pueblo: es la RAMPA del cruce
  // obligatorio hacia el tramo final de la Carretera Austral. Entra igual porque
  // para el viajero es un hito de decisión —ahí se espera la barcaza y ahí se
  // come antes de seguir— y hasta ahora no existía en la app. Coordenadas
  // ancladas en los dos únicos puntos conocidos del sector (la cafetería y las
  // cabañas El Peregrino, del mapa municipal de Tortel); afinar si aparece una
  // fuente mejor para la rampa misma.
  {
    slug: 'puerto-yungay',
    nombre: { es: 'Puerto Yungay', en: 'Puerto Yungay' },
    lat: -47.9343, lng: -73.3241, zoom: 14, orden: 185,
  },
  {
    slug: 'villa-ohiggins',
    nombre: { es: "Villa O'Higgins", en: "Villa O'Higgins" },
    lat: -48.4686, lng: -72.5601, zoom: 14, orden: 190,
  },
]

// Localidades ancla (puertas de entrada de la Carretera Austral) que se resaltan
// en el mapa de la vista general al iniciar la app: punto de partida norte, capital
// regional, destino #1 de atenciones OIT e ícono del extremo sur. Es una decisión
// de producto (curada y estable), independiente del flag comercial `destacado` de
// cada ficha, para que el turista fije de un vistazo los hitos de la ruta y no salte
// una localidad cualquiera por tener una ficha destacada.
export const LOCALIDADES_DESTACADAS = [
  'puerto-montt', // inicio norte de la Carretera Austral
  'chaiten', // puerta de entrada norte (ferry, acceso a Pumalín)
  'coyhaique', // capital regional de Aysén
  'cochrane', // destino #1 de la región por atenciones OIT
  'caleta-tortel', // ícono del extremo sur (pasarelas)
]

// Segundo nivel: localidades que muestran SIEMPRE su nombre en la vista general
// (hitos de referencia para orientarse a lo largo de la ruta), pero SIN el
// resalte coral de las anclas — punto verde normal, solo la etiqueta fija. Así el
// mapa no queda tan vacío sin descuadrar la jerarquía de las 4 destacadas.
export const LOCALIDADES_ROTULADAS = [
  'la-junta', // nudo norte (cruce a Raúl Marín / Palena-Futaleufú)
  // Puyuhuapi vuelve a rotular fijo: se había sacado porque su nombre chocaba con
  // el de La Junta, y eso lo resuelve el lado (ahora rotula a la IZQUIERDA, ver
  // ETIQUETAS_LOCALIDAD), no el sacarle la etiqueta.
  'puyuhuapi', // fiordo Puyuhuapi, termas y puerta del Queulat
  'puerto-cisnes', // desvío costero de la Ruta X-25
  'puerto-aysen', // Ruta 240, acceso a Chacabuco y los fiordos
  'puerto-rio-tranquilo', // base de las Capillas de Mármol
  'chile-chico', // ribera sur del lago General Carrera (etiqueta a la derecha)
  'villa-ohiggins', // extremo sur de la Carretera Austral
  // Los dos desvíos al este desde Villa Santa Lucía / Puerto Ramírez (Ruta 235).
  // Van rotulados porque el borde argentino del mapa es espacio limpio: se leen
  // sin tapar nada y explican un cruce de frontera que en la ruta se pregunta
  // mucho. Sin etiqueta eran dos puntos verdes mudos al este de Chaitén.
  'futaleufu', // río Futaleufú (rafting) y paso Futaleufú → Trevelin/Esquel
  'palena', // valle del río Palena y paso Río Encuentro
  // Puerto Yungay rotula fijo por la misma razón que Futaleufú y Palena: no es
  // un pueblo, es un CRUCE que en la ruta se pregunta mucho ("¿a qué hora sale
  // la barcaza?"). Sin etiqueta sería un punto verde mudo entre Tortel y Villa
  // O'Higgins, justo donde el viajero necesita entender que hay que embarcar.
  // Rotula a la DERECHA (por defecto, sin entrada en ETIQUETAS_LOCALIDAD): a su
  // izquierda ya rotula Caleta Tortel hacia los canales y los dos nombres se
  // encimarían; a la derecha el mapa está limpio hasta la frontera.
  'puerto-yungay',
]

// Ajustes finos del rótulo del pin de localidad (slug → clases extra). Por
// defecto el nombre va a la DERECHA del punto y a su misma altura; estas
// excepciones evitan que dos rótulos vecinos se encimen en la vista general:
//   'izq'  → el nombre va a la IZQUIERDA del punto
//   'alta' → el nombre sube una línea
// Criterio general del costado: la Carretera Austral corre pegada al borde
// oeste del continente, así que a la DERECHA de un pueblo suele haber cordillera
// y route, y a la IZQUIERDA, mar o fiordo — es decir, mapa vacío donde el nombre
// se lee limpio y no tapa nada. Por eso los pueblos costeros rotulan al agua.
export const ETIQUETAS_LOCALIDAD = {
  // Costeros del tramo norte: a su derecha corre la Ruta 7 con los pueblos
  // vecinos; a su izquierda está el mar, que es donde cabe el nombre.
  chaiten: 'izq',
  puyuhuapi: 'izq',
  // Puerto Aysén llevaba 'alta' (subido una línea) porque su nombre chocaba con
  // el de Coyhaique, que está casi a su misma latitud. Al mandarlo al fiordo el
  // choque desaparece por el lado, así que el 'alta' se quitó: sobraba, y solo
  // despegaba la etiqueta de su propio punto.
  'puerto-aysen': 'izq',
  // Puerto Cisnes está al final del desvío costero de la X-25, o sea A LA
  // IZQUIERDA de la Ruta 7 y casi a la misma latitud que Villa Amengual, que
  // queda sobre la ruta. Con el rótulo por defecto (a la derecha) el nombre
  // salía disparado hacia el interior y se topaba con el de Amengual justo
  // encima del tronco de la Carretera — dos nombres encimados tapando la línea
  // que el mapa existe para mostrar. Mandado al canal Puyuhuapi se lee solo.
  'puerto-cisnes': 'izq',
  // Los dos pueblos del lago General Carrera rotulan hacia AFUERA del lago, cada
  // uno hacia su propia orilla: Chile Chico está en el borde ESTE, así que su
  // nombre va a la derecha (hacia Argentina, que en el mapa es espacio limpio), y
  // Puerto Río Tranquilo está en el borde OESTE, así que va a la izquierda. Si
  // ambos rotularan hacia adentro, los dos nombres se juntarían sobre el lago.
  // Chile Chico usa el lado derecho por defecto: no necesita entrada aquí.
  'puerto-rio-tranquilo': 'izq',
  // Tortel está metido en el estuario del Baker: a su derecha quedan el río y el
  // camino a Cochrane, y a su izquierda los canales — ahí el nombre va suelto.
  'caleta-tortel': 'izq',
}

// Tercer nivel: localidades "menores" que se conservan (con sus lugares) pero se
// dibujan con poca notoriedad en el mapa — punto chico y apagado, sin etiqueta
// fija. Para caseríos/sectores que no son un pueblo en sí (p. ej. El Amarillo,
// portal de Pumalín cerca de Chaitén), sin perder sus atractivos.
export const LOCALIDADES_MENORES = [
  'el-amarillo', // sector cerca de Chaitén (termas, ventisquero, portal Pumalín)
]

// Mapa slug → nombre ES de la localidad, para armar búsquedas legibles.
const NOMBRE_LOCALIDAD = Object.fromEntries(
  LOCALIDADES_SEED.map((l) => [l.slug, l.nombre.es])
)

// URL de "Cómo llegar" / compartir. Google Maps rutea al destino buscándolo por
// NOMBRE + localidad + país, NO por coordenada: las lat/lng guardadas son
// aproximadas (muchas fichas SERNATUR traían coordenadas placeholder y se
// dispersaron al centro del pueblo), mientras que Google conoce estos negocios y
// atractivos como POIs y los ubica en su dirección real. Si faltara el nombre,
// cae a las coordenadas para no romper el enlace.
export function urlComoLlegar(lugar, lang = 'es') {
  const nombre = lugar?.nombre?.[lang] ?? lugar?.nombre?.es ?? ''
  const loc = NOMBRE_LOCALIDAD[lugar?.localidad] ?? ''
  const destino = nombre
    ? encodeURIComponent([nombre, loc, 'Chile'].filter(Boolean).join(', '))
    : `${lugar?.lat},${lugar?.lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${destino}`
}

// El orden de las claves define el orden de los botones de categoría en la app:
// "Dónde dormir" y "Dónde comer" primero, que es lo que más busca el turista.
export const CATEGORIAS = {
  alojamiento: { nombre: { es: 'Dónde dormir', en: 'Where to sleep' }, icono: 'bed', fondo: '#EEEDFE', color: '#534AB7' },
  comida: { nombre: { es: 'Dónde comer', en: 'Where to eat' }, icono: 'utensils', fondo: '#FAECE7', color: '#D85A30' },
  atractivo: { nombre: { es: 'Qué visitar', en: 'What to visit' }, icono: 'mountain', fondo: '#E1F5EE', color: '#0F6E56' },
  servicio: { nombre: { es: 'Servicios', en: 'Services' }, icono: 'fuel', fondo: '#E6F1FB', color: '#185FA5' },
  evento: { nombre: { es: 'Eventos', en: 'Events' }, icono: 'calendar', fondo: '#FBEAF0', color: '#D4537E' },
  emergencia: { nombre: { es: 'Emergencias', en: 'Emergencies' }, icono: 'cross', fondo: '#FCEBEB', color: '#A32D2D' },
}

// Directorio semilla. Desde jul-2026 rige la regla "UN SERVICIO PUBLICADO POR
// LOCALIDAD Y CATEGORÍA" (26 localidades × 6 categorías = 156 fichas): la app se
// enfoca en la calidad del dato antes de abrir la mano. Por eso:
//   - `publicado: false` → la ficha se conserva aquí (texto ya redactado, listo
//     para volver) pero NO se muestra ni la sirve la API. Ausente = publicada.
//   - `preliminar: true` → cupo reservado con una ficha verosímil SIN teléfono
//     (dormir, comer y eventos donde no hay dato real todavía). Se reemplaza en
//     cuanto llegue la información oficial: correo a las encargadas de turismo,
//     a los dueños de los servicios, o extracción desde fuentes públicas.
//     En la BD se publica solo si el cupo está vacío (ver PlaceSeeder).
export const LUGARES_SEED = [
  {
    id: 1, cat: 'atractivo', localidad: 'cochrane', lat: -47.133, lng: -72.706,
    nombre: { es: 'Confluencia ríos Baker y Neff', en: 'Baker & Neff rivers confluence' },
    dist: { es: '22 km · 30 min en auto', en: '22 km · 30 min by car' },
    desc: {
      es: 'Uno de los espectáculos naturales más fotografiados de la Carretera Austral: las aguas turquesas del río más caudaloso de Chile se encuentran con el gris glaciar del Neff en un cañón de roca.',
      en: 'One of the most photographed natural sights of the Carretera Austral: the turquoise waters of Chile’s mightiest river meet the glacial grey of the Neff in a rocky canyon.',
    },
    como: {
      es: 'Ruta X-83 hacia el norte, desvío señalizado en el km 18. Sendero corto desde el estacionamiento.',
      en: 'Route X-83 north, signposted turnoff at km 18. Short trail from the parking area.',
    },
  },
  {
    id: 2, cat: 'atractivo', localidad: 'cochrane', lat: -47.225, lng: -72.522, tel: '+56 67 252 2164', publicado: false,
    nombre: { es: 'Reserva Nacional Lago Cochrane (Tamango)', en: 'Lago Cochrane National Reserve (Tamango)' },
    dist: { es: '6 km · 12 min en auto', en: '6 km · 12 min by car' },
    desc: {
      es: 'Hogar de una de las últimas poblaciones de huemul del país. Senderos de baja y media dificultad bordeando el lago Cochrane, con aguas transparentes color esmeralda.',
      en: 'Home to one of the last huemul deer populations in Chile. Easy-to-moderate trails along Lake Cochrane and its transparent emerald waters.',
    },
    como: {
      es: 'Camino a Tamango desde el centro, entrada CONAF. Lleva efectivo para la entrada.',
      en: 'Tamango road from downtown, CONAF entrance. Bring cash for the entry fee.',
    },
  },
  {
    id: 3, cat: 'atractivo', localidad: 'cochrane', lat: -47.11, lng: -72.48, publicado: false,
    nombre: { es: 'Parque Nacional Patagonia — Valle Chacabuco', en: 'Patagonia National Park — Chacabuco Valley' },
    dist: { es: '28 km · 40 min en auto', en: '28 km · 40 min by car' },
    desc: {
      es: 'Ex estancia convertida en uno de los parques más emblemáticos de la Patagonia. Guanacos, ñandúes y paisajes de estepa infinita. Museo y senderos de clase mundial.',
      en: 'A former ranch turned into one of Patagonia’s most emblematic parks. Guanacos, rheas and endless steppe. World-class museum and trails.',
    },
    como: {
      es: 'Ruta X-83 norte hasta el cruce Valle Chacabuco, luego camino interior del parque.',
      en: 'Route X-83 north to the Chacabuco Valley junction, then the park’s inner road.',
    },
  },
  {
    id: 4, cat: 'atractivo', localidad: 'cochrane', lat: -47.2544, lng: -72.5741, publicado: false,
    nombre: { es: 'Plaza de Armas de Cochrane', en: 'Cochrane Main Square' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Corazón del pueblo, rodeada de árboles nativos. Punto de partida ideal para recorrer el centro, con la oficina de información turística a pasos.',
      en: 'The heart of town, surrounded by native trees. Ideal starting point, with the tourist information office steps away.',
    },
    como: {
      es: 'Entre las calles Esmeralda, Dr. Steffens, Tehuelches y Las Golondrinas.',
      en: 'Between Esmeralda, Dr. Steffens, Tehuelches and Las Golondrinas streets.',
    },
  },
  {
    id: 9, cat: 'servicio', localidad: 'cochrane', lat: -47.2565, lng: -72.572,
    nombre: { es: 'Estación de servicio (combustible)', en: 'Petrol station (fuel)' },
    dist: { es: '400 m del centro', en: '400 m from downtown' },
    desc: {
      es: 'Última estación de combustible confiable antes de Villa O’Higgins hacia el sur. Se recomienda cargar aquí siempre.',
      en: 'Last reliable fuel station before Villa O’Higgins heading south. Always fill up here.',
    },
    como: { es: 'Calle Río Maitén, salida norte del pueblo.', en: 'Río Maitén St., north exit of town.' },
  },
  {
    id: 10, cat: 'servicio', localidad: 'cochrane', lat: -47.2542, lng: -72.5735, tel: '+56 67 252 2115', publicado: false,
    nombre: { es: 'Oficina de Información Turística', en: 'Tourist Information Office' },
    dist: { es: 'En la plaza', en: 'At the square' },
    desc: {
      es: 'Mapas impresos, estado de los caminos, horarios de buses y consejos locales. Temporada alta: lunes a domingo 9:00–20:00.',
      en: 'Printed maps, road conditions, bus timetables and local tips. High season: daily 9:00–20:00.',
    },
    como: { es: 'Costado de la Plaza de Armas.', en: 'Beside the main square.' },
  },
  {
    id: 11, cat: 'emergencia', localidad: 'cochrane', lat: -47.252, lng: -72.576, tel: '131',
    nombre: { es: 'Hospital de Cochrane', en: 'Cochrane Hospital' },
    dist: { es: '300 m del centro', en: '300 m from downtown' },
    desc: {
      es: 'Atención de urgencias las 24 horas. Para emergencias en ruta o montaña, llamar antes de trasladarse si hay señal.',
      en: '24-hour emergency care. For road or mountain emergencies, call before moving if you have signal.',
    },
    como: { es: 'Avenida Dr. Steffens s/n.', en: 'Dr. Steffens Avenue.' },
  },
  {
    id: 12, cat: 'emergencia', localidad: 'cochrane', lat: -47.2547, lng: -72.5729, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Tenencia Cochrane', en: 'Police — Cochrane Station' },
    dist: { es: '150 m de la plaza', en: '150 m from the square' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates. Informa aquí tus rutas de trekking antes de salir.',
      en: 'Police emergencies and rescue coordination. Register your trekking routes here before heading out.',
    },
    como: { es: 'Calle Esmeralda 398.', en: 'Esmeralda St. 398.' },
  },
  {
    id: 13, cat: 'emergencia', localidad: 'cochrane', lat: -47.2552, lng: -72.5745, tel: '132', publicado: false,
    nombre: { es: 'Bomberos de Cochrane', en: 'Cochrane Fire Department' },
    dist: { es: '200 m de la plaza', en: '200 m from the square' },
    desc: {
      es: 'Emergencias por incendios y accidentes vehiculares.',
      en: 'Fire and vehicle accident emergencies.',
    },
    como: { es: 'Calle Las Golondrinas s/n.', en: 'Las Golondrinas St.' },
  },
  {
    id: 14, cat: 'evento', localidad: 'cochrane', lat: -47.2544, lng: -72.5741,
    nombre: { es: 'Festival Costumbrista de Cochrane', en: 'Cochrane Folk Festival' },
    dist: { es: 'Plaza de Armas', en: 'Main square' },
    desc: {
      es: 'Última semana de enero: jineteadas, asado al palo, música y artesanía de toda la provincia Capitán Prat. (Fecha de ejemplo).',
      en: 'Last week of January: rodeo, spit-roasted lamb, music and crafts from all of Capitán Prat province. (Sample date).',
    },
    como: { es: 'Plaza de Armas y medialuna municipal.', en: 'Main square and municipal rodeo arena.' },
  },
  {
    id: 15, cat: 'evento', localidad: 'cochrane', lat: -47.2542, lng: -72.5738, publicado: false,
    nombre: { es: 'Feria de artesanía local', en: 'Local crafts fair' },
    dist: { es: 'En la plaza', en: 'At the square' },
    desc: {
      es: 'Sábados de temporada alta: lanas, maderas nativas, conservas y productos del campo aysenino. (Contenido de ejemplo).',
      en: 'High-season Saturdays: wool, native wood, preserves and Aysén farm products. (Sample content).',
    },
    como: { es: 'Costado norte de la Plaza de Armas.', en: 'North side of the main square.' },
  },
  {
    id: 16, cat: 'atractivo', localidad: 'puerto-rio-tranquilo', lat: -46.6497, lng: -72.6252,
    nombre: { es: 'Capillas de Mármol', en: 'Marble Chapels (Capillas de Mármol)' },
    dist: { es: '5 km · 30 min en lancha', en: '5 km · 30 min by boat' },
    desc: {
      es: 'Santuario de la Naturaleza en el lago General Carrera: cavernas, columnas y túneles de mármol tallados por el agua durante miles de años. El color del lago cambia según la estación y la luz.',
      en: 'Nature Sanctuary on General Carrera Lake: marble caves, columns and tunnels carved by the water over thousands of years. The lake’s colour changes with the season and the light.',
    },
    como: {
      es: 'Tours en lancha o kayak desde la costanera de Puerto Río Tranquilo; se contratan en el día, sujetos al clima.',
      en: 'Boat or kayak tours from the Puerto Río Tranquilo waterfront; booked same-day, weather permitting.',
    },
  },
  {
    id: 17, cat: 'atractivo', localidad: 'puerto-rio-tranquilo', lat: -46.509, lng: -73.174, publicado: false,
    nombre: { es: 'Glaciar Exploradores (Valle Exploradores)', en: 'Exploradores Glacier (Exploradores Valley)' },
    dist: { es: '52 km · 1 h 30 min en auto', en: '52 km · 1.5 h by car' },
    desc: {
      es: 'Lengua glaciar del Campo de Hielo Norte, en el valle Exploradores. Mirador accesible y caminatas sobre hielo con operadores certificados desde Puerto Río Tranquilo.',
      en: 'Glacier tongue of the Northern Patagonian Ice Field, in the Exploradores valley. Accessible viewpoint and ice hikes with certified operators from Puerto Río Tranquilo.',
    },
    como: {
      es: 'Ruta X-728 hacia el oeste desde Puerto Río Tranquilo. Camino de ripio: manejar con precaución y consultar su estado antes de salir.',
      en: 'Route X-728 west from Puerto Río Tranquilo. Gravel road: drive carefully and check conditions before leaving.',
    },
  },
  {
    id: 18, cat: 'emergencia', localidad: 'puerto-rio-tranquilo', lat: -46.6249, lng: -72.6741, tel: '131',
    nombre: { es: 'Posta de Salud Puerto Río Tranquilo', en: 'Puerto Río Tranquilo Health Post' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. El hospital más cercano está en Cochrane o Coyhaique según la gravedad.',
      en: 'Rural health post for first aid and basic emergencies. The nearest hospital is in Cochrane or Coyhaique depending on severity.',
    },
    como: {
      es: 'En el casco del pueblo, junto a la Carretera Austral.',
      en: 'In the town centre, next to the Carretera Austral.',
    },
  },
  {
    id: 19, cat: 'atractivo', localidad: 'caleta-tortel', lat: -47.7967, lng: -73.536,
    nombre: { es: 'Pasarelas de Caleta Tortel', en: 'Caleta Tortel Boardwalks' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Pueblo sin calles: kilómetros de pasarelas y escaleras de ciprés de las Guaitecas conectan las casas sobre la ladera, frente a la desembocadura del río Baker. Zona Típica única en Chile.',
      en: 'A town without streets: kilometres of Guaitecas-cypress boardwalks and stairs link the hillside houses facing the mouth of the Baker River. A heritage zone unique in Chile.',
    },
    como: {
      es: 'Se recorre a pie desde el estacionamiento en la entrada del pueblo (no entran vehículos).',
      en: 'Explored on foot from the car park at the town entrance (no vehicles inside).',
    },
  },
  {
    id: 20, cat: 'atractivo', localidad: 'caleta-tortel', lat: -47.783, lng: -73.599,
    nombre: { es: 'Isla de los Muertos', en: 'Isla de los Muertos (Island of the Dead)' },
    dist: { es: '8 km · 40 min en lancha', en: '8 km · 40 min by boat' },
    desc: {
      es: 'Monumento Histórico Nacional en el delta del río Baker: pequeño cementerio de trabajadores fallecidos hacia 1906 en circunstancias aún discutidas. Paisaje sobrecogedor entre canales.',
      en: 'National Historic Monument in the Baker River delta: a small cemetery of workers who died around 1906 in circumstances still debated. A haunting landscape among the channels.',
    },
    como: {
      es: 'Excursión en lancha contratada en Tortel; consulta salidas y mareas en la oficina de información turística.',
      en: 'Boat excursion hired in Tortel; check departures and tides at the tourist information office.',
    },
  },
  {
    // Teléfono: el celular de la posta local, no el 131. El 131 es el SAMU
    // nacional y funciona desde cualquier parte; estando EN Tortel lo que sirve
    // es el número que contesta en el pueblo (fuente: mapa oficial de la
    // municipalidad). El lote municipal traía esta misma posta como una segunda
    // ficha —"Posta Salud Rural", a 112 m y con este número—, y tener dos fichas
    // de emergencia con teléfonos distintos era lo peor del lote: se despublicó
    // la duplicada y este es el número que queda (ver la migración
    // limpiar_fichas_tortel).
    id: 21, cat: 'emergencia', localidad: 'caleta-tortel', lat: -47.795, lng: -73.533, tel: '+56 9 9824 1609',
    nombre: { es: 'Posta de Salud Caleta Tortel', en: 'Caleta Tortel Health Post' },
    dist: { es: 'Sector centro, por las pasarelas', en: 'Central sector, via the boardwalks' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. Las evacuaciones de mayor complejidad se coordinan hacia Cochrane.',
      en: 'Rural health post for first aid and basic emergencies. More complex evacuations are coordinated to Cochrane.',
    },
    como: {
      es: 'Por la pasarela principal, sector centro del pueblo.',
      en: 'Along the main boardwalk, central sector of town.',
    },
  },
  {
    id: 22, cat: 'atractivo', localidad: 'coyhaique', lat: -45.532, lng: -72.032,
    nombre: { es: 'Reserva Nacional Coyhaique', en: 'Coyhaique National Reserve' },
    dist: { es: '5 km · 15 min en auto', en: '5 km · 15 min by car' },
    desc: {
      es: 'Bosques de lenga y coigüe, lagunas y miradores sobre la ciudad y el valle del río Simpson. Senderos cortos ideales para aclimatarse antes de seguir ruta al sur.',
      en: 'Lenga and coigüe forests, lagoons and viewpoints over the city and the Simpson River valley. Short trails, ideal for warming up before heading south.',
    },
    como: {
      es: 'Camino de ripio señalizado desde el sector norte de la ciudad, entrada CONAF.',
      en: 'Signposted gravel road from the north side of the city, CONAF entrance.',
    },
  },
  {
    id: 23, cat: 'atractivo', localidad: 'coyhaique', lat: -45.5719, lng: -72.0683, publicado: false,
    nombre: { es: 'Plaza de Armas pentagonal', en: 'Pentagonal Main Square' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Única en Chile: una plaza de cinco lados de la que irradian diez calles, corazón de la capital regional de Aysén. Alrededor se concentran cafés, artesanía y servicios.',
      en: 'Unique in Chile: a five-sided square with ten radiating streets, the heart of the Aysén regional capital. Cafés, crafts and services cluster around it.',
    },
    como: {
      es: 'Centro de Coyhaique, entre las calles Horn, Bilbao, Prat, 21 de Mayo y Condell.',
      en: 'Central Coyhaique, between Horn, Bilbao, Prat, 21 de Mayo and Condell streets.',
    },
  },
  {
    id: 24, cat: 'atractivo', localidad: 'coyhaique', lat: -45.582, lng: -72.078, publicado: false,
    nombre: { es: 'Piedra del Indio (mirador del río Simpson)', en: 'Piedra del Indio (Simpson River viewpoint)' },
    dist: { es: '1,5 km · 20 min a pie', en: '1.5 km · 20 min on foot' },
    desc: {
      es: 'Formación rocosa que recuerda un perfil humano sobre el cañón del río Simpson. Mirador clásico de la ciudad, especialmente al atardecer.',
      en: 'A rock formation resembling a human profile above the Simpson River canyon. A classic city viewpoint, best at sunset.',
    },
    como: {
      es: 'Salida suroeste de la ciudad, por el puente sobre el río Simpson (camino a Puerto Aysén).',
      en: 'Southwest exit of the city, by the bridge over the Simpson River (road to Puerto Aysén).',
    },
  },
  {
    id: 27, cat: 'servicio', localidad: 'coyhaique', lat: -45.5725, lng: -72.066,
    nombre: { es: 'Combustible, bancos y supermercados', en: 'Fuel, banks and supermarkets' },
    dist: { es: 'En el centro y accesos', en: 'Downtown and city exits' },
    desc: {
      es: 'Coyhaique es el principal punto de abastecimiento de toda la Carretera Austral sur: varias estaciones de servicio, bancos con cajero automático y supermercados grandes. Carga combustible y retira efectivo aquí antes de seguir al sur.',
      en: 'Coyhaique is the main supply point of the whole southern Carretera Austral: several petrol stations, banks with ATMs and large supermarkets. Fill up and withdraw cash here before heading south.',
    },
    como: {
      es: 'Estaciones de servicio en los accesos de la ciudad; bancos y supermercados en el centro.',
      en: 'Petrol stations at the city exits; banks and supermarkets downtown.',
    },
  },
  {
    id: 28, cat: 'emergencia', localidad: 'coyhaique', lat: -45.5754, lng: -72.0736, tel: '131',
    nombre: { es: 'Hospital Regional de Coyhaique', en: 'Coyhaique Regional Hospital' },
    dist: { es: '800 m del centro', en: '800 m from downtown' },
    desc: {
      es: 'El hospital de mayor complejidad de la región de Aysén, urgencias las 24 horas. Aquí se derivan las emergencias graves de toda la Carretera Austral.',
      en: 'The highest-complexity hospital in the Aysén region, 24-hour ER. Serious emergencies from the whole Carretera Austral are referred here.',
    },
    como: { es: 'Calle Dr. Jorge Ibar, sector poniente del centro.', en: 'Dr. Jorge Ibar St., west of downtown.' },
  },
  {
    id: 29, cat: 'emergencia', localidad: 'coyhaique', lat: -45.5708, lng: -72.0662, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Comisaría Coyhaique', en: 'Police — Coyhaique Station' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y coordinación con rescate de montaña. Informa tus rutas de trekking antes de internarte en zonas aisladas.',
      en: 'Police emergencies and mountain-rescue coordination. Register your trekking routes before entering remote areas.',
    },
    como: { es: 'Sector céntrico, a cuadras de la Plaza de Armas.', en: 'Central area, blocks from the main square.' },
  },
  {
    id: 30, cat: 'atractivo', localidad: 'villa-cerro-castillo', lat: -46.113, lng: -72.179,
    nombre: { es: 'Sendero Laguna Cerro Castillo (P.N. Cerro Castillo)', en: 'Cerro Castillo Lagoon Trail (Cerro Castillo N.P.)' },
    dist: { es: 'Acceso a 3 km · trekking de día completo', en: 'Trailhead 3 km away · full-day hike' },
    desc: {
      es: 'El trekking estrella de la zona: ascenso exigente hasta la laguna turquesa al pie de las agujas de basalto del cerro Castillo (unas 8 horas ida y vuelta). En temporada alta el acceso es regulado y con horario de ingreso.',
      en: 'The area’s star hike: a demanding climb to the turquoise lagoon at the foot of Cerro Castillo’s basalt spires (about 8 hours round trip). In high season access is regulated with entry hours.',
    },
    como: {
      es: 'Acceso señalizado sector Estero Parada, a unos 3 km del pueblo. Registro obligatorio; consulta condiciones antes de subir.',
      en: 'Signposted access at the Estero Parada sector, about 3 km from the village. Registration required; check conditions before climbing.',
    },
  },
  {
    id: 31, cat: 'atractivo', localidad: 'villa-cerro-castillo', lat: -46.1295, lng: -72.152, publicado: false,
    nombre: { es: 'Paredón de las Manos', en: 'Paredón de las Manos (Wall of Hands)' },
    dist: { es: '3 km · 40 min a pie', en: '3 km · 40 min on foot' },
    desc: {
      es: 'Alero rocoso con pinturas rupestres de manos de unos 3.000 años de antigüedad, herencia de los antiguos cazadores tehuelches. Administrado por la comunidad local con una pequeña entrada.',
      en: 'A rock overhang with hand paintings around 3,000 years old, a legacy of ancient Tehuelche hunters. Managed by the local community with a small entry fee.',
    },
    como: {
      es: 'Desvío señalizado desde el pueblo, camino al sector sur.',
      en: 'Signposted turnoff from the village, on the road to the southern sector.',
    },
  },
  {
    id: 32, cat: 'atractivo', localidad: 'villa-cerro-castillo', lat: -46.1223, lng: -72.1638, publicado: false,
    nombre: { es: 'Museo Escuela (antigua escuela rural)', en: 'School Museum (old rural school)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'La antigua escuela del pueblo convertida en museo de la vida pionera y la cultura gaucha del valle Ibáñez. Horarios acotados fuera de temporada.',
      en: 'The village’s old school turned into a museum of pioneer life and gaucho culture in the Ibáñez valley. Limited hours off-season.',
    },
    como: { es: 'Calle principal del pueblo (avenida O’Higgins).', en: 'Main street of the village (O’Higgins Avenue).' },
  },
  {
    id: 35, cat: 'servicio', localidad: 'villa-cerro-castillo', lat: -46.1216, lng: -72.1633,
    nombre: { es: 'Almacenes y provisiones', en: 'Grocery stores and supplies' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacenes básicos para reponer víveres antes o después del trekking. No cuentes con combustible ni cajero automático: lo seguro es cargar en Coyhaique o en Puerto Río Tranquilo.',
      en: 'Basic grocery stores to restock before or after the trek. Don’t count on fuel or an ATM: the safe bet is to fill up in Coyhaique or Puerto Río Tranquilo.',
    },
    como: { es: 'Calle principal del pueblo.', en: 'Main street of the village.' },
  },
  {
    id: 36, cat: 'emergencia', localidad: 'villa-cerro-castillo', lat: -46.1224, lng: -72.1626, tel: '131',
    nombre: { es: 'Posta de Salud Villa Cerro Castillo', en: 'Villa Cerro Castillo Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. Las urgencias mayores se derivan a Coyhaique (1,5 h por camino pavimentado).',
      en: 'Rural health post for first aid and basic emergencies. Major emergencies are referred to Coyhaique (1.5 h on paved road).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 37, cat: 'emergencia', localidad: 'villa-cerro-castillo', lat: -46.1207, lng: -72.1642, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Retén Cerro Castillo', en: 'Police — Cerro Castillo Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales y apoyo en rescates del parque nacional. Avisa aquí tu plan de trekking si vas a rutas largas.',
      en: 'Police emergencies and support for national-park rescues. Report your trekking plan here before long routes.',
    },
    como: { es: 'Junto a la calle principal.', en: 'By the main street.' },
  },
  {
    id: 38, cat: 'atractivo', localidad: 'chile-chico', lat: -46.5378, lng: -71.7275,
    nombre: { es: 'Costanera del lago General Carrera', en: 'General Carrera Lake waterfront' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Chile Chico, la "ciudad del sol", goza de un microclima cálido a orillas del lago más grande de Chile. Playas de aguas turquesas, huertos frutales y vista a las cumbres de la ribera norte.',
      en: 'Chile Chico, the "city of the sun", enjoys a warm microclimate on the shore of Chile’s largest lake. Turquoise beaches, fruit orchards and views of the peaks on the northern shore.',
    },
    como: { es: 'Borde norte del pueblo, frente al lago.', en: 'Northern edge of town, facing the lake.' },
  },
  {
    id: 39, cat: 'atractivo', localidad: 'chile-chico', lat: -46.82, lng: -72.0, publicado: false,
    nombre: { es: 'Reserva Nacional Lago Jeinimeni', en: 'Lago Jeinimeni National Reserve' },
    dist: { es: '52 km · 1 h 30 min en auto', en: '52 km · 1.5 h by car' },
    desc: {
      es: 'Lagunas color esmeralda entre estepa y bosque, hoy parte del Parque Nacional Patagonia. En el camino: la Piedra Clavada, la Cueva de las Manos y el valle Lunar, de paisaje casi marciano.',
      en: 'Emerald lagoons between steppe and forest, now part of Patagonia National Park. On the way: Piedra Clavada, the Cave of Hands and the Moon Valley with its almost Martian landscape.',
    },
    como: {
      es: 'Camino de ripio hacia el sur desde Chile Chico. Sin combustible ni señal en la ruta: sal preparado.',
      en: 'Gravel road south from Chile Chico. No fuel or phone signal on the way: leave prepared.',
    },
  },
  {
    id: 42, cat: 'servicio', localidad: 'chile-chico', lat: -46.5405, lng: -71.729, publicado: false,
    nombre: { es: 'Combustible y banco (BancoEstado)', en: 'Fuel and bank (BancoEstado)' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Chile Chico tiene estación de servicio y sucursal de BancoEstado con cajero automático: uno de los pocos puntos con banco entre Coyhaique y Cochrane.',
      en: 'Chile Chico has a petrol station and a BancoEstado branch with an ATM: one of the few banking points between Coyhaique and Cochrane.',
    },
    como: { es: 'Calle principal (avenida O’Higgins).', en: 'Main street (O’Higgins Avenue).' },
  },
  {
    id: 43, cat: 'servicio', localidad: 'chile-chico', lat: -46.5359, lng: -71.731,
    tel: '+56 600 401 9000', hrs: 'Zarpes diarios; presentarse 1–2 h antes',
    nombre: { es: 'Barcaza Chile Chico — Puerto Ibáñez', en: 'Chile Chico — Puerto Ibáñez ferry' },
    dist: { es: 'Rampa en la costanera', en: 'Ramp on the waterfront' },
    desc: {
      es: 'La barcaza La Tehuelche (Naviera Austral) cruza el lago General Carrera entre Chile Chico y Puerto Ibáñez en unas 2 h 15, el atajo hacia Coyhaique. Valores referenciales ago-2026: pasajero $2.510 y vehículo de hasta 5 m lineales $21.270. Reserva en navieraustral.cl con anticipación en temporada alta y preséntate 1 h antes a pie, 2 h con vehículo. Los martes, el zarpe de las 11:00 desde Ibáñez y el de las 16:00 desde Chile Chico son solo de carga peligrosa, sin pasajeros.',
      en: 'The La Tehuelche ferry (Naviera Austral) crosses General Carrera Lake between Chile Chico and Puerto Ibáñez in about 2 h 15, the shortcut to Coyhaique. Reference fares, Aug 2026: passenger CLP 2,510 and vehicle up to 5 linear metres CLP 21,270. Book at navieraustral.cl ahead of time in high season and check in 1 h before on foot, 2 h with a vehicle. On Tuesdays the 11:00 sailing from Ibáñez and the 16:00 from Chile Chico carry dangerous goods only, with no passengers.',
    },
    como: {
      es: 'Rampa de la costanera. Pasajes en navieraustral.cl o en la oficina local (Naviera Austral, +56 600 401 9000, contacto@navieraustral.cl).',
      en: 'Waterfront ramp. Tickets at navieraustral.cl or the local office (Naviera Austral, +56 600 401 9000, contacto@navieraustral.cl).',
    },
  },
  {
    id: 44, cat: 'emergencia', localidad: 'chile-chico', lat: -46.5418, lng: -71.7222, tel: '131',
    nombre: { es: 'Hospital de Chile Chico', en: 'Chile Chico Hospital' },
    dist: { es: '400 m del centro', en: '400 m from downtown' },
    desc: {
      es: 'Hospital de baja complejidad con urgencias las 24 horas. Los casos graves se evacuan a Coyhaique por barcaza o vía aérea.',
      en: 'Low-complexity hospital with 24-hour ER. Serious cases are evacuated to Coyhaique by ferry or air.',
    },
    como: { es: 'Sector oriente del pueblo.', en: 'Eastern sector of town.' },
  },
  {
    id: 45, cat: 'emergencia', localidad: 'chile-chico', lat: -46.541, lng: -71.727, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Comisaría Chile Chico', en: 'Police — Chile Chico Station' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y control fronterizo cercano (paso Río Jeinimeni hacia Los Antiguos, Argentina).',
      en: 'Police emergencies; the Río Jeinimeni border crossing to Los Antiguos, Argentina, is nearby.',
    },
    como: { es: 'Sector céntrico.', en: 'Central area.' },
  },
  {
    id: 46, cat: 'atractivo', localidad: 'puerto-guadal', lat: -46.845, lng: -72.702,
    nombre: { es: 'Costanera y playas del lago General Carrera', en: 'General Carrera Lake waterfront and beaches' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Pueblo tranquilo en la ribera suroeste del lago General Carrera, con playas de aguas turquesas y vista hacia las montañas del Campo de Hielo Norte. Buen punto base entre Río Tranquilo y Chile Chico.',
      en: 'A quiet village on the southwest shore of General Carrera Lake, with turquoise beaches and views towards the Northern Ice Field mountains. A good base between Río Tranquilo and Chile Chico.',
    },
    como: { es: 'Borde del lago, junto al casco del pueblo.', en: 'Lakeshore, by the village centre.' },
  },
  {
    id: 47, cat: 'atractivo', localidad: 'puerto-guadal', lat: -46.822, lng: -72.622, publicado: false,
    nombre: { es: 'Cascada Los Maquis', en: 'Los Maquis Waterfall' },
    dist: { es: '10 km · 20 min en auto + caminata corta', en: '10 km · 20 min by car + short walk' },
    desc: {
      es: 'Salto de agua entre vegetación nativa, con pasarelas y mirador sobre el lago General Carrera. Caminata corta y familiar.',
      en: 'A waterfall amid native vegetation, with walkways and a viewpoint over General Carrera Lake. A short, family-friendly walk.',
    },
    como: {
      es: 'Camino a Chile Chico (ribera sur del lago), desvío señalizado.',
      en: 'Road to Chile Chico (southern lakeshore), signposted turnoff.',
    },
  },
  {
    id: 50, cat: 'servicio', localidad: 'puerto-guadal', lat: -46.8438, lng: -72.7022,
    nombre: { es: 'Almacenes y abastecimiento', en: 'Grocery stores and supplies' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Almacenes de abarrotes para reponer víveres. El combustible no está garantizado: carga en Puerto Río Tranquilo, Chile Chico o Cochrane.',
      en: 'Grocery stores to restock supplies. Fuel is not guaranteed: fill up in Puerto Río Tranquilo, Chile Chico or Cochrane.',
    },
    como: { es: 'Calle principal del pueblo.', en: 'Main street of the village.' },
  },
  {
    id: 51, cat: 'emergencia', localidad: 'puerto-guadal', lat: -46.8435, lng: -72.703, tel: '131',
    nombre: { es: 'Posta de Salud Puerto Guadal', en: 'Puerto Guadal Health Post' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. Los casos mayores se derivan a Chile Chico o Cochrane.',
      en: 'Rural health post for first aid and basic emergencies. Major cases are referred to Chile Chico or Cochrane.',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 52, cat: 'emergencia', localidad: 'puerto-guadal', lat: -46.8442, lng: -72.702, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Retén Puerto Guadal', en: 'Police — Puerto Guadal Outpost' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Emergencias policiales y orientación sobre el estado de los caminos de la ribera sur del lago.',
      en: 'Police emergencies and updates on the state of the southern lakeshore roads.',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 53, cat: 'atractivo', localidad: 'puerto-bertrand', lat: -47.028, lng: -72.82,
    nombre: { es: 'Nacimiento del río Baker', en: 'Source of the Baker River' },
    dist: { es: '2 km · 30 min a pie', en: '2 km · 30 min on foot' },
    desc: {
      es: 'Aquí nace el río más caudaloso de Chile: las aguas turquesas del lago Bertrand se convierten en el Baker a pasos del pueblo. Sendero corto por la ribera.',
      en: 'Chile’s mightiest river is born here: the turquoise waters of Lake Bertrand become the Baker just steps from the village. Short riverside trail.',
    },
    como: {
      es: 'Sendero desde el pueblo por la ribera del lago, hacia el sur.',
      en: 'Trail from the village along the lakeshore, heading south.',
    },
  },
  {
    id: 54, cat: 'atractivo', localidad: 'puerto-bertrand', lat: -47.022, lng: -72.824, publicado: false,
    nombre: { es: 'Rafting y pesca en el río Baker', en: 'Rafting and fishing on the Baker River' },
    dist: { es: 'Desde el pueblo', en: 'From the village' },
    desc: {
      es: 'Puerto Bertrand es la base clásica para rafting en los rápidos del Baker y pesca deportiva de truchas y salmones, con guías y operadores de temporada.',
      en: 'Puerto Bertrand is the classic base for rafting the Baker rapids and fly-fishing for trout and salmon, with seasonal guides and operators.',
    },
    como: {
      es: 'Operadores en el pueblo; salidas sujetas al caudal y al clima.',
      en: 'Operators in the village; departures depend on river flow and weather.',
    },
  },
  {
    id: 57, cat: 'servicio', localidad: 'puerto-bertrand', lat: -47.0218, lng: -72.8248,
    nombre: { es: 'Almacén de abarrotes', en: 'Grocery store' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacén básico para víveres. Sin combustible ni cajero: los puntos seguros más cercanos son Cochrane (al sur) y Puerto Río Tranquilo (al norte).',
      en: 'Basic grocery store. No fuel or ATM: the nearest reliable points are Cochrane (south) and Puerto Río Tranquilo (north).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 58, cat: 'emergencia', localidad: 'puerto-bertrand', lat: -47.0212, lng: -72.825, tel: '131',
    nombre: { es: 'Posta de Salud Puerto Bertrand', en: 'Puerto Bertrand Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios. Las urgencias mayores se derivan al hospital de Cochrane (50 km al sur).',
      en: 'Rural health post for first aid. Major emergencies are referred to Cochrane hospital (50 km south).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 59, cat: 'emergencia', localidad: 'puerto-bertrand', lat: -47.0224, lng: -72.8244, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Retén Puerto Bertrand', en: 'Police — Puerto Bertrand Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en el río Baker y los senderos cercanos.',
      en: 'Police emergencies and rescue coordination on the Baker River and nearby trails.',
    },
    como: { es: 'Junto a la calle principal.', en: 'By the main street.' },
  },
  {
    id: 60, cat: 'atractivo', localidad: 'villa-ohiggins', lat: -48.9, lng: -73.1,
    nombre: { es: 'Glaciar O’Higgins (navegación por el lago)', en: 'O’Higgins Glacier (lake cruise)' },
    dist: { es: 'Navegación de día completo', en: 'Full-day boat trip' },
    desc: {
      es: 'Navegación por el lago O’Higgins hasta la pared de hielo del glaciar, en el Campo de Hielo Sur. Una de las excursiones más remotas y sobrecogedoras de la Patagonia chilena.',
      en: 'A cruise across Lake O’Higgins to the glacier’s ice wall in the Southern Ice Field. One of the most remote and awe-inspiring excursions in Chilean Patagonia.',
    },
    como: {
      es: 'Zarpes desde Bahía Bahamóndez (7 km del pueblo), en temporada y sujetos al clima. Reserva en el pueblo.',
      en: 'Departures from Bahía Bahamóndez (7 km from the village), in season and weather permitting. Book in the village.',
    },
  },
  {
    id: 61, cat: 'atractivo', localidad: 'villa-ohiggins', lat: -48.517, lng: -72.586, publicado: false,
    nombre: { es: 'Fin de la Carretera Austral (Bahía Bahamóndez)', en: 'End of the Carretera Austral (Bahía Bahamóndez)' },
    dist: { es: '7 km · 15 min en auto', en: '7 km · 15 min by car' },
    desc: {
      es: 'El hito del kilómetro final de la Carretera Austral, a orillas del lago O’Higgins: la meta clásica de ciclistas y viajeros que recorren la ruta completa desde Puerto Montt.',
      en: 'The final-kilometre milestone of the Carretera Austral, on the shore of Lake O’Higgins: the classic finish line for cyclists and travellers riding the whole route from Puerto Montt.',
    },
    como: {
      es: 'Último tramo de la Carretera Austral al sur del pueblo, hasta la rampa de Bahía Bahamóndez.',
      en: 'Last stretch of the Carretera Austral south of the village, down to the Bahía Bahamóndez ramp.',
    },
  },
  {
    id: 62, cat: 'atractivo', localidad: 'villa-ohiggins', lat: -48.463, lng: -72.556, publicado: false,
    nombre: { es: 'Mirador Cerro Santiago', en: 'Cerro Santiago Viewpoint' },
    dist: { es: '1 km · 45 min a pie', en: '1 km · 45 min on foot' },
    desc: {
      es: 'Sendero corto que sube por la ladera detrás del pueblo hasta miradores sobre Villa O’Higgins, el valle del río Mayer y los cordones del Campo de Hielo Sur.',
      en: 'A short trail climbing the hillside behind the village to viewpoints over Villa O’Higgins, the Mayer River valley and the ranges of the Southern Ice Field.',
    },
    como: { es: 'Inicio señalizado en el borde oriente del pueblo.', en: 'Signposted trailhead on the eastern edge of the village.' },
  },
  {
    id: 65, cat: 'servicio', localidad: 'villa-ohiggins', lat: -48.4677, lng: -72.5612,
    nombre: { es: 'Combustible y almacenes', en: 'Fuel and grocery stores' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Último punto de abastecimiento de la Carretera Austral: venta de combustible a pequeña escala y almacenes básicos. No hay banco ni cajero automático — trae efectivo desde Cochrane o Coyhaique.',
      en: 'The last supply point on the Carretera Austral: small-scale fuel sales and basic grocery stores. There is no bank or ATM — bring cash from Cochrane or Coyhaique.',
    },
    como: { es: 'Casco del pueblo; pregunta horarios en el almacén.', en: 'Village centre; ask for opening hours at the store.' },
  },
  {
    id: 66, cat: 'emergencia', localidad: 'villa-ohiggins', lat: -48.4692, lng: -72.5597, tel: '131',
    nombre: { es: 'Posta de Salud Villa O’Higgins', en: 'Villa O’Higgins Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. Las evacuaciones mayores se coordinan vía aérea o hacia Cochrane (más de 220 km y un cruce en barcaza).',
      en: 'Rural health post for first aid and basic emergencies. Major evacuations are coordinated by air or to Cochrane (over 220 km and a ferry crossing).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 67, cat: 'emergencia', localidad: 'villa-ohiggins', lat: -48.4681, lng: -72.5594, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Retén Villa O’Higgins', en: 'Police — Villa O’Higgins Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales, coordinación de rescates y registro recomendado para quienes siguen el cruce de frontera a pie hacia El Chaltén (Argentina).',
      en: 'Police emergencies, rescue coordination and recommended check-in for those continuing the on-foot border crossing to El Chaltén (Argentina).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 68, cat: 'atractivo', localidad: 'puerto-aysen', lat: -45.403, lng: -72.7,
    nombre: { es: 'Puente Presidente Ibáñez', en: 'Presidente Ibáñez Bridge' },
    dist: { es: 'En Puerto Aysén', en: 'In Puerto Aysén' },
    desc: {
      es: 'Emblema de Puerto Aysén: puente colgante sobre el río Aysén inaugurado en 1966, en su época el más largo de Chile. Hoy es el mejor mirador del río y la postal clásica de la ciudad.',
      en: 'Puerto Aysén’s landmark: a suspension bridge over the Aysén River opened in 1966, then the longest in Chile. Today it is the best viewpoint over the river and the city’s classic postcard.',
    },
    como: {
      es: 'En el acceso sur de la ciudad, cruzando el río Aysén. Se recorre a pie.',
      en: 'At the southern entrance to town, crossing the Aysén River. Best explored on foot.',
    },
  },
  {
    id: 69, cat: 'atractivo', localidad: 'puerto-aysen', lat: -45.49, lng: -72.36, publicado: false,
    nombre: { es: 'Reserva Nacional Río Simpson', en: 'Río Simpson National Reserve' },
    dist: { es: '35 km · 30 min hacia Coyhaique', en: '35 km · 30 min toward Coyhaique' },
    desc: {
      es: 'Área protegida por CONAF a lo largo del camino Coyhaique–Puerto Aysén, con bosque siempreverde y saltos de agua como la Cascada de la Virgen y el Velo de la Novia, visibles desde la ruta.',
      en: 'A CONAF-protected reserve along the Coyhaique–Puerto Aysén road, with evergreen forest and waterfalls such as Cascada de la Virgen and Velo de la Novia, visible from the road.',
    },
    como: {
      es: 'Ruta 240 hacia Coyhaique; los saltos están señalizados al costado del camino, con centro de visitantes CONAF.',
      en: 'Route 240 toward Coyhaique; the falls are signposted along the road, with a CONAF visitor centre.',
    },
  },
  {
    id: 70, cat: 'atractivo', localidad: 'puerto-aysen', lat: -45.46, lng: -72.63, publicado: false,
    nombre: { es: 'Laguna Los Palos', en: 'Los Palos Lagoon' },
    dist: { es: '18 km · 25 min en auto', en: '18 km · 25 min by car' },
    desc: {
      es: 'Laguna tranquila rodeada de bosque, popular para picnic, pesca deportiva y kayak en verano. Un panorama local sencillo cerca de la ciudad.',
      en: 'A calm lagoon surrounded by forest, popular for picnics, sport fishing and kayaking in summer. An easy local outing near town.',
    },
    como: {
      es: 'Camino secundario al noreste de Puerto Aysén; consulta el estado del ripio en época de lluvias.',
      en: 'Secondary road northeast of Puerto Aysén; check the gravel condition in the rainy season.',
    },
  },
  {
    id: 71, cat: 'atractivo', localidad: 'puerto-aysen', lat: -45.4033, lng: -72.6947, publicado: false,
    nombre: { es: 'Costanera y Plaza de Puerto Aysén', en: 'Puerto Aysén Riverfront & Main Square' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'El corazón de la ciudad portuaria: plaza, iglesia y la ribera del río Aysén. Buen punto para caminar, comprar provisiones y orientarse antes de seguir a Chacabuco o al sur por la Carretera.',
      en: 'The heart of the port town: main square, church and the Aysén riverfront. A good place to walk, stock up and get your bearings before heading to Chacabuco or south on the highway.',
    },
    como: { es: 'En el centro, en torno a la plaza.', en: 'Downtown, around the main square.' },
  },
  {
    id: 74, cat: 'servicio', localidad: 'puerto-aysen', lat: -45.405, lng: -72.696,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Puerto Aysén tiene estación de servicio, bancos y cajeros automáticos — uno de los últimos puntos con servicios completos antes de internarse al norte por la Carretera Austral. Carga combustible y efectivo aquí.',
      en: 'Puerto Aysén has a fuel station, banks and ATMs — one of the last spots with full services before heading north on the Carretera Austral. Fill up on fuel and cash here.',
    },
    como: { es: 'Estación y bancos en el centro.', en: 'Station and banks downtown.' },
  },
  {
    id: 75, cat: 'emergencia', localidad: 'puerto-aysen', lat: -45.401, lng: -72.698, tel: '131',
    nombre: { es: 'Hospital de Puerto Aysén (Dr. Jorge Ibar)', en: 'Puerto Aysén Hospital (Dr. Jorge Ibar)' },
    dist: { es: 'En Puerto Aysén', en: 'In Puerto Aysén' },
    desc: {
      es: 'Hospital comunitario que atiende urgencias de la provincia. Para casos graves, la derivación mayor es al Hospital Regional de Coyhaique (~65 km). SAMU 131.',
      en: 'Community hospital handling emergencies for the province. Serious cases are referred to Coyhaique Regional Hospital (~65 km). SAMU ambulance 131.',
    },
    como: { es: 'En la ciudad.', en: 'In town.' },
  },
  {
    id: 76, cat: 'emergencia', localidad: 'puerto-aysen', lat: -45.4038, lng: -72.6952, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Puerto Aysén', en: 'Police — Puerto Aysén' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en la provincia de Aysén. Marca 133.',
      en: 'Police emergencies and rescue coordination in Aysén province. Dial 133.',
    },
    como: { es: 'En el centro.', en: 'Downtown.' },
  },
  {
    id: 77, cat: 'atractivo', localidad: 'puerto-chacabuco', lat: -45.4667, lng: -72.8167, publicado: false,
    nombre: { es: 'Puerto Chacabuco', en: 'Puerto Chacabuco' },
    dist: { es: '15 km · 20 min desde Puerto Aysén', en: '15 km · 20 min from Puerto Aysén' },
    desc: {
      es: 'El principal puerto marítimo de la Región de Aysén y su puerta de entrada por mar: desde aquí zarpan los transbordadores hacia Quellón y Puerto Montt y las navegaciones a la Laguna San Rafael. Reemplazó a Puerto Aysén cuando su río se sedimentó.',
      en: 'The main seaport of the Aysén Region and its gateway by sea: ferries to Quellón and Puerto Montt and cruises to Laguna San Rafael depart from here. It replaced Puerto Aysén when its river silted up.',
    },
    como: {
      es: 'A 15 km al oeste de Puerto Aysén por la Ruta 240.',
      en: '15 km west of Puerto Aysén on Route 240.',
    },
  },
  {
    id: 78, cat: 'atractivo', localidad: 'puerto-chacabuco', lat: -45.465, lng: -72.818,
    nombre: { es: 'Navegación al Glaciar San Rafael', en: 'San Rafael Glacier cruise' },
    dist: { es: 'Zarpe desde el terminal', en: 'Departs from the terminal' },
    desc: {
      es: 'Excursión estrella de la zona: catamarán por los fiordos hasta el ventisquero San Rafael, en el Parque Nacional Laguna San Rafael (Campo de Hielo Norte), donde el glaciar cae al mar entre témpanos. Salidas por el día en temporada.',
      en: 'The area’s flagship excursion: a catamaran through the fjords to the San Rafael glacier in Laguna San Rafael National Park (Northern Ice Field), where the ice calves into the sea among icebergs. Day departures in season.',
    },
    como: {
      es: 'Zarpe desde el terminal de Puerto Chacabuco; se contrata con operadores locales.',
      en: 'Departs from the Puerto Chacabuco terminal; booked with local operators.',
    },
  },
  {
    id: 81, cat: 'servicio', localidad: 'puerto-chacabuco', lat: -45.4655, lng: -72.8178,
    tel: '+56 600 401 9000', hrs: 'Según itinerario semanal (navieraustral.cl)',
    nombre: { es: 'Terminal de transbordadores — barcazas y ferries', en: 'Ferry terminal — barges and ferries' },
    dist: { es: 'En el terminal del puerto', en: 'At the port terminal' },
    desc: {
      es: 'Punto de embarque de los ferries a Chiloé y Puerto Montt (Naviera Austral, Navimag) y de las navegaciones a la laguna San Rafael. La ruta Cordillera une Quellón con Chacabuco en unas 28 h, unas tres veces por semana, recalando en Melinka, Raúl Marín Balmaceda, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota y Puerto Aguirre. Valores referenciales ago-2026, tramo completo: $23.650 por pasajero y $191.100 el vehículo. Reserva con anticipación; los zarpes dependen del clima.',
      en: 'Boarding point for the ferries to Chiloé and Puerto Montt (Naviera Austral, Navimag) and for San Rafael lagoon cruises. The Cordillera route links Quellón with Chacabuco in about 28 h, roughly three times a week, calling at Melinka, Raúl Marín Balmaceda, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota and Puerto Aguirre. Reference fares, Aug 2026, full route: CLP 23,650 per passenger and CLP 191,100 per vehicle. Book ahead; departures depend on the weather.',
    },
    como: {
      es: 'En el terminal del puerto. Pasajes en navieraustral.cl o +56 600 401 9000.',
      en: 'At the port terminal. Tickets at navieraustral.cl or +56 600 401 9000.',
    },
  },
  {
    id: 82, cat: 'emergencia', localidad: 'puerto-chacabuco', lat: -45.4668, lng: -72.8165, tel: '133',
    nombre: { es: 'Emergencias — Puerto Chacabuco', en: 'Emergencies — Puerto Chacabuco' },
    dist: { es: 'En el puerto', en: 'At the port' },
    desc: {
      es: 'Retén de Carabineros (133) en el puerto; la atención de salud mayor está en el Hospital de Puerto Aysén, a 15 km. SAMU 131.',
      en: 'Police outpost (133) at the port; major medical care is at Puerto Aysén Hospital, 15 km away. SAMU ambulance 131.',
    },
    como: { es: 'En el puerto.', en: 'At the port.' },
  },
  {
    id: 83, cat: 'atractivo', localidad: 'villa-manihuales', lat: -45.19, lng: -72.16,
    nombre: { es: 'Reserva Nacional Mañihuales', en: 'Mañihuales National Reserve' },
    dist: { es: '5 km · 10 min en auto', en: '5 km · 10 min by car' },
    desc: {
      es: 'Área protegida por CONAF creada para resguardar al huemul, el ciervo nativo en peligro y símbolo del escudo de Chile. Bosque siempreverde y senderos de baja dificultad junto al pueblo.',
      en: 'A CONAF-protected reserve created to safeguard the huemul, the endangered native deer on Chile’s coat of arms. Evergreen forest and easy trails next to the village.',
    },
    como: {
      es: 'Acceso señalizado desde la Ruta 7, a la salida norte del pueblo; entrada CONAF.',
      en: 'Signposted access from Route 7 at the northern exit of the village; CONAF entrance.',
    },
  },
  {
    id: 84, cat: 'atractivo', localidad: 'villa-manihuales', lat: -45.212, lng: -72.156, publicado: false,
    nombre: { es: 'Río Mañihuales', en: 'Mañihuales River' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'El río que da nombre al pueblo, de aguas claras y buen caudal, reconocido para la pesca con mosca de trucha en temporada. Paisaje de ribera y aves acuáticas junto al puente.',
      en: 'The river that gives the village its name — clear and full-flowing, known for fly fishing for trout in season. Riverside scenery and waterbirds by the bridge.',
    },
    como: {
      es: 'Cruza junto al pueblo por el puente de la Ruta 7; consulta vedas y permisos de pesca.',
      en: 'Crosses beside the village on the Route 7 bridge; check fishing closed seasons and permits.',
    },
  },
  {
    id: 85, cat: 'atractivo', localidad: 'villa-manihuales', lat: -45.2103, lng: -72.1547, publicado: false,
    nombre: { es: 'Plaza e iglesia de Villa Mañihuales', en: 'Villa Mañihuales Square & Church' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'El corazón de este pueblo de colonización, punto de descanso y reabastecimiento a mitad de camino entre Coyhaique y La Junta. Buen lugar para estirar las piernas y tomar algo.',
      en: 'The heart of this settler village, a rest and resupply stop halfway between Coyhaique and La Junta. A good place to stretch your legs and grab a bite.',
    },
    como: { es: 'En el centro, junto a la Ruta 7.', en: 'Downtown, along Route 7.' },
  },
  {
    id: 86, cat: 'servicio', localidad: 'villa-manihuales', lat: -45.211, lng: -72.154,
    nombre: { es: 'Combustible y abastecimiento', en: 'Fuel and supplies' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Punto de combustible y almacenes del pueblo — parada importante en un tramo largo: hacia el norte no hay bencina confiable hasta La Junta (unos 150 km). Carga antes de seguir y confirma disponibilidad, que en zonas rurales puede ser intermitente.',
      en: 'Village fuel point and shops — an important stop on a long stretch: heading north there is no reliable fuel until La Junta (about 150 km). Fill up before continuing and confirm availability, which can be intermittent in rural areas.',
    },
    como: { es: 'Sobre la Ruta 7, en el pueblo.', en: 'On Route 7, in the village.' },
  },
  {
    id: 89, cat: 'emergencia', localidad: 'villa-manihuales', lat: -45.2095, lng: -72.1552, tel: '131',
    nombre: { es: 'Posta de Salud Rural Villa Mañihuales', en: 'Villa Mañihuales Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta de salud rural para primeros auxilios y urgencias básicas. Las derivaciones mayores van al Hospital de Puerto Aysén o al Hospital Regional de Coyhaique. SAMU 131.',
      en: 'Rural health post for first aid and basic emergencies. Major cases are referred to Puerto Aysén Hospital or Coyhaique Regional Hospital. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 90, cat: 'emergencia', localidad: 'villa-manihuales', lat: -45.21, lng: -72.1549, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Villa Mañihuales', en: 'Police — Villa Mañihuales' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Retén de Carabineros para emergencias policiales y coordinación de rescates en el tramo norte de la Ruta 7. Marca 133.',
      en: 'Police outpost for emergencies and rescue coordination on the northern stretch of Route 7. Dial 133.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 91, cat: 'atractivo', localidad: 'villa-amengual', lat: -44.7167, lng: -72.1667,
    nombre: { es: 'Iglesia de Villa Amengual', en: 'Villa Amengual Church' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'La postal del pueblo: una pequeña iglesia de madera revestida en tejuela, de estilo patagón heredado de la tradición chilota. Una de las capillas rurales más fotografiadas del tramo.',
      en: 'The village’s postcard: a small wooden church clad in shingles, in a Patagonian style inherited from Chiloé tradition. One of the most photographed rural chapels on this stretch.',
    },
    como: { es: 'En el centro, junto a la Ruta 7.', en: 'Downtown, along Route 7.' },
  },
  {
    id: 92, cat: 'atractivo', localidad: 'villa-amengual', lat: -44.95, lng: -72.05, publicado: false,
    nombre: { es: 'Reserva Nacional Lago Las Torres', en: 'Lago Las Torres National Reserve' },
    dist: { es: '28 km · 30 min al sur', en: '28 km · 30 min south' },
    desc: {
      es: 'Lago de aguas verdes al pie de cerros con torreones de roca, rodeado de bosque siempreverde. Área CONAF con camping, sendero y buena pesca; parada tranquila sobre la Ruta 7.',
      en: 'A green-water lake beneath rocky tower-like peaks, ringed by evergreen forest. A CONAF area with camping, a trail and good fishing; a calm stop along Route 7.',
    },
    como: {
      es: 'Sobre la Ruta 7 al sur de Villa Amengual, acceso señalizado con entrada CONAF.',
      en: 'On Route 7 south of Villa Amengual, signposted access with a CONAF entrance.',
    },
  },
  {
    id: 93, cat: 'atractivo', localidad: 'villa-amengual', lat: -44.71, lng: -72.17, publicado: false,
    nombre: { es: 'Mirador Cerro Pirámide', en: 'Cerro Pirámide Viewpoint' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Sendero local que sube al cerro que domina el pueblo, con vistas al valle y a los cordones nevados. Caminata corta de media dificultad para estirar las piernas en la ruta.',
      en: 'A local trail up the hill overlooking the village, with views of the valley and snowy ranges. A short, moderate walk to stretch your legs on the road.',
    },
    como: {
      es: 'Inicio señalizado en el pueblo; consulta el estado del sendero con lluvia.',
      en: 'Signposted trailhead in the village; check the trail condition in wet weather.',
    },
  },
  {
    id: 94, cat: 'servicio', localidad: 'villa-amengual', lat: -44.7165, lng: -72.1665,
    nombre: { es: 'Abastecimiento y combustible', en: 'Supplies and fuel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacenes del pueblo y combustible de venta informal (bidones) — no hay estación formal. En este tramo la bencina es intermitente: no cuentes con cargar aquí y confirma antes. La próxima segura hacia el norte es La Junta.',
      en: 'Village shops and informally sold fuel (jerry cans) — there is no formal station. Fuel is intermittent on this stretch: don’t count on filling up here and confirm first. The next reliable stop north is La Junta.',
    },
    como: { es: 'En el pueblo, sobre la Ruta 7.', en: 'In the village, on Route 7.' },
  },
  {
    id: 97, cat: 'emergencia', localidad: 'villa-amengual', lat: -44.716, lng: -72.1672, tel: '131',
    nombre: { es: 'Posta de Salud Rural Villa Amengual', en: 'Villa Amengual Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta rural para primeros auxilios y urgencias básicas. Las derivaciones mayores van al Hospital de Puerto Cisnes o al Hospital Regional de Coyhaique. SAMU 131; Carabineros 133.',
      en: 'Rural post for first aid and basic emergencies. Major cases are referred to Puerto Cisnes Hospital or Coyhaique Regional Hospital. SAMU ambulance 131; police 133.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 98, cat: 'atractivo', localidad: 'puerto-cisnes', lat: -44.743, lng: -72.69,
    nombre: { es: 'Costanera y puerto de Puerto Cisnes', en: 'Puerto Cisnes Waterfront & Harbour' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'El frente costero de este pueblo pesquero asomado al canal Puyuhuapi, con vista a los fiordos y la isla Magdalena. Caleta, embarcaciones y el ir y venir de la pesca y la salmonicultura.',
      en: 'The seafront of this fishing town facing the Puyuhuapi channel, with views of the fjords and Magdalena Island. A cove, fishing boats and the comings and goings of fishing and salmon farming.',
    },
    como: { es: 'En el centro, frente al mar.', en: 'Downtown, on the seafront.' },
  },
  {
    id: 99, cat: 'atractivo', localidad: 'puerto-cisnes', lat: -44.72, lng: -72.4, publicado: false,
    nombre: { es: 'Piedra del Gato', en: 'Piedra del Gato' },
    dist: { es: 'En el camino de acceso', en: 'On the access road' },
    desc: {
      es: 'Angostura de roca donde el camino se abre paso pegado al río Cisnes, encajonado entre paredones. Un paso escénico y célebre por lo difícil que fue construirlo; buen punto para detenerse a mirar el río.',
      en: 'A rocky narrows where the road squeezes alongside the Cisnes River, boxed in by cliffs. A scenic pass famous for how hard it was to build; a good spot to stop and watch the river.',
    },
    como: {
      es: 'Sobre el camino que une la Ruta 7 con Puerto Cisnes, siguiendo el río Cisnes.',
      en: 'On the road linking Route 7 with Puerto Cisnes, following the Cisnes River.',
    },
  },
  {
    id: 100, cat: 'atractivo', localidad: 'puerto-cisnes', lat: -44.74, lng: -72.55, publicado: false,
    nombre: { es: 'Río Cisnes', en: 'Cisnes River' },
    dist: { es: 'En la ruta de acceso', en: 'On the access road' },
    desc: {
      es: 'Uno de los ríos más largos y valorados de la Patagonia para la pesca con mosca: aguas cristalinas, truchas grandes y paisaje de bosque. Referencia mundial entre los pescadores.',
      en: 'One of Patagonia’s longest and most prized rivers for fly fishing: crystal-clear water, big trout and forest scenery. A world reference among anglers.',
    },
    como: {
      es: 'Acompaña el camino de acceso desde la Ruta 7; consulta vedas y permisos de pesca.',
      en: 'Follows the access road from Route 7; check fishing closed seasons and permits.',
    },
  },
  {
    id: 101, cat: 'atractivo', localidad: 'puerto-cisnes', lat: -44.7, lng: -72.9, publicado: false,
    nombre: { es: 'Parque Nacional Isla Magdalena', en: 'Isla Magdalena National Park' },
    dist: { es: 'En bote desde el puerto', en: 'By boat from the harbour' },
    desc: {
      es: 'Isla montañosa cubierta de selva valdiviana virgen frente a Puerto Cisnes, con volcán, fiordos y fauna marina. Naturaleza prácticamente inexplorada; se visita por mar con operadores locales.',
      en: 'A mountainous island cloaked in pristine Valdivian rainforest across from Puerto Cisnes, with a volcano, fjords and marine wildlife. Almost untouched nature, visited by sea with local operators.',
    },
    como: {
      es: 'Cruce en embarcación desde el puerto; coordina con operadores del pueblo.',
      en: 'Boat crossing from the harbour; arrange with village operators.',
    },
  },
  {
    id: 102, cat: 'servicio', localidad: 'puerto-cisnes', lat: -44.7425, lng: -72.6885,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Puerto Cisnes tiene estación de servicio, comercio y cajero — el punto de servicios más completo del tramo entre Coyhaique y La Junta. Vale el desvío para cargar combustible y efectivo.',
      en: 'Puerto Cisnes has a fuel station, shops and an ATM — the most complete service point on the stretch between Coyhaique and La Junta. The detour is worth it to load up on fuel and cash.',
    },
    como: { es: 'En el centro del pueblo.', en: 'In the town centre.' },
  },
  {
    id: 105, cat: 'emergencia', localidad: 'puerto-cisnes', lat: -44.7415, lng: -72.688, tel: '131',
    nombre: { es: 'Hospital de Puerto Cisnes', en: 'Puerto Cisnes Hospital' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Hospital comunitario que atiende urgencias de la comuna de Cisnes. Los casos graves se derivan al Hospital Regional de Coyhaique. SAMU 131.',
      en: 'Community hospital handling emergencies for the Cisnes district. Serious cases are referred to Coyhaique Regional Hospital. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 106, cat: 'emergencia', localidad: 'puerto-cisnes', lat: -44.7422, lng: -72.6888, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Puerto Cisnes', en: 'Police — Puerto Cisnes' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en la comuna de Cisnes. Marca 133.',
      en: 'Police emergencies and rescue coordination in the Cisnes district. Dial 133.',
    },
    como: { es: 'En el centro.', en: 'Downtown.' },
  },
  {
    id: 107, cat: 'atractivo', localidad: 'puyuhuapi', lat: -44.4989, lng: -72.5486,
    nombre: { es: 'Parque Nacional Queulat — Ventisquero Colgante', en: 'Queulat National Park — Hanging Glacier' },
    dist: { es: '24 km · 30 min al sur', en: '24 km · 30 min south' },
    desc: {
      es: 'La joya del tramo: un glaciar suspendido entre paredones de selva desde el que caen dos cascadas al vacío. Miradores y un sendero hasta la laguna con témpanos; bosque siempreverde y catarata todo el año.',
      en: 'The highlight of this stretch: a glacier suspended between rainforest cliffs, with two waterfalls plunging from it. Viewpoints and a trail to the iceberg lagoon; evergreen forest and falls all year.',
    },
    como: {
      es: 'Ruta 7 al sur de Puyuhuapi; entrada CONAF y estacionamiento al inicio de los senderos.',
      en: 'Route 7 south of Puyuhuapi; CONAF entrance and parking at the trailheads.',
    },
  },
  {
    id: 108, cat: 'atractivo', localidad: 'puyuhuapi', lat: -44.39, lng: -72.55, publicado: false,
    nombre: { es: 'Termas del Ventisquero', en: 'Ventisquero Hot Springs' },
    dist: { es: '6 km · 10 min al sur', en: '6 km · 10 min south' },
    desc: {
      es: 'Piscinas termales al aire libre junto al fiordo, con vista al agua y al bosque. Un alto perfecto para descansar del ripio; acceso público a pasos de la Ruta 7 (a diferencia del lodge de termas, que se cruza en bote).',
      en: 'Open-air thermal pools beside the fjord, facing the water and the forest. A perfect stop to rest from the gravel; public access right off Route 7 (unlike the spa lodge, reached by boat).',
    },
    como: {
      es: 'Sobre la Ruta 7, poco al sur del pueblo. Cobro de entrada; lleva efectivo.',
      en: 'On Route 7, just south of the village. Entry fee; bring cash.',
    },
  },
  {
    id: 109, cat: 'atractivo', localidad: 'puyuhuapi', lat: -44.3286, lng: -72.5567, publicado: false,
    nombre: { es: 'Fiordo y pueblo de Puyuhuapi', en: 'Puyuhuapi Fjord & Village' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Caserío de casas de madera fundado por inmigrantes alemanes en 1935, asomado a la cabecera del fiordo Puyuhuapi. Costanera tranquila, arquitectura patrimonial y aire de fin de mundo.',
      en: 'A village of wooden houses founded by German immigrants in 1935, at the head of the Puyuhuapi fjord. A calm waterfront, heritage architecture and an end-of-the-world feel.',
    },
    como: { es: 'En el pueblo, sobre la Ruta 7.', en: 'In the village, on Route 7.' },
  },
  {
    id: 110, cat: 'atractivo', localidad: 'puyuhuapi', lat: -44.328, lng: -72.557, publicado: false,
    nombre: { es: 'Fábrica de Alfombras Puyuhuapi', en: 'Puyuhuapi Carpet Factory' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Taller histórico donde aún se tejen a mano alfombras de lana desde los años 40, legado de los fundadores alemanes. Se puede visitar y ver el proceso; un pedazo vivo de la historia del pueblo.',
      en: 'A historic workshop where wool carpets have been hand-woven since the 1940s, a legacy of the German founders. Open to visit and watch the process; a living piece of the village’s history.',
    },
    como: { es: 'En el pueblo; consulta horarios de visita.', en: 'In the village; check visiting hours.' },
  },
  {
    id: 111, cat: 'servicio', localidad: 'puyuhuapi', lat: -44.3282, lng: -72.5562,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Combustible y comercio del pueblo. La disponibilidad puede ser intermitente; el punto de servicios más seguro cercano es La Junta, hacia el norte. Carga y confirma antes de seguir.',
      en: 'Village fuel and shops. Availability can be intermittent; the most reliable nearby service point is La Junta, to the north. Fill up and confirm before continuing.',
    },
    como: { es: 'En el pueblo, sobre la Ruta 7.', en: 'In the village, on Route 7.' },
  },
  {
    id: 114, cat: 'emergencia', localidad: 'puyuhuapi', lat: -44.3278, lng: -72.5575, tel: '131',
    nombre: { es: 'Posta de Salud Rural Puyuhuapi', en: 'Puyuhuapi Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta rural para primeros auxilios y urgencias básicas. Las derivaciones mayores van al Hospital de Puerto Cisnes o al Hospital Regional de Coyhaique. SAMU 131.',
      en: 'Rural post for first aid and basic emergencies. Major cases are referred to Puerto Cisnes Hospital or Coyhaique Regional Hospital. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 115, cat: 'emergencia', localidad: 'puyuhuapi', lat: -44.3284, lng: -72.5564, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Puyuhuapi', en: 'Police — Puyuhuapi' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Retén de Carabineros para emergencias policiales y coordinación de rescates en el tramo del Queulat. Marca 133.',
      en: 'Police outpost for emergencies and rescue coordination on the Queulat stretch. Dial 133.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 116, cat: 'atractivo', localidad: 'la-junta', lat: -43.98, lng: -72.28,
    nombre: { es: 'Reserva Nacional Lago Rosselot', en: 'Lago Rosselot National Reserve' },
    dist: { es: '12 km · 15 min al este', en: '12 km · 15 min east' },
    desc: {
      es: 'Lago de aguas profundas rodeado de bosque siempreverde, protegido por CONAF. Buena pesca, miradores y calma total; parada natural saliendo de La Junta hacia el este.',
      en: 'A deep-water lake ringed by evergreen forest, protected by CONAF. Good fishing, viewpoints and total calm; a natural stop heading east out of La Junta.',
    },
    como: {
      es: 'Camino al este de La Junta rumbo a Lago Verde, acceso señalizado.',
      en: 'Road east of La Junta toward Lago Verde, signposted access.',
    },
  },
  {
    id: 117, cat: 'atractivo', localidad: 'la-junta', lat: -43.982, lng: -72.41, publicado: false,
    nombre: { es: 'Confluencia de los ríos Rosselot y Palena', en: 'Rosselot & Palena Rivers Confluence' },
    dist: { es: '3 km · 5 min', en: '3 km · 5 min' },
    desc: {
      es: 'Punto donde el río Rosselot entrega sus aguas al Palena. Paisaje de ríos y bosque, mirador y buen sitio para observar aves; el origen del nombre del pueblo (“la junta” de los ríos).',
      en: 'Where the Rosselot River meets the Palena. A river-and-forest landscape, a viewpoint and good birdwatching; the origin of the town’s name (“the junction” of the rivers).',
    },
    como: { es: 'A pasos del pueblo, señalizado.', en: 'Just outside town, signposted.' },
  },
  {
    id: 118, cat: 'atractivo', localidad: 'la-junta', lat: -43.99, lng: -72.42, publicado: false,
    nombre: { es: 'Río Palena', en: 'Palena River' },
    dist: { es: 'Junto al pueblo', en: 'Next to town' },
    desc: {
      es: 'Gran río de la Patagonia, célebre para la pesca con mosca y el rafting. Aguas potentes que bajan hacia el Pacífico; operadores locales ofrecen bajadas y jornadas de pesca en temporada.',
      en: 'A great Patagonian river, famous for fly fishing and rafting. Powerful waters flowing to the Pacific; local operators offer descents and fishing days in season.',
    },
    como: {
      es: 'Bordea el pueblo; consulta operadores, vedas y permisos.',
      en: 'Runs alongside town; ask operators about closed seasons and permits.',
    },
  },
  {
    id: 119, cat: 'atractivo', localidad: 'la-junta', lat: -43.78, lng: -72.96, publicado: false,
    nombre: { es: 'Desvío a Raúl Marín Balmaceda', en: 'Detour to Raúl Marín Balmaceda' },
    dist: { es: '74 km · 1 h 30 al oeste', en: '74 km · 1 h 30 west' },
    desc: {
      es: 'Aldea costera en la desembocadura del río Palena, entre bosque y mar, conocida por sus playas, aguas termales y avistamiento de delfines y lobos marinos. Un desvío que vale la pena desde La Junta.',
      en: 'A coastal hamlet at the mouth of the Palena River, between forest and sea, known for its beaches, hot springs and dolphin and sea-lion sightings. A worthwhile detour from La Junta.',
    },
    como: {
      es: 'Camino de ripio al oeste desde La Junta; incluye un cruce en barcaza por el río. Consulta horarios.',
      en: 'Gravel road west from La Junta; includes a river ferry crossing. Check schedules.',
    },
  },
  {
    id: 120, cat: 'servicio', localidad: 'la-junta', lat: -43.9756, lng: -72.4058,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'La Junta tiene estación de servicio, comercio y cajero — el punto de reabastecimiento confiable del norte de Aysén. Carga combustible y efectivo aquí antes de seguir hacia Los Lagos o hacia el sur.',
      en: 'La Junta has a fuel station, shops and an ATM — the reliable resupply point in northern Aysén. Load up on fuel and cash here before heading to Los Lagos or south.',
    },
    como: { es: 'En el centro, sobre la Ruta 7.', en: 'Downtown, on Route 7.' },
  },
  {
    id: 123, cat: 'emergencia', localidad: 'la-junta', lat: -43.9748, lng: -72.4068, tel: '131',
    nombre: { es: 'Hospital de La Junta', en: 'La Junta Hospital' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Hospital comunitario que atiende urgencias del norte de la comuna de Cisnes. Los casos graves se derivan al Hospital Regional de Coyhaique. SAMU 131.',
      en: 'Community hospital handling emergencies for the northern Cisnes district. Serious cases are referred to Coyhaique Regional Hospital. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 124, cat: 'emergencia', localidad: 'la-junta', lat: -43.9754, lng: -72.406, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — La Junta', en: 'Police — La Junta' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en el cruce hacia Raúl Marín Balmaceda y el límite con Los Lagos. Marca 133.',
      en: 'Police emergencies and rescue coordination at the junction toward Raúl Marín Balmaceda and the Los Lagos boundary. Dial 133.',
    },
    como: { es: 'En el centro.', en: 'Downtown.' },
  },
  {
    id: 125, cat: 'atractivo', localidad: 'villa-santa-lucia', lat: -43.4167, lng: -72.3667, publicado: false,
    nombre: { es: 'Villa Santa Lucía — el cruce', en: 'Villa Santa Lucía — the junction' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Pueblo-cruce donde la Ruta 7 se encuentra con el camino a Futaleufú y Palena. Reconstruido con enorme resiliencia tras el aluvión de 2017, que se recuerda con un memorial; hoy es parada obligada para orientarse y decidir ruta.',
      en: 'A junction village where Route 7 meets the road to Futaleufú and Palena. Rebuilt with great resilience after the 2017 landslide, remembered with a memorial; today it is the natural stop to get oriented and choose your route.',
    },
    como: { es: 'Sobre la Ruta 7, en el cruce.', en: 'On Route 7, at the junction.' },
  },
  {
    id: 126, cat: 'atractivo', localidad: 'villa-santa-lucia', lat: -43.3, lng: -72.32,
    nombre: { es: 'Lago Yelcho', en: 'Yelcho Lake' },
    dist: { es: '15 km · 20 min al norte', en: '15 km · 20 min north' },
    desc: {
      es: 'Gran lago color esmeralda encajonado entre montañas selváticas, famoso mundialmente por la pesca de truchas y salmones. La Ruta 7 lo bordea; el puente Yelcho y sus orillas son paradas clásicas de foto.',
      en: 'A big emerald lake boxed in by rainforest mountains, world-famous for trout and salmon fishing. Route 7 skirts its shore; the Yelcho bridge and lakeside pull-offs are classic photo stops.',
    },
    como: {
      es: 'Sobre la Ruta 7 al norte del pueblo; lodges y accesos señalizados.',
      en: 'On Route 7 north of the village; lodges and signposted accesses.',
    },
  },
  {
    id: 127, cat: 'atractivo', localidad: 'villa-santa-lucia', lat: -43.36, lng: -72.42, publicado: false,
    nombre: { es: 'Sendero Ventisquero Yelcho', en: 'Yelcho Glacier Trail' },
    dist: { es: '20 km · 30 min al norte', en: '20 km · 30 min north' },
    desc: {
      es: 'Caminata por bosque siempreverde hasta el mirador del ventisquero que cuelga sobre el valle del Yelcho. Sendero de media dificultad, ida y vuelta en unas 4 horas.',
      en: 'A walk through evergreen forest to the viewpoint of the glacier hanging above the Yelcho valley. A moderate trail, about 4 hours round trip.',
    },
    como: {
      es: 'Inicio señalizado sobre la Ruta 7, cerca del puente Yelcho.',
      en: 'Signposted trailhead on Route 7, near the Yelcho bridge.',
    },
  },
  {
    id: 128, cat: 'servicio', localidad: 'villa-santa-lucia', lat: -43.4165, lng: -72.3665,
    nombre: { es: 'Abastecimiento en el cruce', en: 'Supplies at the junction' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacenes básicos y venta informal de combustible — no hay estación de servicio. Los puntos confiables más cercanos son La Junta (al sur), Chaitén (al norte) y Futaleufú (por el desvío). Planifica el estanque en este tramo.',
      en: 'Basic shops and informally sold fuel — there is no service station. The nearest reliable stops are La Junta (south), Chaitén (north) and Futaleufú (via the detour). Plan your tank on this stretch.',
    },
    como: { es: 'En el pueblo, sobre la Ruta 7.', en: 'In the village, on Route 7.' },
  },
  {
    id: 131, cat: 'emergencia', localidad: 'villa-santa-lucia', lat: -43.416, lng: -72.3672, tel: '131',
    nombre: { es: 'Posta de Salud Rural Villa Santa Lucía', en: 'Villa Santa Lucía Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta rural para primeros auxilios y urgencias básicas. Las derivaciones mayores van al Hospital de Chaitén. SAMU 131.',
      en: 'Rural post for first aid and basic emergencies. Major cases are referred to Chaitén Hospital. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 132, cat: 'emergencia', localidad: 'villa-santa-lucia', lat: -43.4164, lng: -72.3664, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Villa Santa Lucía', en: 'Police — Villa Santa Lucía' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Retén de Carabineros en el cruce hacia Futaleufú y Palena. Marca 133.',
      en: 'Police outpost at the junction toward Futaleufú and Palena. Dial 133.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 133, cat: 'atractivo', localidad: 'futaleufu', lat: -43.19, lng: -71.9,
    nombre: { es: 'Río Futaleufú — rafting y kayak', en: 'Futaleufú River — rafting & kayaking' },
    dist: { es: 'Junto al pueblo', en: 'Next to town' },
    desc: {
      es: 'Aguas turquesas y rápidos de clase mundial: el "Futa" figura entre los mejores ríos del planeta para rafting y kayak. Operadores locales ofrecen bajadas de todos los niveles en temporada, además de flotadas suaves para ver el cañón.',
      en: 'Turquoise water and world-class rapids: the “Futa” ranks among the planet’s best rivers for rafting and kayaking. Local operators run descents for all levels in season, plus gentle floats to see the canyon.',
    },
    como: {
      es: 'Salidas desde el pueblo con operadores certificados; reserva en temporada alta.',
      en: 'Trips depart from town with certified operators; book ahead in high season.',
    },
  },
  {
    id: 134, cat: 'atractivo', localidad: 'futaleufu', lat: -43.2, lng: -71.95, publicado: false,
    nombre: { es: 'Lago Espolón', en: 'Espolón Lake' },
    dist: { es: '8 km · 15 min', en: '8 km · 15 min' },
    desc: {
      es: 'Lago tranquilo de aguas templadas en verano, rodeado de cerros y campos; playa, camping y kayak suave. El contrapunto sereno a los rápidos del Futaleufú.',
      en: 'A calm lake, warm-ish in summer, ringed by hills and farmland; beach, camping and easy kayaking. The serene counterpoint to the Futaleufú rapids.',
    },
    como: {
      es: 'Camino señalizado desde el acceso al pueblo.',
      en: 'Signposted road from the town access.',
    },
  },
  {
    id: 135, cat: 'atractivo', localidad: 'futaleufu', lat: -43.25, lng: -71.85, publicado: false,
    nombre: { es: 'Reserva Nacional Futaleufú', en: 'Futaleufú National Reserve' },
    dist: { es: '10 km · 20 min al sur', en: '10 km · 20 min south' },
    desc: {
      es: 'Bosques de ciprés de la cordillera y lenga que protegen al huemul, con senderos y miradores sobre el valle del río. Área CONAF poco visitada, ideal para caminatas tranquilas.',
      en: 'Mountain-cypress and lenga forests protecting the huemul deer, with trails and viewpoints over the river valley. A little-visited CONAF area, ideal for quiet hikes.',
    },
    como: {
      es: 'Acceso señalizado al sur del pueblo; entrada CONAF.',
      en: 'Signposted access south of town; CONAF entrance.',
    },
  },
  {
    id: 136, cat: 'atractivo', localidad: 'futaleufu', lat: -43.18, lng: -71.8, publicado: false,
    nombre: { es: 'Paso fronterizo Futaleufú (Argentina)', en: 'Futaleufú border crossing (Argentina)' },
    dist: { es: '10 km · 15 min al este', en: '10 km · 15 min east' },
    desc: {
      es: 'Cruce internacional hacia Trevelin y Esquel, en la Patagonia argentina — una de las entradas y salidas clásicas de la Carretera Austral. Trámite ágil en temporada; revisa horarios de atención y documentos del vehículo.',
      en: 'International crossing to Trevelin and Esquel in Argentine Patagonia — one of the classic ways in and out of the Carretera Austral. Usually quick in season; check opening hours and vehicle paperwork.',
    },
    como: {
      es: 'Camino al este desde el pueblo hasta el complejo fronterizo.',
      en: 'Road east from town to the border complex.',
    },
  },
  {
    id: 137, cat: 'servicio', localidad: 'futaleufu', lat: -43.1845, lng: -71.8695,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Futaleufú tiene combustible, comercio y cajero — el punto de servicios del ramal este. Carga aquí si sigues a Palena o vuelves a la Ruta 7; confirma efectivo antes de fines de semana largos.',
      en: 'Futaleufú has fuel, shops and an ATM — the service point of the eastern branch. Fill up here if continuing to Palena or returning to Route 7; secure cash before long weekends.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 140, cat: 'emergencia', localidad: 'futaleufu', lat: -43.184, lng: -71.8705, tel: '131',
    nombre: { es: 'Hospital de Futaleufú', en: 'Futaleufú Hospital' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Hospital comunitario para urgencias de la comuna; primer punto de atención ante accidentes de río o montaña. Casos graves se derivan a Puerto Montt (vía aérea) o Esquel. SAMU 131.',
      en: 'Community hospital for the district; the first stop for river or mountain accidents. Serious cases are referred to Puerto Montt (by air) or Esquel. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 141, cat: 'emergencia', localidad: 'futaleufu', lat: -43.1846, lng: -71.8694, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Futaleufú', en: 'Police — Futaleufú' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Emergencias policiales, coordinación de rescates de río y control del paso fronterizo. Marca 133.',
      en: 'Police emergencies, river-rescue coordination and border-crossing control. Dial 133.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 142, cat: 'atractivo', localidad: 'palena', lat: -43.6167, lng: -71.8,
    nombre: { es: 'Palena — pueblo huaso y su rodeo', en: 'Palena — cowboy village & rodeo' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Pueblo ganadero del alto valle del Palena que conserva viva la cultura huasa y pionera: rodeos, jineteadas y fiestas costumbristas de verano, entre cerros y campos de pastoreo.',
      en: 'A ranching village in the upper Palena valley that keeps pioneer and huaso culture alive: rodeos, horse-taming shows and summer folk festivals, set among hills and grazing land.',
    },
    como: { es: 'En el pueblo; la medialuna está junto al casco.', en: 'In the village; the rodeo ring sits by the centre.' },
  },
  {
    id: 143, cat: 'atractivo', localidad: 'palena', lat: -43.6, lng: -71.85, publicado: false,
    nombre: { es: 'Alto río Palena — valle y cabalgatas', en: 'Upper Palena River — valley & horse rides' },
    dist: { es: 'En torno al pueblo', en: 'Around the village' },
    desc: {
      es: 'El tramo alto del río Palena corre entre praderas y montañas: pesca tranquila, cabalgatas con arrieros locales y rutas camperas que son la esencia de la Patagonia continental.',
      en: 'The upper Palena flows between meadows and mountains: quiet fishing, horse rides with local herdsmen and country routes that capture inland Patagonia’s essence.',
    },
    como: {
      es: 'Excursiones coordinadas con guías y arrieros del pueblo.',
      en: 'Trips arranged with village guides and herdsmen.',
    },
  },
  {
    id: 144, cat: 'atractivo', localidad: 'palena', lat: -43.63, lng: -71.73, publicado: false,
    nombre: { es: 'Paso fronterizo Río Encuentro (Argentina)', en: 'Río Encuentro border crossing (Argentina)' },
    dist: { es: '8 km · 15 min al este', en: '8 km · 15 min east' },
    desc: {
      es: 'Cruce internacional tranquilo hacia Carrenleufú y la Patagonia argentina. Alternativa poco transitada al paso de Futaleufú; revisa horarios antes de ir.',
      en: 'A quiet international crossing to Carrenleufú and Argentine Patagonia. A low-traffic alternative to the Futaleufú pass; check opening hours before going.',
    },
    como: {
      es: 'Camino al este del pueblo hasta el límite.',
      en: 'Road east of the village to the border.',
    },
  },
  {
    id: 145, cat: 'servicio', localidad: 'palena', lat: -43.6165, lng: -71.7995,
    nombre: { es: 'Abastecimiento y combustible', en: 'Supplies and fuel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacenes y venta local de combustible; la disponibilidad puede variar, así que confirma antes de contar con ella. El punto seguro del ramal es Futaleufú.',
      en: 'Shops and locally sold fuel; availability can vary, so confirm before counting on it. The branch’s reliable stop is Futaleufú.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 148, cat: 'emergencia', localidad: 'palena', lat: -43.616, lng: -71.8002, tel: '131',
    nombre: { es: 'Posta de Salud Palena', en: 'Palena Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Atención primaria y urgencias básicas del alto valle. Las derivaciones mayores van a Futaleufú o Chaitén, y los casos graves a Puerto Montt. SAMU 131.',
      en: 'Primary care and basic emergencies for the upper valley. Major cases go to Futaleufú or Chaitén, and serious ones to Puerto Montt. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 149, cat: 'emergencia', localidad: 'palena', lat: -43.6164, lng: -71.7998, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Palena', en: 'Police — Palena' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales, rescates rurales y control del paso Río Encuentro. Marca 133.',
      en: 'Police emergencies, rural rescues and Río Encuentro border control. Dial 133.',
    },
    como: { es: 'En el pueblo.', en: 'In the village.' },
  },
  {
    id: 150, cat: 'atractivo', localidad: 'chaiten', lat: -42.837, lng: -72.647,
    nombre: { es: 'Volcán Chaitén — sendero al cráter', en: 'Chaitén Volcano — crater trail' },
    dist: { es: '25 km · 30 min al norte', en: '25 km · 30 min north' },
    desc: {
      es: 'Subida al borde del cráter del volcán que despertó en 2008 y cubrió el pueblo de ceniza. El bosque quemado en regeneración y el domo humeante hacen de esta una de las caminatas más impactantes de la ruta (3-4 h ida y vuelta).',
      en: 'A climb to the crater rim of the volcano that awoke in 2008 and blanketed the town in ash. The regenerating burnt forest and steaming dome make this one of the route’s most striking hikes (3-4 h round trip).',
    },
    como: {
      es: 'Inicio señalizado sobre el camino a Caleta Gonzalo (sector P.N. Pumalín).',
      en: 'Signposted trailhead on the Caleta Gonzalo road (Pumalín N.P. sector).',
    },
  },
  {
    id: 151, cat: 'atractivo', localidad: 'chaiten', lat: -42.9169, lng: -72.7086, publicado: false,
    nombre: { es: 'Costanera de Chaitén', en: 'Chaitén Waterfront' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'El frente de mar del pueblo que renació tras la erupción de 2008: playa de arena volcánica, vista al golfo Corcovado y atardeceres largos. La historia reciente de Chaitén es parte del atractivo.',
      en: 'The seafront of the town reborn after the 2008 eruption: volcanic-sand beach, views over the Corcovado gulf and long sunsets. Chaitén’s recent history is part of the draw.',
    },
    como: { es: 'Frente al pueblo.', en: 'Along the town shore.' },
  },
  {
    id: 152, cat: 'atractivo', localidad: 'chaiten', lat: -42.87, lng: -72.78, publicado: false,
    nombre: { es: 'Playa Santa Bárbara', en: 'Santa Bárbara Beach' },
    dist: { es: '10 km · 15 min al norte', en: '10 km · 15 min north' },
    desc: {
      es: 'Playa de arena negra flanqueada de bosque, considerada una de las más bonitas del litoral norte de la ruta. Camping y caminatas por la orilla; a veces se ven toninas.',
      en: 'A black-sand beach flanked by forest, considered one of the prettiest on the route’s northern coast. Camping and shoreline walks; dolphins sometimes appear.',
    },
    como: {
      es: 'Desvío señalizado desde el camino a Caleta Gonzalo.',
      en: 'Signposted turnoff from the Caleta Gonzalo road.',
    },
  },
  {
    id: 153, cat: 'servicio', localidad: 'chaiten', lat: -42.918, lng: -72.71,
    tel: '+56 600 401 9000', hrs: 'Según itinerario semanal (navieraustral.cl)',
    nombre: { es: 'Terminal de transbordadores de Chaitén', en: 'Chaitén Ferry Terminal' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Puerta marítima del tramo norte: Naviera Austral navega a Puerto Montt (~9–10 h) y a Quellón, en Chiloé (~5 h), con itinerario semanal que cambia por temporada. Es la alternativa que evita las barcazas de Hornopirén, y por eso se llena. Valores referenciales ago-2026: Puerto Montt–Chaitén desde $35.000 por pasajero ($43.300 extranjero); Quellón–Chaitén $30.000 por pasajero y $140.000 el vehículo liviano. Reserva en navieraustral.cl, sobre todo con vehículo, y confirma el zarpe: depende del clima.',
      en: 'The northern stretch’s sea gateway: Naviera Austral sails to Puerto Montt (~9–10 h) and to Quellón, on Chiloé (~5 h), on a weekly timetable that shifts with the season. It is the alternative that skips the Hornopirén ferries, which is why it fills up. Reference fares, Aug 2026: Puerto Montt–Chaitén from CLP 35,000 per passenger (CLP 43,300 for foreigners); Quellón–Chaitén CLP 30,000 per passenger and CLP 140,000 for a light vehicle. Book at navieraustral.cl, especially with a vehicle, and reconfirm: sailings depend on the weather.',
    },
    como: {
      es: 'Rampa en la costanera del pueblo. Pasajes en navieraustral.cl, +56 600 401 9000 o contacto@navieraustral.cl.',
      en: 'Ramp on the town waterfront. Tickets at navieraustral.cl, +56 600 401 9000 or contacto@navieraustral.cl.',
    },
  },
  {
    id: 154, cat: 'servicio', localidad: 'chaiten', lat: -42.9165, lng: -72.708, publicado: false,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Chaitén tiene combustible, comercio y cajero — el punto de reabastecimiento del tramo entre Hornopirén y La Junta. Carga combustible y efectivo: hacia el sur el siguiente punto confiable es La Junta.',
      en: 'Chaitén has fuel, shops and an ATM — the resupply point between Hornopirén and La Junta. Load up on fuel and cash: heading south the next reliable stop is La Junta.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 157, cat: 'emergencia', localidad: 'chaiten', lat: -42.9155, lng: -72.7075, tel: '131',
    nombre: { es: 'Hospital de Chaitén', en: 'Chaitén Hospital' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Hospital comunitario que atiende las urgencias de toda la comuna (incluye Villa Santa Lucía y El Amarillo). Casos graves se derivan a Puerto Montt, por mar o aire. SAMU 131.',
      en: 'Community hospital covering emergencies for the whole district (including Villa Santa Lucía and El Amarillo). Serious cases are referred to Puerto Montt by sea or air. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 158, cat: 'emergencia', localidad: 'chaiten', lat: -42.9171, lng: -72.7088, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Chaitén', en: 'Police — Chaitén' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en la comuna de Chaitén. Marca 133.',
      en: 'Police emergencies and rescue coordination in the Chaitén district. Dial 133.',
    },
    como: { es: 'En el centro.', en: 'Downtown.' },
  },
  {
    id: 159, cat: 'atractivo', localidad: 'el-amarillo', lat: -42.92, lng: -72.5,
    nombre: { es: 'P.N. Pumalín — portal El Amarillo', en: 'Pumalín N.P. — El Amarillo gateway' },
    dist: { es: '3 km · 5 min', en: '3 km · 5 min' },
    desc: {
      es: 'Entrada sur del Parque Nacional Pumalín Douglas Tompkins: senderos al ventisquero del Michinmahuida, campings de diseño impecable y bosque siempreverde al pie del volcán.',
      en: 'The southern gateway to Pumalín Douglas Tompkins National Park: trails to the Michinmahuida glacier, beautifully kept campgrounds and evergreen forest at the volcano’s foot.',
    },
    como: {
      es: 'Acceso señalizado desde la aldea; portería del parque.',
      en: 'Signposted access from the hamlet; park gatehouse.',
    },
  },
  {
    id: 160, cat: 'atractivo', localidad: 'el-amarillo', lat: -42.9, lng: -72.46, publicado: false,
    nombre: { es: 'Termas El Amarillo', en: 'El Amarillo Hot Springs' },
    dist: { es: '5 km · 10 min', en: '5 km · 10 min' },
    desc: {
      es: 'Piscinas termales sencillas en plena selva valdiviana, alimentadas por las aguas calientes del Michinmahuida. Clásico alto reparador del tramo.',
      en: 'Simple thermal pools deep in Valdivian rainforest, fed by the Michinmahuida’s hot waters. A classic restorative stop on this stretch.',
    },
    como: {
      es: 'Camino señalizado desde la aldea; cobro de entrada, lleva efectivo.',
      en: 'Signposted road from the hamlet; entry fee, bring cash.',
    },
  },
  {
    id: 161, cat: 'atractivo', localidad: 'el-amarillo', lat: -42.89, lng: -72.43, publicado: false,
    nombre: { es: 'Volcán Michinmahuida y su ventisquero', en: 'Michinmahuida Volcano & Glacier' },
    dist: { es: 'Sendero desde el portal', en: 'Trail from the gateway' },
    desc: {
      es: 'Macizo nevado que domina el horizonte de El Amarillo. El sendero al ventisquero avanza por el valle del río Amarillo hasta la lengua de hielo; jornada completa, paisaje mayor.',
      en: 'The snowy massif dominating El Amarillo’s horizon. The glacier trail follows the Amarillo river valley to the ice tongue; a full-day walk with big scenery.',
    },
    como: {
      es: 'Desde el portal El Amarillo del P.N. Pumalín; consulta condiciones en portería.',
      en: 'From Pumalín’s El Amarillo gateway; check conditions at the gatehouse.',
    },
  },
  {
    id: 162, cat: 'servicio', localidad: 'el-amarillo', lat: -42.9333, lng: -72.5333,
    nombre: { es: 'Abastecimiento en El Amarillo', en: 'Supplies in El Amarillo' },
    dist: { es: 'En la aldea', en: 'In the hamlet' },
    desc: {
      es: 'Almacenes básicos; sin estación de combustible ni cajero — los servicios completos están en Chaitén, a 25 km. Abastécete antes de venir.',
      en: 'Basic shops; no fuel station or ATM — full services are in Chaitén, 25 km away. Stock up before coming.',
    },
    como: { es: 'En la aldea, sobre la Ruta 7.', en: 'In the hamlet, on Route 7.' },
  },
  {
    id: 165, cat: 'emergencia', localidad: 'el-amarillo', lat: -42.933, lng: -72.5337, tel: '131',
    nombre: { es: 'Posta de Salud Rural El Amarillo', en: 'El Amarillo Rural Health Post' },
    dist: { es: 'En la aldea', en: 'In the hamlet' },
    desc: {
      es: 'Posta rural para primeros auxilios; las urgencias mayores se derivan al Hospital de Chaitén (25 km). SAMU 131; Carabineros en Chaitén, 133.',
      en: 'Rural post for first aid; major emergencies are referred to Chaitén Hospital (25 km). SAMU ambulance 131; police in Chaitén, dial 133.',
    },
    como: { es: 'En la aldea.', en: 'In the hamlet.' },
  },
  {
    id: 166, cat: 'atractivo', localidad: 'caleta-gonzalo', lat: -42.5633, lng: -72.5989,
    nombre: { es: 'Parque Nacional Pumalín Douglas Tompkins', en: 'Pumalín Douglas Tompkins National Park' },
    dist: { es: 'Alrededor de la caleta', en: 'All around the cove' },
    desc: {
      es: 'Uno de los grandes parques de la Patagonia: selva valdiviana intacta, alerces milenarios, fiordos y volcanes, legado de la familia Tompkins donado a Chile. Caleta Gonzalo es su corazón, con senderos, campings y centro de información.',
      en: 'One of Patagonia’s great parks: intact Valdivian rainforest, millennia-old alerce trees, fjords and volcanoes — the Tompkins family legacy donated to Chile. Caleta Gonzalo is its heart, with trails, campgrounds and an info centre.',
    },
    como: { es: 'La Ruta 7 cruza el parque; portería en la caleta.', en: 'Route 7 crosses the park; gatehouse at the cove.' },
  },
  {
    id: 167, cat: 'atractivo', localidad: 'caleta-gonzalo', lat: -42.58, lng: -72.6, publicado: false,
    nombre: { es: 'Sendero Cascadas', en: 'Cascadas Trail' },
    dist: { es: 'Desde la caleta', en: 'From the cove' },
    desc: {
      es: 'Caminata clásica de Caleta Gonzalo: pasarelas y escaleras por selva densa hasta una cascada escondida entre paredes de nalcas y helechos (5,6 km ida y vuelta).',
      en: 'Caleta Gonzalo’s classic walk: boardwalks and stairs through dense rainforest to a waterfall hidden among nalca plants and ferns (5.6 km round trip).',
    },
    como: { es: 'Inicio junto a la caleta.', en: 'Trailhead by the cove.' },
  },
  {
    id: 168, cat: 'atractivo', localidad: 'caleta-gonzalo', lat: -42.63, lng: -72.6, publicado: false,
    nombre: { es: 'Sendero Alerces', en: 'Alerces Trail' },
    dist: { es: '12 km · 15 min al sur', en: '12 km · 15 min south' },
    desc: {
      es: 'Paseo corto y llano entre alerces de miles de años, los gigantes protegidos que definen a Pumalín. Uno de los accesos más fáciles del mundo a un bosque de alerce milenario.',
      en: 'A short, flat walk among alerce trees thousands of years old — the protected giants that define Pumalín. One of the world’s easiest ways into an ancient alerce forest.',
    },
    como: { es: 'Sobre la Ruta 7 al sur de la caleta, señalizado.', en: 'On Route 7 south of the cove, signposted.' },
  },
  {
    id: 169, cat: 'servicio', localidad: 'caleta-gonzalo', lat: -42.5628, lng: -72.5995,
    tel: '+56 65 221 7413', hrs: 'Zarpes a Hornopirén 12:30 y 20:00',
    nombre: { es: 'Rampa de barcazas Caleta Gonzalo (a Hornopirén)', en: 'Caleta Gonzalo ferry ramp (to Hornopirén)' },
    dist: { es: 'En la caleta', en: 'At the cove' },
    desc: {
      es: 'Extremo sur del cruce bimodal: barcaza a Fiordo Largo (~45 min), 10 km por tierra hasta Leptepu y segunda barcaza a Hornopirén (~3 h 30); unas 5 h en total. Zarpes hacia el norte a las 12:30 y 20:00, con frecuencias comerciales adicionales en enero y febrero. Valores referenciales ago-2026 (no residente, cruce completo): auto o camioneta $72.650, pasajero o peatón $12.100, moto $18.200, bicicleta $8.050. Compra el pasaje en barcazas.cl ANTES de entrar a Pumalín: acá no hay señal para reservar ni para confirmar.',
      en: 'The southern end of the bimodal crossing: a ferry to Fiordo Largo (~45 min), 10 km overland to Leptepu and a second ferry to Hornopirén (~3 h 30); about 5 h in total. Northbound sailings at 12:30 and 20:00, with extra commercial sailings in January and February. Reference fares, Aug 2026 (non-resident, full crossing): car or pickup CLP 72,650, passenger or foot passenger CLP 12,100, motorbike CLP 18,200, bicycle CLP 8,050. Buy your ticket at barcazas.cl BEFORE entering Pumalín: there is no signal here to book or reconfirm.',
    },
    como: {
      es: 'Rampa en la caleta. Reservas en barcazas.cl (Somarco, +56 65 229 4855). El embarque es por orden de llegada aunque tengas pasaje: llega con una hora de holgura.',
      en: 'Ramp at the cove. Bookings at barcazas.cl (Somarco, +56 65 229 4855). Boarding is by order of arrival even with a ticket: allow an hour.',
    },
  },
  {
    id: 170, cat: 'alojamiento', localidad: 'caleta-gonzalo', lat: -42.5635, lng: -72.5985,
    nombre: { es: 'Cabañas y camping de Caleta Gonzalo', en: 'Caleta Gonzalo Cabins & Campground' },
    dist: { es: 'En la caleta', en: 'At the cove' },
    desc: {
      es: 'Infraestructura del parque: cabañas frente al fiordo Reñihué y campings de diseño cuidado. Cupos limitados — reserva en temporada y consulta apertura fuera de ella.',
      en: 'Park infrastructure: cabins facing the Reñihué fjord and carefully designed campgrounds. Limited capacity — book in season and check availability outside it.',
    },
    como: { es: 'En la caleta; consulta con la administración del parque.', en: 'At the cove; check with the park administration.' },
  },
  {
    id: 171, cat: 'comida', localidad: 'caleta-gonzalo', lat: -42.563, lng: -72.5987,
    nombre: { es: 'Cafetería de Caleta Gonzalo', en: 'Caleta Gonzalo Café' },
    dist: { es: 'En la caleta', en: 'At the cove' },
    desc: {
      es: 'El único punto de comida del sector: café del parque junto a la rampa, con horario de temporada. Fuera de él, viaja abastecido — no hay más servicios hasta Chaitén o Hornopirén.',
      en: 'The only food stop in the area: the park café by the ramp, open in season. Otherwise travel supplied — there are no more services until Chaitén or Hornopirén.',
    },
    como: { es: 'Junto a la rampa; horario de temporada.', en: 'By the ramp; seasonal hours.' },
  },
  {
    id: 172, cat: 'emergencia', localidad: 'caleta-gonzalo', lat: -42.5631, lng: -72.5991,
    nombre: { es: 'Emergencias — guardaparques Pumalín', en: 'Emergencies — Pumalín park rangers' },
    dist: { es: 'En la caleta', en: 'At the cove' },
    desc: {
      es: 'No hay posta en el sector: ante emergencias, acude a los guardaparques (portería/caleta), que coordinan por radio. La atención de salud más cercana está en Chaitén (56 km al sur) y en Hornopirén (vía barcaza). Sin señal de celular en gran parte del parque.',
      en: 'There is no health post here: in an emergency go to the park rangers (gatehouse/cove), who coordinate by radio. The nearest medical care is in Chaitén (56 km south) and Hornopirén (via ferry). No cell signal in much of the park.',
    },
    como: { es: 'Portería del parque, en la caleta.', en: 'Park gatehouse, at the cove.' },
  },
  {
    id: 173, cat: 'atractivo', localidad: 'hornopiren', lat: -41.9, lng: -72.3,
    nombre: { es: 'Parque Nacional Hornopirén', en: 'Hornopirén National Park' },
    dist: { es: '16 km · 40 min', en: '16 km · 40 min' },
    desc: {
      es: 'Parque de montaña poco visitado: bosques de alerce, lagos Cabrera y Pinto Concha y las faldas de los volcanes Hornopirén y Yates. Senderos exigentes con paisaje andino-patagónico de primera.',
      en: 'A little-visited mountain park: alerce forests, Cabrera and Pinto Concha lakes and the slopes of the Hornopirén and Yates volcanoes. Demanding trails with first-rate Andean-Patagonian scenery.',
    },
    como: {
      es: 'Acceso por camino interior desde el pueblo; consulta condiciones en la municipalidad o CONAF.',
      en: 'Inland road from town; check conditions with the municipality or CONAF.',
    },
  },
  {
    id: 174, cat: 'atractivo', localidad: 'hornopiren', lat: -42.0, lng: -72.5, publicado: false,
    nombre: { es: 'Termas de Llancahué', en: 'Llancahué Hot Springs' },
    dist: { es: 'En bote desde el pueblo', en: 'By boat from town' },
    desc: {
      es: 'Aguas termales en la isla Llancahué, frente a Hornopirén: baño caliente entre el bosque y el mar interior. Se cruza en lancha en pocos minutos; ideal como excursión de medio día.',
      en: 'Hot springs on Llancahué Island opposite Hornopirén: a warm soak between forest and inland sea. A short boat hop away; ideal as a half-day trip.',
    },
    como: {
      es: 'Lanchas desde la costanera; coordina con operadores locales.',
      en: 'Boats from the waterfront; arrange with local operators.',
    },
  },
  {
    id: 175, cat: 'atractivo', localidad: 'hornopiren', lat: -41.9578, lng: -72.4372, publicado: false,
    nombre: { es: 'Costanera y fiordos de Hornopirén', en: 'Hornopirén Waterfront & Fjords' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'El pueblo se asoma al fiordo Comau con el volcán Hornopirén de telón: caleta pesquera, gaviotas y el vaivén de las barcazas. Buen lugar para esperar el zarpe con un paseo por la orilla.',
      en: 'The town overlooks the Comau fjord with the Hornopirén volcano behind: a fishing cove, gulls and the coming and going of ferries. A fine place to wait for your sailing with a shoreline stroll.',
    },
    como: { es: 'Frente al pueblo.', en: 'Along the town shore.' },
  },
  {
    id: 176, cat: 'servicio', localidad: 'hornopiren', lat: -41.9583, lng: -72.4378,
    tel: '+56 65 221 7413', hrs: 'Zarpes 10:00 (subsidiado), 18:00 y 02:00',
    nombre: { es: 'Rampa de barcazas Hornopirén (a Caleta Gonzalo)', en: 'Hornopirén ferry ramp (to Caleta Gonzalo)' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Extremo norte del cruce bimodal: barcaza a Leptepu (~3 h 30), 10 km por tierra hasta Fiordo Largo y segunda barcaza a Caleta Gonzalo (~45 min); unas 5 h en total. El zarpe de las 10:00 es el subsidiado; los de 18:00 y 02:00 son comerciales y cuestan varias veces más. Valores referenciales ago-2026 (no residente, cruce completo): auto o camioneta $72.650, pasajero o peatón $12.100, moto $18.200, bicicleta $8.050. Reserva en barcazas.cl con días de anticipación —el cupo se vende por metro y en enero y febrero se agota— y confirma el zarpe la víspera: navega fiordos y depende del clima.',
      en: 'The northern end of the bimodal crossing: a ferry to Leptepu (~3 h 30), 10 km overland to Fiordo Largo and a second ferry to Caleta Gonzalo (~45 min); about 5 h in total. The 10:00 sailing is the subsidised one; the 18:00 and 02:00 sailings are commercial and cost several times more. Reference fares, Aug 2026 (non-resident, full crossing): car or pickup CLP 72,650, passenger or foot passenger CLP 12,100, motorbike CLP 18,200, bicycle CLP 8,050. Book at barcazas.cl days ahead —space is sold by the metre and sells out in January and February— and reconfirm the day before: it sails the fjords and depends on the weather.',
    },
    como: {
      es: 'Rampa en la costanera. Oficina Somarco: Ingenieros Militares 450, Hornopirén (+56 65 221 7413 / +56 65 229 4855, contacto@somarco.cl); pasajes en barcazas.cl. Preséntate 1–2 h antes: aun con reserva, el embarque es por orden de llegada.',
      en: 'Ramp on the waterfront. Somarco office: Ingenieros Militares 450, Hornopirén (+56 65 221 7413 / +56 65 229 4855, contacto@somarco.cl); tickets at barcazas.cl. Turn up 1–2 h early: even with a booking, boarding is by order of arrival.',
    },
  },
  {
    id: 177, cat: 'servicio', localidad: 'hornopiren', lat: -41.9575, lng: -72.4368, publicado: false,
    nombre: { es: 'Combustible y servicios', en: 'Fuel and services' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Hornopirén tiene combustible y comercio; el cajero puede quedarse sin efectivo en temporada, así que trae respaldo. Último reabastecimiento antes de embarcar hacia Pumalín.',
      en: 'Hornopirén has fuel and shops; the ATM can run out of cash in season, so bring backup. The last resupply before boarding toward Pumalín.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 180, cat: 'emergencia', localidad: 'hornopiren', lat: -41.9572, lng: -72.4365, tel: '131',
    nombre: { es: 'Salud y urgencias — Hornopirén', en: 'Health & emergencies — Hornopirén' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Centro de salud de la comuna de Hualaihué para atención primaria y urgencias básicas; los casos graves se derivan a Puerto Montt. SAMU 131.',
      en: 'Hualaihué district health centre for primary care and basic emergencies; serious cases are referred to Puerto Montt. SAMU ambulance 131.',
    },
    como: { es: 'En el pueblo.', en: 'In town.' },
  },
  {
    id: 181, cat: 'emergencia', localidad: 'hornopiren', lat: -41.9579, lng: -72.4374, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Hornopirén', en: 'Police — Hornopirén' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en la comuna de Hualaihué. Marca 133.',
      en: 'Police emergencies and rescue coordination in the Hualaihué district. Dial 133.',
    },
    como: { es: 'En el centro.', en: 'Downtown.' },
  },
  {
    id: 182, cat: 'atractivo', localidad: 'puerto-montt', lat: -41.4842, lng: -72.9337,
    nombre: { es: 'Hito Cero — inicio de la Carretera Austral', en: 'Kilometre Zero — start of the Carretera Austral' },
    dist: { es: 'Salida sureste de la ciudad', en: 'Southeast exit of the city' },
    desc: {
      es: 'Aquí parte la Ruta 7: el kilómetro cero de los 1.240 km que terminan en Villa O\'Higgins. La foto obligada del inicio (o del final) del gran viaje por la Patagonia.',
      en: 'Route 7 starts here: kilometre zero of the 1,240 km that end in Villa O\'Higgins. The must-take photo at the start (or finish) of the great Patagonian journey.',
    },
    como: {
      es: 'En el acceso sureste de Puerto Montt, inicio señalizado de la Ruta 7.',
      en: 'At Puerto Montt’s southeast exit, the signposted start of Route 7.',
    },
  },
  {
    id: 183, cat: 'atractivo', localidad: 'puerto-montt', lat: -41.4857, lng: -72.9614, publicado: false,
    nombre: { es: 'Caleta y mercado de Angelmó', en: 'Angelmó Cove & Market' },
    dist: { es: '3 km · 10 min del centro', en: '3 km · 10 min from downtown' },
    desc: {
      es: 'El mercado costero más famoso del sur de Chile: cocinerías de curanto y mariscos, artesanía en lana y madera, y el bullicio de la caleta. La despedida gastronómica perfecta antes de partir al sur.',
      en: 'Southern Chile’s most famous seaside market: curanto and shellfish eateries, wool and wood crafts, and the bustle of the cove. The perfect culinary send-off before heading south.',
    },
    como: { es: 'Costanera al oeste del centro.', en: 'Waterfront west of downtown.' },
  },
  {
    id: 184, cat: 'atractivo', localidad: 'puerto-montt', lat: -41.4693, lng: -72.9424, publicado: false,
    nombre: { es: 'Centro y costanera de Puerto Montt', en: 'Puerto Montt Downtown & Waterfront' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Plaza de Armas, catedral de alerce (1856) y la costanera del seno de Reloncaví con la escultura "Sentados frente al mar". Capital de Los Lagos y base logística natural del viaje.',
      en: 'The main square, the alerce-wood cathedral (1856) and the Reloncaví sound waterfront with the “Sitting by the Sea” sculpture. Los Lagos’ capital and the trip’s natural logistics base.',
    },
    como: { es: 'Centro de la ciudad.', en: 'City centre.' },
  },
  {
    id: 185, cat: 'atractivo', localidad: 'puerto-montt', lat: -41.5, lng: -72.6, publicado: false,
    nombre: { es: 'Parque Nacional Alerce Andino', en: 'Alerce Andino National Park' },
    dist: { es: '40 km · 50 min', en: '40 km · 50 min' },
    desc: {
      es: 'A un paso del inicio de la Ruta 7: alerces milenarios, decenas de lagunas de montaña y selva valdiviana. Un anticipo perfecto de lo que espera camino al sur.',
      en: 'Right off the start of Route 7: ancient alerce trees, dozens of mountain lagoons and Valdivian rainforest. A perfect preview of what awaits down south.',
    },
    como: {
      es: 'Accesos por Correntoso y Chamiza, señalizados desde la Ruta 7; entrada CONAF.',
      en: 'Correntoso and Chamiza accesses, signposted from Route 7; CONAF entrance.',
    },
  },
  {
    id: 186, cat: 'servicio', localidad: 'puerto-montt', lat: -41.62, lng: -72.66,
    hrs: 'Cada ~30 min de día; cada 1½ h de madrugada',
    nombre: { es: 'Barcaza La Arena — Caleta Puelche', en: 'La Arena — Caleta Puelche ferry' },
    dist: { es: '45 km · 1 h al sureste', en: '45 km · 1 h southeast' },
    desc: {
      es: 'El primer cruce de la Carretera Austral: ~30 min por el estuario de Reloncaví, todo el año y sin reserva — se embarca por orden de llegada y se paga en la rampa. Sale cada media hora durante el día y cada hora y media de madrugada. Valores referenciales ago-2026: pasajeros liberados; auto o camioneta $11.510, furgón $15.210, moto $8.280, bicicleta $3.130, carro de arrastre hasta 2 m $8.720. En enero y febrero llega temprano: la fila puede costarte dos zarpes.',
      en: 'The Carretera Austral’s first crossing: ~30 min over the Reloncaví estuary, year-round and with no booking — boarding is by order of arrival and you pay at the ramp. Departures every half hour through the day and every hour and a half overnight. Reference fares, Aug 2026: foot passengers free; car or pickup CLP 11,510, van CLP 15,210, motorbike CLP 8,280, bicycle CLP 3,130, trailer up to 2 m CLP 8,720. In January and February arrive early: the queue can cost you two sailings.',
    },
    como: {
      es: 'Ruta 7 hasta la rampa de La Arena, 45 km al sureste de Puerto Montt; se paga en la rampa. Opera Transportes del Estuario (testuario.cl).',
      en: 'Route 7 to the La Arena ramp, 45 km southeast of Puerto Montt; pay at the ramp. Operated by Transportes del Estuario (testuario.cl).',
    },
  },
  {
    id: 187, cat: 'servicio', localidad: 'puerto-montt', lat: -41.4865, lng: -72.9655, publicado: false,
    tel: '+56 600 401 9000', hrs: 'Según itinerario (navieraustral.cl, navimag.com)',
    nombre: { es: 'Terminales de ferries de Puerto Montt', en: 'Puerto Montt Ferry Terminals' },
    dist: { es: 'Sector Angelmó', en: 'Angelmó area' },
    desc: {
      es: 'Puerto de partida de los ferries que acortan la ruta: a Chaitén (evita las barcazas de Hornopirén, ~9–10 h, desde $35.000 por pasajero, valor referencial ago-2026) y a Puerto Chacabuco (Navimag / Naviera Austral, entra directo a Aysén). Reserva con anticipación, sobre todo con vehículo.',
      en: 'Departure port for the ferries that shortcut the route: to Chaitén (skipping the Hornopirén ferries, ~9–10 h, from CLP 35,000 per passenger, reference fare Aug 2026) and to Puerto Chacabuco (Navimag / Naviera Austral, straight into Aysén). Book ahead, especially with a vehicle.',
    },
    como: {
      es: 'Terminal de transbordadores, sector Angelmó. Naviera Austral: Angelmó 1673, Puerto Montt (+56 600 401 9000, contacto@navieraustral.cl).',
      en: 'Ferry terminal, Angelmó area. Naviera Austral: Angelmó 1673, Puerto Montt (+56 600 401 9000, contacto@navieraustral.cl).',
    },
  },
  {
    id: 188, cat: 'servicio', localidad: 'puerto-montt', lat: -41.47, lng: -72.9415, publicado: false,
    nombre: { es: 'Últimas compras — servicios de ciudad', en: 'Last shopping — full city services' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Puerto Montt tiene de todo: supermercados grandes, bancos, farmacias, repuestos, equipamiento outdoor y aeropuerto (El Tepual). Es EL lugar para armar el viaje: hacia el sur los servicios se espacian cada vez más.',
      en: 'Puerto Montt has everything: big supermarkets, banks, pharmacies, spare parts, outdoor gear and an airport (El Tepual). This is THE place to set up your trip: services thin out steadily to the south.',
    },
    como: { es: 'Por toda la ciudad.', en: 'Throughout the city.' },
  },
  {
    id: 191, cat: 'emergencia', localidad: 'puerto-montt', lat: -41.4635, lng: -72.9585, tel: '131',
    nombre: { es: 'Hospital de Puerto Montt', en: 'Puerto Montt Hospital' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Hospital regional de alta complejidad — el centro de derivación mayor de todo el tramo norte de la Carretera Austral. SAMU 131.',
      en: 'A high-complexity regional hospital — the main referral centre for the entire northern Carretera Austral. SAMU ambulance 131.',
    },
    como: { es: 'En la ciudad.', en: 'In the city.' },
  },
  {
    id: 192, cat: 'emergencia', localidad: 'puerto-montt', lat: -41.4696, lng: -72.9426, tel: '133', publicado: false,
    nombre: { es: 'Carabineros de Chile — Puerto Montt', en: 'Police — Puerto Montt' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Prefectura con cobertura completa de la ciudad y el inicio de la Ruta 7. Marca 133.',
      en: 'Full police coverage for the city and the start of Route 7. Dial 133.',
    },
    como: { es: 'Unidades en toda la ciudad.', en: 'Stations citywide.' },
  },
  // ---- Puerto Yungay (11-ago-2026) ----
  // Localidad nueva. Los dos servicios son REALES, del mapa turístico oficial de
  // la Municipalidad de Tortel (tortel.cl/mapa-turismo-tortel-2024), con su
  // teléfono verificado en la fuente. La barcaza se redacta con el criterio
  // conservador del proyecto: sin horarios inventados, porque cambian por
  // temporada y un horario equivocado en la ruta es peor que ninguno.
  {
    id: 193, cat: 'servicio', localidad: 'puerto-yungay', lat: -47.9343, lng: -73.3241,
    hrs: 'Zarpes 10:00 · 12:00 · 16:00 · 18:00 (verano)',
    nombre: {
      es: 'Barcaza Puerto Yungay — Río Bravo',
      en: 'Puerto Yungay — Río Bravo ferry',
    },
    dist: { es: 'En la rampa', en: 'At the ramp' },
    desc: {
      es: 'El cruce obligatorio para seguir al sur: la barcaza atraviesa el fiordo Mitchell hasta Río Bravo, donde continúa el camino a Villa O\'Higgins. Es GRATUITO —lo paga el Estado— y no admite reserva: se embarca por estricto orden de llegada. Son ~45 min de navegación. Horarios referenciales ago-2026, temporada alta: desde Puerto Yungay 10:00, 12:00, 16:00 y 18:00; desde Río Bravo 11:00, 13:00, 17:00 y 19:00. Entre abril y septiembre bajan a dos zarpes diarios. Confirma el horario antes de bajar a Tortel: perder el último cruce significa esperar al día siguiente.',
      en: 'The mandatory crossing to continue south: the ferry crosses Mitchell Fjord to Río Bravo, where the road to Villa O\'Higgins continues. It is FREE —the state pays for it— and takes no bookings: boarding is by strict order of arrival. The sailing takes ~45 min. Reference times, Aug 2026, high season: from Puerto Yungay 10:00, 12:00, 16:00 and 18:00; from Río Bravo 11:00, 13:00, 17:00 and 19:00. From April to September it drops to two sailings a day. Check the timetable before heading down to Tortel: missing the last crossing means waiting until the next day.',
    },
    como: {
      es: 'Rampa al final del camino desde el cruce con la Ruta 7. Sin reserva y sin pago: llega con holgura, que la fila se arma antes del zarpe y los cupos de vehículo son limitados.',
      en: 'Ramp at the end of the road from the Route 7 junction. No booking and no fare: arrive early, the queue forms before departure and vehicle space is limited.',
    },
  },
  {
    id: 194, cat: 'comida', localidad: 'puerto-yungay', lat: -47.9354, lng: -73.3241,
    tel: '+56 9 5020 6647',
    nombre: { es: 'Cafetería El Peregrino', en: 'El Peregrino Café' },
    dist: { es: 'En Puerto Yungay', en: 'In Puerto Yungay' },
    desc: {
      es: 'Comida al paso junto a la rampa: el único servicio de alimentación del cruce, y la parada natural mientras se espera la barcaza.',
      en: 'Quick food next to the ramp: the only place to eat at the crossing, and the natural stop while waiting for the ferry.',
    },
    como: { es: 'Junto a la rampa de Puerto Yungay.', en: 'Next to the Puerto Yungay ramp.' },
  },
  {
    id: 195, cat: 'alojamiento', localidad: 'puerto-yungay', lat: -47.9332, lng: -73.3241,
    tel: '+56 9 5020 6647',
    nombre: { es: 'Cabañas El Peregrino', en: 'El Peregrino Cabins' },
    dist: { es: 'En Puerto Yungay', en: 'In Puerto Yungay' },
    desc: {
      es: 'Cabañas en el sector de la rampa, a unos 200 m de la cafetería del mismo nombre (mismo teléfono). Capacidad para 10 personas. Es la única opción para dormir en el cruce, útil si se pierde el último zarpe del día.',
      en: 'Cabins by the ferry ramp, about 200 m from the café of the same name (same phone). Capacity for 10 people. The only place to sleep at the crossing — useful if you miss the day\'s last departure.',
    },
    como: { es: 'Sector de la rampa, Puerto Yungay.', en: 'Ramp area, Puerto Yungay.' },
  },
  // ---- Siembra "un servicio por localidad" (jul-2026) ----
  // Un lugar publicado por localidad y categoría. Las fichas comerciales
  // (dormir, comer) y los eventos de este bloque son PRELIMINARES: nombres
  // verosímiles sin teléfono, un cupo reservado hasta que llegue el dato
  // oficial (correo a las encargadas de turismo, a los dueños de los
  // servicios, o extracción desde fuentes públicas). Los de Raúl Marín
  // Balmaceda y Balmaceda, en cambio, son contenido real.
  {
    id: 3001, cat: 'alojamiento', localidad: 'puerto-montt', lat: -41.4656, lng: -72.9373, preliminar: true,
    nombre: { es: 'Hostal Costanera Angelmó', en: 'Costanera Angelmó Hostel' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Puerto Montt. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Puerto Montt. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Montt; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Montt; exact address to be confirmed.',
    },
  },
  {
    id: 3002, cat: 'comida', localidad: 'puerto-montt', lat: -41.4737, lng: -72.9387, preliminar: true,
    nombre: { es: 'Cocinería del Mercado de Angelmó', en: 'Angelmó Market Eatery' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Puerto Montt. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Puerto Montt. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Montt; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Montt; exact address to be confirmed.',
    },
  },
  {
    id: 3003, cat: 'evento', localidad: 'puerto-montt', lat: -41.4669, lng: -72.9478, preliminar: true,
    nombre: { es: 'Semana costumbrista de Angelmó', en: 'Angelmó Folk Week' },
    dist: { es: 'Centro', en: 'Downtown' },
    desc: {
      es: 'Cocinerías, curanto, mariscos y música chilota en el sector del mercado. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Market eateries, curanto, shellfish and Chilote music in the market area. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Puerto Montt.', en: 'Puerto Montt main square and community hall.' },
  },
  {
    id: 3004, cat: 'alojamiento', localidad: 'hornopiren', lat: -41.9556, lng: -72.4342, preliminar: true,
    nombre: { es: 'Cabañas Fiordo Comau', en: 'Fiordo Comau Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en Hornopirén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in Hornopirén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Hornopirén; dirección exacta por confirmar.',
      en: 'In the centre of Hornopirén; exact address to be confirmed.',
    },
  },
  {
    id: 3005, cat: 'comida', localidad: 'hornopiren', lat: -41.9604, lng: -72.435, preliminar: true,
    nombre: { es: 'Restaurante El Muelle', en: 'El Muelle Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en Hornopirén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in Hornopirén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Hornopirén; dirección exacta por confirmar.',
      en: 'In the centre of Hornopirén; exact address to be confirmed.',
    },
  },
  {
    id: 3006, cat: 'evento', localidad: 'hornopiren', lat: -41.9564, lng: -72.4404, preliminar: true,
    nombre: { es: 'Fiesta del Pescador de Hornopirén', en: 'Hornopirén Fisherman\'s Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Procesión de botes, mariscos, música en vivo y artesanía del fiordo. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Boat procession, shellfish, live music and fjord crafts. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Hornopirén.', en: 'Hornopirén main square and community hall.' },
  },
  {
    id: 3007, cat: 'evento', localidad: 'caleta-gonzalo', lat: -42.5619, lng: -72.6021, preliminar: true,
    nombre: { es: 'Jornada de senderos del Parque Pumalín', en: 'Pumalín Park Trails Day' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Caminatas guiadas por guardaparques, charlas del bosque valdiviano y voluntariado de senderos. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Ranger-guided walks, Valdivian forest talks and trail volunteering. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Caleta Gonzalo (Pumalín).',
      en: 'Caleta Gonzalo (Pumalín) main square and community hall.',
    },
  },
  {
    id: 3008, cat: 'alojamiento', localidad: 'chaiten', lat: -42.9147, lng: -72.7056, preliminar: true,
    nombre: { es: 'Hospedaje Santa Bárbara', en: 'Santa Bárbara Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Chaitén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Chaitén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Chaitén; dirección exacta por confirmar.',
      en: 'In the centre of Chaitén; exact address to be confirmed.',
    },
  },
  {
    id: 3009, cat: 'comida', localidad: 'chaiten', lat: -42.9195, lng: -72.7064, preliminar: true,
    nombre: { es: 'Cocinería Volcán Chaitén', en: 'Volcán Chaitén Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Chaitén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Chaitén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Chaitén; dirección exacta por confirmar.',
      en: 'In the centre of Chaitén; exact address to be confirmed.',
    },
  },
  {
    id: 3010, cat: 'evento', localidad: 'chaiten', lat: -42.9155, lng: -72.7118, preliminar: true,
    nombre: { es: 'Aniversario de Chaitén', en: 'Chaitén Anniversary Celebration' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Ferias, música en vivo y actividades en la costanera para celebrar el renacer del pueblo. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Fairs, live music and waterfront activities celebrating the town’s rebirth. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Chaitén.', en: 'Chaitén main square and community hall.' },
  },
  {
    id: 3011, cat: 'alojamiento', localidad: 'el-amarillo', lat: -42.9311, lng: -72.5303, preliminar: true,
    nombre: { es: 'Cabañas El Amarillo', en: 'El Amarillo Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en El Amarillo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in El Amarillo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de El Amarillo; dirección exacta por confirmar.',
      en: 'In the centre of El Amarillo; exact address to be confirmed.',
    },
  },
  {
    id: 3012, cat: 'comida', localidad: 'el-amarillo', lat: -42.9359, lng: -72.5311, preliminar: true,
    nombre: { es: 'Comedor Michinmahuida', en: 'Michinmahuida Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en El Amarillo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in El Amarillo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de El Amarillo; dirección exacta por confirmar.',
      en: 'In the centre of El Amarillo; exact address to be confirmed.',
    },
  },
  {
    id: 3013, cat: 'evento', localidad: 'el-amarillo', lat: -42.9319, lng: -72.5365, preliminar: true,
    nombre: { es: 'Fiesta campesina de El Amarillo', en: 'El Amarillo Country Fair' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Asado al palo, esquila, artesanía y productos del valle. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Spit-roasted lamb, sheep shearing, crafts and valley produce. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de El Amarillo.', en: 'El Amarillo main square and community hall.' },
  },
  {
    id: 3014, cat: 'alojamiento', localidad: 'villa-santa-lucia', lat: -43.4145, lng: -72.3637, preliminar: true,
    nombre: { es: 'Hospedaje El Cruce', en: 'El Cruce Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Villa Santa Lucía. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Villa Santa Lucía. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Santa Lucía; dirección exacta por confirmar.',
      en: 'In the centre of Villa Santa Lucía; exact address to be confirmed.',
    },
  },
  {
    id: 3015, cat: 'comida', localidad: 'villa-santa-lucia', lat: -43.4193, lng: -72.3645, preliminar: true,
    nombre: { es: 'Comedor Lago Yelcho', en: 'Lago Yelcho Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Villa Santa Lucía. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Villa Santa Lucía. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Santa Lucía; dirección exacta por confirmar.',
      en: 'In the centre of Villa Santa Lucía; exact address to be confirmed.',
    },
  },
  {
    id: 3016, cat: 'evento', localidad: 'villa-santa-lucia', lat: -43.4153, lng: -72.3699, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Villa Santa Lucía', en: 'Villa Santa Lucía Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Comida típica, música en vivo y juegos criollos en la villa. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Traditional food, live music and country games in the village. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Villa Santa Lucía.',
      en: 'Villa Santa Lucía main square and community hall.',
    },
  },
  {
    id: 3017, cat: 'alojamiento', localidad: 'futaleufu', lat: -43.1825, lng: -71.8667, preliminar: true,
    nombre: { es: 'Hostal Río Azul', en: 'Río Azul Hostel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Futaleufú. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Futaleufú. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Futaleufú; dirección exacta por confirmar.',
      en: 'In the centre of Futaleufú; exact address to be confirmed.',
    },
  },
  {
    id: 3018, cat: 'comida', localidad: 'futaleufu', lat: -43.1873, lng: -71.8675, preliminar: true,
    nombre: { es: 'Restaurante Espolón', en: 'Espolón Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en Futaleufú. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in Futaleufú. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Futaleufú; dirección exacta por confirmar.',
      en: 'In the centre of Futaleufú; exact address to be confirmed.',
    },
  },
  {
    id: 3019, cat: 'evento', localidad: 'futaleufu', lat: -43.1833, lng: -71.8729, preliminar: true,
    nombre: { es: 'Semana futaleufuana', en: 'Futaleufú Town Week' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Rodeo, bajadas de kayak y rafting, música en vivo y feria de artesanía. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Rodeo, kayak and rafting descents, live music and a crafts fair. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Futaleufú.', en: 'Futaleufú main square and community hall.' },
  },
  {
    id: 3020, cat: 'alojamiento', localidad: 'palena', lat: -43.6145, lng: -71.797, preliminar: true,
    nombre: { es: 'Hospedaje Casa Huasa', en: 'Casa Huasa Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Palena. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Palena. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Palena; dirección exacta por confirmar.',
      en: 'In the centre of Palena; exact address to be confirmed.',
    },
  },
  {
    id: 3021, cat: 'comida', localidad: 'palena', lat: -43.6193, lng: -71.7978, preliminar: true,
    nombre: { es: 'Comedor La Trilla', en: 'La Trilla Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Palena. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Palena. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Palena; dirección exacta por confirmar.',
      en: 'In the centre of Palena; exact address to be confirmed.',
    },
  },
  {
    id: 3022, cat: 'evento', localidad: 'palena', lat: -43.6153, lng: -71.8032, preliminar: true,
    nombre: { es: 'Rodeo y fiesta huasa de Palena', en: 'Palena Rodeo and Huaso Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Medialuna, jineteadas, asado al palo y cueca en la capital huasa de la Patagonia. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Rodeo arena, bronco riding, spit-roasted lamb and cueca dancing. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Palena.', en: 'Palena main square and community hall.' },
  },
  {
    id: 3023, cat: 'alojamiento', localidad: 'la-junta', lat: -43.9734, lng: -72.4028, preliminar: true,
    nombre: { es: 'Cabañas Lago Rosselot', en: 'Lago Rosselot Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en La Junta. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in La Junta. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de La Junta; dirección exacta por confirmar.',
      en: 'In the centre of La Junta; exact address to be confirmed.',
    },
  },
  {
    id: 3024, cat: 'comida', localidad: 'la-junta', lat: -43.9782, lng: -72.4036, preliminar: true,
    nombre: { es: 'Restaurante El Nudo', en: 'El Nudo Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en La Junta. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in La Junta. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de La Junta; dirección exacta por confirmar.',
      en: 'In the centre of La Junta; exact address to be confirmed.',
    },
  },
  {
    id: 3025, cat: 'evento', localidad: 'la-junta', lat: -43.9742, lng: -72.409, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de La Junta', en: 'La Junta Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Asado, música en vivo y muestra de artesanía del valle del Palena. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Barbecue, live music and a Palena valley crafts showcase. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de La Junta.', en: 'La Junta main square and community hall.' },
  },
  {
    id: 3026, cat: 'alojamiento', localidad: 'raul-marin-balmaceda', lat: -43.7761, lng: -72.9573, preliminar: true,
    nombre: { es: 'Hospedaje Boca del Palena', en: 'Boca del Palena Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Raúl Marín Balmaceda. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Raúl Marín Balmaceda. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Raúl Marín Balmaceda; dirección exacta por confirmar.',
      en: 'In the centre of Raúl Marín Balmaceda; exact address to be confirmed.',
    },
  },
  {
    id: 3027, cat: 'comida', localidad: 'raul-marin-balmaceda', lat: -43.7809, lng: -72.9581, preliminar: true,
    nombre: { es: 'Cocinería del Muelle', en: 'Del Muelle Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Raúl Marín Balmaceda. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Raúl Marín Balmaceda. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Raúl Marín Balmaceda; dirección exacta por confirmar.',
      en: 'In the centre of Raúl Marín Balmaceda; exact address to be confirmed.',
    },
  },
  {
    id: 3028, cat: 'atractivo', localidad: 'raul-marin-balmaceda', lat: -43.7743, lng: -72.9563,
    nombre: {
      es: 'Boca del río Palena — toninas y bosque siempreverde',
      en: 'Mouth of the Palena river — dolphins and evergreen forest',
    },
    dist: { es: 'En la isla, junto al pueblo', en: 'On the island, next to the village' },
    desc: {
      es: 'Pueblo isla en la desembocadura del río Palena, rodeado de bosque siempreverde, playas de arena y canales donde se avistan toninas, delfines y lobos marinos. Es el desvío costero más apartado del tramo norte y se llega por la Ruta X-12 desde La Junta.',
      en: 'An island village at the mouth of the Palena river, surrounded by evergreen forest, sandy beaches and channels where dolphins and sea lions are often seen. It is the most remote coastal detour of the northern section, reached via Route X-12 from La Junta.',
    },
    como: {
      es: 'Ruta X-12 al oeste desde La Junta (unos 74 km de ripio) y cruce en barcaza del río Palena; conviene confirmar los horarios antes de salir.',
      en: 'Route X-12 west from La Junta (about 74 km of gravel) plus a ferry crossing of the Palena river; check the schedule before setting out.',
    },
  },
  {
    id: 3029, cat: 'servicio', localidad: 'raul-marin-balmaceda', lat: -43.7793, lng: -72.9593,
    hrs: 'Verano 08:30–13:00 y 13:30–18:30 (invierno hasta 17:30)',
    nombre: { es: 'Abastecimiento y barcaza del río Palena', en: 'Supplies and the Palena river ferry' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Almacenes con lo básico y venta de combustible no siempre disponible: conviene cargar bencina y efectivo en La Junta. El acceso depende de la barcaza del río Palena, que es gratuita, cruza en unos 4 minutos y funciona por orden de llegada, sin reserva. Horario referencial ago-2026: 08:30–13:00 y 13:30–18:30 en verano; en invierno el segundo turno cierra a las 17:30. Con lluvias fuertes el río crece y arrastra troncos, y el cruce puede suspenderse: confirma en Carabineros de La Junta o de Raúl Marín antes de tomar la X-12.',
      en: 'Small shops with the basics and fuel that is not always available: fill up and get cash in La Junta. Access depends on the Palena river ferry, which is free, takes about 4 minutes and runs by order of arrival, with no booking. Reference hours, Aug 2026: 08:30–13:00 and 13:30–18:30 in summer; in winter the afternoon shift ends at 17:30. Heavy rain raises the river and washes down logs, and crossings can be suspended: check with the Carabineros in La Junta or Raúl Marín before taking Route X-12.',
    },
    como: {
      es: 'Casco del pueblo; la rampa de la barcaza queda en el acceso por la Ruta X-12.',
      en: 'Village centre; the ferry ramp is on the Route X-12 access.',
    },
  },
  {
    id: 3030, cat: 'evento', localidad: 'raul-marin-balmaceda', lat: -43.7769, lng: -72.9635, preliminar: true,
    nombre: { es: 'Fiesta del Mar de Raúl Marín Balmaceda', en: 'Raúl Marín Balmaceda Sea Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Mariscos, salidas en bote, avistamiento de toninas y música en el muelle. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Shellfish, boat trips, dolphin watching and music at the pier. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Raúl Marín Balmaceda.',
      en: 'Raúl Marín Balmaceda main square and community hall.',
    },
  },
  {
    id: 3031, cat: 'emergencia', localidad: 'raul-marin-balmaceda', lat: -43.7798, lng: -72.9611, tel: '131',
    nombre: { es: 'Posta de Salud Rural Raúl Marín Balmaceda', en: 'Raúl Marín Balmaceda Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta rural para primeros auxilios y urgencias básicas. Por ser un pueblo isla, las evacuaciones se coordinan por mar o aire hacia La Junta y Coyhaique: SAMU 131, Carabineros 133.',
      en: 'Rural health post for first aid and basic emergencies. As this is an island village, evacuations are coordinated by sea or air to La Junta and Coyhaique: ambulance 131, police 133.',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 3032, cat: 'alojamiento', localidad: 'puyuhuapi', lat: -44.3264, lng: -72.5537, preliminar: true,
    nombre: { es: 'Cabañas Fiordo Puyuhuapi', en: 'Fiordo Puyuhuapi Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en Puyuhuapi. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in Puyuhuapi. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puyuhuapi; dirección exacta por confirmar.',
      en: 'In the centre of Puyuhuapi; exact address to be confirmed.',
    },
  },
  {
    id: 3033, cat: 'comida', localidad: 'puyuhuapi', lat: -44.3312, lng: -72.5545, preliminar: true,
    nombre: { es: 'Cocinería Ventisquero', en: 'Ventisquero Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Puyuhuapi. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Puyuhuapi. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puyuhuapi; dirección exacta por confirmar.',
      en: 'In the centre of Puyuhuapi; exact address to be confirmed.',
    },
  },
  {
    id: 3034, cat: 'evento', localidad: 'puyuhuapi', lat: -44.3272, lng: -72.5599, preliminar: true,
    nombre: { es: 'Aniversario de Puyuhuapi', en: 'Puyuhuapi Anniversary Celebration' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Muestra de la tradición alfombrera y colona alemana, comida típica y música junto al fiordo. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'A showcase of the village’s carpet-weaving and German settler heritage, local food and music by the fjord. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Puyuhuapi.', en: 'Puyuhuapi main square and community hall.' },
  },
  {
    id: 3035, cat: 'alojamiento', localidad: 'villa-amengual', lat: -44.7145, lng: -72.1637, preliminar: true,
    nombre: { es: 'Hospedaje Cerro Pirámide', en: 'Cerro Pirámide Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Villa Amengual. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Villa Amengual. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Amengual; dirección exacta por confirmar.',
      en: 'In the centre of Villa Amengual; exact address to be confirmed.',
    },
  },
  {
    id: 3036, cat: 'comida', localidad: 'villa-amengual', lat: -44.7193, lng: -72.1645, preliminar: true,
    nombre: { es: 'Comedor Las Torres', en: 'Las Torres Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Villa Amengual. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Villa Amengual. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Amengual; dirección exacta por confirmar.',
      en: 'In the centre of Villa Amengual; exact address to be confirmed.',
    },
  },
  {
    id: 3037, cat: 'evento', localidad: 'villa-amengual', lat: -44.7153, lng: -72.1699, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Villa Amengual', en: 'Villa Amengual Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Comida típica, artesanía en lana y madera, y música en vivo en la villa. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Traditional food, wool and wood crafts, and live music in the village. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Villa Amengual.',
      en: 'Villa Amengual main square and community hall.',
    },
  },
  {
    id: 3038, cat: 'alojamiento', localidad: 'puerto-cisnes', lat: -44.74, lng: -72.6859, preliminar: true,
    nombre: { es: 'Hostal Piedra del Gato', en: 'Piedra del Gato Hostel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Puerto Cisnes. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Puerto Cisnes. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Cisnes; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Cisnes; exact address to be confirmed.',
    },
  },
  {
    id: 3039, cat: 'comida', localidad: 'puerto-cisnes', lat: -44.7448, lng: -72.6867, preliminar: true,
    nombre: { es: 'Marisquería El Cisne', en: 'El Cisne Seafood Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Pescado y mariscos del día preparados al estilo de la costa de Aysén, en Puerto Cisnes. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Fish and shellfish of the day cooked Aysén-coast style, in Puerto Cisnes. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Cisnes; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Cisnes; exact address to be confirmed.',
    },
  },
  {
    id: 3040, cat: 'evento', localidad: 'puerto-cisnes', lat: -44.7408, lng: -72.6921, preliminar: true,
    nombre: { es: 'Fiesta del Pescador de Puerto Cisnes', en: 'Puerto Cisnes Fisherman\'s Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Mariscos y pescado fresco, procesión de botes y música en la costanera. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Fresh fish and shellfish, boat procession and music on the waterfront. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Puerto Cisnes.',
      en: 'Puerto Cisnes main square and community hall.',
    },
  },
  {
    id: 3041, cat: 'alojamiento', localidad: 'villa-manihuales', lat: -45.2081, lng: -72.1517, preliminar: true,
    nombre: { es: 'Hospedaje Mañihuales', en: 'Mañihuales Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Villa Mañihuales. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Villa Mañihuales. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Mañihuales; dirección exacta por confirmar.',
      en: 'In the centre of Villa Mañihuales; exact address to be confirmed.',
    },
  },
  {
    id: 3042, cat: 'comida', localidad: 'villa-manihuales', lat: -45.2129, lng: -72.1525, preliminar: true,
    nombre: { es: 'Comedor Ruta 7', en: 'Ruta 7 Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Villa Mañihuales. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Villa Mañihuales. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Mañihuales; dirección exacta por confirmar.',
      en: 'In the centre of Villa Mañihuales; exact address to be confirmed.',
    },
  },
  {
    id: 3043, cat: 'evento', localidad: 'villa-manihuales', lat: -45.2089, lng: -72.1579, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Villa Mañihuales', en: 'Villa Mañihuales Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Asado al palo, juegos criollos y artesanía local junto a la Ruta 7. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Spit-roasted lamb, country games and local crafts by Route 7. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Villa Mañihuales.',
      en: 'Villa Mañihuales main square and community hall.',
    },
  },
  {
    id: 3044, cat: 'alojamiento', localidad: 'puerto-aysen', lat: -45.4011, lng: -72.6917, preliminar: true,
    nombre: { es: 'Hostal Puente Ibáñez', en: 'Puente Ibáñez Hostel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Puerto Aysén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Puerto Aysén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Aysén; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Aysén; exact address to be confirmed.',
    },
  },
  {
    id: 3045, cat: 'comida', localidad: 'puerto-aysen', lat: -45.4059, lng: -72.6925, preliminar: true,
    nombre: { es: 'Restaurante Río Aysén', en: 'Río Aysén Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en Puerto Aysén. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in Puerto Aysén. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Aysén; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Aysén; exact address to be confirmed.',
    },
  },
  {
    id: 3046, cat: 'evento', localidad: 'puerto-aysen', lat: -45.4019, lng: -72.6979, preliminar: true,
    nombre: { es: 'Semana aysenina', en: 'Puerto Aysén Town Week' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Desfiles, ferias, deportes en el río y música en vivo en la costanera. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Parades, fairs, river sports and live music on the waterfront. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Puerto Aysén.', en: 'Puerto Aysén main square and community hall.' },
  },
  {
    id: 3047, cat: 'alojamiento', localidad: 'puerto-chacabuco', lat: -45.4645, lng: -72.8137, preliminar: true,
    nombre: { es: 'Hospedaje Chacabuco', en: 'Chacabuco Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Puerto Chacabuco. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Puerto Chacabuco. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Chacabuco; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Chacabuco; exact address to be confirmed.',
    },
  },
  {
    id: 3048, cat: 'comida', localidad: 'puerto-chacabuco', lat: -45.4693, lng: -72.8145, preliminar: true,
    nombre: { es: 'Marisquería del Terminal', en: 'Terminal Seafood Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Pescado y mariscos del día preparados al estilo de la costa de Aysén, en Puerto Chacabuco. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Fish and shellfish of the day cooked Aysén-coast style, in Puerto Chacabuco. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Chacabuco; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Chacabuco; exact address to be confirmed.',
    },
  },
  {
    id: 3049, cat: 'evento', localidad: 'puerto-chacabuco', lat: -45.4653, lng: -72.8199, preliminar: true,
    nombre: { es: 'Fiesta del Pescador de Puerto Chacabuco', en: 'Puerto Chacabuco Fisherman\'s Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Mariscos, procesión de embarcaciones y música en el puerto. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Shellfish, boat procession and music at the port. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Puerto Chacabuco.',
      en: 'Puerto Chacabuco main square and community hall.',
    },
  },
  {
    id: 3050, cat: 'alojamiento', localidad: 'coyhaique', lat: -45.5682, lng: -72.0632, preliminar: true,
    nombre: { es: 'Hostal Piedra del Indio', en: 'Piedra del Indio Hostel' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Coyhaique. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Coyhaique. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Coyhaique; dirección exacta por confirmar.',
      en: 'In the centre of Coyhaique; exact address to be confirmed.',
    },
  },
  {
    id: 3051, cat: 'comida', localidad: 'coyhaique', lat: -45.5763, lng: -72.0646, preliminar: true,
    nombre: { es: 'Restaurante Simpson', en: 'Simpson Restaurant' },
    dist: { es: 'En la ciudad', en: 'In the city' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en Coyhaique. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in Coyhaique. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Coyhaique; dirección exacta por confirmar.',
      en: 'In the centre of Coyhaique; exact address to be confirmed.',
    },
  },
  {
    id: 3052, cat: 'evento', localidad: 'coyhaique', lat: -45.5695, lng: -72.0737, preliminar: true,
    nombre: { es: 'Aniversario de Coyhaique', en: 'Coyhaique Anniversary Celebration' },
    dist: { es: 'Centro', en: 'Downtown' },
    desc: {
      es: 'Ferias, exposición ganadera, rodeo y música en vivo en la capital regional. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Fairs, livestock show, rodeo and live music in the regional capital. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Coyhaique.', en: 'Coyhaique main square and community hall.' },
  },
  {
    id: 3053, cat: 'alojamiento', localidad: 'balmaceda', lat: -45.9115, lng: -71.6917, preliminar: true,
    nombre: { es: 'Hospedaje Balmaceda', en: 'Balmaceda Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Balmaceda. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Balmaceda. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Balmaceda; dirección exacta por confirmar.',
      en: 'In the centre of Balmaceda; exact address to be confirmed.',
    },
  },
  {
    id: 3054, cat: 'comida', localidad: 'balmaceda', lat: -45.9163, lng: -71.6925, preliminar: true,
    nombre: { es: 'Comedor La Estepa', en: 'La Estepa Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Balmaceda. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Balmaceda. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Balmaceda; dirección exacta por confirmar.',
      en: 'In the centre of Balmaceda; exact address to be confirmed.',
    },
  },
  {
    id: 3055, cat: 'atractivo', localidad: 'balmaceda', lat: -45.9107, lng: -71.6907,
    nombre: {
      es: 'Estepa patagónica y paso Huemules',
      en: 'Patagonian steppe and the Huemules border crossing',
    },
    dist: { es: 'En el pueblo y camino al paso', en: 'In the village and on the road to the pass' },
    desc: {
      es: 'El cambio de paisaje más brusco de la región: al este de Coyhaique el bosque se abre en estepa de coirón, con viento permanente, guanacos y cielos enormes. Por aquí sale la Ruta 245 al paso fronterizo Huemules, hacia Argentina.',
      en: 'The region’s sharpest change of scenery: east of Coyhaique the forest opens into tussock steppe, with constant wind, guanacos and huge skies. Route 245 continues from here to the Huemules border crossing into Argentina.',
    },
    como: {
      es: 'Ruta 245 desde Coyhaique (unos 55 km); el paso queda algunos kilómetros más al este del pueblo.',
      en: 'Route 245 from Coyhaique (about 55 km); the pass is a few kilometres east of the village.',
    },
  },
  {
    id: 3056, cat: 'servicio', localidad: 'balmaceda', lat: -45.9157, lng: -71.6927,
    nombre: {
      es: 'Aeropuerto Balmaceda — traslados y arriendo de autos',
      en: 'Balmaceda Airport — transfers and car rental',
    },
    dist: { es: 'Junto al pueblo', en: 'Next to the village' },
    desc: {
      es: 'La puerta aérea de la Región de Aysén: la mayoría de los viajeros de la Carretera Austral empieza o termina aquí. Hay arriendo de autos, transfer y buses a Coyhaique (unos 55 km). El viento fuerte puede desviar vuelos, así que conviene no calzar la conexión al límite.',
      en: 'The air gateway to the Aysén Region: most Carretera Austral travellers start or finish here. Car rental, transfers and buses to Coyhaique (about 55 km) are available. Strong winds can divert flights, so avoid tight connections.',
    },
    como: { es: 'Terminal del aeropuerto, sobre la Ruta 245.', en: 'Airport terminal, on Route 245.' },
  },
  {
    id: 3057, cat: 'evento', localidad: 'balmaceda', lat: -45.9123, lng: -71.6979, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Balmaceda', en: 'Balmaceda Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Asado, esquila, juegos criollos y artesanía de la estepa. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Barbecue, sheep shearing, country games and steppe crafts. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Balmaceda.', en: 'Balmaceda main square and community hall.' },
  },
  {
    id: 3058, cat: 'emergencia', localidad: 'balmaceda', lat: -45.9149, lng: -71.6957, tel: '131',
    nombre: { es: 'Posta de Salud Rural Balmaceda', en: 'Balmaceda Rural Health Post' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Posta rural para primeros auxilios y urgencias básicas. Los casos de mayor complejidad se derivan al Hospital Regional de Coyhaique, a unos 55 km: SAMU 131, Carabineros 133.',
      en: 'Rural health post for first aid and basic emergencies. More complex cases are referred to the Coyhaique Regional Hospital, about 55 km away: ambulance 131, police 133.',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 3059, cat: 'alojamiento', localidad: 'villa-cerro-castillo', lat: -46.1194, lng: -72.1606, preliminar: true,
    nombre: { es: 'Hospedaje Cerro Castillo', en: 'Cerro Castillo Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Villa Cerro Castillo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Villa Cerro Castillo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Cerro Castillo; dirección exacta por confirmar.',
      en: 'In the centre of Villa Cerro Castillo; exact address to be confirmed.',
    },
  },
  {
    id: 3060, cat: 'comida', localidad: 'villa-cerro-castillo', lat: -46.1242, lng: -72.1614, preliminar: true,
    nombre: { es: 'Cocinería Paredón de las Manos', en: 'Paredón de las Manos Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Villa Cerro Castillo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Villa Cerro Castillo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa Cerro Castillo; dirección exacta por confirmar.',
      en: 'In the centre of Villa Cerro Castillo; exact address to be confirmed.',
    },
  },
  {
    id: 3061, cat: 'evento', localidad: 'villa-cerro-castillo', lat: -46.1202, lng: -72.1668, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Villa Cerro Castillo', en: 'Villa Cerro Castillo Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Jineteadas, asado al palo, artesanía y música al pie del cerro Castillo. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Bronco riding, spit-roasted lamb, crafts and music at the foot of Cerro Castillo. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Villa Cerro Castillo.',
      en: 'Villa Cerro Castillo main square and community hall.',
    },
  },
  {
    id: 3062, cat: 'alojamiento', localidad: 'puerto-rio-tranquilo', lat: -46.623, lng: -72.6705, preliminar: true,
    nombre: { es: 'Cabañas Capillas de Mármol', en: 'Capillas de Mármol Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en Puerto Río Tranquilo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in Puerto Río Tranquilo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Río Tranquilo; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Río Tranquilo; exact address to be confirmed.',
    },
  },
  {
    id: 3063, cat: 'comida', localidad: 'puerto-rio-tranquilo', lat: -46.6278, lng: -72.6713, preliminar: true,
    nombre: { es: 'Cocinería Exploradores', en: 'Exploradores Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Puerto Río Tranquilo. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Puerto Río Tranquilo. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Río Tranquilo; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Río Tranquilo; exact address to be confirmed.',
    },
  },
  {
    id: 3064, cat: 'servicio', localidad: 'puerto-rio-tranquilo', lat: -46.6244, lng: -72.6723,
    nombre: { es: 'Combustible y abastecimiento', en: 'Fuel and supplies' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Punto de bencina y almacenes sobre la Ruta 7, en el pueblo base de las Capillas de Mármol. Es el abastecimiento intermedio entre Villa Cerro Castillo y Cochrane: conviene confirmar disponibilidad y llevar efectivo, porque no hay banco ni cajero.',
      en: 'Fuel point and shops on Route 7, in the base town for the Marble Caves. It is the mid-point supply stop between Villa Cerro Castillo and Cochrane: confirm availability and bring cash, as there is no bank or ATM.',
    },
    como: {
      es: 'Sobre la Carretera Austral, en el casco del pueblo.',
      en: 'On the Carretera Austral, in the town centre.',
    },
  },
  {
    id: 3065, cat: 'evento', localidad: 'puerto-rio-tranquilo', lat: -46.6238, lng: -72.6767, preliminar: true,
    nombre: { es: 'Aniversario de Puerto Río Tranquilo', en: 'Puerto Río Tranquilo Anniversary Celebration' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Feria de artesanía, comida típica y actividades náuticas en el lago General Carrera. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Crafts fair, traditional food and water activities on Lake General Carrera. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Puerto Río Tranquilo.',
      en: 'Puerto Río Tranquilo main square and community hall.',
    },
  },
  {
    id: 3066, cat: 'alojamiento', localidad: 'puerto-guadal', lat: -46.842, lng: -72.6997, preliminar: true,
    nombre: { es: 'Cabañas Los Maquis', en: 'Los Maquis Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en Puerto Guadal. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in Puerto Guadal. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Guadal; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Guadal; exact address to be confirmed.',
    },
  },
  {
    id: 3067, cat: 'comida', localidad: 'puerto-guadal', lat: -46.8468, lng: -72.7005, preliminar: true,
    nombre: { es: 'Cocinería Puerto Guadal', en: 'Puerto Guadal Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Puerto Guadal. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Puerto Guadal. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Guadal; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Guadal; exact address to be confirmed.',
    },
  },
  {
    id: 3068, cat: 'evento', localidad: 'puerto-guadal', lat: -46.8428, lng: -72.7059, preliminar: true,
    nombre: { es: 'Fiesta costumbrista de Puerto Guadal', en: 'Puerto Guadal Folk Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Comida típica, artesanía y música en vivo frente al lago. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Traditional food, crafts and live music by the lake. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Puerto Guadal.',
      en: 'Puerto Guadal main square and community hall.',
    },
  },
  {
    id: 3069, cat: 'alojamiento', localidad: 'chile-chico', lat: -46.5377, lng: -71.7258, preliminar: true,
    nombre: { es: 'Hostal Jeinimeni', en: 'Jeinimeni Hostel' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hostal con habitaciones privadas y compartidas, cocina para huéspedes y desayuno, en Chile Chico. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Hostel with private and shared rooms, guest kitchen and breakfast, in Chile Chico. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Chile Chico; dirección exacta por confirmar.',
      en: 'In the centre of Chile Chico; exact address to be confirmed.',
    },
  },
  {
    id: 3070, cat: 'comida', localidad: 'chile-chico', lat: -46.5425, lng: -71.7266, preliminar: true,
    nombre: { es: 'Restaurante Costanera del Lago', en: 'Costanera del Lago Restaurant' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Carta patagónica con cordero, pescado y cazuelas, con atención de almuerzo y cena, en Chile Chico. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Patagonian menu with lamb, fish and stews, open for lunch and dinner, in Chile Chico. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Chile Chico; dirección exacta por confirmar.',
      en: 'In the centre of Chile Chico; exact address to be confirmed.',
    },
  },
  {
    id: 3071, cat: 'evento', localidad: 'chile-chico', lat: -46.5385, lng: -71.732, preliminar: true,
    nombre: { es: 'Fiesta de la Cereza de Chile Chico', en: 'Chile Chico Cherry Festival' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Fruta de la zona, gastronomía, artesanía y música en el pueblo más soleado de Aysén. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Local fruit, food, crafts and music in the sunniest town in Aysén. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: { es: 'Plaza y sede vecinal de Chile Chico.', en: 'Chile Chico main square and community hall.' },
  },
  {
    id: 3072, cat: 'alojamiento', localidad: 'puerto-bertrand', lat: -47.0197, lng: -72.8217, preliminar: true,
    nombre: { es: 'Cabañas Nacimiento del Baker', en: 'Nacimiento del Baker Cabins' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, en Puerto Bertrand. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Cabins for four to six people, with kitchen, firewood and parking, in Puerto Bertrand. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Bertrand; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Bertrand; exact address to be confirmed.',
    },
  },
  {
    id: 3073, cat: 'comida', localidad: 'puerto-bertrand', lat: -47.0245, lng: -72.8225, preliminar: true,
    nombre: { es: 'Comedor del Baker', en: 'Del Baker Diner' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Puerto Bertrand. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Puerto Bertrand. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Puerto Bertrand; dirección exacta por confirmar.',
      en: 'In the centre of Puerto Bertrand; exact address to be confirmed.',
    },
  },
  {
    id: 3074, cat: 'evento', localidad: 'puerto-bertrand', lat: -47.0205, lng: -72.8279, preliminar: true,
    nombre: {
      es: 'Torneo de pesca deportiva de Puerto Bertrand',
      en: 'Puerto Bertrand Sport Fishing Tournament',
    },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Pesca con mosca en el nacimiento del río Baker, asado y premiación en el pueblo. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Fly fishing at the source of the Baker river, barbecue and prize-giving in the village. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Puerto Bertrand.',
      en: 'Puerto Bertrand main square and community hall.',
    },
  },
  {
    id: 3075, cat: 'alojamiento', localidad: 'cochrane', lat: -47.2502, lng: -72.5681, preliminar: true,
    nombre: { es: 'Hospedaje Plaza Cochrane', en: 'Plaza Cochrane Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Cochrane. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Cochrane. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Cochrane; dirección exacta por confirmar.',
      en: 'In the centre of Cochrane; exact address to be confirmed.',
    },
  },
  {
    id: 3076, cat: 'comida', localidad: 'cochrane', lat: -47.2583, lng: -72.5695, preliminar: true,
    nombre: { es: 'Cocinería Río Baker', en: 'Río Baker Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Cochrane. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Cochrane. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Cochrane; dirección exacta por confirmar.',
      en: 'In the centre of Cochrane; exact address to be confirmed.',
    },
  },
  {
    // Fuera de circulación (ago-2026): sin teléfono, y la ficha comercial que
    // no se puede contactar no le sirve a nadie. Relleno (preliminar) ya reemplazado por los 31 alojamientos reales de Tortel.
    id: 3077, cat: 'alojamiento', localidad: 'caleta-tortel', lat: -47.7945, lng: -73.533, preliminar: true, publicado: false,
    nombre: { es: 'Hospedaje Las Pasarelas', en: 'Las Pasarelas Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Caleta Tortel. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Caleta Tortel. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Caleta Tortel; dirección exacta por confirmar.',
      en: 'In the centre of Caleta Tortel; exact address to be confirmed.',
    },
  },
  {
    // Fuera de circulación (ago-2026): sin teléfono, y la ficha comercial que
    // no se puede contactar no le sirve a nadie. Relleno (preliminar) ya reemplazado por las 16 fichas de comida reales.
    id: 3078, cat: 'comida', localidad: 'caleta-tortel', lat: -47.7993, lng: -73.5338, preliminar: true, publicado: false,
    nombre: { es: 'Cocinería del Cipresal', en: 'Del Cipresal Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Caleta Tortel. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Caleta Tortel. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Caleta Tortel; dirección exacta por confirmar.',
      en: 'In the centre of Caleta Tortel; exact address to be confirmed.',
    },
  },
  {
    // Fuera de circulación (ago-2026): sin teléfono, y la ficha comercial que
    // no se puede contactar no le sirve a nadie. No es un negocio sino el nombre de una categoría; hoy hay 18 comercios reales.
    id: 3079, cat: 'servicio', localidad: 'caleta-tortel', lat: -47.7955, lng: -73.5342, publicado: false,
    nombre: { es: 'Abastecimiento en Caleta Tortel', en: 'Supplies in Caleta Tortel' },
    dist: { es: 'Sector centro, por las pasarelas', en: 'Central sector, via the boardwalks' },
    desc: {
      es: 'Almacenes pequeños con lo básico, sin banco ni cajero y con combustible que no siempre hay: carga bencina y efectivo en Cochrane (unos 127 km). Los vehículos quedan en el estacionamiento a la entrada, porque el pueblo se recorre a pie por las pasarelas.',
      en: 'Small shops with the basics, no bank or ATM and fuel that is not always available: fill up and get cash in Cochrane (about 127 km). Vehicles stay in the car park at the entrance, as the village is walked on its boardwalks.',
    },
    como: {
      es: 'Sector centro, por la pasarela principal.',
      en: 'Central sector, along the main boardwalk.',
    },
  },
  {
    id: 3080, cat: 'evento', localidad: 'caleta-tortel', lat: -47.7953, lng: -73.5392, preliminar: true,
    nombre: { es: 'Aniversario de Caleta Tortel', en: 'Caleta Tortel Anniversary Celebration' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Comida de mar, remo en la bahía y música sobre las pasarelas de ciprés. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Seafood, rowing in the bay and music on the cypress boardwalks. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Caleta Tortel.',
      en: 'Caleta Tortel main square and community hall.',
    },
  },
  {
    id: 3081, cat: 'alojamiento', localidad: 'villa-ohiggins', lat: -48.4664, lng: -72.5571, preliminar: true,
    nombre: { es: 'Hospedaje Fin de Ruta', en: 'Fin de Ruta Guesthouse' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedaje familiar con habitaciones simples y dobles, desayuno casero y estacionamiento, en Villa O\'Higgins. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Family-run guesthouse with single and double rooms, homemade breakfast and parking, in Villa O\'Higgins. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa O\'Higgins; dirección exacta por confirmar.',
      en: 'In the centre of Villa O\'Higgins; exact address to be confirmed.',
    },
  },
  {
    id: 3082, cat: 'comida', localidad: 'villa-ohiggins', lat: -48.4712, lng: -72.5579, preliminar: true,
    nombre: { es: 'Cocinería El Viajero', en: 'El Viajero Eatery' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocina casera patagónica: cordero, cazuelas y pan amasado, sobre todo en temporada alta, en Villa O\'Higgins. Ficha preliminar de referencia: estamos confirmando nombre, dirección y contacto con la oficina de turismo y con el propietario.',
      en: 'Home-style Patagonian cooking: lamb, stews and fresh bread, mainly in high season, in Villa O\'Higgins. Preliminary reference listing: we are confirming the name, address and contact details with the local tourist office and the owner.',
    },
    como: {
      es: 'En el casco de Villa O\'Higgins; dirección exacta por confirmar.',
      en: 'In the centre of Villa O\'Higgins; exact address to be confirmed.',
    },
  },
  {
    id: 3083, cat: 'evento', localidad: 'villa-ohiggins', lat: -48.4672, lng: -72.5633, preliminar: true,
    nombre: { es: 'Aniversario de Villa O’Higgins', en: 'Villa O’Higgins Anniversary Celebration' },
    dist: { es: 'Plaza del pueblo', en: 'Village square' },
    desc: {
      es: 'Ferias, asado, juegos criollos y música en el último pueblo de la Carretera Austral. Fecha por confirmar con la municipalidad: publicaremos el programa cuando sea oficial.',
      en: 'Fairs, barbecue, country games and music in the last village on the Carretera Austral. Date to be confirmed with the municipality: we will publish the programme once it is official.',
    },
    como: {
      es: 'Plaza y sede vecinal de Villa O\'Higgins.',
      en: 'Villa O\'Higgins main square and community hall.',
    },
  },
]

// Avisos municipales de ejemplo (en producción llegan como push desde el CMS)
export const AVISOS_SEED = [
  {
    es: 'Este sábado: Feria costumbrista en la Plaza de Armas desde las 11:00',
    en: 'This Saturday: folk fair at the main square from 11:00',
  },
  {
    es: 'Camino X-83 a Tortel con tránsito suspendido por nieve. Revisa antes de salir.',
    en: 'Route X-83 to Tortel closed due to snow. Check before leaving.',
  },
  {
    es: 'Pronóstico: viento fuerte esta tarde en el Valle Chacabuco. Precaución en senderos.',
    en: 'Forecast: strong winds this afternoon in Chacabuco Valley. Take care on trails.',
  },
  {
    es: 'Avistamiento de huemules reportado en sendero Tamanguito esta semana.',
    en: 'Huemul deer sightings reported on the Tamanguito trail this week.',
  },
]
