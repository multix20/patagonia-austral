import { createContext, useContext, useState, useCallback } from 'react'

// Contenidos bilingües ES/EN según bases de licitación (perfil internacional
// del visitante de la Carretera Austral)
const DICCIONARIO = {
  es: {
    titulo: 'Patagonia Austral',
    subtitulo: 'Carretera Austral · Puerto Montt a Villa O\'Higgins',
    // Lo que dice la píldora sobre el mapa. NO es el nombre de la app —ese sigue
    // siendo `titulo`, y es el que va en la pestaña del navegador y en la app
    // instalada—: sobre el mapa manda el CAMINO, no la marca, porque el viajero
    // está mirando la Ruta 7. Va igual en los dos idiomas: es el número de una
    // carretera, no una frase que se traduzca.
    // Se ve en VERSALES, pero acá se escribe en caja mixta: las mayúsculas las
    // pone el CSS con `text-transform`. Esta misma cadena arma el nombre
    // accesible del botón, y varios lectores de pantalla deletrean una palabra
    // escrita toda en mayúsculas ("erre-u-te-a" en vez de "ruta").
    // (Se veía en caja mixta de verdad hasta el 23-ago-2026, porque en versales
    // no cabía con Segoe UI. Con la marca en Archivo, más angosta, dejó de ser
    // un límite: 63,6 px contra un techo de 173.)
    marcaMapa: 'Ruta 7',
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
    // La llama: sello que se GANA con las calificaciones. El texto de ayuda
    // dice la regla completa a propósito — un sello sin regla visible se lee
    // como publicidad pagada, que es justo lo contrario de lo que es.
    recomendado: 'Recomendado',
    recomendadoAyuda: 'Recomendado por los viajeros: 4,5 estrellas o más, con al menos 3 opiniones.',
    dispOffline: 'Esta información está disponible sin conexión',
    compartir: 'Compartir',
    enlaceCopiado: 'Enlace copiado',
    estasAqui: 'Estás aquí',
    actualizado: 'Contenidos actualizados',
    instalarTitulo: 'Instala Patagonia Austral',
    instalarTexto: 'Agrégala a tu pantalla de inicio y úsala sin internet',
    instalar: 'Instalar',
    // iOS no permite instalar desde un botón: el gesto lo tiene que hacer la
    // persona. Por eso allí el banner explica cómo, en vez de ofrecer un
    // "Instalar" que no puede instalar nada.
    instalarTextoIOS: 'Toca Compartir abajo y elige «Añadir a pantalla de inicio»',
    // Android cuando el navegador no nos dio permiso de instalar de un toque:
    // el camino existe igual, pero hay que ir a buscarlo al menú.
    // El icono del menú va NOMBRADO, no dibujado con «⋮» (U+22EE): ese carácter
    // no está en la fuente de varios Android y el sistema lo reemplaza por algo
    // parecido a dos puntos, con lo que la frase se leía "Abre el menú : del
    // navegador" (visto en un Samsung de la ruta). En palabras se entiende en
    // cualquier teléfono y no depende de dónde ponga cada navegador ese botón.
    // El rótulo tampoco es uno solo: Chrome dice "Instalar aplicación" y Samsung
    // Internet / Firefox hablan de la pantalla de inicio. Por eso "busca" y no
    // "elige": lo que va entre comillas se parece a lo que verá, no es exacto.
    instalarTextoMenu:
      'Abre el menú del navegador (los tres puntos) y busca «Instalar» o «Agregar a pantalla de inicio»',
    instalarEntendido: 'Entendido',
    pushTitulo: '¿Quieres recibir avisos?',
    pushTexto: 'Te avisamos de cortes de camino, clima y barcazas aunque tengas la app cerrada.',
    pushActivar: 'Activar avisos',
    muni: 'Patagonia Austral Turismo',
    // El asistente tiene NOMBRE y CARA: el huemul, emblema de Aysén y del escudo
    // de Chile. "Asistente Turístico" es lo que se llama a sí mismo el chatbot
    // de cualquier municipalidad; un huemul que te acompaña por la ruta es de
    // acá y no se confunde con nada. El rol va aparte, en una línea, porque el
    // nombre solo no dice para qué sirve.
    chatNombre: 'Huemul',
    chatRol: 'Tu copiloto de ruta',
    chatNota: 'Respuestas guardadas en tu dispositivo — funcionan sin internet',
    chatPlaceholder: 'Escribe tu pregunta…',
    chatDudas: '¿Dudas?',
    // ---- Rediseño map-first (Sprint UX/UI) ----
    volverRuta: 'Volver a la ruta',
    aDondeVas: '¿A dónde vas?',
    buscarPh: 'Buscar localidad, servicio…',
    queVesRuta: '¿Qué ves en la ruta?',
    reportesNota: 'El reporte queda en tu posición exacta y dura 24 horas: se confirma o caduca solo.',
    reportePreview: 'Sin señal también sirve: el reporte se guarda y se envía cuando vuelva la conexión.',
    comentarioPh: 'Agrega un detalle (opcional)…',
    reporteEncolado: 'Guardado sin señal. Se enviará al recuperar conexión.',
    reporteFalla: 'No se pudo enviar el reporte. Inténtalo de nuevo en un rato.',
    reporteSinUbicacion: 'Sin tu ubicación no podemos poner el pin. Activa el GPS e inténtalo de nuevo.',
    reporteFueraDeRuta: 'Estás fuera de la Carretera Austral: el reporte no se envía.',
    colaPendiente: 'reporte(s) por enviar',
    colaEnviada: 'Se enviaron tus reportes guardados.',
    sigueAhi: '¿Sigue ahí?',
    yaNoEsta: 'Ya no está',
    graciasVoto: '¡Gracias! Tu voto ayuda al resto de la ruta.',
    reporteConfirmaciones: 'confirmaciones',
    reporteRecien: 'recién',
    reporteHaceMin: 'hace {n} min',
    reporteHaceH: 'hace {n} h',
    reporteDeViajero: 'Reporte de un viajero',
    dejarComentario: 'Comentario',
    // ---- Calificaciones (Fase 3) ----
    calificarTitulo: '¿Estuviste aquí? Califica',
    calificarSub: 'Tu opinión ayuda al resto de la ruta a elegir.',
    tuCalificacion: 'Tu calificación',
    calificarPh: 'Cuenta cómo te fue (opcional)…',
    calificarEnviar: 'Enviar calificación',
    calificarEnviando: 'Enviando…',
    calificacionEnviada: '¡Gracias! Tu calificación ya está publicada.',
    calificacionEncolada: 'Guardada sin señal. Se enviará al recuperar conexión.',
    calificacionFalla: 'No se pudo enviar. Inténtalo de nuevo en un rato.',
    calificacionNoAdmitida: 'Esta ficha no se califica.',
    opinionesTitulo: 'Lo que dicen otros viajeros',
    opinion: 'opinión',
    opiniones: 'opiniones',
    estrella: 'estrella',
    estrellasPlural: 'estrellas',
    zonaNorte: 'Norte',
    zonaCentro: 'Centro',
    zonaSur: 'Sur',
    tramoTodos: 'Todos',
    reportesTitulo: 'Reportes de la ruta',
    filtrarReportesTramo: 'Filtrar reportes por tramo',
    zonaNorteSub: 'Los Lagos',
    zonaCentroSub: 'Aysén N',
    zonaSurSub: 'Aysén S',
    catDormir: 'Dormir',
    catComer: 'Comer',
    catVisitar: 'Visitar',
    catServicios: 'Servicios',
    catEventos: 'Eventos',
    catEmergencia: 'SOS',
    abiertoAhora: 'Abierto ahora',
    cerrado: 'Cerrado',
    llamar: 'Llamar',
    whatsapp: 'WhatsApp',
    comoLlegar: 'Cómo llegar',
    // El horario se muestra tal cual lo dijo el negocio. La app NO calcula si
    // está abierto ahora mismo: el dato es texto libre ("en invierno hasta las
    // 20") y afirmar "abierto" sobre eso manda a alguien a manejar 40 km de
    // ripio hasta una puerta cerrada.
    horarioFicha: 'Horario',
    consultaPendiente: 'Tienes 1 consulta guardada — mándala desde el asistente',
    consultasPendientes: 'Tienes {n} consultas guardadas — mándalas desde el asistente',
    guardar: 'Guardar',
    reporteEnviado: '¡Gracias! Tu reporte ya está en el mapa.',
    verFicha: 'Ver ficha completa',
    localidadesRuta: 'localidades en la ruta',
    menuAsistente: 'Asistente turístico',
    // Rótulo VISIBLE del botón coral del mapa (antes era un "+" pelado) y su
    // nombre accesible, que dice de más porque el botón no vive dentro de
    // ningún contexto que lo explique.
    railReportar: 'Reportar',
    railReportarAria: 'Reportar algo en la ruta',
    menuAvisos: 'Avisos municipales',
    idioma: 'Idioma',
    buscandoUbicacion: 'Buscando tu ubicación…',
    sinUbicacion: 'Sin ubicación: revisa el permiso de GPS',
    eligeLocalidad: 'Elige una localidad para filtrar',
    sinLugaresCategoria: 'Todavía no hay lugares de esa categoría aquí',
    // Los tres tipos vivos del crowdsourcing.
    repPeligro: 'Peligro',
    repAccidente: 'Accidente',
    repFaena: 'Trabajos en la vía',
    // Tipos retirados: siguen acá porque los reportes creados antes del recorte
    // se dibujan hasta caducar (ver TIPOS_HISTORICOS en data/reportes.js).
    repDerrumbe: 'Derrumbe',
    repHielo: 'Hielo / nieve',
    repCamino: 'Camino malo',
    repCombustible: 'Sin combustible',
    repFerry: 'Ferry / barcaza',
    repCamping: 'Camping lleno',
    repTiempo: 'Mal tiempo',
    repFauna: 'Fauna en ruta',
    repEvento: 'Evento local',
    // ---- Actualización de la app (ver src/actualizacion.js) ----
    updBoton: 'Actualizar',
    updAplicando: 'Actualizando la app…',
    updAplicandoSub: 'Se reinicia sola en un momento. Tus mapas y reportes guardados no se pierden.',
    updListo: 'App actualizada: ya tienes la última versión.',
    updBuscando: 'Buscando actualizaciones…',
    updAlDia: 'Ya tienes la última versión.',
    menuVersionSub: 'Buscar actualizaciones',
  },
  en: {
    titulo: 'Patagonia Austral',
    subtitulo: 'Carretera Austral · Puerto Montt to Villa O\'Higgins',
    // Lo que dice la píldora sobre el mapa. NO es el nombre de la app —ese sigue
    // siendo `titulo`, y es el que va en la pestaña del navegador y en la app
    // instalada—: sobre el mapa manda el CAMINO, no la marca, porque el viajero
    // está mirando la Ruta 7. Va igual en los dos idiomas: es el número de una
    // carretera, no una frase que se traduzca.
    // Se ve en VERSALES, pero acá se escribe en caja mixta: las mayúsculas las
    // pone el CSS con `text-transform`. Esta misma cadena arma el nombre
    // accesible del botón, y varios lectores de pantalla deletrean una palabra
    // escrita toda en mayúsculas ("erre-u-te-a" en vez de "ruta").
    // (Se veía en caja mixta de verdad hasta el 23-ago-2026, porque en versales
    // no cabía con Segoe UI. Con la marca en Archivo, más angosta, dejó de ser
    // un límite: 63,6 px contra un techo de 173.)
    marcaMapa: 'Ruta 7',
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
    recomendado: 'Travellers’ pick',
    recomendadoAyuda: 'Picked by travellers: 4.5 stars or more, from at least 3 reviews.',
    dispOffline: 'This information is available offline',
    compartir: 'Share',
    enlaceCopiado: 'Link copied',
    estasAqui: "You're here",
    actualizado: 'Content updated',
    instalarTitulo: 'Install Patagonia Austral',
    instalarTexto: 'Add it to your home screen and use it without internet',
    instalar: 'Install',
    instalarTextoIOS: 'Tap Share below and choose “Add to Home Screen”',
    instalarTextoMenu:
      'Open the browser menu (the three dots) and look for “Install” or “Add to Home screen”',
    instalarEntendido: 'Got it',
    pushTitulo: 'Want to get alerts?',
    pushTexto: 'We\'ll warn you about road closures, weather and ferries even when the app is closed.',
    pushActivar: 'Enable alerts',
    muni: 'Patagonia Austral Turismo',
    chatNombre: 'Huemul',
    chatRol: 'Your road copilot',
    chatNota: 'Answers stored on your device — they work without internet',
    chatPlaceholder: 'Type your question…',
    chatDudas: 'Questions?',
    // ---- Map-first redesign (UX/UI Sprint) ----
    volverRuta: 'Back to route',
    aDondeVas: 'Where to?',
    buscarPh: 'Search town, service…',
    queVesRuta: 'What do you see?',
    reportesNota: 'The report is pinned to your exact position and lasts 24 hours: it gets confirmed or expires.',
    reportePreview: 'Works offline too: the report is saved and sent once you are back online.',
    comentarioPh: 'Add a detail (optional)…',
    reporteEncolado: 'Saved offline. It will be sent when you are back online.',
    reporteFalla: 'The report could not be sent. Please try again shortly.',
    reporteSinUbicacion: 'Without your location we cannot drop the pin. Turn on GPS and try again.',
    reporteFueraDeRuta: "You're outside the Carretera Austral: the report won't be sent.",
    colaPendiente: 'report(s) waiting to be sent',
    colaEnviada: 'Your saved reports were sent.',
    sigueAhi: 'Still there?',
    yaNoEsta: 'Gone now',
    graciasVoto: 'Thanks! Your vote helps everyone on the road.',
    reporteConfirmaciones: 'confirmations',
    reporteRecien: 'just now',
    reporteHaceMin: '{n} min ago',
    reporteHaceH: '{n} h ago',
    reporteDeViajero: 'Traveller report',
    dejarComentario: 'Comment',
    // ---- Ratings (Phase 3) ----
    calificarTitulo: 'Been here? Rate it',
    calificarSub: 'Your opinion helps everyone else on the road choose.',
    tuCalificacion: 'Your rating',
    calificarPh: 'Tell others how it went (optional)…',
    calificarEnviar: 'Send rating',
    calificarEnviando: 'Sending…',
    calificacionEnviada: 'Thanks! Your rating is published.',
    calificacionEncolada: 'Saved offline. It will be sent when you are back online.',
    calificacionFalla: 'Could not send it. Please try again shortly.',
    calificacionNoAdmitida: 'This listing cannot be rated.',
    opinionesTitulo: 'What other travellers say',
    opinion: 'review',
    opiniones: 'reviews',
    estrella: 'star',
    estrellasPlural: 'stars',
    zonaNorte: 'North',
    zonaCentro: 'Centre',
    zonaSur: 'South',
    tramoTodos: 'All',
    reportesTitulo: 'Road reports',
    filtrarReportesTramo: 'Filter reports by section',
    zonaNorteSub: 'Los Lagos',
    zonaCentroSub: 'Aysén N',
    zonaSurSub: 'Aysén S',
    catDormir: 'Sleep',
    catComer: 'Eat',
    catVisitar: 'Visit',
    catServicios: 'Services',
    catEventos: 'Events',
    catEmergencia: 'SOS',
    abiertoAhora: 'Open now',
    cerrado: 'Closed',
    llamar: 'Call',
    whatsapp: 'WhatsApp',
    comoLlegar: 'Directions',
    horarioFicha: 'Hours',
    consultaPendiente: 'You have 1 saved request — send it from the assistant',
    consultasPendientes: 'You have {n} saved requests — send them from the assistant',
    guardar: 'Save',
    reporteEnviado: 'Thanks! Your report is on the map.',
    verFicha: 'See full details',
    localidadesRuta: 'towns on the route',
    menuAsistente: 'Tourist assistant',
    railReportar: 'Report',
    railReportarAria: 'Report something on the road',
    menuAvisos: 'Municipal alerts',
    idioma: 'Language',
    buscandoUbicacion: 'Finding your location…',
    sinUbicacion: 'No location: check your GPS permission',
    eligeLocalidad: 'Pick a town to filter',
    sinLugaresCategoria: 'Nothing in that category here yet',
    // The three live crowdsourcing types.
    repPeligro: 'Hazard',
    repAccidente: 'Crash',
    repFaena: 'Roadworks',
    // Retired types: kept because reports created before the cut are still drawn
    // until they expire (see TIPOS_HISTORICOS in data/reportes.js).
    repDerrumbe: 'Rockfall',
    repHielo: 'Ice / snow',
    repCamino: 'Rough road',
    repCombustible: 'No fuel',
    repFerry: 'Ferry',
    repCamping: 'Camp full',
    repTiempo: 'Bad weather',
    repFauna: 'Wildlife',
    repEvento: 'Local event',
    // ---- App update (see src/actualizacion.js) ----
    updBoton: 'Update',
    updAplicando: 'Updating the app…',
    updAplicandoSub: 'It restarts by itself in a moment. Your saved maps and reports stay put.',
    updListo: 'App updated: you are on the latest version.',
    updBuscando: 'Checking for updates…',
    updAlDia: 'You are on the latest version.',
    menuVersionSub: 'Check for updates',
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
