import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import Huemul from './Huemul'
import { useI18n } from '../i18n'
import { contar } from '../analitica'
import {
  consultasPendientes,
  descartarConsulta,
  guardarConsulta,
  mensajeConsulta,
  numeroWhatsApp,
  sePuedeConsultar,
  urlWhatsApp,
} from '../reservas'
import { CRUCES, RESERVA } from '../data/barcazas'
import {
  NOMBRE_VEHICULO,
  crucesEntre,
  etapas,
  formatoHoras,
  guardarPerfil,
  kmEntre,
  leerPerfil,
  planDelDia,
  ubicarEnRuta,
} from '../viaje'

// Asistente turístico offline: motor de reglas que responde con los
// contenidos locales (IndexedDB). No requiere conexión.
//
// Multi-localidad (Fase 2): recibe SOLO los lugares de la localidad
// seleccionada (`lugares` = lugaresVisibles) y su nombre (`localidadNombre`).
// Las respuestas basadas en datos listan esos lugares; los consejos de prosa
// son genéricos de la Carretera Austral (no afirman datos específicos de un
// pueblo que serían falsos en otro).
//
// COPILOTO (ago-2026): además de responder, acompaña el viaje. Con el PERFIL
// (cuántos van, cuántos días, en qué vehículo, hacia dónde) y la POSICIÓN GPS
// arma el plan del día y el itinerario, y deja lista la consulta de
// disponibilidad por WhatsApp. Dos reglas que lo ordenan todo:
//
//  - Nada de esto puede depender de la señal. El plan se calcula con el trazado
//    y las localidades que ya viajan empaquetados (`viaje.js`), y la consulta
//    que no se puede mandar se guarda para el próximo pueblo con cobertura.
//  - El bot NO reserva: deja el mensaje escrito y lo manda la persona desde su
//    propio WhatsApp. Ver `reservas.js` para por qué.

const SUGERENCIAS = {
  es: ['¿Dónde estoy?', 'Plan de hoy', 'Barcazas', '¿Dónde dormir?', '¿Qué visitar?', 'Combustible', 'Emergencias'],
  en: ['Where am I?', "Today's plan", 'Ferries', 'Where to sleep?', 'What to visit?', 'Fuel', 'Emergencies'],
}

function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Recorta un texto a un resumen corto (primeras palabras), sin partir palabras,
// para enriquecer las listas del bot con una pincelada de contexto real.
function resumenBreve(texto, max = 120) {
  const t = (texto || '').trim()
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  const fin = corte.lastIndexOf(' ')
  return `${(fin > 40 ? corte.slice(0, fin) : corte).trimEnd()}…`
}

// Lista los lugares de una categoría (todos de la localidad activa). Opciones:
//  - conTel:  agrega el teléfono cuando existe (alojamiento, comida, servicios).
//  - conDesc: agrega una descripción breve real (atractivos) en vez de la distancia.
// Cada ítem cabe en UNA línea para no romper el render Markdown (viñetas).
function listaLugares(lugares, cat, lang, { conTel = false, conDesc = false, max = 0 } = {}) {
  const tel = lang === 'es' ? 'Tel' : 'Phone'
  const elegidos = lugares.filter((l) => l.cat === cat)
  return (max > 0 ? elegidos.slice(0, max) : elegidos)
    .map((l) => {
      // El nombre en **negrita** lo resalta el render Markdown de los mensajes.
      let linea = `• **${l.nombre[lang]}**`
      if (conDesc && l.desc?.[lang]) {
        linea += ` — ${resumenBreve(l.desc[lang])}`
      } else if (l.dist?.[lang]) {
        linea += ` — ${l.dist[lang].split('·')[0].trim()}`
      }
      if (conTel && l.tel) linea += ` · ${tel}: ${l.tel}`
      return linea
    })
    .join('\n')
}

// Resumen de lo que hay cargado en la localidad (conteo por categoría), para
// que el asistente responda algo concreto y propio del pueblo, no genérico.
function resumenLocalidad(lugares, lang, loc) {
  const es = lang === 'es'
  const etiquetas = {
    atractivo: es ? ['atractivo', 'atractivos'] : ['attraction', 'attractions'],
    alojamiento: es ? ['alojamiento', 'alojamientos'] : ['place to stay', 'places to stay'],
    comida: es ? ['lugar para comer', 'lugares para comer'] : ['place to eat', 'places to eat'],
    servicio: es ? ['servicio', 'servicios'] : ['service', 'services'],
    emergencia: es
      ? ['contacto de emergencia', 'contactos de emergencia']
      : ['emergency contact', 'emergency contacts'],
    evento: es ? ['evento', 'eventos'] : ['event', 'events'],
  }
  const partes = Object.entries(etiquetas)
    .map(([cat, [sing, plural]]) => {
      const n = lugares.filter((l) => l.cat === cat).length
      return n > 0 ? `${n} ${n === 1 ? sing : plural}` : null
    })
    .filter(Boolean)

  if (partes.length === 0) {
    return es
      ? `Todavía no tengo lugares cargados para ${loc}. Explora el mapa o vuelve a la vista de la ruta.`
      : `I don't have places loaded for ${loc} yet. Explore the map or go back to the route view.`
  }
  const lista = `• ${partes.join('\n• ')}`
  return es
    ? `Esto es lo que tengo sobre ${loc}:\n\n${lista}\n\nPregúntame por cualquiera de estos temas.`
    : `Here's what I have for ${loc}:\n\n${lista}\n\nAsk me about any of these.`
}

// Render de Markdown simple para los mensajes del bot: **negrita**, viñetas
// (líneas con • o -) como lista, y líneas en blanco como separación. Sin
// dependencias — el contenido lo generamos nosotros, así que el subset es acotado.
function inline(texto) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    /^\*\*[^*]+\*\*$/.test(seg) ? <strong key={i}>{seg.slice(2, -2)}</strong> : seg
  )
}

function Markdown({ texto }) {
  const bloques = []
  let items = null
  const cerrarLista = (k) => {
    if (items) {
      bloques.push(
        <ul key={`ul-${k}`} className="md-lista">
          {items}
        </ul>
      )
      items = null
    }
  }
  texto.split('\n').forEach((ln, i) => {
    const limpio = ln.trimStart()
    if (limpio.startsWith('• ') || limpio.startsWith('- ')) {
      if (!items) items = []
      items.push(<li key={`li-${i}`}>{inline(limpio.replace(/^[•-]\s+/, ''))}</li>)
    } else {
      cerrarLista(i)
      if (limpio === '') bloques.push(<div key={`sp-${i}`} className="md-sp" />)
      else bloques.push(<p key={`p-${i}`}>{inline(ln)}</p>)
    }
  })
  cerrarLista('fin')
  return bloques
}

/**
 * Los lugares ordenados por cercanía al viajero.
 *
 * Sin esto, en la vista "toda la ruta" la respuesta a "¿dónde dormir?" eran los
 * alojamientos de los 27 pueblos en el orden en que vinieron de la API — con
 * Puerto Montt arriba mientras la persona está parada en Cochrane. Teniendo GPS
 * no hay excusa: primero lo que tiene al lado.
 */
function porCercania(lugares, pos) {
  if (!pos) return lugares
  return [...lugares].sort(
    (a, b) => kmEntre(pos[0], pos[1], a.lat, a.lng) - kmEntre(pos[0], pos[1], b.lat, b.lng)
  )
}

// Cuántos lugares lista el bot de una categoría. Diez ya es una lista larga de
// leer en un teléfono; el mapa y el buscador están para ver el resto.
const MAX_LISTA = 8

// Lista los lugares de una categoría o, si no hay, un aviso claro para esa localidad.
function listaOFallback(lugares, cat, lang, loc, opciones = {}) {
  const l = listaLugares(lugares, cat, lang, opciones)
  if (l) return l
  return lang === 'es'
    ? `(Aún no tengo lugares de esta categoría cargados para ${loc}. Toca el mapa o la lista para explorar.)`
    : `(No places of this category are loaded for ${loc} yet. Tap the map or list to explore.)`
}

function saludo(lang, loc, lugares = [], perfil = null) {
  const es = lang === 'es'
  // Sin perfil, lo primero que ofrece el bot es armarlo: es lo que lo convierte
  // en copiloto (plan del día, itinerario, consultas ya escritas con el número
  // de personas correcto) y son cuatro toques.
  if (!perfil) {
    return es
      ? `¡Hola! Soy tu copiloto de la Carretera Austral. Puedo decirte dónde estás, hasta dónde llegas hoy, qué hay en el camino y dejarte lista la consulta de disponibilidad donde quieras parar.\n\nPara eso necesito cuatro datos de tu viaje — son cuatro toques.`
      : `Hi! I'm your Carretera Austral copilot. I can tell you where you are, how far you'll get today, what's along the way, and draft your availability request wherever you want to stop.\n\nI just need four things about your trip — four taps.`
  }
  const detalle = lugares.length > 0 ? `\n\n${resumenLocalidad(lugares, lang, loc)}` : ''
  return es
    ? `¡Hola de nuevo! Soy tu copiloto para ${loc}. Puedo ayudarte con el plan del día, lugares para visitar, alojamiento, comida y emergencias.${detalle || '\n\n¿Qué necesitas saber?'}`
    : `Hi again! I'm your copilot for ${loc}. I can help with today's plan, places to visit, lodging, food and emergencies.${detalle || '\n\nWhat do you need to know?'}`
}

// ---- Perfil de viaje: las cuatro preguntas ---------------------------------

// Chips, no teclado: esto se contesta con el pulgar, detenido a la orilla de la
// ruta y muchas veces con guantes.
const PASOS_PERFIL = ['personas', 'dias', 'vehiculo', 'sentido']

/**
 * "2 de 4" delante de la pregunta. Cuatro preguntas seguidas sin saber cuántas
 * faltan se sienten como un formulario, y un formulario se abandona; sabiendo
 * que son cuatro, se contestan.
 */
function conPaso(paso, texto, lang) {
  const n = PASOS_PERFIL.indexOf(paso) + 1
  return `${n} ${lang === 'es' ? 'de' : 'of'} ${PASOS_PERFIL.length} · ${texto}`
}

function preguntaPerfil(paso, lang) {
  const es = lang === 'es'
  switch (paso) {
    case 'personas':
      return {
        texto: es ? '¿Cuántos viajan?' : 'How many are traveling?',
        opciones: [
          { txt: es ? 'Solo yo' : 'Just me', val: 1 },
          { txt: '2', val: 2 },
          { txt: '3', val: 3 },
          { txt: es ? '4 o más' : '4 or more', val: 4 },
        ],
      }
    case 'dias':
      return {
        texto: es ? '¿Cuántos días tienes para la ruta?' : 'How many days do you have for the route?',
        opciones: [
          { txt: es ? '2 o 3' : '2 or 3', val: 3 },
          { txt: es ? '4 a 6' : '4 to 6', val: 5 },
          { txt: es ? 'Una semana' : 'A week', val: 7 },
          { txt: es ? 'Dos o más' : 'Two weeks +', val: 14 },
        ],
      }
    case 'vehiculo':
      return {
        texto: es ? '¿En qué andas? Cambia mucho el ritmo del día.' : "What are you traveling in? It changes the day's pace a lot.",
        opciones: ['auto', '4x4', 'motorhome', 'moto', 'bus', 'bici'].map((v) => ({
          txt: NOMBRE_VEHICULO[lang][v],
          val: v,
        })),
      }
    default:
      return {
        texto: es ? '¿Hacia dónde vas?' : 'Which way are you heading?',
        opciones: [
          { txt: es ? 'Hacia el sur' : 'Southbound', val: 'sur' },
          { txt: es ? 'Hacia el norte' : 'Northbound', val: 'norte' },
        ],
      }
  }
}

function resumenPerfil(perfil, lang) {
  const es = lang === 'es'
  const gente = perfil.personas === 1 ? (es ? 'viajas solo' : 'traveling solo') : es ? `van ${perfil.personas}` : `${perfil.personas} of you`
  const rumbo = perfil.sentido === 'sur' ? (es ? 'hacia el sur' : 'southbound') : es ? 'hacia el norte' : 'northbound'
  return es
    ? `Listo: ${gente}, ${perfil.dias} días, en ${NOMBRE_VEHICULO.es[perfil.vehiculo].toLowerCase()}, ${rumbo}.\n\nCon eso ya puedo armarte el plan. Si algo cambia, dime "cambiar viaje".`
    : `Got it: ${gente}, ${perfil.dias} days, by ${NOMBRE_VEHICULO.en[perfil.vehiculo].toLowerCase()}, ${rumbo}.\n\nI can plan from here. If anything changes, say "change trip".`
}

// ---- Copiloto: dónde estás, plan del día, itinerario ------------------------

const SIN_GPS = {
  es: 'Todavía no tengo tu ubicación. Activa el GPS y vuelve a preguntarme — el mapa te muestra el punto azul cuando ya te ubicó. (Esto funciona sin señal: el GPS no necesita internet.)',
  en: "I don't have your location yet. Turn on GPS and ask me again — the map shows a blue dot once it has you. (This works without signal: GPS doesn't need internet.)",
}

const km = (n) => `${Math.round(n)} km`

function textoUbicacion(ctx) {
  const { pos, localidades, lang } = ctx
  const r = ubicarEnRuta(pos, localidades)
  if (!r) return { texto: SIN_GPS[lang] }
  const es = lang === 'es'
  const cerca = r.cercana

  const linea =
    cerca.distancia < 3
      ? es
        ? `Estás en **${cerca.nombre[lang]}**.`
        : `You're in **${cerca.nombre[lang]}**.`
      : es
        ? `Estás a unos **${km(cerca.distancia)}** de **${cerca.nombre[lang]}**.`
        : `You're about **${km(cerca.distancia)}** from **${cerca.nombre[lang]}**.`

  // `distancia` ya viene por camino y con el ramal incluido, así que un desvío
  // como Tortel muestra lo que de verdad hay que manejar para llegar.
  const proximas = (lista, titulo) =>
    lista.length === 0
      ? ''
      : `\n\n${titulo}\n${lista
          .slice(0, 3)
          .map((l) => `• **${l.nombre[lang]}** — ${km(l.distancia)}${l.esDesvio ? (es ? ' (desvío)' : ' (detour)') : ''}`)
          .join('\n')}`

  return {
    texto:
      linea +
      proximas(r.haciaElSur, es ? 'Hacia el sur:' : 'To the south:') +
      proximas(r.haciaElNorte, es ? 'Hacia el norte:' : 'To the north:') +
      (es
        ? '\n\nLas distancias son aproximadas, sobre el trazado de la ruta.'
        : '\n\nDistances are approximate, measured along the route.'),
  }
}

function textoPlanDia(ctx) {
  const { pos, localidades, lang, perfil, todosLugares } = ctx
  const es = lang === 'es'
  const plan = planDelDia({ pos, localidades, perfil, sentido: perfil?.sentido })
  if (!plan) return { texto: SIN_GPS[lang] }
  if (!plan.meta) {
    return {
      texto: es
        ? 'Estás en la punta de la ruta en ese sentido: no queda tramo por delante. Si diste la vuelta, dime "cambiar viaje" y ajustamos el rumbo.'
        : "You're at the end of the route in that direction: there's no leg ahead. If you turned around, say \"change trip\" and we'll fix the heading.",
    }
  }

  const meta = plan.meta
  const enCamino = plan.intermedias
    .slice(0, 4)
    .map((l) => {
      // Un atractivo real de ese pueblo, si lo hay: convierte una lista de
      // nombres en una razón para parar.
      const hito = todosLugares?.find((x) => x.localidad === l.slug && x.cat === 'atractivo')
      return `• **${l.nombre[lang]}**${hito ? ` — ${hito.nombre[lang]}` : ''}`
    })
    .join('\n')

  // Los ramales se ofrecen aparte y con sus kilómetros: "¿me desvío a Tortel?"
  // es una decisión del día, no una parada más del camino.
  const desvios = plan.desvios.length
    ? (es ? '\n\nDesvíos en este tramo:\n' : '\n\nDetours on this leg:\n') +
      plan.desvios
        .map((l) => `• **${l.nombre[lang]}** — +${km(l.ramal)} ${es ? 'desde el cruce' : 'from the junction'}`)
        .join('\n')
    : ''

  // La barcaza se NOMBRA, no se cuenta: "hay 1 barcaza" no sirve para decidir.
  // Lo que decide el día es cuál es, cuánto dura y si hay que reservar.
  const barcazas = plan.cruces.length
    ? (es ? '\n\n⚠️ Barcazas en el tramo:\n' : '\n\n⚠️ Ferries on this leg:\n') +
      plan.cruces.map((c) => `• ${lineaCruce(c, lang)}`).join('\n') +
      (es
        ? '\nConfirma el horario del día antes: la barcaza es lo que decide el día, no los kilómetros.'
        : '\nCheck the schedule the day before: the ferry decides your day, not the mileage.')
    : ''

  const texto = es
    ? `Hoy llegas bien hasta **${meta.nombre[lang]}**: unos ${km(plan.km)}, cerca de ${formatoHoras(plan.horas)} de manejo${plan.horasCruces ? ` más ${formatoHoras(plan.horasCruces)} de barcaza y espera` : ''}.${enCamino ? `\n\nEn el camino:\n${enCamino}` : ''}${desvios}${barcazas}\n\nSon estimaciones para un viaje con paradas, no una carrera: en la Austral el ripio y las fotos mandan.`
    : `Today you'll comfortably reach **${meta.nombre[lang]}**: about ${km(plan.km)}, roughly ${formatoHoras(plan.horas)} of driving${plan.horasCruces ? ` plus ${formatoHoras(plan.horasCruces)} of ferry and waiting` : ''}.${enCamino ? `\n\nAlong the way:\n${enCamino}` : ''}${desvios}${barcazas}\n\nThese are estimates for a trip with stops, not a race: on the Austral, gravel and photo stops rule.`

  return {
    texto,
    // La acción natural al final del día es tener dónde dormir allá, y esa
    // decisión se toma AHORA, en el camino, no al llegar de noche.
    ofrecerReserva: meta,
    sugerencias: es
      ? [`Dormir en ${meta.nombre[lang]}`, 'Mi itinerario', '¿Dónde estoy?']
      : [`Sleep in ${meta.nombre[lang]}`, 'My itinerary', 'Where am I?'],
  }
}

/** Una línea de barcaza: nombre, cuánto dura, si se reserva y si es gratis. */
function lineaCruce(c, lang) {
  const partes = [c.duracion[lang], RESERVA[lang][c.reserva]]
  if (c.gratis) partes.push(lang === 'es' ? '**gratis**' : '**free**')
  if (c.operador) partes.push(c.operador)
  return `**${c.nombre[lang]}** — ${partes.join(' · ')}`
}

/**
 * Todo lo que hay que saber de barcazas, no solo las del tramo de hoy.
 *
 * El viajero preguntaba por barcazas y el bot le nombraba una sola —la del
 * corredor que tenía delante— como si fuera la única forma de avanzar. Y no lo
 * es: a la Austral se entra y se sale por mar desde Puerto Montt, desde Quellón
 * y desde Chacabuco, y esa elección cambia el viaje entero. Se muestra en tres
 * bloques porque son tres decisiones distintas: lo que vas a cruzar sí o sí, por
 * dónde puedes entrar o salir, y los cruces de lago que son atajos.
 */
function textoBarcazas(ctx) {
  const { pos, localidades, lang, perfil } = ctx
  const es = lang === 'es'
  const bloque = (titulo, lista) =>
    lista.length ? `\n\n${titulo}\n${lista.map((c) => `• ${lineaCruce(c, lang)}`).join('\n')}` : ''

  // Si hay GPS, lo primero es lo que tiene por delante en su sentido: eso es
  // acción, el resto es contexto.
  let porDelante = []
  const r = pos && localidades?.length ? ubicarEnRuta(pos, localidades) : null
  if (r) {
    const fin = perfil?.sentido === 'norte' ? 0 : 99999
    porDelante = crucesEntre(r.kmYo, fin)
  }

  const corredor = CRUCES.filter((c) => c.tipo === 'corredor')
  const mar = CRUCES.filter((c) => c.tipo === 'mar')
  const lago = CRUCES.filter((c) => c.tipo === 'lago')
  const ramal = CRUCES.filter((c) => c.tipo === 'ramal')

  const cabecera = porDelante.length
    ? bloque(
        es ? 'Lo que te queda por cruzar:' : 'Still ahead of you:',
        porDelante
      )
    : bloque(es ? 'Los cruces de la ruta (van sí o sí):' : 'The route crossings (unavoidable):', corredor)

  const detalle = porDelante.length
    ? porDelante
        .map((c) => `\n\n**${c.nombre[lang]}**\n${c.nota[lang]}`)
        .join('')
    : ''

  return {
    texto:
      (es
        ? 'En la Austral la barcaza no es un detalle: es lo que decide el día.'
        : 'On the Austral the ferry is no detail: it decides your day.') +
      cabecera +
      detalle +
      bloque(
        es ? 'Entrar o salir por mar (alternativas al camino):' : 'Entering or leaving by sea (alternatives to the road):',
        mar
      ) +
      bloque(es ? 'Cruces de lago:' : 'Lake crossings:', lago) +
      bloque(es ? 'En los ramales:' : 'On the side roads:', ramal) +
      (es
        ? '\n\nNo guardo las horas de zarpe a propósito: cambian por temporada y por clima, y un horario equivocado guardado en la app es peor que ninguno. Confírmalas con el operador o en la rampa el día antes.'
        : '\n\nI deliberately do not store departure times: they change with season and weather, and a wrong time saved in the app is worse than none. Confirm with the operator or at the ramp the day before.'),
    sugerencias: es
      ? ['Plan de hoy', 'Mi itinerario', 'Estado de caminos']
      : ["Today's plan", 'My itinerary', 'Road conditions'],
  }
}

function textoItinerario(ctx) {
  const { pos, localidades, lang, perfil } = ctx
  const es = lang === 'es'
  const lista = etapas({ pos, localidades, perfil, sentido: perfil?.sentido })
  if (!lista.length) return { texto: SIN_GPS[lang] }

  const dias = lista
    .map((e) => {
      const paso = e.intermedias.length
        ? ` (por ${e.intermedias.slice(0, 2).map((l) => l.nombre[lang]).join(', ')})`
        : ''
      const barcaza = e.cruces.length
        ? ` · ${es ? 'barcaza' : 'ferry'}: ${e.cruces.map((c) => c.nombre[lang].split(' (')[0]).join(' + ')}`
        : ''
      return `• **${es ? 'Día' : 'Day'} ${e.dia}: ${e.meta.nombre[lang]}**${paso} — ${km(e.km)}, ${formatoHoras(e.horas + e.horasCruces)}${barcaza}`
    })
    .join('\n')

  const sobran = perfil.dias - lista.length
  const cierre =
    sobran > 0
      ? es
        ? `\n\nTe sobran ${sobran} ${sobran === 1 ? 'día' : 'días'}: úsalos en los pueblos que más te gusten en vez de sumar kilómetros. La Austral se disfruta quedándose.`
        : `\n\nYou have ${sobran} spare ${sobran === 1 ? 'day' : 'days'}: spend them in the towns you like most instead of adding mileage. The Austral rewards staying put.`
      : es
        ? '\n\nVa justo: si algo se atrasa (barcaza, clima, un camino cortado), recorta una parada en vez de manejar de noche.'
        : "\n\nIt's tight: if something slips (ferry, weather, a closed road), drop a stop instead of driving at night."

  return {
    texto: (es ? `Tu ruta en ${lista.length} etapas, desde donde estás:\n\n` : `Your route in ${lista.length} legs, from where you are:\n\n`) + dias + cierre,
    sugerencias: es ? ['Plan de hoy', '¿Dónde dormir?', 'Estado de caminos'] : ["Today's plan", 'Where to sleep?', 'Road conditions'],
  }
}

// ---- Motor de reglas --------------------------------------------------------

function responder(pregunta, ctx) {
  const p = normalizar(pregunta)
  const tiene = (...ks) => ks.some((k) => p.includes(k))
  const { lang, loc, pos } = ctx
  const es = lang === 'es'
  const sug = SUGERENCIAS[lang]
  // Todas las listas salen de acá: lo más cerca primero cuando hay GPS.
  const lugares = porCercania(ctx.lugares, pos)
  // Aviso honesto cuando la lista se recortó: nadie tiene por qué adivinar que
  // hay más, y en la vista de toda la ruta hay muchos más.
  const recorte = (cat) =>
    lugares.filter((l) => l.cat === cat).length > MAX_LISTA
      ? es
        ? `\n\n(Te muestro los ${MAX_LISTA} más cercanos a ti. En el mapa y el buscador están todos.)`
        : `\n\n(Showing the ${MAX_LISTA} closest to you. The map and search have them all.)`
      : ''

  // -- Copiloto. Va PRIMERO: si alguien pregunta "¿hasta dónde llego hoy?", la
  // respuesta útil es su tramo, no la lista de atractivos del pueblo activo.
  if (tiene('donde estoy', 'donde ando', 'mi ubicacion', 'where am i', 'my location'))
    return textoUbicacion(ctx)

  if (tiene('plan de hoy', 'plan del dia', 'que hago hoy', 'hasta donde llego', 'hoy llego', 'today', 'todays plan', 'how far'))
    return textoPlanDia(ctx)

  if (tiene('itinerario', 'mi ruta', 'planificar', 'etapas', 'cuantos dias', 'itinerary', 'my route', 'plan my trip'))
    return textoItinerario(ctx)

  // Antes de "estado de caminos": "barcaza" caía ahí y se llevaba una respuesta
  // sobre ripio y clima, que no es lo que se preguntó.
  if (tiene('barcaza', 'transbordador', 'ferry', 'ferries', 'cruce', 'cruzar', 'navegar', 'quellon', 'chiloe', 'zarpe'))
    return textoBarcazas(ctx)

  if (tiene('cambiar viaje', 'cambiar perfil', 'otro vehiculo', 'change trip', 'edit trip'))
    return { rehacerPerfil: true }

  if (tiene('reservar', 'reserva', 'disponibilidad', 'book', 'booking', 'availability'))
    return { iniciarReserva: 'alojamiento' }

  if (tiene('hola', 'buenas', 'hello', 'hi ', 'hey'))
    return {
      texto: es
        ? `¡Hola! ¿En qué te puedo ayudar? Pregúntame por el plan de hoy, atractivos, alojamiento, comida, servicios o emergencias en ${loc}.`
        : `Hi! How can I help? Ask me about today's plan, attractions, lodging, food, services or emergencies in ${loc}.`,
      sugerencias: sug,
    }

  if (tiene('gracias', 'thanks', 'thank you', 'perfecto', 'genial'))
    return {
      texto: es
        ? `¡De nada! Buen viaje por la Austral. Aquí estaré — incluso sin conexión a internet.`
        : `You're welcome! Safe travels on the Austral. I'll be here — even without internet.`,
      sugerencias: sug,
    }

  if (tiene('que hay', 'resumen', 'cuentame', 'informacion', 'que tienes', 'que ofrece', 'overview', 'summary', 'tell me about', 'what is there', 'whats here'))
    return { texto: resumenLocalidad(lugares, lang, loc), sugerencias: sug }

  if (tiene('emergencia', 'hospital', 'urgencia', 'accidente', 'carabineros', 'policia', 'bomberos', 'rescate', 'emergency', 'police', 'fire', 'rescue', 'ambulance'))
    return {
      texto: es
        ? `Números de emergencia en ${loc}:\n\n${listaOFallback(lugares, 'emergencia', lang, loc, { conTel: true })}\n\nConsejo: antes de salir de trekking, informa tu ruta en la tenencia de Carabineros.`
        : `Emergency numbers in ${loc}:\n\n${listaOFallback(lugares, 'emergencia', lang, loc, { conTel: true })}\n\nTip: before trekking, register your route at the police station.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Estado de caminos', '¿Qué visitar?'] : ['Where to sleep?', 'Road conditions', 'What to visit?'],
    }

  if (tiene('dormir', 'alojamiento', 'hostal', 'cabana', 'hotel', 'hospedaje', 'sleep', 'stay', 'lodging', 'hostel', 'cabin'))
    return {
      texto: es
        ? `Opciones de alojamiento en ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, { conTel: true, max: MAX_LISTA })}${recorte('alojamiento')}\n\nEn temporada alta (dic–feb) conviene reservar con anticipación.`
        : `Lodging options in ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, { conTel: true, max: MAX_LISTA })}${recorte('alojamiento')}\n\nIn high season (Dec–Feb) book in advance.`,
      // Si alguno se puede contactar, el paso siguiente no es otra búsqueda: es
      // escribirle. El bot lo ofrece en vez de dejar al viajero copiando números.
      ofrecerReservaCat: 'alojamiento',
      sugerencias: es ? ['¿Dónde comer?', '¿Qué visitar?', 'Combustible'] : ['Where to eat?', 'What to visit?', 'Fuel'],
    }

  if (tiene('comer', 'restaurante', 'comida', 'almuerzo', 'cena', 'cafe', 'desayuno', 'kuchen', 'eat', 'food', 'restaurant', 'lunch', 'dinner', 'coffee'))
    return {
      texto: es
        ? `Dónde comer en ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, { conTel: true, max: MAX_LISTA })}${recorte('comida')}\n\nEl cordero al palo es un plato típico de la Patagonia.`
        : `Where to eat in ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, { conTel: true, max: MAX_LISTA })}${recorte('comida')}\n\nSpit-roasted lamb is a Patagonian specialty.`,
      ofrecerReservaCat: 'comida',
      sugerencias: es ? ['¿Dónde dormir?', 'Eventos', '¿Qué visitar?'] : ['Where to sleep?', 'Events', 'What to visit?'],
    }

  if (tiene('combustible', 'bencina', 'gasolina', 'petroleo', 'servicio', 'banco', 'cajero', 'fuel', 'gas', 'petrol', 'diesel', 'service')) {
    const servicios = listaLugares(lugares, 'servicio', lang, { conTel: true, max: MAX_LISTA })
    return {
      texto: es
        ? `Combustible y servicios en ${loc}:\n\n${servicios || '(Aún no tengo estaciones ni servicios cargados para esta localidad.)'}\n\nLa bencina escasea en la Carretera Austral y las estaciones están lejos entre sí: carga el estanque completo cada vez que puedas, sobre todo antes de tramos largos hacia el sur.`
        : `Fuel and services in ${loc}:\n\n${servicios || '(No fuel stations or services loaded for this locality yet.)'}\n\nFuel is scarce on the Carretera Austral and stations are far apart: fill up completely whenever you can, especially before long stretches heading south.`,
      sugerencias: es ? ['Estado de caminos', 'Emergencias', '¿Qué visitar?'] : ['Road conditions', 'Emergencies', 'What to visit?'],
    }
  }

  if (tiene('huemul', 'fauna', 'animal', 'guanaco', 'nandu', 'wildlife', 'deer'))
    return {
      texto: es
        ? `En la Patagonia puedes ver fauna nativa: huemules, guanacos, ñandúes y zorros. Los mejores horarios son el amanecer y el atardecer; mantén distancia y no los alimentes.\n\nRevisa los atractivos y parques de ${loc} en la lista para saber dónde avistarlos.`
        : `In Patagonia you can spot native wildlife: huemul deer, guanacos, rheas and foxes. Best hours are dawn and dusk; keep your distance and do not feed them.\n\nCheck ${loc}'s attractions and parks in the list to know where to look.`,
      sugerencias: es ? ['¿Qué visitar?', 'Estado de caminos', '¿Dónde dormir?'] : ['What to visit?', 'Road conditions', 'Where to sleep?'],
    }

  if (tiene('visitar', 'atractivo', 'hacer', 'panorama', 'conocer', 'sendero', 'trekking', 'caminata', 'parque', 'mirador', 'laguna', 'glaciar', 'lago', 'visit', 'attraction', 'see', 'hike', 'trail', 'park'))
    return {
      texto: es
        ? `Los imperdibles de ${loc}:\n\n${listaOFallback(lugares, 'atractivo', lang, loc, { conDesc: true, max: MAX_LISTA })}${recorte('atractivo')}\n\nToca cualquier lugar en el mapa o la lista para ver cómo llegar. Toda la información funciona sin conexión.`
        : `${loc}'s must-sees:\n\n${listaOFallback(lugares, 'atractivo', lang, loc, { conDesc: true, max: MAX_LISTA })}${recorte('atractivo')}\n\nTap any place on the map or list for directions. Everything works offline.`,
      sugerencias: es ? ['Plan de hoy', 'Estado de caminos', '¿Dónde comer?'] : ["Today's plan", 'Road conditions', 'Where to eat?'],
    }

  if (tiene('camino', 'estado', 'carretera', 'nieve', 'transito', 'ripio', 'road', 'snow', 'conditions'))
    return {
      texto: es
        ? `El estado de los caminos cambia con el clima, sobre todo en invierno, y algunos tramos son de ripio o dependen de barcazas.\n\n• Consulta en la oficina de información turística o en Carabineros de ${loc} antes de salir.\n• La app te avisa cuando se reportan cortes o novedades.\n\nCarga combustible antes de tramos largos hacia el sur.`
        : `Road conditions change with the weather, especially in winter, and some sections are gravel or depend on ferries.\n\n• Check at the tourist information office or with the police (Carabineros) in ${loc} before you leave.\n• The app notifies you when closures or updates are reported.\n\nFill up before long stretches heading south.`,
      sugerencias: es ? ['Combustible', 'Emergencias', 'Plan de hoy'] : ['Fuel', 'Emergencies', "Today's plan"],
    }

  if (tiene('clima', 'tiempo', 'viento', 'lluvia', 'frio', 'temperatura', 'weather', 'wind', 'rain', 'cold'))
    return {
      texto: es
        ? 'El clima patagónico es cambiante: puedes tener sol, viento y lluvia el mismo día.\n\n• Vístete por capas y lleva cortaviento siempre.\n• El viento arrecia por las tardes: planifica senderos temprano.\n• Revisa las notificaciones de la app para alertas meteorológicas.'
        : 'Patagonian weather is changeable: sun, wind and rain can all happen in one day.\n\n• Dress in layers and always carry a windbreaker.\n• Wind picks up in the afternoon: plan hikes early.\n• Check app notifications for weather alerts.',
      sugerencias: es ? ['¿Qué visitar?', 'Estado de caminos', '¿Dónde dormir?'] : ['What to visit?', 'Road conditions', 'Where to sleep?'],
    }

  if (tiene('evento', 'fiesta', 'festival', 'feria', 'artesania', 'costumbrista', 'event', 'fair', 'craft'))
    return {
      texto: es
        ? `Eventos en ${loc}:\n\n${listaOFallback(lugares, 'evento', lang, loc)}\n\nLas fiestas costumbristas y ferias artesanales se concentran en verano (dic–feb).`
        : `Events in ${loc}:\n\n${listaOFallback(lugares, 'evento', lang, loc)}\n\nFolk festivals and craft fairs are concentrated in summer (Dec–Feb).`,
      sugerencias: es ? ['¿Dónde dormir?', '¿Dónde comer?', '¿Qué visitar?'] : ['Where to sleep?', 'Where to eat?', 'What to visit?'],
    }

  if (tiene('offline', 'sin conexion', 'internet', 'senal', 'signal', 'connection'))
    return {
      texto: es
        ? '¡Esa es la gracia de esta app! Toda la información —lugares, mapas, teléfonos y este asistente— queda guardada en tu teléfono al instalarla.\n\nEn gran parte de la ruta no hay señal, así que la app está diseñada para funcionar 100% sin internet. Si me pides una consulta de disponibilidad sin cobertura, te la dejo guardada y te la recuerdo al llegar al pueblo.'
        : "That's the whole point of this app! All the information —places, maps, phone numbers and this assistant— is stored on your phone when you install it.\n\nMuch of the route has no signal, so the app is designed to work 100% offline. If you ask for an availability request with no coverage, I'll save it and remind you when you reach town.",
      sugerencias: sug,
    }

  return {
    texto: es
      ? `Puedo ayudarte con esto:\n\n• Dónde estás y hasta dónde llegas hoy\n• Tu itinerario por etapas\n• Pedir disponibilidad donde quieras parar\n• Qué visitar, dónde dormir y dónde comer en ${loc}\n• Emergencias, combustible, caminos y clima\n\nPrueba con una de las sugerencias o escribe tu pregunta con otras palabras.`
      : `I can help you with:\n\n• Where you are and how far you'll get today\n• Your route, leg by leg\n• Asking about availability wherever you want to stop\n• What to visit, where to sleep and eat in ${loc}\n• Emergencies, fuel, roads and weather\n\nTry one of the suggestions or rephrase your question.`,
    sugerencias: sug,
  }
}

// ---- Componente -------------------------------------------------------------

export default function ChatBot({
  abierto,
  onCerrar,
  lugares,
  localidadNombre,
  pos = null,
  localidades = [],
  todosLugares = [],
}) {
  const { t, lang } = useI18n()
  const loc =
    localidadNombre || (lang === 'es' ? 'la Carretera Austral' : 'the Carretera Austral')
  // Historial persistente por sesión: si el usuario cierra y reabre el chat (el
  // componente se desmonta al cerrar), la conversación se conserva.
  const [mensajes, setMensajes] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('chatHistorial')) || []
    } catch {
      return []
    }
  })
  const [sugerencias, setSugerencias] = useState(SUGERENCIAS[lang])
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [perfil, setPerfil] = useState(() => leerPerfil())
  // Flujo guiado en curso: { tipo: 'perfil'|'reserva', paso, datos }. Vive en
  // estado y NO en el historial: si se recarga la app a mitad de las preguntas,
  // es mejor volver a empezar que retomar un formulario a medias.
  const [flujo, setFlujo] = useState(null)
  const msgsRef = useRef(null)

  const ctx = { lugares, lang, loc, pos, localidades, perfil, todosLugares }

  const decir = (texto, extra = {}) =>
    setMensajes((m) => [...m, { quien: 'bot', texto, ...extra }])

  // Saludo inicial. Se actualiza si cambia el idioma o la localidad mientras la
  // conversación aún no tiene preguntas del usuario (así no "miente" el pueblo);
  // si ya hay preguntas, no se toca para no borrar la conversación.
  useEffect(() => {
    if (!abierto) return
    setMensajes((prev) => {
      if (prev.some((m) => m.quien === 'usuario')) return prev
      return [{ quien: 'bot', texto: saludo(lang, loc, lugares, leerPerfil()) }]
    })
    // `lugares` se lee del closure al abrir/cambiar de localidad; no va en deps
    // (su referencia cambia en cada render y dispararía el efecto en bucle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, lang, loc])

  // Sin perfil, la conversación arranca por ahí: es lo que permite todo lo demás.
  useEffect(() => {
    if (!abierto || perfil || flujo) return
    const q = preguntaPerfil('personas', lang)
    setFlujo({ tipo: 'perfil', paso: 'personas', datos: {} })
    setSugerencias(q.opciones)
    setMensajes((prev) =>
      prev.some((m) => m.quien === 'usuario')
        ? prev
        : [...prev, { quien: 'bot', texto: conPaso('personas', q.texto, lang) }]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  useEffect(() => {
    if (!flujo) setSugerencias(SUGERENCIAS[lang])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // Consultas que quedaron guardadas sin señal: al abrir el chat CON cobertura,
  // el bot las recuerda con su botón para mandarlas. Es el cierre del ciclo
  // "decides en la ruta, avisas al llegar al pueblo".
  useEffect(() => {
    if (!abierto || !navigator.onLine) return
    let vigente = true
    consultasPendientes().then((lista) => {
      if (!vigente || lista.length === 0) return
      const es = lang === 'es'
      decir(
        es
          ? `Tienes ${lista.length} ${lista.length === 1 ? 'consulta guardada' : 'consultas guardadas'} de cuando no había señal. Ahora sí puedes mandarlas:`
          : `You have ${lista.length} saved ${lista.length === 1 ? 'request' : 'requests'} from when there was no signal. You can send them now:`,
        {
          acciones: lista.map((c) => ({
            k: 'wa',
            lbl: c.nombre,
            numero: c.numero,
            msg: c.texto,
            placeId: c.placeId,
            clave: c.clave,
          })),
        }
      )
    })
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  // Persiste la conversación en la sesión (se limpia al cerrar la pestaña).
  useEffect(() => {
    try {
      sessionStorage.setItem('chatHistorial', JSON.stringify(mensajes))
    } catch {
      // sessionStorage lleno o no disponible: el chat sigue funcionando en memoria.
    }
  }, [mensajes])

  useEffect(() => {
    msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight)
  }, [mensajes, escribiendo])

  // -- Flujos guiados ---------------------------------------------------------

  function arrancarPerfil() {
    const q = preguntaPerfil('personas', lang)
    setFlujo({ tipo: 'perfil', paso: 'personas', datos: {} })
    decir(conPaso('personas', q.texto, lang))
    setSugerencias(q.opciones)
  }

  /** Lista de negocios contactables de una categoría, como acciones del mensaje. */
  function accionesDeContacto(cat, cuando, desde = lugares) {
    const datos = perfil || { personas: 2 }
    return porCercania(desde, pos)
      .filter((l) => l.cat === cat && sePuedeConsultar(l))
      .slice(0, 5)
      .map((l) => ({
        k: 'wa',
        lbl: l.nombre[lang],
        numero: numeroWhatsApp(l),
        msg: mensajeConsulta({ lugar: l, lang, personas: datos.personas, cuando }),
        placeId: l.id,
      }))
  }

  function arrancarReserva(cat, localidadDestino = null) {
    const es = lang === 'es'
    const desde = localidadDestino
      ? todosLugares.filter((l) => l.localidad === localidadDestino.slug)
      : lugares
    const hay = desde.some((l) => l.cat === cat && sePuedeConsultar(l))

    if (!hay) {
      decir(
        es
          ? 'Todavía no tengo un número al que escribirle por acá. Puedes llamar a los que aparecen en la lista, o tocar la ficha para ver el contacto completo.'
          : "I don't have a number to message here yet. You can call the ones listed, or open a place to see its full contact."
      )
      return
    }

    setFlujo({ tipo: 'reserva', paso: 'cuando', datos: { cat, desde } })
    decir(
      cat === 'alojamiento'
        ? es ? '¿Para cuándo necesitas el alojamiento?' : 'When do you need the room?'
        : es ? '¿Para cuándo?' : 'For when?'
    )
    setSugerencias([
      { txt: es ? 'Hoy' : 'Today', val: 'hoy' },
      { txt: es ? 'Mañana' : 'Tomorrow', val: 'manana' },
      { txt: es ? 'En unos días' : 'In a few days', val: 'pronto' },
    ])
  }

  /** Un chip de flujo: guarda la respuesta y hace la pregunta siguiente. */
  function avanzarFlujo(opcion) {
    setMensajes((m) => [...m, { quien: 'usuario', texto: opcion.txt }])

    if (flujo.tipo === 'perfil') {
      const datos = { ...flujo.datos, [flujo.paso]: opcion.val }
      const siguiente = PASOS_PERFIL[PASOS_PERFIL.indexOf(flujo.paso) + 1]

      if (siguiente) {
        const q = preguntaPerfil(siguiente, lang)
        setFlujo({ tipo: 'perfil', paso: siguiente, datos })
        decir(conPaso(siguiente, q.texto, lang))
        setSugerencias(q.opciones)
        return
      }

      const nuevo = guardarPerfil(datos)
      setPerfil(nuevo)
      setFlujo(null)
      contar('perfil_viaje')
      decir(resumenPerfil(nuevo, lang))
      setSugerencias(SUGERENCIAS[lang])
      return
    }

    // Reserva: elegido el cuándo, se listan los negocios contactables.
    const { cat, desde } = flujo.datos
    const acciones = accionesDeContacto(cat, opcion.val, desde)
    const es = lang === 'es'
    setFlujo(null)
    setSugerencias(SUGERENCIAS[lang])
    decir(
      es
        ? `Listo. Toca uno y te abro el chat con el mensaje ya escrito — solo revisas y envías:`
        : `Done. Tap one and I'll open the chat with the message ready — just review and send:`,
      { acciones }
    )
  }

  /** Ejecuta la acción de un botón dentro de un mensaje del bot. */
  async function ejecutarAccion(a) {
    if (a.k === 'tel') {
      contar('llamar', a.placeId)
      window.location.href = `tel:${a.numero}`
      return
    }

    // WhatsApp. Sin cobertura no hay forma de entregarlo: se guarda el mensaje
    // ya escrito y se recuerda al llegar al pueblo. No se pierde nada, y es
    // exactamente cómo se viaja la Austral.
    if (!navigator.onLine) {
      await guardarConsulta({ placeId: a.placeId, nombre: a.lbl, numero: a.numero, texto: a.msg })
      contar('consulta_guardada', a.placeId)
      decir(
        lang === 'es'
          ? `Guardada tu consulta a **${a.lbl}**. Cuando entres a un pueblo con señal te la recuerdo para mandarla de un toque.`
          : `Saved your request to **${a.lbl}**. When you reach a town with signal I'll remind you to send it with one tap.`
      )
      return
    }

    contar('consulta_reserva', a.placeId)
    if (a.clave != null) await descartarConsulta(a.clave)
    window.open(urlWhatsApp(a.numero, a.msg), '_blank', 'noopener,noreferrer')
  }

  function enviar(txt) {
    const pregunta = (txt ?? texto).trim()
    if (!pregunta) return
    setTexto('')
    // Escribir a mano cancela el flujo guiado: si alguien interrumpe las
    // preguntas para consultar otra cosa, se le responde eso — dejarlo atrapado
    // en un cuestionario es la forma más rápida de que cierre el chat.
    setFlujo(null)
    setMensajes((m) => [...m, { quien: 'usuario', texto: pregunta }])
    setEscribiendo(true)
    setTimeout(() => {
      const r = responder(pregunta, ctx)
      setEscribiendo(false)

      if (r.rehacerPerfil) {
        arrancarPerfil()
        return
      }
      if (r.iniciarReserva) {
        arrancarReserva(r.iniciarReserva)
        return
      }

      const es = lang === 'es'
      const extra = {}
      // Ofrecer el contacto es el paso siguiente natural de una lista de
      // alojamientos o restaurantes; se agrega solo si hay a quién escribirle.
      if (r.ofrecerReservaCat && lugares.some((l) => l.cat === r.ofrecerReservaCat && sePuedeConsultar(l))) {
        extra.acciones = [
          {
            k: 'flujo',
            cat: r.ofrecerReservaCat,
            lbl: r.ofrecerReservaCat === 'alojamiento'
              ? es ? 'Pedir disponibilidad' : 'Ask availability'
              : es ? 'Consultar por mesa' : 'Ask about a table',
          },
        ]
      }
      if (r.ofrecerReserva) {
        const destino = r.ofrecerReserva
        const hay = todosLugares.some(
          (l) => l.localidad === destino.slug && l.cat === 'alojamiento' && sePuedeConsultar(l)
        )
        if (hay) {
          extra.acciones = [
            {
              k: 'flujo',
              cat: 'alojamiento',
              slug: destino.slug,
              lbl: es ? `Pedir disponibilidad en ${destino.nombre[lang]}` : `Ask availability in ${destino.nombre[lang]}`,
            },
          ]
        }
      }

      decir(r.texto, extra)
      if (r.sugerencias) setSugerencias(r.sugerencias)
    }, 700 + Math.random() * 500)
  }

  if (!abierto) return null

  const enFlujo = flujo !== null

  return (
    <div className="chat" role="dialog" aria-label={t('chatNombre')}>
      <div className="chat-header">
        <div className="avatar">
          <Huemul tam={24} />
        </div>
        <div className="ch-info">
          <div className="ch-nombre">{t('chatNombre')}</div>
          <div className="ch-sub">
            <span className="ch-punto" /> {t('chatDisponible')}
          </div>
        </div>
        <button className="chat-cerrar" onClick={onCerrar} aria-label="Cerrar">
          <Icon nombre="x" tam={16} />
        </button>
      </div>
      <div className="chat-nota">
        <Icon nombre="download" tam={12} /> {t('chatNota')}
      </div>
      <div className="chat-msgs" ref={msgsRef}>
        {mensajes.map((m, i) => (
          <div key={i} className={`msg ${m.quien}`}>
            {m.quien === 'bot' ? <Markdown texto={m.texto} /> : m.texto}
            {m.acciones?.length > 0 && (
              <div className="msg-acciones">
                {m.acciones.map((a, j) => (
                  <button
                    key={j}
                    className="msg-accion"
                    onClick={() =>
                      a.k === 'flujo'
                        ? arrancarReserva(a.cat, a.slug ? localidades.find((l) => l.slug === a.slug) : null)
                        : ejecutarAccion(a)
                    }
                  >
                    <Icon nombre={a.k === 'tel' ? 'phone' : 'message-circle'} tam={15} />
                    <span>{a.lbl}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {escribiendo && (
          <div className="escribiendo">
            <Icon nombre="spark" tam={16} />
          </div>
        )}
      </div>
      <div className={`chat-sugerencias${enFlujo ? ' en-flujo' : ''}`}>
        {sugerencias.map((s, i) => {
          const chip = typeof s === 'string' ? { txt: s } : s
          return (
            <button
              key={`${chip.txt}-${i}`}
              className="sugerencia"
              onClick={() => (enFlujo ? avanzarFlujo(chip) : enviar(chip.txt))}
            >
              {chip.txt}
            </button>
          )
        })}
      </div>
      <div className="chat-input">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          value={texto}
          placeholder={t('chatPlaceholder')}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
        />
        <button onClick={() => enviar()} aria-label="Enviar">
          <Icon nombre="send" tam={18} />
        </button>
      </div>
    </div>
  )
}
