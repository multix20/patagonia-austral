// Datos semilla del directorio turístico (contenido de ejemplo para desarrollo).
// En producción estos contenidos provienen de la API Laravel (/api/places)
// y son administrados por funcionarios municipales desde el CMS.

// Localidades de la Carretera Austral sur (Fase 1 — multi-localidad).
// El slug es la clave estable que une lugares ↔ localidades (igual al backend).
// `orden` va norte → sur en decenas para poder intercalar pueblos después.
export const LOCALIDADES_SEED = [
  {
    slug: 'puerto-rio-tranquilo',
    nombre: { es: 'Puerto Río Tranquilo', en: 'Puerto Río Tranquilo' },
    lat: -46.6252, lng: -72.6735, zoom: 14, orden: 30,
  },
  {
    slug: 'cochrane',
    nombre: { es: 'Cochrane', en: 'Cochrane' },
    lat: -47.2539, lng: -72.5732, zoom: 13, orden: 60,
  },
  {
    slug: 'caleta-tortel',
    nombre: { es: 'Caleta Tortel', en: 'Caleta Tortel' },
    lat: -47.7967, lng: -73.536, zoom: 15, orden: 70,
  },
]

export const CATEGORIAS = {
  atractivo: { nombre: { es: 'Qué visitar', en: 'What to visit' }, icono: 'mountain', fondo: '#E1F5EE', color: '#0F6E56' },
  alojamiento: { nombre: { es: 'Dónde dormir', en: 'Where to sleep' }, icono: 'bed', fondo: '#EEEDFE', color: '#534AB7' },
  comida: { nombre: { es: 'Dónde comer', en: 'Where to eat' }, icono: 'utensils', fondo: '#FAECE7', color: '#D85A30' },
  servicio: { nombre: { es: 'Servicios', en: 'Services' }, icono: 'fuel', fondo: '#E6F1FB', color: '#185FA5' },
  evento: { nombre: { es: 'Eventos', en: 'Events' }, icono: 'calendar', fondo: '#FBEAF0', color: '#D4537E' },
  emergencia: { nombre: { es: 'Emergencias', en: 'Emergencies' }, icono: 'cross', fondo: '#FCEBEB', color: '#A32D2D' },
}

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
    id: 2, cat: 'atractivo', localidad: 'cochrane', lat: -47.225, lng: -72.522, tel: '+56 67 252 2164',
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
    id: 3, cat: 'atractivo', localidad: 'cochrane', lat: -47.11, lng: -72.48,
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
    id: 4, cat: 'atractivo', localidad: 'cochrane', lat: -47.2544, lng: -72.5741,
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
    id: 5, cat: 'alojamiento', localidad: 'cochrane', lat: -47.2536, lng: -72.5725, tel: '+56 9 1234 5678',
    nombre: { es: 'Hostal Patagonia (ejemplo)', en: 'Hostal Patagonia (sample)' },
    dist: { es: '200 m del centro', en: '200 m from downtown' },
    desc: {
      es: 'Habitaciones simples y dobles con desayuno casero. Estacionamiento y bicicletas para huéspedes. (Contenido de ejemplo).',
      en: 'Single and double rooms with homemade breakfast. Parking and bikes for guests. (Sample content).',
    },
    como: { es: 'Calle Tehuelches 361, a dos cuadras de la plaza.', en: 'Tehuelches St. 361, two blocks from the square.' },
  },
  {
    id: 6, cat: 'alojamiento', localidad: 'cochrane', lat: -47.258, lng: -72.578, tel: '+56 9 8765 4321',
    nombre: { es: 'Cabañas Río Baker (ejemplo)', en: 'Río Baker Cabins (sample)' },
    dist: { es: '800 m del centro', en: '800 m from downtown' },
    desc: {
      es: 'Cabañas equipadas para 2 a 6 personas con vista al río. Ideal para familias. (Contenido de ejemplo).',
      en: 'Fully equipped cabins for 2–6 people with river views. Great for families. (Sample content).',
    },
    como: { es: 'Salida sur del pueblo, camino a la costanera.', en: 'South exit of town, on the riverside road.' },
  },
  {
    id: 7, cat: 'comida', localidad: 'cochrane', lat: -47.2549, lng: -72.5738, tel: '+56 9 5555 1111',
    nombre: { es: 'Restaurante El Fogón (ejemplo)', en: 'El Fogón Restaurant (sample)' },
    dist: { es: 'Frente a la plaza', en: 'Facing the square' },
    desc: {
      es: 'Cordero al palo, cazuelas y platos patagones. Atención de 12:30 a 22:00. (Contenido de ejemplo).',
      en: 'Spit-roasted lamb, stews and Patagonian dishes. Open 12:30–22:00. (Sample content).',
    },
    como: { es: 'Calle Esmeralda, frente a la Plaza de Armas.', en: 'Esmeralda St., facing the main square.' },
  },
  {
    id: 8, cat: 'comida', localidad: 'cochrane', lat: -47.2531, lng: -72.5749,
    nombre: { es: 'Café del Sur (ejemplo)', en: 'Café del Sur (sample)' },
    dist: { es: '100 m de la plaza', en: '100 m from the square' },
    desc: {
      es: 'Café de especialidad, kuchen casero y sándwiches. Wifi para viajeros. (Contenido de ejemplo).',
      en: 'Specialty coffee, homemade kuchen and sandwiches. Wifi for travellers. (Sample content).',
    },
    como: { es: 'Calle Dr. Steffens esquina San Valentín.', en: 'Dr. Steffens St. at San Valentín corner.' },
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
    id: 10, cat: 'servicio', localidad: 'cochrane', lat: -47.2542, lng: -72.5735, tel: '+56 67 252 2115',
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
    id: 12, cat: 'emergencia', localidad: 'cochrane', lat: -47.2547, lng: -72.5729, tel: '133',
    nombre: { es: 'Carabineros de Chile — Tenencia Cochrane', en: 'Police — Cochrane Station' },
    dist: { es: '150 m de la plaza', en: '150 m from the square' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates. Informa aquí tus rutas de trekking antes de salir.',
      en: 'Police emergencies and rescue coordination. Register your trekking routes here before heading out.',
    },
    como: { es: 'Calle Esmeralda 398.', en: 'Esmeralda St. 398.' },
  },
  {
    id: 13, cat: 'emergencia', localidad: 'cochrane', lat: -47.2552, lng: -72.5745, tel: '132',
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
    id: 15, cat: 'evento', localidad: 'cochrane', lat: -47.2542, lng: -72.5738,
    nombre: { es: 'Feria de artesanía local', en: 'Local crafts fair' },
    dist: { es: 'En la plaza', en: 'At the square' },
    desc: {
      es: 'Sábados de temporada alta: lanas, maderas nativas, conservas y productos del campo aysenino. (Contenido de ejemplo).',
      en: 'High-season Saturdays: wool, native wood, preserves and Aysén farm products. (Sample content).',
    },
    como: { es: 'Costado norte de la Plaza de Armas.', en: 'North side of the main square.' },
  },

  // ---- Puerto Río Tranquilo ----
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
    id: 17, cat: 'atractivo', localidad: 'puerto-rio-tranquilo', lat: -46.509, lng: -73.174,
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

  // ---- Caleta Tortel ----
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
    id: 21, cat: 'emergencia', localidad: 'caleta-tortel', lat: -47.795, lng: -73.533, tel: '131',
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
