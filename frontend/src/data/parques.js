// La Ruta de los Parques de la Patagonia, dentro de la Carretera Austral.
//
// QUÉ ES. Una iniciativa de Fundación Rewilding Chile (ex Tompkins Conservation)
// junto a CONAF y SERNATUR: 2.800 km de Puerto Montt a Cabo de Hornos que
// enhebran 17 parques nacionales y unas 60 comunidades. Su TRAMO NORTE es
// literalmente la Carretera Austral, o sea el territorio que esta app ya cubre
// entero: 11 de los 17 parques caen entre Puerto Montt y Villa O'Higgins.
//
// QUÉ ES ESTE ARCHIVO Y QUÉ NO. Es una capa de LECTURA sobre las fichas que ya
// existen, no un catálogo nuevo. La app no agrega una ficha por parque: agrega
// la pertenencia al parque en la ficha de su PUERTA DE ENTRADA, que es lo que el
// viajero decide de verdad ("desde Cochrane entro a Tamango"), y es además lo
// único que respeta la regla de un atractivo publicado por localidad.
//
// POR QUÉ SE DEDUCE EN EL CLIENTE Y NO ES UNA COLUMNA. Mismo criterio que el
// subtipo de `iconos.js`: así vale igual para la semilla empaquetada y para lo
// que llega de la API, y nadie tiene que mantener a mano un campo ficha por
// ficha en el CMS. Los parques son un conjunto CERRADO fijado por decreto —no
// rotan como los servicios—, así que caben empaquetados y funcionan sin señal,
// que es donde el viajero decide si entra o sigue de largo.
//
// OJO CON LA MARCA. "Ruta de los Parques de la Patagonia" es de Fundación
// Rewilding Chile. Los parques son públicos y describirlos es libre, y decir que
// un parque forma parte de la Ruta es un hecho citable — pero esta app NO es
// oficial de esa iniciativa, no usa su identidad y no reproduce su Pasaporte
// (el cuadernillo de sellos por parque visitado), que es producto suyo. El copy
// dice "forma parte de", nunca "en alianza con".

/** Cifras de la iniciativa completa, para el copy. Fuente: rutadelosparques.org. */
export const RUTA_PARQUES = {
  parquesTotal: 17,
  km: 2800,
  desde: { es: 'Puerto Montt', en: 'Puerto Montt' },
  hasta: { es: 'Cabo de Hornos', en: 'Cape Horn' },
}

/**
 * Los 11 parques de la Ruta que caen dentro del alcance de la app, norte → sur.
 *
 * Los 6 restantes —Torres del Paine, Pali Aike, Kawésqar, Alberto de Agostini,
 * Yendegaia y Cabo de Hornos— están en Magallanes, al sur de Villa O'Higgins y
 * fuera de la Ruta 7: no se listan porque esta app no los cubre, y una lista de
 * 17 con 6 que no se pueden abrir es una lista que miente.
 *
 * `entradas` son slugs de localidad: las puertas por donde se entra al parque
 * DESDE ESTA RUTA. No son "las localidades del parque" ni su superficie — son de
 * dónde sale el viajero. De ahí las saca el copiloto para decir qué parques hay
 * en el tramo del día, y por eso no se repiten coordenadas acá: las de cada
 * localidad ya viven en `places.js`, y un mismo punto escrito en dos archivos se
 * desincroniza siempre.
 *
 * `patron` reconoce las fichas del parque por su NOMBRE. Exige que el nombre
 * MENCIONE el parque ("Parque Nacional Queulat", "P.N. Cerro Castillo"): sin esa
 * exigencia, "Hospedaje Cerro Castillo" y "Posta de Villa Cerro Castillo"
 * quedarían dentro de un parque nacional. Se prefiere no marcar una ficha antes
 * que afirmar algo falso sobre ella.
 */
export const PARQUES = [
  {
    slug: 'alerce-andino',
    nombre: { es: 'P.N. Alerce Andino', en: 'Alerce Andino N.P.' },
    entradas: ['puerto-montt'],
    patron: /parque nacional alerce andino|alerce andino national park|p\.?n\.? alerce andino/,
  },
  {
    slug: 'hornopiren',
    nombre: { es: 'P.N. Hornopirén', en: 'Hornopirén N.P.' },
    entradas: ['hornopiren'],
    patron: /parque nacional hornopiren|hornopiren national park|p\.?n\.? hornopiren/,
  },
  {
    slug: 'pumalin',
    nombre: { es: 'P.N. Pumalín Douglas Tompkins', en: 'Pumalín Douglas Tompkins N.P.' },
    entradas: ['caleta-gonzalo', 'el-amarillo', 'chaiten'],
    // Sin "nacional" obligatorio: la jornada de senderos se llama "del Parque
    // Pumalín" a secas, que es como lo nombra todo el mundo en la ruta.
    patron: /parque (nacional )?pumalin|pumalin( douglas tompkins)? national park|p\.?n\.? pumalin/,
  },
  {
    slug: 'corcovado',
    nombre: { es: 'P.N. Corcovado', en: 'Corcovado N.P.' },
    entradas: ['chaiten'],
    patron: /parque nacional corcovado|corcovado national park|p\.?n\.? corcovado/,
  },
  {
    slug: 'melimoyu',
    nombre: { es: 'P.N. Melimoyu', en: 'Melimoyu N.P.' },
    entradas: ['raul-marin-balmaceda', 'la-junta'],
    patron: /parque nacional melimoyu|melimoyu national park|p\.?n\.? melimoyu/,
  },
  {
    slug: 'queulat',
    nombre: { es: 'P.N. Queulat', en: 'Queulat N.P.' },
    entradas: ['puyuhuapi'],
    patron: /parque nacional queulat|queulat national park|p\.?n\.? queulat/,
  },
  {
    slug: 'isla-magdalena',
    nombre: { es: 'P.N. Isla Magdalena', en: 'Isla Magdalena N.P.' },
    entradas: ['puerto-cisnes'],
    patron: /parque nacional isla magdalena|isla magdalena national park|p\.?n\.? isla magdalena/,
  },
  {
    slug: 'cerro-castillo',
    nombre: { es: 'P.N. Cerro Castillo', en: 'Cerro Castillo N.P.' },
    entradas: ['villa-cerro-castillo'],
    patron: /parque nacional cerro castillo|cerro castillo national park|p\.?n\.? cerro castillo|cerro castillo n\.?p\.?/,
  },
  {
    slug: 'laguna-san-rafael',
    nombre: { es: 'P.N. Laguna San Rafael', en: 'Laguna San Rafael N.P.' },
    entradas: ['puerto-chacabuco', 'puerto-rio-tranquilo'],
    patron: /parque nacional laguna san rafael|laguna san rafael national park|p\.?n\.? laguna san rafael/,
  },
  {
    slug: 'patagonia',
    nombre: { es: 'P.N. Patagonia', en: 'Patagonia N.P.' },
    // Los tres sectores del parque, cada uno con su puerta: Chacabuco y Tamango
    // desde Cochrane, Jeinimeni desde Chile Chico.
    entradas: ['cochrane', 'chile-chico'],
    // "Patagonia" a secas es media app ("Patagonia Austral", "Hostal Patagonia"),
    // así que acá el "parque nacional" NO es opcional.
    patron: /parque nacional patagonia|patagonia national park|p\.?n\.? patagonia/,
  },
  {
    slug: 'bernardo-ohiggins',
    nombre: { es: "P.N. Bernardo O'Higgins", en: "Bernardo O'Higgins N.P." },
    entradas: ['villa-ohiggins', 'caleta-tortel'],
    // El apóstrofo va como `.`: las fichas usan el tipográfico (’) y el teclado
    // escribe el recto ('). Y "bernardo" es obligatorio — sin él, cualquier
    // ficha de Villa O'Higgins entraría al parque.
    patron: /parque nacional bernardo o.higgins|bernardo o.higgins national park|p\.?n\.? bernardo o.higgins/,
  },
]

/** Índice slug → parque, para no recorrer la lista en cada consulta. */
const POR_SLUG = Object.fromEntries(PARQUES.map((p) => [p.slug, p]))

/** Misma normalización que `iconos.js`: minúsculas y sin tildes ni ñ. */
function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * ¿A qué parque de la Ruta pertenece esta ficha? Devuelve el parque o `null`.
 *
 * Se mira el nombre en LOS DOS idiomas, como en `iconoDeLugar`: las fichas
 * mezclan ("Parque Nacional" en ES, "National Park" en EN) y la pertenencia no
 * puede aparecer y desaparecer al cambiar de idioma.
 */
export function parqueDeLugar(lugar) {
  if (!lugar?.nombre) return null
  const texto = normalizar(`${lugar.nombre.es || ''} ${lugar.nombre.en || ''}`)
  return PARQUES.find((p) => p.patron.test(texto)) || null
}

/** Los parques a los que se entra desde esta localidad (slug). */
export function parquesDeLocalidad(slug) {
  if (!slug) return []
  return PARQUES.filter((p) => p.entradas.includes(slug))
}

/**
 * Los parques que se pueden abrir desde una lista de localidades, en orden
 * norte → sur y sin repetir: un parque con dos puertas en el mismo tramo
 * (Pumalín desde Caleta Gonzalo y desde El Amarillo) es UN parque, no dos.
 */
export function parquesDeLocalidades(slugs) {
  const vistos = new Set()
  for (const s of slugs || []) {
    for (const p of parquesDeLocalidad(s)) vistos.add(p.slug)
  }
  return PARQUES.filter((p) => vistos.has(p.slug))
}

/** Un parque por su slug, para el copy. */
export function parquePorSlug(slug) {
  return POR_SLUG[slug] || null
}
