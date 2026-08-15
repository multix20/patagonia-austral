import { CATEGORIAS } from './places'

/**
 * Iconografía de guía de ruta (ago-2026).
 *
 * Dos capas encima de la categoría, con propósitos distintos:
 *
 * 1. ICONO POR SUBTIPO (`iconoDeLugar`). La categoría dice a qué GRUPO
 *    pertenece la ficha; el subtipo dice QUÉ ES. En una guía de ruta la
 *    diferencia no es cosmética: con el icono único de categoría, el taller
 *    mecánico, la barcaza, el cajero y la bomba de bencina se dibujaban los
 *    cuatro con un surtidor, o sea que el mapa AFIRMABA algo falso sobre tres
 *    de ellos. Lo mismo con dormir: una carpa y una cabaña se deciden distinto
 *    a las siete de la tarde en la ruta, y las dos eran una cama.
 *
 * 2. LA LLAMA (`esRecomendado`). Sello que se GANA con las calificaciones de
 *    los viajeros: se enciende sobre lo que vale la pena parar a ver, comer o
 *    dormir. No se compra — el sello comercial es otro (`destacado`, la
 *    estrella), y mezclarlos le quitaría el valor al que se gana.
 *
 * El subtipo se deduce del NOMBRE de la ficha, no de la descripción: el nombre
 * de un servicio de la Austral casi siempre dice qué es ("Camping Los Ñires",
 * "Estación de servicio", "Sendero Ventisquero"), mientras que la descripción
 * menciona de pasada cosas que no son la ficha ("a 200 m del camping"). Y se
 * deduce en el cliente a propósito: así vale igual para la semilla empaquetada
 * y para lo que llega de la API, sin agregarle un campo al CMS que alguien
 * tenga que mantener a mano ficha por ficha.
 */

// ---- La llama ----------------------------------------------------------

// Nota mínima para encender la llama.
export const LLAMA_MIN_ESTRELLAS = 4.5
/**
 * Opiniones mínimas. Sin este piso, la primera persona que pone cinco
 * estrellas corona el lugar: un 5,0 con una opinión no es una recomendación,
 * es una anécdota — y es exactamente así como las notas de otras plataformas
 * se vuelven imposibles de creer. La app ya muestra siempre el total al lado
 * del promedio por la misma razón.
 */
export const LLAMA_MIN_OPINIONES = 3

/**
 * Categorías donde la llama significa algo. Es un sello de RECOMENDACIÓN, así
 * que solo tiene sentido donde el viajero elige: dónde dormir, dónde comer y
 * qué visitar. Un hospital o una bomba de bencina no compiten por su
 * preferencia —los usa porque son los que hay—, y ahí una llama solo diría
 * "este hospital es mejor que el otro", que no es un mensaje que esta app deba
 * dar. Los eventos quedan fuera porque duran lo que duran: un sello ganado en
 * la fiesta costumbrista del año pasado no ayuda a decidir la de este año.
 */
export const CATEGORIAS_CON_LLAMA = ['alojamiento', 'comida', 'atractivo']

/** ¿Esta ficha se ganó la llama? */
export function esRecomendado(lugar) {
  if (!lugar || !CATEGORIAS_CON_LLAMA.includes(lugar.cat)) return false
  // Una ficha preliminar es un cupo reservado con datos por confirmar: no puede
  // recomendarse algo cuyo nombre y teléfono todavía estamos verificando.
  if (lugar.preliminar) return false
  const nota = Number(lugar.estrellas)
  const total = Number(lugar.calificaciones || 0)
  return Number.isFinite(nota) && nota >= LLAMA_MIN_ESTRELLAS && total >= LLAMA_MIN_OPINIONES
}

// ---- Icono por subtipo -------------------------------------------------

/**
 * Texto comparable: minúsculas y SIN tildes ni ñ (NFD descompone la letra y le
 * quitamos la marca). Así las reglas de abajo se escriben en ASCII plano y
 * "Cabañas", "cabanas" y "CABAÑAS" caen todas en la misma.
 */
function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Reglas por categoría, EN ORDEN: gana la primera que calce, así que lo más
 * específico va arriba. Sin coincidencia se usa el icono de la categoría, que
 * es el comportamiento de siempre — el subtipo agrega información cuando la
 * hay, nunca la inventa.
 */
const SUBTIPOS = {
  alojamiento: [
    [/camping|camp\b|acampar|campground|campsite/, 'tent'],
    [/refugio|domo|domos/, 'tent'],
    [/caban|cabin|lodge|casona|casa |departamento|apart/, 'house'],
    [/hostal|hostel|hospedaje|residencial|hotel|pension|b&b|bed and breakfast/, 'bed'],
  ],
  comida: [
    [/panaderia|pasteleria|bakery|cafe|coffee|salon de te|tea|chocolat/, 'coffee'],
    [/\bbar\b|cerveceria|pub|brewery|taproom/, 'beer'],
    [/restaurant|restoran|cocineria|comedor|parrilla|pizzer|marisqu|fuente de soda|food/, 'utensils'],
  ],
  atractivo: [
    [/glaciar|ventisquero|glacier|campo de hielo|hielo|nieve|ski/, 'snow'],
    [/mirador|viewpoint|lookout/, 'eye'],
    [/termas|termal|hot spring/, 'droplet'],
    [/sendero|trail|trekking|caminata|hiking|circuito/, 'footprints'],
    // Las áreas protegidas van ANTES que el agua: media docena de reservas de
    // la ruta llevan el lago en el nombre (Lago Cochrane, Jeinimeni) y salían
    // dibujadas como una laguna. Lo que el viajero decide ahí es "entrar a un
    // parque", no "ir a mirar agua".
    [/parque|reserva|park|reserve|bosque|forest|alerce|jardin/, 'tree'],
    [/lago|laguna|\brio\b|river|lake|salto|cascada|catarata|waterfall|fiordo|fjord|ventisquero/, 'waves'],
    [/museo|museum|iglesia|church|capilla|plaza|monumento|monument|cultural|cementerio|feria artesan/, 'landmark'],
    [/muelle|puerto|caleta|pier|harbor|harbour|pasarela/, 'anchor'],
    [/volcan|cerro|monte|volcano|mount|paso |frontera/, 'mountain'],
  ],
  servicio: [
    [/combustible|bencina|petroleo|estacion de servicio|surtidor|fuel|petrol|gas station|copec|shell|petrobras/, 'fuel'],
    [/barcaza|transbordador|ferry|naviera|catamaran|lancha|zarpe|rampa/, 'ship'],
    // Antes que los buses: Balmaceda es "aeropuerto — traslados", y traslados
    // ganaba. Al aeropuerto de la región no se llega en micro.
    [/aeropuerto|aerodromo|airport|airfield/, 'plane'],
    [/bus|buses|transporte|minibus|furgon|van|taxi|transfer|encomienda|terminal/, 'bus'],
    [/mecanic|taller|vulcaniz|neumatic|repuesto|workshop|tyre|tire|gomeria/, 'wrench'],
    [/banco|cajero|\batm\b|bank|redbanc|caja vecina/, 'banknote'],
    [/supermercado|minimarket|market|almacen|abarrote|tienda|verduler|carnicer|botiller|shop/, 'shopping-bag'],
    [/informacion|oficina de turismo|tourist|\boit\b|sernatur|conaf/, 'info'],
    [/farmacia|pharmacy/, 'cross'],
    [/lavanderia|laundry|ducha|shower|\bbanos\b|sanitario/, 'droplet'],
    [/wifi|internet|ciber/, 'wifi'],
    [/correo|chilexpress|starken|encomiendas/, 'send'],
  ],
  emergencia: [
    [/carabineros|policia|comisaria|reten|police|armada|capitania|sag\b/, 'shield'],
    [/bombero|fire/, 'alert'],
    [/hospital|posta|cesfam|sapu|ambulancia|salud|clinic|health|medic/, 'cross'],
    [/rescate|socorro|rescue|emergencia/, 'alert'],
  ],
  evento: [
    [/feria|mercado|market|expo|muestra/, 'shopping-bag'],
    [/rodeo|jineteada|carrera|maraton|competencia|race|cabalgata/, 'footprints'],
    [/asado|gastronom|costumbrista|degustacion/, 'utensils'],
  ],
}

/**
 * Icono que le corresponde a UNA ficha (subtipo si se reconoce, si no el de su
 * categoría). Se usa donde el dibujo representa a la ficha —el pin del mapa y
 * el icono grande de la tarjeta— y NO en la etiqueta de categoría ni en la
 * barra de filtros: ahí el icono representa al grupo entero y tiene que seguir
 * siendo el mismo, o la barra deja de servir de leyenda del mapa.
 */
export function iconoDeLugar(lugar) {
  const porCategoria = CATEGORIAS[lugar?.cat]?.icono || 'map-pin'
  const reglas = SUBTIPOS[lugar?.cat]
  if (!reglas) return porCategoria
  // Los dos idiomas juntos: las fichas mezclan ("Camping" en ES, "Campsite" en
  // EN) y el icono no puede cambiar al cambiar de idioma.
  const texto = normalizar(`${lugar?.nombre?.es || ''} ${lugar?.nombre?.en || ''}`)
  for (const [patron, icono] of reglas) {
    if (patron.test(texto)) return icono
  }
  return porCategoria
}
