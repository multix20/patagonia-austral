import { encolarConsulta, leerConsultas, borrarConsulta } from './db'

// Consultas de disponibilidad — lo que el asistente arma para que el viajero
// pueda RESERVAR (Fase 3).
//
// Qué hace y qué NO hace, porque la diferencia es todo el diseño: la app no
// reserva ni confirma nada. Los negocios chicos de la Austral no tienen sistema
// de reservas —contestan un WhatsApp— y consultar disponibilidad sin señal es
// imposible por definición. Lo que sí se puede hacer, y es donde está el valor,
// es dejar el mensaje ESCRITO: quién es, cuántos son y para cuándo, con el
// nombre del negocio, en el idioma del viajero y con un toque.
//
// Por eso el copy dice "pedir disponibilidad" y nunca "reservar". Prometer una
// reserva que nadie confirmó es la forma más rápida de quemar la confianza con
// el primer viajero que llegue a una cabaña ocupada — y con el dueño que lo
// recibe.

/**
 * Número al que se le puede escribir por WhatsApp, o `null`.
 *
 * Regla: se acepta el campo `whatsapp` de la ficha y, si no hay, el teléfono
 * SOLO cuando es un móvil chileno (9 dígitos que parten en 9). Un fijo de
 * Cochrane no tiene WhatsApp, y mandar a un chat que no existe es peor que no
 * ofrecer el botón: el viajero cree que avisó y nadie lo leyó nunca.
 */
export function numeroWhatsApp(lugar) {
  const bruto = (lugar?.whatsapp || lugar?.tel || '').trim()
  if (!bruto) return null

  // Número extranjero escrito con código de país explícito (un hospedaje de
  // dueño de afuera): se respeta tal cual, no hay regla chilena que aplicarle.
  const digitos = bruto.replace(/\D/g, '')
  if (bruto.startsWith('+') && !digitos.startsWith('56')) {
    return digitos.length >= 8 ? digitos : null
  }

  // Chile: se normaliza a 56 9 XXXX XXXX sin importar cómo esté escrito en la
  // ficha (+56 9…, 09…, 9 8765 4321).
  let n = digitos.startsWith('56') ? digitos.slice(2) : digitos
  n = n.replace(/^0+/, '')

  return n.length === 9 && n.startsWith('9') ? `56${n}` : null
}

/** ¿Esta ficha admite una consulta de disponibilidad por chat? */
export function sePuedeConsultar(lugar) {
  return numeroWhatsApp(lugar) !== null
}

// Cuándo llega el viajero. Tres opciones y no un calendario: se elige con el
// pulgar, en movimiento, y con una mano en el volante detenido a la orilla de
// la ruta. La fecha exacta la termina de acordar la conversación.
const CUANDO = {
  es: { hoy: 'hoy', manana: 'mañana', pronto: 'en los próximos días' },
  en: { hoy: 'today', manana: 'tomorrow', pronto: 'in the next few days' },
}

// El alojamiento se pregunta por noche, no por día: "para hoy" en una cabaña es
// "para esta noche".
const CUANDO_NOCHE = {
  es: { hoy: 'esta noche', manana: 'mañana en la noche', pronto: 'en los próximos días' },
  en: { hoy: 'tonight', manana: 'tomorrow night', pronto: 'in the next few days' },
}

function personasTexto(n, lang) {
  if (lang === 'es') return n === 1 ? '1 persona' : `${n} personas`
  return n === 1 ? '1 person' : `${n} people`
}

/**
 * El mensaje que se manda. Se menciona la app a propósito: es lo que le permite
 * al dueño saber de dónde le llegó el cliente, y sin eso no hay forma de
 * mostrarle después que la ficha le sirvió.
 */
export function mensajeConsulta({ lugar, lang, personas, cuando }) {
  const nombre = lugar.nombre[lang] || lugar.nombre.es
  const es = lang === 'es'
  const quienes = personasTexto(personas, lang)
  const noche = (es ? CUANDO_NOCHE.es : CUANDO_NOCHE.en)[cuando]
  const dia = (es ? CUANDO.es : CUANDO.en)[cuando]

  if (lugar.cat === 'alojamiento') {
    return es
      ? `Hola ${nombre}, los vi en la app Ruta Austral. ¿Tienen disponibilidad para ${quienes} ${noche}? Gracias.`
      : `Hi ${nombre}, I found you on the Ruta Austral app. Do you have availability for ${quienes} ${noche}? Thanks.`
  }

  if (lugar.cat === 'comida') {
    return es
      ? `Hola ${nombre}, los vi en la app Ruta Austral. ¿Tienen mesa para ${quienes} ${dia}? Gracias.`
      : `Hi ${nombre}, I found you on the Ruta Austral app. Do you have a table for ${quienes} ${dia}? Thanks.`
  }

  return es
    ? `Hola ${nombre}, los vi en la app Ruta Austral. Quería consultar por sus servicios ${dia}, somos ${quienes}. Gracias.`
    : `Hi ${nombre}, I found you on the Ruta Austral app. I'd like to ask about your services ${dia}, we are ${quienes}. Thanks.`
}

export function urlWhatsApp(numero, texto) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

/**
 * Guarda una consulta que no se pudo mandar por falta de señal.
 *
 * Se guarda el TEXTO ya armado, el número y el nombre del lugar, y no solo su
 * id: la ficha puede despublicarse o cambiar de nombre entre la ruta y el
 * pueblo, y lo que el viajero quiso decir no cambia por eso.
 */
export async function guardarConsulta({ placeId, nombre, numero, texto }) {
  return encolarConsulta({ placeId, nombre, numero, texto, creada: Date.now() })
}

/** Consultas pendientes, de la más nueva a la más vieja. */
export async function consultasPendientes() {
  try {
    const lista = await leerConsultas()
    return lista.sort((a, b) => b.creada - a.creada)
  } catch {
    // IndexedDB no disponible (modo privado): sin cola, pero el chat funciona.
    return []
  }
}

export async function descartarConsulta(clave) {
  try {
    await borrarConsulta(clave)
  } catch {
    // si no se pudo borrar, reaparece en el próximo recordatorio: molesto, no roto
  }
}
