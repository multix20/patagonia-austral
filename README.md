# Patagonia Austral Turismo

Aplicación Web Progresiva (PWA) **offline-first** que es la guía turística de
referencia de la **Carretera Austral**, desde **Coyhaique hasta Villa O'Higgins**.
El viajero elige una localidad o explora un mapa regional y encuentra qué visitar,
dónde dormir, dónde comer, servicios, rutas y emergencias — todo funcionando
**sin señal**, clave en las zonas rurales y de montaña de la Patagonia.

> Producto propio (comercial). Base técnica heredada de la PWA de Cochrane.
> Stack: **React 18 + Vite** · **Laravel (PHP 8.x) + Filament** · **PostgreSQL**.

## Alcance geográfico (Ruta 7, norte a sur)

**Cubierto hoy (Región de Aysén, Coyhaique → sur):** Coyhaique · Villa Cerro
Castillo · Puerto Río Tranquilo · Puerto Guadal / Chile Chico · Puerto Bertrand ·
Cochrane · Caleta Tortel · Villa O'Higgins.

**En incorporación (Fase 2.5 — tramo norte, Coyhaique → Puerto Montt):**
Puerto Aysén / Puerto Chacabuco · Villa Mañihuales · Puerto Cisnes · Villa
Amengual · Puyuhuapi · La Junta · Palena · Futaleufú · Villa Santa Lucía ·
Chaitén · Parque Pumalín / Caleta Gonzalo · Hornopirén · Puerto Montt (km 0).
Al completarlo, la app cubre **toda la Carretera Austral, Puerto Montt → Villa
O'Higgins**.

## Estructura del repositorio

- `frontend/` — PWA React 18 + Vite (offline-first, IndexedDB, Service Worker)
- `backend/` — API Laravel + CMS Filament (`/admin`), API pública `/api/*`
- `docker/`, `docker-compose.*.yml` — orquestación de despliegue

## Frontend — desarrollo local

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (genera dist/ con service worker)
npm run preview   # sirve el build para pruebas
```

## Backend — desarrollo local

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve   # API en http://localhost:8000
```

Ver `backend/SETUP.md` para el detalle de configuración.

## Características (heredadas de la base)

- PWA instalable (manifest + service worker con vite-plugin-pwa / Workbox)
- Offline-first: precache del app shell, cache de teselas (CacheFirst),
  contenidos en IndexedDB, datos semilla para la primera visita
- Directorio turístico geolocalizado (Leaflet) con filtros por categoría
- Multi-localidad: selector de pueblo (norte → sur), filtro de mapa/lista y
  recentrado del mapa por localidad — todo disponible offline
- Mapa con GPS en vivo, switch Mapa/Satélite, ruta con distancia y "Cómo llegar"
- Bilingüe ES/EN con persistencia de preferencia
- Chatbot asistente turístico offline (motor de reglas sobre datos locales)
- Web Push (VAPID) con notificación nativa y badge en vivo

## Roadmap

- **Fase 0 — Base:** clonar, limpiar, renombrar marca, correr en local. ✅
- **Fase 1 — Multi-localidad:** modelo `Localidad`, selector de pueblo, filtro
  por localidad en mapa y API. Cargar 2-3 pueblos reales. ✅
  (Cochrane, Puerto Río Tranquilo y Caleta Tortel; `/api/localidades`,
  selector offline-first en la PWA y CRUD de localidades en el CMS)
- **Fase 2 — Contenido:** poblar todas las localidades (atractivos, alojamiento,
  comida, servicios, emergencias, rutas) en ES/EN. ✅
  (9 localidades de Coyhaique a Villa O'Higgins, 67 lugares bilingües;
  los negocios no verificables van marcados "(ejemplo)" hasta la Fase 3)
- **Fase 2.5 — Contenido tramo norte (Coyhaique → Puerto Montt):** extender la
  cobertura por la Ruta 7 hacia el norte hasta el km 0 de la Carretera Austral,
  completando la ruta entera. Mismo patrón que la Fase 2 (localidades + lugares
  bilingües ES/EN; "(ejemplo)" para negocios no verificables). Incluye actualizar
  la identidad de la app a "Puerto Montt a Villa O'Higgins" al completarlo.
- **Fase 3 — Capa comercial:** fichas destacadas, planes de negocio, analítica.
- **Fase 4 — Publicación:** producción, dominio propio, PWA instalable, difusión.

## Conexión con backend

La capa `src/api/client.js` consume `GET /api/places` cuando `VITE_API_URL`
está definida (ver `frontend/.env.example`) y sincroniza a IndexedDB. Sin API o
sin conexión, la app funciona 100% con datos locales.
