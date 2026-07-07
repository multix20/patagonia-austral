# App PWA Turismo Cochrane — Licitación ID 3797-37-LE26

Aplicación Web Progresiva de información turística para la I. Municipalidad
de Cochrane. Stack según bases: **React 18 + Laravel (PHP 8.x) + PostgreSQL 16**.

## Estructura

- `frontend/` — PWA React 18 + Vite (este repositorio, funcional)
- `backend/` — API Laravel + CMS municipal (próxima etapa)
- `docker-compose.yml` — orquestación de despliegue (próxima etapa)

## Frontend — desarrollo local

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (genera dist/ con service worker)
npm run preview   # sirve el build para pruebas
```

## Características implementadas

- PWA instalable (manifest + service worker con vite-plugin-pwa / Workbox)
- Offline-first: precache del app shell, cache de teselas OSM (CacheFirst),
  contenidos en IndexedDB, datos semilla empaquetados para primera visita
- Indicador real de conexión (navigator.onLine) + modo demo para presentaciones
- Directorio turístico geolocalizado (Leaflet + OpenStreetMap) con filtros
- Fichas con cómo llegar, distancias y llamada directa
- Bilingüe ES/EN con persistencia de preferencia
- Chatbot asistente turístico offline (motor de reglas sobre datos locales)
- Notificaciones municipales (demo local; producción: Web Push desde CMS Laravel)
- Banner de instalación con beforeinstallprompt real

## Conexión con backend

La capa `src/api/client.js` consume `GET /api/places` cuando `VITE_API_URL`
está definida (ver `.env.example`) y sincroniza a IndexedDB. Sin API o sin
conexión, la app funciona 100% con datos locales.
