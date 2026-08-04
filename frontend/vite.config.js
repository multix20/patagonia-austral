import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA Patagonia Austral Turismo - Carretera Austral (Puerto Montt a Villa O'Higgins)
// Offline-first: precache del app shell + cache de teselas OSM + cache de API
export default defineConfig({
  // Versión visible en el menú. No hay versionado semántico (el despliegue es
  // continuo desde `main`), y lo que le sirve al viajero es saber DE CUÁNDO es
  // la app que tiene instalada para reconocer que la actualización sí entró.
  define: {
    __VERSION_APP__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (antes 'autoUpdate'): la versión nueva queda ESPERANDO y el
      // relevo lo pide la app, que así puede mostrar el indicador en el icono y
      // el cartel "Actualizando la app…" antes de recargar. Con 'autoUpdate' la
      // recarga ocurría sola y sin explicación. Ver src/actualizacion.js.
      registerType: 'prompt',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
        'icons/favicon.svg',
      ],
      manifest: {
        name: 'Patagonia Austral Turismo',
        short_name: 'Patagonia',
        description:
          'Guia turistica de la Carretera Austral, de Puerto Montt a Villa O Higgins. Funciona sin conexion.',
        lang: 'es',
        theme_color: '#0F6E56',
        background_color: '#F7F5F0',
        display: 'standalone',
        start_url: '/',
        // Le permite a la app preguntarle al navegador si YA esta instalada
        // (navigator.getInstalledRelatedApps), cosa de no ofrecerle instalar a
        // quien ya la tiene. Necesita la URL absoluta del manifest, por eso el
        // dominio va escrito: en otros origenes (previews de Netlify) la
        // consulta simplemente no encuentra nada y no molesta.
        // OJO: NO agregar prefer_related_applications: true — eso le dice al
        // navegador que prefiera una app nativa y desactiva el instalar de la PWA.
        related_applications: [
          { platform: 'webapp', url: 'https://rutaaustral.cl/manifest.webmanifest' },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // La maskable NO puede ser el mismo archivo que la normal: Android le
          // aplica su máscara (círculo, squircle, gota) y recorta ~20% del
          // borde, así que necesita su propia versión a sangre y con el
          // contenido centrado. Ver scripts/generar-iconos.py.
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Habilita el service worker también en `npm run dev` para probar el push.
      devOptions: { enabled: true, type: 'module' },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // La PRIMERA instalación sí toma el control de inmediato (esto lo hacía
        // 'autoUpdate' por su cuenta): sin esto la app recién abierta se queda
        // sin service worker hasta la siguiente visita, o sea sin offline. No
        // afecta a las actualizaciones: el SW que espera no reclama nada hasta
        // que se activa, y eso lo decide la app.
        clientsClaim: true,
        // La landing de presentacion (municipios / servicios turisticos) NO va al
        // precache: se lee una vez, con senal, desde un computador de oficina. El
        // precache es para lo que el viajero necesita sin conexion en la ruta.
        // El QR se suma por lo mismo: vive en la landing, para imprimirlo desde
        // un computador de oficina. Al viajero no le sirve de nada llevarlo
        // guardado en el telefono.
        globIgnores: ['proyecto.html', 'qr-rutaaustral.*'],
        // ...pero sacarla del precache NO basta para que /proyecto se vea. El SW
        // registra una NavigationRoute que responde index.html a CUALQUIER
        // navegacion (es lo que hace funcionar la SPA sin conexion), asi que a
        // quien tiene la app instalada le servia el mapa en vez de la landing:
        // el redirect de netlify.toml ni siquiera llegaba a evaluarse, porque la
        // peticion moria en el service worker. Por eso /proyecto queda excluido
        // de la ruta de navegacion y sale a la red como una pagina normal.
        navigateFallbackDenylist: [/^\/proyecto/],
        // Importa el manejador de Web Push (push/notificationclick) al SW generado.
        importScripts: ['push-listener.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mapa base CARTO Voyager (estilo por defecto)
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Basemap de terreno Stadia/Stamen (capa "Mapa" cuando hay API key)
            urlPattern: /^https:\/\/tiles\.stadiamaps\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'stadia-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Capa Satélite (Esri World Imagery)
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'esri-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Reportes del crowdsourcing (Fase 3): dato PERECIBLE, va antes que la
            // regla genérica de /api/ (en Workbox gana la primera que calza). Con
            // StaleWhileRevalidate se vería primero el estado viejo del camino, que
            // es justo lo que no sirve. NetworkFirst con timeout corto: si hay señal
            // manda la red, y si no (lo normal en la ruta) responde el caché y la
            // app además tiene su copia en IndexedDB.
            urlPattern: /\/api\/reportes/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-reportes',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Fotos de las fichas (bucket R2). NO entran al precache: el shell
            // debe seguir siendo liviano (regla del proyecto, ~20 MB) y nadie
            // quiere descargar 200 fotos al instalar la app. Se guardan a medida
            // que el turista abre fichas, y desde ahí ya se ven sin señal.
            // CacheFirst porque la foto de una cabaña no cambia: si está en
            // caché, no se gasta ni un byte de datos móviles en revalidar.
            // El tope de entradas evita que el caché crezca sin control en un
            // celular con poco espacio.
            urlPattern: ({ url }) => /\.webp$/i.test(url.pathname) && /\/fichas\//i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fotos-fichas',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-contenidos' },
          },
        ],
      },
    }),
  ],
})
