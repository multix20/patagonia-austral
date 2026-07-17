import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
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

function listaLugares(lugares, cat, lang, conTel = false) {
  return lugares
    .filter((l) => l.cat === cat)
    .map((l) => {
      let linea = `• ${l.nombre[lang]} — ${l.dist[lang].split('·')[0].trim()}`
      if (conTel && l.tel) linea += ` · Tel: ${l.tel}`
      return linea
    })
    .join('\n')
}

// Lista los lugares de una categoría o, si no hay, un aviso claro para esa localidad.
function listaOFallback(lugares, cat, lang, loc, conTel = false) {
  const l = listaLugares(lugares, cat, lang, conTel)
  if (l) return l
  return lang === 'es'
    ? `(Aún no tengo lugares de esta categoría cargados para ${loc}. Toca el mapa o la lista para explorar.)`
    : `(No places of this category are loaded for ${loc} yet. Tap the map or list to explore.)`
}

function saludo(lang, loc) {
  return lang === 'es'
    ? `¡Hola! Soy tu asistente turístico para ${loc}. Puedo ayudarte con lugares para visitar, alojamiento, comida, emergencias y consejos de ruta.\n\n¿Qué necesitas saber?`
    : `Hi! I'm your tourist assistant for ${loc}. I can help with places to visit, lodging, food, emergencies and road tips.\n\nWhat do you need to know?`
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

  if (tiene('emergencia', 'hospital', 'urgencia', 'accidente', 'carabineros', 'policia', 'bomberos', 'rescate', 'emergency', 'police', 'fire', 'rescue', 'ambulance'))
    return {
      texto: es
        ? `Números de emergencia en ${loc}:\n\n${listaOFallback(lugares, 'emergencia', lang, loc, true)}\n\nConsejo: antes de salir de trekking, informa tu ruta en la tenencia de Carabineros.`
        : `Emergency numbers in ${loc}:\n\n${listaOFallback(lugares, 'emergencia', lang, loc, true)}\n\nTip: before trekking, register your route at the police station.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Estado de caminos', '¿Qué visitar?'] : ['Where to sleep?', 'Road conditions', 'What to visit?'],
    }

  if (tiene('dormir', 'alojamiento', 'hostal', 'cabana', 'hotel', 'hospedaje', 'sleep', 'stay', 'lodging', 'hostel', 'cabin'))
    return {
      texto: es
        ? `Opciones de alojamiento en ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, true)}\n\nEn temporada alta (dic–feb) conviene reservar con anticipación.`
        : `Lodging options in ${loc}:\n\n${listaOFallback(lugares, 'alojamiento', lang, loc, true)}\n\nIn high season (Dec–Feb) book in advance.`,
      sugerencias: es ? ['¿Dónde comer?', '¿Qué visitar?', 'Combustible'] : ['Where to eat?', 'What to visit?', 'Fuel'],
    }

  if (tiene('comer', 'restaurante', 'comida', 'almuerzo', 'cena', 'cafe', 'desayuno', 'kuchen', 'eat', 'food', 'restaurant', 'lunch', 'dinner', 'coffee'))
    return {
      texto: es
        ? `Dónde comer en ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, true)}\n\nEl cordero al palo es un plato típico de la Patagonia.`
        : `Where to eat in ${loc}:\n\n${listaOFallback(lugares, 'comida', lang, loc, true)}\n\nSpit-roasted lamb is a Patagonian specialty.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Eventos', '¿Qué visitar?'] : ['Where to sleep?', 'Events', 'What to visit?'],
    }

  if (tiene('combustible', 'bencina', 'gasolina', 'petroleo', 'fuel', 'gas', 'petrol', 'diesel'))
    return {
      texto: es
        ? `La bencina es escasa en la Carretera Austral y las estaciones están lejos entre sí. Carga el estanque completo cada vez que puedas, sobre todo antes de tramos largos hacia el sur.\n\nRevisa los servicios de ${loc} en la lista y el mapa para ubicar la estación más cercana.`
        : `Fuel is scarce on the Carretera Austral and stations are far apart. Fill up completely whenever you can, especially before long stretches heading south.\n\nCheck ${loc}'s services in the list and map to find the nearest station.`,
      sugerencias: es ? ['Estado de caminos', 'Emergencias', '¿Qué visitar?'] : ['Road conditions', 'Emergencies', 'What to visit?'],
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
        ? `Los imperdibles de ${loc}:\n\n${listaOFallback(lugares, 'atractivo', lang, loc)}\n\nToca cualquier lugar en el mapa o la lista para ver cómo llegar. Toda la información funciona sin conexión.`
        : `${loc}'s must-sees:\n\n${listaOFallback(lugares, 'atractivo', lang, loc)}\n\nTap any place on the map or list for directions. Everything works offline.`,
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
  const [mensajes, setMensajes] = useState([])
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
      return [{ quien: 'bot', texto: saludo(lang, loc) }]
    })
  }, [abierto, lang, loc])

  useEffect(() => {
    setSugerencias(SUGERENCIAS[lang])
  }, [lang])

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
          <Icon nombre="bot" tam={22} />
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
            {m.texto}
          </div>
        ))}
        {escribiendo && (
          <div className="escribiendo">
            <span />
            <span />
            <span />
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
