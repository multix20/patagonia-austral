// Manejo de Web Push en el service worker.
// Se importa desde el SW generado por vite-plugin-pwa (workbox.importScripts).

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }

  // Aviso de version nueva de la PWA: lo manda el hook de despliegue
  // (POST /api/version/desplegada). Es lo unico que llega con la app CERRADA, y
  // es la pieza que le pone el punto al icono en Android, donde no existe la
  // Badging API. Se muestra silencioso y con la MISMA `tag` que la notificacion
  // que emite la app abierta, para que nunca haya dos.
  const esVersion = data.tipo === 'nueva-version'

  const title = data.title || 'Municipalidad de Cochrane'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'es',
    data: { tipo: esVersion ? 'actualizacion' : data.tipo || 'info' },
  }
  if (esVersion) {
    options.tag = 'actualizacion-app'
    options.silent = true
  }

  // Muestra la notificacion del SO Y avisa a la app abierta (si la hay) para que
  // la campanita/badge se actualice en vivo, sin necesidad de refrescar.
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // En escritorio (Windows/macOS) esto ademas enciende el punto del icono
      // con la app cerrada, que sin push no se podia.
      esVersion && self.navigator && self.navigator.setAppBadge
        ? self.navigator.setAppBadge(1).catch(() => {})
        : null,
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((lista) => {
          for (const cliente of lista) {
            // Con la app abierta, el push solo avisa: la version se busca en el
            // service worker (actualizacion.js) y de ahi sale el cartel.
            cliente.postMessage(
              esVersion ? { tipo: 'nueva-version' } : { tipo: 'nuevo-aviso', aviso: data }
            )
          }
        }),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  // La notificacion de version nueva (la que le pone el punto al icono en
  // Android, donde no hay Badging API) la emite la app desde actualizacion.js.
  const esActualizacion = (event.notification.data || {}).tipo === 'actualizacion'
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ('focus' in cliente) {
          // Con la app ya abierta, traerla al frente deja al viajero mirando el
          // mismo aviso: se le pide ademas que aplique la version esperando.
          // Recien abierta no hace falta, la aplica sola al arrancar.
          if (esActualizacion) cliente.postMessage({ tipo: 'aplicar-actualizacion' })
          return cliente.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
