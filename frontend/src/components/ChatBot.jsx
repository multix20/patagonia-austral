import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n'
import { CATEGORIAS } from '../data/places'

// Asistente turístico offline: motor de reglas que responde con los
// contenidos locales (IndexedDB). No requiere conexión.

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

function responder(pregunta, lugares, lang) {
  const p = normalizar(pregunta)
  const tiene = (...ks) => ks.some((k) => p.includes(k))
  const es = lang === 'es'
  const sug = SUGERENCIAS[lang]

  if (tiene('hola', 'buenas', 'hello', 'hi ', 'hey'))
    return {
      texto: es
        ? '¡Hola! ¿En qué te puedo ayudar? Pregúntame por atractivos, alojamiento, comida, servicios o emergencias en Cochrane.'
        : 'Hi! How can I help? Ask me about attractions, lodging, food, services or emergencies in Cochrane.',
      sugerencias: sug,
    }

  if (tiene('gracias', 'thanks', 'thank you', 'perfecto', 'genial'))
    return {
      texto: es
        ? '¡De nada! Que disfrutes tu visita a Cochrane y la Patagonia. Aquí estaré — incluso sin conexión a internet.'
        : "You're welcome! Enjoy your visit to Cochrane and Patagonia. I'll be here — even without internet.",
      sugerencias: sug,
    }

  if (tiene('emergencia', 'hospital', 'urgencia', 'accidente', 'carabineros', 'policia', 'bomberos', 'rescate', 'emergency', 'police', 'fire', 'rescue', 'ambulance'))
    return {
      texto: es
        ? `Números de emergencia en Cochrane:\n\n${listaLugares(lugares, 'emergencia', lang, true)}\n\nConsejo: antes de salir de trekking, informa tu ruta en la tenencia de Carabineros.`
        : `Emergency numbers in Cochrane:\n\n${listaLugares(lugares, 'emergencia', lang, true)}\n\nTip: before trekking, register your route at the police station.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Estado de caminos', '¿Qué visitar?'] : ['Where to sleep?', 'Road conditions', 'What to visit?'],
    }

  if (tiene('dormir', 'alojamiento', 'hostal', 'cabana', 'hotel', 'hospedaje', 'sleep', 'stay', 'lodging', 'hostel', 'cabin'))
    return {
      texto: es
        ? `Opciones de alojamiento en Cochrane:\n\n${listaLugares(lugares, 'alojamiento', lang, true)}\n\nEn temporada alta (dic–feb) conviene reservar con anticipación.`
        : `Lodging options in Cochrane:\n\n${listaLugares(lugares, 'alojamiento', lang, true)}\n\nIn high season (Dec–Feb) book in advance.`,
      sugerencias: es ? ['¿Dónde comer?', '¿Qué visitar?', 'Combustible'] : ['Where to eat?', 'What to visit?', 'Fuel'],
    }

  if (tiene('comer', 'restaurante', 'comida', 'almuerzo', 'cena', 'cafe', 'desayuno', 'kuchen', 'eat', 'food', 'restaurant', 'lunch', 'dinner', 'coffee'))
    return {
      texto: es
        ? `Dónde comer en Cochrane:\n\n${listaLugares(lugares, 'comida', lang, true)}\n\nEl cordero al palo es el plato típico de la zona.`
        : `Where to eat in Cochrane:\n\n${listaLugares(lugares, 'comida', lang, true)}\n\nSpit-roasted lamb is the local specialty.`,
      sugerencias: es ? ['¿Dónde dormir?', 'Eventos', '¿Qué visitar?'] : ['Where to sleep?', 'Events', 'What to visit?'],
    }

  if (tiene('combustible', 'bencina', 'gasolina', 'petroleo', 'fuel', 'gas', 'petrol', 'diesel'))
    return {
      texto: es
        ? 'La estación de servicio está en Calle Río Maitén, salida norte del pueblo (400 m del centro).\n\nImportante: es la última estación confiable antes de Villa O’Higgins hacia el sur. Carga siempre el estanque completo aquí.'
        : 'The petrol station is on Río Maitén St., north exit of town (400 m from downtown).\n\nImportant: it is the last reliable station before Villa O’Higgins heading south. Always fill up here.',
      sugerencias: es ? ['Estado de caminos', 'Emergencias', '¿Qué visitar?'] : ['Road conditions', 'Emergencies', 'What to visit?'],
    }

  if (tiene('huemul', 'fauna', 'animal', 'guanaco', 'nandu', 'wildlife', 'deer'))
    return {
      texto: es
        ? 'Para ver fauna nativa:\n\n• Reserva Nacional Tamango (6 km): una de las últimas poblaciones de huemul de Chile.\n• Parque Nacional Patagonia — Valle Chacabuco (28 km): guanacos, ñandúes y zorros.\n\nMejores horas: amanecer y atardecer. Mantén distancia y no alimentes a los animales.'
        : 'To see native wildlife:\n\n• Tamango National Reserve (6 km): one of the last huemul deer populations in Chile.\n• Patagonia National Park — Chacabuco Valley (28 km): guanacos, rheas and foxes.\n\nBest hours: dawn and dusk. Keep your distance and do not feed the animals.',
      sugerencias: es ? ['¿Qué visitar?', 'Estado de caminos', '¿Dónde dormir?'] : ['What to visit?', 'Road conditions', 'Where to sleep?'],
    }

  if (tiene('visitar', 'atractivo', 'hacer', 'panorama', 'conocer', 'sendero', 'trekking', 'caminata', 'parque', 'baker', 'confluencia', 'tamango', 'chacabuco', 'plaza', 'visit', 'attraction', 'see', 'hike', 'trail', 'park'))
    return {
      texto: es
        ? `Los imperdibles de Cochrane:\n\n${listaLugares(lugares, 'atractivo', lang)}\n\nToca cualquier lugar en el mapa o la lista para ver cómo llegar. Toda la información funciona sin conexión.`
        : `Cochrane's must-sees:\n\n${listaLugares(lugares, 'atractivo', lang)}\n\nTap any place on the map or list for directions. Everything works offline.`,
      sugerencias: es ? ['Ver fauna / huemules', 'Estado de caminos', '¿Dónde comer?'] : ['Wildlife / huemul', 'Road conditions', 'Where to eat?'],
    }

  if (tiene('camino', 'ruta', 'estado', 'x-83', 'carretera', 'nieve', 'transito', 'tortel', 'road', 'route', 'snow', 'conditions'))
    return {
      texto: es
        ? 'El estado de los caminos cambia con el clima, especialmente en invierno.\n\n• Consulta en la Oficina de Información Turística (costado de la Plaza de Armas, tel +56 67 252 2115).\n• La app envía notificaciones cuando la Municipalidad reporta cortes.\n\nRecuerda cargar combustible antes de salir hacia el sur.'
        : 'Road conditions change with the weather, especially in winter.\n\n• Check at the Tourist Information Office (beside the main square, tel +56 67 252 2115).\n• The app sends notifications when the Municipality reports closures.\n\nRemember to fill up before heading south.',
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
        ? `Eventos en Cochrane:\n\n${listaLugares(lugares, 'evento', lang)}\n\nEl Festival Costumbrista (última semana de enero) es el evento más grande de la provincia Capitán Prat.`
        : `Events in Cochrane:\n\n${listaLugares(lugares, 'evento', lang)}\n\nThe Folk Festival (last week of January) is the biggest event in Capitán Prat province.`,
      sugerencias: es ? ['¿Dónde dormir?', '¿Dónde comer?', '¿Qué visitar?'] : ['Where to sleep?', 'Where to eat?', 'What to visit?'],
    }

  if (tiene('offline', 'sin conexion', 'internet', 'senal', 'signal', 'connection'))
    return {
      texto: es
        ? '¡Esa es la gracia de esta app! Toda la información —lugares, mapas, teléfonos y este asistente— queda guardada en tu teléfono al instalarla.\n\nEn gran parte de la provincia no hay señal, así que la app está diseñada para funcionar 100% sin internet.'
        : "That's the whole point of this app! All the information —places, maps, phone numbers and this assistant— is stored on your phone when you install it.\n\nMuch of the province has no signal, so the app is designed to work 100% offline.",
      sugerencias: sug,
    }

  return {
    texto: es
      ? 'Puedo ayudarte con estos temas:\n\n• Qué visitar (senderos, parques, miradores)\n• Dónde dormir y dónde comer\n• Emergencias y teléfonos útiles\n• Combustible y servicios\n• Estado de caminos y clima\n• Eventos y ferias\n\nPrueba con una de las sugerencias o escribe tu pregunta con otras palabras.'
      : 'I can help you with:\n\n• What to visit (trails, parks, viewpoints)\n• Where to sleep and eat\n• Emergencies and useful phone numbers\n• Fuel and services\n• Road conditions and weather\n• Events and fairs\n\nTry one of the suggestions or rephrase your question.',
    sugerencias: sug,
  }
}

export default function ChatBot({ abierto, onCerrar, lugares }) {
  const { t, lang } = useI18n()
  const [mensajes, setMensajes] = useState([])
  const [sugerencias, setSugerencias] = useState(SUGERENCIAS[lang])
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const msgsRef = useRef(null)
  const saludoRef = useRef(false)

  useEffect(() => {
    if (abierto && !saludoRef.current) {
      saludoRef.current = true
      setMensajes([
        {
          quien: 'bot',
          texto:
            lang === 'es'
              ? '¡Hola! Soy el asistente turístico de Cochrane. Puedo ayudarte con lugares para visitar, alojamiento, comida, emergencias y consejos de ruta.\n\n¿Qué necesitas saber?'
              : "Hi! I'm the Cochrane tourist assistant. I can help with places to visit, lodging, food, emergencies and road tips.\n\nWhat do you need to know?",
        },
      ])
    }
  }, [abierto, lang])

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
      const r = responder(pregunta, lugares, lang)
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
