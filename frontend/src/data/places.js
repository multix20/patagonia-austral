// Datos semilla del directorio turístico (contenido de ejemplo para desarrollo).
// En producción estos contenidos provienen de la API Laravel (/api/places)
// y son administrados por funcionarios municipales desde el CMS.

// Localidades de la Carretera Austral sur (Fases 1 y 2 — multi-localidad).
// El slug es la clave estable que une lugares ↔ localidades (igual al backend).
// `orden` va norte → sur en decenas para poder intercalar pueblos después.
// Chile Chico (45) no está sobre la Carretera pero es el desvío clásico por la
// ribera sur del lago General Carrera, entre Puerto Guadal y Puerto Bertrand.
export const LOCALIDADES_SEED = [
  {
    slug: 'coyhaique',
    nombre: { es: 'Coyhaique', en: 'Coyhaique' },
    lat: -45.5719, lng: -72.0683, zoom: 13, orden: 10,
  },
  {
    slug: 'villa-cerro-castillo',
    nombre: { es: 'Villa Cerro Castillo', en: 'Villa Cerro Castillo' },
    lat: -46.1216, lng: -72.1636, zoom: 15, orden: 20,
  },
  {
    slug: 'puerto-rio-tranquilo',
    nombre: { es: 'Puerto Río Tranquilo', en: 'Puerto Río Tranquilo' },
    lat: -46.6252, lng: -72.6735, zoom: 14, orden: 30,
  },
  {
    slug: 'puerto-guadal',
    nombre: { es: 'Puerto Guadal', en: 'Puerto Guadal' },
    lat: -46.8442, lng: -72.7027, zoom: 15, orden: 40,
  },
  {
    slug: 'chile-chico',
    nombre: { es: 'Chile Chico', en: 'Chile Chico' },
    lat: -46.5399, lng: -71.7288, zoom: 14, orden: 45,
  },
  {
    slug: 'puerto-bertrand',
    nombre: { es: 'Puerto Bertrand', en: 'Puerto Bertrand' },
    lat: -47.0219, lng: -72.8247, zoom: 15, orden: 50,
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
  {
    slug: 'villa-ohiggins',
    nombre: { es: "Villa O'Higgins", en: "Villa O'Higgins" },
    lat: -48.4686, lng: -72.5601, zoom: 14, orden: 80,
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

  // ---- Coyhaique ----
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
    id: 23, cat: 'atractivo', localidad: 'coyhaique', lat: -45.5719, lng: -72.0683,
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
    id: 24, cat: 'atractivo', localidad: 'coyhaique', lat: -45.582, lng: -72.078,
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
    id: 25, cat: 'alojamiento', localidad: 'coyhaique', lat: -45.5731, lng: -72.0699, tel: '+56 9 1111 2222',
    nombre: { es: 'Hostal del Centro (ejemplo)', en: 'Downtown Hostel (sample)' },
    dist: { es: '300 m de la plaza', en: '300 m from the square' },
    desc: {
      es: 'Coyhaique concentra la mayor oferta de alojamiento de la región: hostales, hoteles y cabañas para todos los presupuestos. (Contenido de ejemplo).',
      en: 'Coyhaique has the region’s widest range of lodging: hostels, hotels and cabins for every budget. (Sample content).',
    },
    como: { es: 'A pasos de la Plaza de Armas.', en: 'Steps from the main square.' },
  },
  {
    id: 26, cat: 'comida', localidad: 'coyhaique', lat: -45.5713, lng: -72.0668,
    nombre: { es: 'Restaurante Patagón (ejemplo)', en: 'Patagón Restaurant (sample)' },
    dist: { es: 'Frente a la plaza', en: 'Facing the square' },
    desc: {
      es: 'Cordero, carnes a la parrilla y cerveza artesanal ayseninas. El centro reúne decenas de restaurantes y cafés. (Contenido de ejemplo).',
      en: 'Lamb, grilled meats and Aysén craft beer. Downtown has dozens of restaurants and cafés. (Sample content).',
    },
    como: { es: 'Sector Plaza de Armas.', en: 'Main square area.' },
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
    id: 29, cat: 'emergencia', localidad: 'coyhaique', lat: -45.5708, lng: -72.0662, tel: '133',
    nombre: { es: 'Carabineros de Chile — Comisaría Coyhaique', en: 'Police — Coyhaique Station' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y coordinación con rescate de montaña. Informa tus rutas de trekking antes de internarte en zonas aisladas.',
      en: 'Police emergencies and mountain-rescue coordination. Register your trekking routes before entering remote areas.',
    },
    como: { es: 'Sector céntrico, a cuadras de la Plaza de Armas.', en: 'Central area, blocks from the main square.' },
  },

  // ---- Villa Cerro Castillo ----
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
    id: 31, cat: 'atractivo', localidad: 'villa-cerro-castillo', lat: -46.1295, lng: -72.152,
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
    id: 32, cat: 'atractivo', localidad: 'villa-cerro-castillo', lat: -46.1223, lng: -72.1638,
    nombre: { es: 'Museo Escuela (antigua escuela rural)', en: 'School Museum (old rural school)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'La antigua escuela del pueblo convertida en museo de la vida pionera y la cultura gaucha del valle Ibáñez. Horarios acotados fuera de temporada.',
      en: 'The village’s old school turned into a museum of pioneer life and gaucho culture in the Ibáñez valley. Limited hours off-season.',
    },
    como: { es: 'Calle principal del pueblo (avenida O’Higgins).', en: 'Main street of the village (O’Higgins Avenue).' },
  },
  {
    id: 33, cat: 'alojamiento', localidad: 'villa-cerro-castillo', lat: -46.1219, lng: -72.1645, tel: '+56 9 3333 4444',
    nombre: { es: 'Hospedaje La Villa (ejemplo)', en: 'La Villa Guesthouse (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedajes familiares, cabañas y campings para los trekkers del cerro Castillo. Reserva con anticipación en temporada alta. (Contenido de ejemplo).',
      en: 'Family guesthouses, cabins and campsites for Cerro Castillo trekkers. Book ahead in high season. (Sample content).',
    },
    como: { es: 'Casco del pueblo, junto a la Carretera Austral.', en: 'Village centre, next to the Carretera Austral.' },
  },
  {
    id: 34, cat: 'comida', localidad: 'villa-cerro-castillo', lat: -46.1213, lng: -72.1629,
    nombre: { es: 'Cocinería del valle (ejemplo)', en: 'Valley eatery (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cocinerías y cafés de ruta con menú casero: cazuelas, asado y kuchen. (Contenido de ejemplo).',
      en: 'Roadside eateries and cafés with home cooking: stews, roast lamb and kuchen. (Sample content).',
    },
    como: { es: 'Sobre la calle principal.', en: 'On the main street.' },
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
    id: 37, cat: 'emergencia', localidad: 'villa-cerro-castillo', lat: -46.1207, lng: -72.1642, tel: '133',
    nombre: { es: 'Carabineros de Chile — Retén Cerro Castillo', en: 'Police — Cerro Castillo Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales y apoyo en rescates del parque nacional. Avisa aquí tu plan de trekking si vas a rutas largas.',
      en: 'Police emergencies and support for national-park rescues. Report your trekking plan here before long routes.',
    },
    como: { es: 'Junto a la calle principal.', en: 'By the main street.' },
  },

  // ---- Chile Chico ----
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
    id: 39, cat: 'atractivo', localidad: 'chile-chico', lat: -46.82, lng: -72.0,
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
    id: 40, cat: 'alojamiento', localidad: 'chile-chico', lat: -46.5402, lng: -71.7263, tel: '+56 9 5555 6666',
    nombre: { es: 'Hostería del Sol (ejemplo)', en: 'Hostería del Sol (sample)' },
    dist: { es: '200 m del centro', en: '200 m from downtown' },
    desc: {
      es: 'Hosterías, cabañas y residenciales familiares; el microclima hace agradable la estadía todo el año. (Contenido de ejemplo).',
      en: 'Inns, cabins and family guesthouses; the microclimate makes for a pleasant stay year-round. (Sample content).',
    },
    como: { es: 'Sector céntrico.', en: 'Central area.' },
  },
  {
    id: 41, cat: 'comida', localidad: 'chile-chico', lat: -46.5396, lng: -71.7248,
    nombre: { es: 'Restaurante frente al lago (ejemplo)', en: 'Lakefront restaurant (sample)' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Cocina casera y productos del microclima local: cerezas, duraznos y hortalizas de los huertos del pueblo. (Contenido de ejemplo).',
      en: 'Home cooking and produce from the local microclimate: cherries, peaches and vegetables from the town’s orchards. (Sample content).',
    },
    como: { es: 'Sector céntrico, cerca de la costanera.', en: 'Central area, near the waterfront.' },
  },
  {
    id: 42, cat: 'servicio', localidad: 'chile-chico', lat: -46.5405, lng: -71.729,
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
    nombre: { es: 'Barcaza Chile Chico — Puerto Ibáñez', en: 'Chile Chico — Puerto Ibáñez ferry' },
    dist: { es: 'Rampa en la costanera', en: 'Ramp on the waterfront' },
    desc: {
      es: 'La barcaza cruza el lago General Carrera y conecta Chile Chico con Puerto Ibáñez (unas 2 horas), atajo clave hacia Coyhaique. Lleva vehículos y pasajeros; reserva con anticipación en temporada alta.',
      en: 'The ferry crosses General Carrera Lake linking Chile Chico with Puerto Ibáñez (about 2 hours), a key shortcut to Coyhaique. Carries vehicles and passengers; book ahead in high season.',
    },
    como: {
      es: 'Rampa de la costanera; horarios y reservas en la oficina local o en línea.',
      en: 'Waterfront ramp; timetables and bookings at the local office or online.',
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
    id: 45, cat: 'emergencia', localidad: 'chile-chico', lat: -46.541, lng: -71.727, tel: '133',
    nombre: { es: 'Carabineros de Chile — Comisaría Chile Chico', en: 'Police — Chile Chico Station' },
    dist: { es: 'En el centro', en: 'Downtown' },
    desc: {
      es: 'Emergencias policiales y control fronterizo cercano (paso Río Jeinimeni hacia Los Antiguos, Argentina).',
      en: 'Police emergencies; the Río Jeinimeni border crossing to Los Antiguos, Argentina, is nearby.',
    },
    como: { es: 'Sector céntrico.', en: 'Central area.' },
  },

  // ---- Puerto Guadal ----
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
    id: 47, cat: 'atractivo', localidad: 'puerto-guadal', lat: -46.822, lng: -72.622,
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
    id: 48, cat: 'alojamiento', localidad: 'puerto-guadal', lat: -46.844, lng: -72.704, tel: '+56 9 7777 8888',
    nombre: { es: 'Cabañas del Lago (ejemplo)', en: 'Lakeside Cabins (sample)' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Cabañas, hospedajes y campings frente al lago, varios con vista a las montañas. (Contenido de ejemplo).',
      en: 'Cabins, guesthouses and campsites facing the lake, several with mountain views. (Sample content).',
    },
    como: { es: 'Sector costanera.', en: 'Waterfront area.' },
  },
  {
    id: 49, cat: 'comida', localidad: 'puerto-guadal', lat: -46.8445, lng: -72.7025,
    nombre: { es: 'Café-restaurante del pueblo (ejemplo)', en: 'Village café-restaurant (sample)' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Cocina casera y repostería en un circuito pequeño de cafés y cocinerías de temporada. (Contenido de ejemplo).',
      en: 'Home cooking and pastries in a small circuit of seasonal cafés and eateries. (Sample content).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
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
    id: 52, cat: 'emergencia', localidad: 'puerto-guadal', lat: -46.8442, lng: -72.702, tel: '133',
    nombre: { es: 'Carabineros de Chile — Retén Puerto Guadal', en: 'Police — Puerto Guadal Outpost' },
    dist: { es: 'En el pueblo', en: 'In town' },
    desc: {
      es: 'Emergencias policiales y orientación sobre el estado de los caminos de la ribera sur del lago.',
      en: 'Police emergencies and updates on the state of the southern lakeshore roads.',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },

  // ---- Puerto Bertrand ----
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
    id: 54, cat: 'atractivo', localidad: 'puerto-bertrand', lat: -47.022, lng: -72.824,
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
    id: 55, cat: 'alojamiento', localidad: 'puerto-bertrand', lat: -47.0215, lng: -72.8245, tel: '+56 9 2222 3333',
    nombre: { es: 'Cabañas junto al lago (ejemplo)', en: 'Lakeside cabins (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Cabañas y hospedajes pequeños frente al lago Bertrand, muchos orientados a pescadores. (Contenido de ejemplo).',
      en: 'Small cabins and guesthouses facing Lake Bertrand, many geared to anglers. (Sample content).',
    },
    como: { es: 'Casco del pueblo, frente al lago.', en: 'Village centre, facing the lake.' },
  },
  {
    id: 56, cat: 'comida', localidad: 'puerto-bertrand', lat: -47.0221, lng: -72.8242,
    nombre: { es: 'Cocinería del pueblo (ejemplo)', en: 'Village eatery (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Oferta pequeña y de temporada: cocinerías caseras y algún café. Fuera de temporada conviene llevar provisiones. (Contenido de ejemplo).',
      en: 'A small, seasonal offering: home-style eateries and the odd café. Off-season, carry your own provisions. (Sample content).',
    },
    como: { es: 'Calle principal.', en: 'Main street.' },
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
    id: 59, cat: 'emergencia', localidad: 'puerto-bertrand', lat: -47.0224, lng: -72.8244, tel: '133',
    nombre: { es: 'Carabineros de Chile — Retén Puerto Bertrand', en: 'Police — Puerto Bertrand Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales y coordinación de rescates en el río Baker y los senderos cercanos.',
      en: 'Police emergencies and rescue coordination on the Baker River and nearby trails.',
    },
    como: { es: 'Junto a la calle principal.', en: 'By the main street.' },
  },

  // ---- Villa O'Higgins ----
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
    id: 61, cat: 'atractivo', localidad: 'villa-ohiggins', lat: -48.517, lng: -72.586,
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
    id: 62, cat: 'atractivo', localidad: 'villa-ohiggins', lat: -48.463, lng: -72.556,
    nombre: { es: 'Mirador Cerro Santiago', en: 'Cerro Santiago Viewpoint' },
    dist: { es: '1 km · 45 min a pie', en: '1 km · 45 min on foot' },
    desc: {
      es: 'Sendero corto que sube por la ladera detrás del pueblo hasta miradores sobre Villa O’Higgins, el valle del río Mayer y los cordones del Campo de Hielo Sur.',
      en: 'A short trail climbing the hillside behind the village to viewpoints over Villa O’Higgins, the Mayer River valley and the ranges of the Southern Ice Field.',
    },
    como: { es: 'Inicio señalizado en el borde oriente del pueblo.', en: 'Signposted trailhead on the eastern edge of the village.' },
  },
  {
    id: 63, cat: 'alojamiento', localidad: 'villa-ohiggins', lat: -48.468, lng: -72.561, tel: '+56 9 9999 0000',
    nombre: { es: 'Hospedaje Fin de Ruta (ejemplo)', en: 'End-of-the-Road Guesthouse (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Hospedajes familiares, cabañas y camping para quienes culminan la Carretera. En temporada alta conviene reservar: la capacidad del pueblo es limitada. (Contenido de ejemplo).',
      en: 'Family guesthouses, cabins and camping for those finishing the Carretera. Book ahead in high season: the village’s capacity is limited. (Sample content).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
  },
  {
    id: 64, cat: 'comida', localidad: 'villa-ohiggins', lat: -48.4685, lng: -72.5605,
    nombre: { es: 'Cocinería El Viajero (ejemplo)', en: 'El Viajero Eatery (sample)' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Menú casero contundente para ciclistas y trekkers: cazuelas, asado y pan amasado. Horarios acotados fuera de temporada. (Contenido de ejemplo).',
      en: 'Hearty home cooking for cyclists and trekkers: stews, roast lamb and fresh bread. Limited hours off-season. (Sample content).',
    },
    como: { es: 'Calle principal del pueblo.', en: 'Main street of the village.' },
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
    id: 67, cat: 'emergencia', localidad: 'villa-ohiggins', lat: -48.4681, lng: -72.5594, tel: '133',
    nombre: { es: 'Carabineros de Chile — Retén Villa O’Higgins', en: 'Police — Villa O’Higgins Outpost' },
    dist: { es: 'En el pueblo', en: 'In the village' },
    desc: {
      es: 'Emergencias policiales, coordinación de rescates y registro recomendado para quienes siguen el cruce de frontera a pie hacia El Chaltén (Argentina).',
      en: 'Police emergencies, rescue coordination and recommended check-in for those continuing the on-foot border crossing to El Chaltén (Argentina).',
    },
    como: { es: 'Casco del pueblo.', en: 'Village centre.' },
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
