import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import Huemul from './Huemul'
import { useI18n } from '../i18n'

// Asistente turístico offline: motor de reglas que responde con los
// contenidos locales (IndexedDB). No requiere conexión.
//
// Multi-localidad (Fase 2): recibe SOLO los lugares de la localidad
// seleccionada (`lugares` = lugaresVisibles) y su nombre (`localidadNombre`).
// Las respuestas basadas en datos listan esos lugares; los consejos de prosa
// son genéricos de la Carretera Austral (no afirman datos específicos de un
// pueblo que serían falsos en otro).

const SUGERENCIAS = {
  es: ['¿Qué visitar?', '¿Dónde dormir?', '¿Dónde comer?', 'Emergencias', 'Combustible', 'Estado de caminos'],
  en: ['What to visit?', 'Where to sleep?', 'Where to eat?', 'Emergencies', 'Fuel', 'Road conditions'],
}

function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
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
function listaLugares(lugares, cat, lang, { conTel = false, conDesc = false } = {}) {
  const tel = lang === 'es' ? 'Tel' : 'Phone'
  return lugares
    .filter((l) => l.cat === cat)
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

// Lista los lugares de una categoría o, si no hay, un aviso claro para esa localidad.
function listaOFallback(lugares, cat, lang, loc, opciones = {}) {
  const l = listaLugares(lugares, cat, lang, opciones)
  if (l) return l
  return lang === 'es'
    ? `(Aún no tengo lugares de esta categoría cargados para ${loc}. Toca el mapa o la lista para explorar.)`
    : `(No places of this category are loaded for ${loc} yet. Tap the map or list to explore.)`
}

function saludo(lang, loc, lugares = []) {
  const es = lang === 'es'
  // Si ya hay lugares de la localidad cargados, el saludo arranca con lo que hay
  // (concreto y propio del pueblo), no con una frase genérica.
  const detalle = lugares.length > 0 ? `\n\n${resumenLocalidad(lugares, lang, loc)}` : ''
  return es
    ? `¡Hola! Soy tu asistente turístico para ${loc}. Puedo ayudarte con lugares para visitar, alojamiento, comida, emergencias y consejos de ruta.${detalle || '\n\n¿Qué necesitas saber?'}`
    : `Hi! I'm your tourist assistant for ${loc}. I can help with places to visit, lodging, food, emergencies and road tips.${detalle || '\n\nWhat do you need to know?'}`
}

function responder(pregunta, lugares, lang, loc) {
  const p = normalizar(pregunta)
  const tiene = (...ks) => ks.some((k) => p.includes(k))
  const es = lang === 'es'
  const sug = SUGERENCIAS[lang]

  if (tiene('hola', 'buenas', 'hello', 'hi ', 'hey'))
    return {
      texto: es
        ? `¡Hola! ¿En qué te puedo ayudar? Pregúntame por atractivos, alojamiento, comida, servicios o emergencias en ${loc}.`
        : `Hi! How can I help? Ask me about attractions, lodging, food, services or emergencies in ${loc}.`,
      sugerencias: sug,
    }

  if (tiene('gracias', 'thanks', 'thank you', 'perfecto', 'genial'))
    return {
      texto: es
        ? `¡De nada! Que disfrutes tu visita a ${loc} y la Patagonia. Aquí estaré — incluso sin conexión a internet.`
        : `You're welcome! Enjoy your visit to ${loc} and Patagonia. I'll be here — even without internet.`,
      sugerencias: sug,
    }

  if (tiene('que hay', 'resumen', 'cuentame', 'informacion', 'que tienes', 'que ofrece', 'overview', 'summary', 'tell me about', 'what is there', 'whats here'))
    return {
      texto: resumenLocalidad(lugares, lang, loc),
      sugerencias: sug,
    }

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
        ? `Opciones de alojamiento en ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, { conTel: true })}\n\nEn temporada alta (dic–feb) conviene reservar con anticipación.`
        : `Lodging options in ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, { conTel: true })}\n\nIn high season (Dec–Feb) book in advance.`,
      sugerencias: es ? ['¿Dónde comer?', '¿Qué visitar?', 'Combustible'] : ['Where to eat?', 'What to visit?', 'Fuel'],
    }

  if (tiene('comer', 'restaurante', 'comida', 'almuerzo', 'cena', 'cafe', 'desayuno', 'kuchen', 'eat', 'food', 'restaurant', 'lunch', 'dinner', 'coffee'))
    return {
      texto: es
        ? `Dónde comer en ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, { conTel: true })}\n\nEl cordero al palo es un plato típico de la Patagonia.`
        : `Where to eat in ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, { conTel: true })}\n\nSpit-roasted lamb is a Patagonian specialty.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Eventos', '¿Qué visitar?'] : ['Where to sleep?', 'Events', 'What to visit?'],
    }

  if (tiene('combustible', 'bencina', 'gasolina', 'petroleo', 'servicio', 'banco', 'cajero', 'fuel', 'gas', 'petrol', 'diesel', 'service')) {
    const servicios = listaLugares(lugares, 'servicio', lang, { conTel: true })
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
        ? `Los imperdibles de ${loc}:\n\n${listaOFallback(lugares, 'atractivo', lang, loc, { conDesc: true })}\n\nToca cualquier lugar en el mapa o la lista para ver cómo llegar. Toda la información funciona sin conexión.`
        : `${loc}'s must-sees:\n\n${listaOFallback(lugares, 'atractivo', lang, loc, { conDesc: true })}\n\nTap any place on the map or list for directions. Everything works offline.`,
      sugerencias: es ? ['Ver fauna / huemules', 'Estado de caminos', '¿Dónde comer?'] : ['Wildlife / huemul', 'Road conditions', 'Where to eat?'],
    }

  if (tiene('camino', 'ruta', 'estado', 'carretera', 'nieve', 'transito', 'barcaza', 'ripio', 'road', 'route', 'snow', 'conditions', 'ferry'))
    return {
      texto: es
        ? `El estado de los caminos cambia con el clima, sobre todo en invierno, y algunos tramos son de ripio o dependen de barcazas.\n\n• Consulta en la oficina de información turística o en Carabineros de ${loc} antes de salir.\n• La app te avisa cuando se reportan cortes o novedades.\n\nCarga combustible antes de tramos largos hacia el sur.`
        : `Road conditions change with the weather, especially in winter, and some sections are gravel or depend on ferries.\n\n• Check at the tourist information office or with the police (Carabineros) in ${loc} before you leave.\n• The app notifies you when closures or updates are reported.\n\nFill up before long stretches heading south.`,
      sugerencias: es ? ['Combustible', 'Emergencias', '¿Qué visitar?'] : ['Fuel', 'Emergencies', 'What to visit?'],
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
        ? '¡Esa es la gracia de esta app! Toda la información —lugares, mapas, teléfonos y este asistente— queda guardada en tu teléfono al instalarla.\n\nEn gran parte de la ruta no hay señal, así que la app está diseñada para funcionar 100% sin internet.'
        : "That's the whole point of this app! All the information —places, maps, phone numbers and this assistant— is stored on your phone when you install it.\n\nMuch of the route has no signal, so the app is designed to work 100% offline.",
      sugerencias: sug,
    }

  return {
    texto: es
      ? `Puedo ayudarte con estos temas sobre ${loc}:\n\n• Qué visitar (senderos, parques, miradores)\n• Dónde dormir y dónde comer\n• Emergencias y teléfonos útiles\n• Combustible y servicios\n• Estado de caminos y clima\n• Eventos y ferias\n\nPrueba con una de las sugerencias o escribe tu pregunta con otras palabras.`
      : `I can help you with these topics about ${loc}:\n\n• What to visit (trails, parks, viewpoints)\n• Where to sleep and eat\n• Emergencies and useful phone numbers\n• Fuel and services\n• Road conditions and weather\n• Events and fairs\n\nTry one of the suggestions or rephrase your question.`,
    sugerencias: sug,
  }
}

export default function ChatBot({ abierto, onCerrar, lugares, localidadNombre }) {
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
  const msgsRef = useRef(null)

  // Saludo inicial. Se actualiza si cambia el idioma o la localidad mientras la
  // conversación aún no tiene preguntas del usuario (así no "miente" el pueblo);
  // si ya hay preguntas, no se toca para no borrar la conversación.
  useEffect(() => {
    if (!abierto) return
    setMensajes((prev) => {
      if (prev.some((m) => m.quien === 'usuario')) return prev
      return [{ quien: 'bot', texto: saludo(lang, loc, lugares) }]
    })
    // `lugares` se lee del closure al abrir/cambiar de localidad; no va en deps
    // (su referencia cambia en cada render y dispararía el efecto en bucle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, lang, loc])

  useEffect(() => {
    setSugerencias(SUGERENCIAS[lang])
  }, [lang])

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

  function enviar(txt) {
    const pregunta = (txt ?? texto).trim()
    if (!pregunta) return
    setTexto('')
    setMensajes((m) => [...m, { quien: 'usuario', texto: pregunta }])
    setEscribiendo(true)
    setTimeout(() => {
      const r = responder(pregunta, lugares, lang, loc)
      setEscribiendo(false)
      setMensajes((m) => [...m, { quien: 'bot', texto: r.texto }])
      if (r.sugerencias) setSugerencias(r.sugerencias)
    }, 700 + Math.random() * 500)
  }

  if (!abierto) return null

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
          </div>
        ))}
        {escribiendo && (
          <div className="escribiendo">
            <Icon nombre="spark" tam={16} />
          </div>
        )}
      </div>
      <div className="chat-sugerencias">
        {sugerencias.map((s) => (
          <button key={s} className="sugerencia" onClick={() => enviar(s)}>
            {s}
          </button>
        ))}
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
