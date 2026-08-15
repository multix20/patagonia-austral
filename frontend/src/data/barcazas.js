// Cruces marítimos y lacustres de la Carretera Austral.
//
// POR QUÉ ESTE ARCHIVO. La app ya sabía dibujar los tramos de barcaza en el mapa
// y el copiloto sabía CONTARLOS ("hay 1 barcaza en el tramo"), pero un número no
// sirve para decidir: el viajero necesita saber cuál es, cuánto dura, si hay que
// reservar y qué pasa si pierde el último zarpe. Y sobre todo necesita saber que
// **hay más de un camino**: a la Austral se entra por tierra desde Puerto Montt,
// pero también por mar desde Puerto Montt, desde Quellón o desde Chacabuco, y esa
// elección cambia el viaje entero.
//
// En la Austral la barcaza no es un detalle logístico: es LO que decide el día.
// Perder el zarpe de Yungay significa dormir en la rampa; no reservar el bimodal
// de Hornopirén en enero significa no pasar.
//
// QUÉ NO GUARDA, a propósito: **horas exactas de zarpe**. Cambian por temporada,
// por clima y por operador, y un horario equivocado empaquetado en la app es peor
// que no tener horario — manda a alguien a una rampa a esperar un barco que no
// viene. Lo que se guarda es lo estable (ruta, operador, duración, si se reserva,
// si es gratis, temporada) y el copiloto siempre cierra diciendo que se confirma
// el horario del día antes.
//
// Fuentes (ago-2026): navieraustral.cl (Puerto Montt–Chaitén, Quellón–Chaitén,
// ruta corta Quellón–Melinka–Puerto Cisnes, ruta Cordillera Quellón–Chacabuco,
// lago General Carrera), barcazas.cl / Somarco (La Arena–Puelche y bimodal
// Hornopirén–Caleta Gonzalo), Naviera Transal (Fiordo Mitchell: Puerto
// Yungay–Río Bravo, gratuito y sin reserva), y las fichas ya curadas del propio
// directorio. El MOP anunció una segunda nave para Ibáñez–Chile Chico y otra
// para el lago O'Higgins dentro del Plan Ruta Austral 2026–2030.

export const CRUCES = [
  // ---- Los tres del corredor: van SÍ o SÍ si haces la ruta por tierra -------
  {
    id: 'la-arena-puelche',
    tipo: 'corredor',
    // Las DOS rampas, no solo una: un cruce ocupa un tramo de la ruta, y saber
    // dónde empieza y dónde termina es lo que evita cobrárselo dos veces (al
    // día que llega a la rampa y al día que zarpa desde ella).
    lat: -41.7574,
    lng: -72.656,
    lat2: -41.7799,
    lng2: -72.598,
    nombre: { es: 'La Arena – Caleta Puelche', en: 'La Arena – Caleta Puelche' },
    duracion: { es: '30–45 min', en: '30–45 min' },
    // Horas que se lleva el cruce, ESPERA INCLUIDA. Se descuenta del día: una
    // barcaza no es distancia, es tiempo, y sumarla mal es lo que hace que un
    // plan no se cumpla.
    horas: 1,
    operador: 'Somarco',
    reserva: 'no',
    gratis: false,
    temporada: { es: 'Todo el año', en: 'Year-round' },
    nota: {
      es: 'El primer cruce de la ruta, por el estuario de Reloncaví. Salidas frecuentes todo el día y por orden de llegada: no se reserva. En temporada alta llega temprano, la fila puede ser larga.',
      en: 'The first crossing of the route, over the Reloncaví estuary. Frequent departures all day, first come first served: no booking. In high season arrive early, the queue can be long.',
    },
  },
  {
    id: 'hornopiren-caleta-gonzalo',
    tipo: 'corredor',
    lat: -41.9578,
    lng: -72.4372,
    lat2: -42.5633,
    lng2: -72.5989,
    nombre: { es: 'Hornopirén – Caleta Gonzalo (bimodal)', en: 'Hornopirén – Caleta Gonzalo (bimodal)' },
    duracion: { es: '~5 h en total', en: '~5 h total' },
    // Cinco horas de cruce más la espera del zarpe: en la práctica es EL día.
    horas: 6,
    operador: 'Somarco',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Principalmente temporada (dic–mar)', en: 'Mainly summer season (Dec–Mar)' },
    nota: {
      es: 'Son dos barcazas y un tramo por tierra: Hornopirén–Leptepu (~3 h 30), 10 km de camino hasta Fiordo Largo, y Fiordo Largo–Caleta Gonzalo (~40 min). El cupo es limitado y **se agota**: reserva con días de anticipación en enero y febrero. Si no alcanzas cupo, la alternativa es el ferry Puerto Montt–Chaitén.',
      en: 'Two ferries and a land section: Hornopirén–Leptepu (~3 h 30), 10 km of road to Fiordo Largo, then Fiordo Largo–Caleta Gonzalo (~40 min). Capacity is limited and **sells out**: book days ahead in January and February. If you miss out, the alternative is the Puerto Montt–Chaitén ferry.',
    },
  },
  {
    id: 'yungay-rio-bravo',
    tipo: 'corredor',
    lat: -47.9351,
    lng: -73.3238,
    lat2: -47.9682,
    lng2: -73.2236,
    nombre: { es: 'Puerto Yungay – Río Bravo (Fiordo Mitchell)', en: 'Puerto Yungay – Río Bravo (Mitchell Fjord)' },
    duracion: { es: '~45 min', en: '~45 min' },
    horas: 1.5,
    operador: 'Naviera Transal',
    reserva: 'no',
    gratis: true,
    temporada: { es: 'Todo el año, menos salidas en invierno', en: 'Year-round, fewer departures in winter' },
    nota: {
      es: 'El paso obligado para llegar a Villa O\'Higgins, y es **gratuito** para todos: peatones, autos, motos, bicis y buses. No se reserva, se embarca por estricto orden de llegada. Varias salidas al día en verano — confirma el horario del día antes de bajar a Tortel: perder el último zarpe es dormir en la rampa.',
      en: 'The mandatory crossing to reach Villa O\'Higgins, and it is **free** for everyone: pedestrians, cars, motorbikes, bikes and buses. No booking, strictly first come first served. Several departures a day in summer — check the schedule the day before you head down to Tortel: missing the last one means sleeping at the ramp.',
    },
  },

  // ---- Por mar: otras formas de entrar y salir de la Austral ----------------
  {
    id: 'puerto-montt-chaiten',
    tipo: 'mar',
    nombre: { es: 'Puerto Montt – Chaitén (ferry)', en: 'Puerto Montt – Chaitén (ferry)' },
    duracion: { es: '~9 h', en: '~9 h' },
    operador: 'Naviera Austral',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Todo el año, más frecuencias en verano', en: 'Year-round, more sailings in summer' },
    nota: {
      es: 'La alternativa clásica: **se salta el bimodal de Hornopirén** y te deja directo en Chaitén, ya dentro de la Austral. Reserva con anticipación, sobre todo con vehículo (las medidas del auto se piden exactas).',
      en: 'The classic alternative: it **skips the Hornopirén bimodal** and drops you straight in Chaitén, already on the Austral. Book ahead, especially with a vehicle (exact car dimensions are required).',
    },
  },
  {
    id: 'quellon-chaiten',
    tipo: 'mar',
    nombre: { es: 'Quellón (Chiloé) – Chaitén', en: 'Quellón (Chiloé) – Chaitén' },
    duracion: { es: '~5 h', en: '~5 h' },
    operador: 'Naviera Austral',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Unos 4 días por semana', en: 'About 4 days a week' },
    nota: {
      es: 'El cruce más corto desde Chiloé. Sirve para armar el viaje bajando por la isla (Chacao, Castro, Quellón) y entrar a la Austral por Chaitén, sin repetir camino a la vuelta.',
      en: 'The shortest crossing from Chiloé. Great for coming down the island (Chacao, Castro, Quellón) and entering the Austral at Chaitén, without backtracking on the way home.',
    },
  },
  {
    id: 'quellon-cisnes',
    tipo: 'mar',
    nombre: { es: 'Quellón – Melinka – Puerto Cisnes', en: 'Quellón – Melinka – Puerto Cisnes' },
    duracion: { es: '~12 h', en: '~12 h' },
    operador: 'Naviera Austral',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Unos 5 días por semana', en: 'About 5 days a week' },
    nota: {
      es: 'La "ruta corta" desde Chiloé: entra a la Austral mucho más al sur, a la altura de Puerto Cisnes, saltándose todo el tramo norte.',
      en: 'The "short route" from Chiloé: it enters the Austral much further south, at Puerto Cisnes, skipping the entire northern section.',
    },
  },
  {
    id: 'quellon-chacabuco',
    tipo: 'mar',
    nombre: { es: 'Quellón – Puerto Chacabuco (ruta Cordillera)', en: 'Quellón – Puerto Chacabuco (Cordillera route)' },
    duracion: { es: '~28 h', en: '~28 h' },
    operador: 'Naviera Austral',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Servicio estacional: confirma antes de planificar', en: 'Seasonal service: confirm before planning' },
    nota: {
      es: 'Navegación larga por los fiordos con escalas en Melinka, Raúl Marín Balmaceda, Santo Domingo, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota y Puerto Aguirre. Es un viaje en sí mismo, no solo un traslado.',
      en: 'A long fjord sailing calling at Melinka, Raúl Marín Balmaceda, Santo Domingo, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota and Puerto Aguirre. A journey in itself, not just transport.',
    },
  },
  {
    id: 'puerto-montt-chacabuco',
    tipo: 'mar',
    nombre: { es: 'Puerto Montt – Puerto Chacabuco', en: 'Puerto Montt – Puerto Chacabuco' },
    duracion: { es: 'Navegación de un día', en: 'A full day at sea' },
    operador: 'Navimag / Naviera Austral',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Todo el año, según programación', en: 'Year-round, per schedule' },
    nota: {
      es: 'Entra directo al corazón de Aysén: desembarcas en Chacabuco, a ~80 km de Coyhaique, saltándote todo el tramo norte. Útil si tienes pocos días y quieres concentrarte en el sur.',
      en: 'Lands you straight in the heart of Aysén: you disembark at Chacabuco, ~80 km from Coyhaique, skipping the whole northern section. Useful with few days if you want to focus on the south.',
    },
  },

  // ---- De lago -------------------------------------------------------------
  {
    id: 'chile-chico-ibanez',
    tipo: 'lago',
    nombre: { es: 'Chile Chico – Puerto Ibáñez (lago General Carrera)', en: 'Chile Chico – Puerto Ibáñez (General Carrera lake)' },
    duracion: { es: '~2 h', en: '~2 h' },
    operador: 'Naviera Austral / Naviera Transal',
    reserva: 'recomendada',
    gratis: false,
    temporada: { es: 'Todo el año', en: 'Year-round' },
    nota: {
      es: 'Atajo clave: cruza el lago y te ahorra el rodeo completo por la ruta. Lleva vehículos y pasajeros; reserva con anticipación en temporada alta. El MOP anunció una segunda nave para esta ruta.',
      en: 'A key shortcut: it crosses the lake and saves the full detour by road. Takes vehicles and passengers; book ahead in high season. A second vessel for this route has been announced.',
    },
  },
  {
    id: 'ohiggins-candelario',
    tipo: 'lago',
    nombre: { es: 'Villa O\'Higgins – Candelario Mansilla (lago O\'Higgins)', en: 'Villa O\'Higgins – Candelario Mansilla (O\'Higgins lake)' },
    duracion: { es: '~1 h 30 a 2 h', en: '~1 h 30 to 2 h' },
    operador: 'Operadores locales de Villa O\'Higgins',
    reserva: 'obligatoria',
    gratis: false,
    temporada: { es: 'Septiembre a abril', en: 'September to April' },
    nota: {
      es: 'Zarpa de Bahía Bahamóndez, al final de la Carretera Austral, y es el paso hacia **El Chaltén (Argentina)**: desde Candelario Mansilla se sigue a pie o en bici hasta la frontera y el lago del Desierto. Cupo limitado y muy sensible al clima — con viento o nieve se suspende, y esperar varios días es normal. No lo pongas como último día de tu viaje.',
      en: 'It sails from Bahía Bahamóndez at the end of the Carretera Austral and is the way through to **El Chaltén (Argentina)**: from Candelario Mansilla you continue on foot or by bike to the border and Lago del Desierto. Limited capacity and very weather-dependent — wind or snow suspends it, and waiting several days is normal. Do not make it the last day of your trip.',
    },
  },

  // ---- De ramal ------------------------------------------------------------
  {
    id: 'rio-palena',
    tipo: 'ramal',
    nombre: { es: 'Barcaza del río Palena (acceso a Raúl Marín Balmaceda)', en: 'Palena river ferry (access to Raúl Marín Balmaceda)' },
    duracion: { es: 'Cruce corto', en: 'Short crossing' },
    operador: null,
    reserva: 'no',
    gratis: false,
    temporada: { es: 'Horarios acotados', en: 'Limited hours' },
    nota: {
      es: 'Va en el camino X-12 desde La Junta (unos 74 km de ripio). Los horarios son acotados y sensibles al clima: confírmalos en La Junta antes de tomar el desvío, o te quedas en la orilla equivocada.',
      en: 'On road X-12 from La Junta (about 74 km of gravel). Hours are limited and weather-sensitive: confirm them in La Junta before taking the detour, or you will be stuck on the wrong bank.',
    },
  },
]

/** Los tres cruces que van sí o sí si haces la ruta por tierra. */
export const CRUCES_CORREDOR = CRUCES.filter((c) => c.tipo === 'corredor')

/** Cómo se cuenta la reserva en cada idioma. */
export const RESERVA = {
  es: { no: 'sin reserva, por orden de llegada', recomendada: 'reserva recomendada', obligatoria: 'con reserva' },
  en: { no: 'no booking, first come first served', recomendada: 'booking recommended', obligatoria: 'booking required' },
}
