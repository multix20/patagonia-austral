import { createContext, useContext, useState, useCallback } from 'react'

// Contenidos bilingües ES/EN según bases de licitación (perfil internacional
// del visitante de la Carretera Austral)
const DICCIONARIO = {
  es: {
    titulo: 'Patagonia Austral',
    subtitulo: 'Carretera Austral · Puerto Montt a Villa O\'Higgins',
    enLinea: 'En línea',
    sinConexion: 'Sin conexión',
    bannerOffline: 'Sin conexión — mostrando información guardada en tu teléfono',
    veloOffline: 'Mapa guardado en el dispositivo — funcionando sin internet',
    todos: 'Todos',
    localidad: 'Localidad',
    todaLaRuta: 'Toda la ruta',
    buscarLocalidad: 'Buscar localidad…',
    sinResultados: 'Sin resultados',
    sinLugaresLocalidad: 'Aún no hay lugares publicados en esta localidad.',
    guardadoOffline: 'Guardado para uso sin conexión',
    destacado: 'Destacado',
    dispOffline: 'Esta información está disponible sin conexión',
    compartir: 'Compartir',
    enlaceCopiado: 'Enlace copiado',
    actualizado: 'Contenidos actualizados',
    instalarTitulo: 'Instala Patagonia Austral',
    instalarTexto: 'Agrégala a tu pantalla de inicio y úsala sin internet',
    instalar: 'Instalar',
    pushTitulo: '¿Quieres recibir avisos?',
    pushTexto: 'Te avisamos de cortes de camino, clima y barcazas aunque tengas la app cerrada.',
    pushActivar: 'Activar avisos',
    muni: 'Patagonia Austral Turismo',
    chatNombre: 'Asistente Turístico',
    chatDisponible: 'Disponible sin conexión',
    chatNota: 'Respuestas guardadas en tu dispositivo — funcionan sin internet',
    chatPlaceholder: 'Escribe tu pregunta…',
    chatDudas: '¿Dudas?',
  },
  en: {
    titulo: 'Patagonia Austral',
    subtitulo: 'Carretera Austral · Puerto Montt to Villa O\'Higgins',
    enLinea: 'Online',
    sinConexion: 'Offline',
    bannerOffline: 'Offline — showing information saved on your phone',
    veloOffline: 'Map stored on your device — working without internet',
    todos: 'All',
    localidad: 'Town',
    todaLaRuta: 'Whole route',
    buscarLocalidad: 'Search town…',
    sinResultados: 'No results',
    sinLugaresLocalidad: 'No places published for this town yet.',
    guardadoOffline: 'Saved for offline use',
    destacado: 'Featured',
    dispOffline: 'This information is available offline',
    compartir: 'Share',
    enlaceCopiado: 'Link copied',
    actualizado: 'Content updated',
    instalarTitulo: 'Install Patagonia Austral',
    instalarTexto: 'Add it to your home screen and use it without internet',
    instalar: 'Install',
    pushTitulo: 'Want to get alerts?',
    pushTexto: 'We\'ll warn you about road closures, weather and ferries even when the app is closed.',
    pushActivar: 'Enable alerts',
    muni: 'Patagonia Austral Turismo',
    chatNombre: 'Tourist Assistant',
    chatDisponible: 'Available offline',
    chatNota: 'Answers stored on your device — they work without internet',
    chatPlaceholder: 'Type your question…',
    chatDudas: 'Questions?',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es')
  const cambiar = useCallback((l) => {
    setLang(l)
    localStorage.setItem('lang', l)
    document.documentElement.lang = l
  }, [])
  const t = useCallback((clave) => DICCIONARIO[lang][clave] ?? clave, [lang])
  return (
    <I18nContext.Provider value={{ lang, setLang: cambiar, t }}>{children}</I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
