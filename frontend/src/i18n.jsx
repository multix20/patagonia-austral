import { createContext, useContext, useState, useCallback } from 'react'

// Contenidos bilingües ES/EN según bases de licitación (perfil internacional
// del visitante de la Carretera Austral)
const DICCIONARIO = {
  es: {
    titulo: 'Cochrane Turismo',
    subtitulo: 'Capital de la Patagonia chilena',
    enLinea: 'En línea',
    sinConexion: 'Sin conexión',
    bannerOffline: 'Sin conexión — mostrando información guardada en tu teléfono',
    veloOffline: 'Mapa guardado en el dispositivo — funcionando sin internet',
    demoOffline: 'Simular sin conexión',
    demoPush: 'Probar notificación push',
    todos: 'Todos',
    guardadoOffline: 'Guardado para uso sin conexión',
    dispOffline: 'Esta información está disponible sin conexión',
    actualizado: 'Contenidos actualizados',
    instalarTitulo: 'Instala Cochrane Turismo',
    instalarTexto: 'Agrégala a tu pantalla de inicio y úsala sin internet',
    instalar: 'Instalar',
    muni: 'Municipalidad de Cochrane',
    chatNombre: 'Asistente Turístico',
    chatDisponible: 'Disponible sin conexión',
    chatNota: 'Respuestas guardadas en tu dispositivo — funcionan sin internet',
    chatPlaceholder: 'Escribe tu pregunta…',
    chatDudas: '¿Dudas?',
  },
  en: {
    titulo: 'Cochrane Tourism',
    subtitulo: 'Capital of Chilean Patagonia',
    enLinea: 'Online',
    sinConexion: 'Offline',
    bannerOffline: 'Offline — showing information saved on your phone',
    veloOffline: 'Map stored on your device — working without internet',
    demoOffline: 'Simulate offline',
    demoPush: 'Test push notification',
    todos: 'All',
    guardadoOffline: 'Saved for offline use',
    dispOffline: 'This information is available offline',
    actualizado: 'Content updated',
    instalarTitulo: 'Install Cochrane Tourism',
    instalarTexto: 'Add it to your home screen and use it without internet',
    instalar: 'Install',
    muni: 'Municipality of Cochrane',
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
