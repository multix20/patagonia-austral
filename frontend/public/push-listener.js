// Manejo de Web Push en el service worker.
// Se importa desde el SW generado por vite-plugin-pwa (workbox.importScripts).

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Municipalidad de Cochrane'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'es',
    data: { tipo: data.tipo || 'info' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ('focus' in cliente) return cliente.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
