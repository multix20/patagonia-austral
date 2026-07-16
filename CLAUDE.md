# Patagonia Austral — contexto del proyecto

PWA de turismo **offline-first** de la Carretera Austral (Coyhaique a Villa
O'Higgins). **Proyecto personal/comercial propio** — NO se rige por bases de
licitación (nació como fork de `multix20/cochrane-turismo`, que sigue vivo y
desplegado por separado; no interferir con sus servicios).

## Stack y estructura

- `frontend/` — React 18 + Vite, PWA (vite-plugin-pwa/Workbox), IndexedDB,
  Leaflet, bilingüe ES/EN. Sin TypeScript. Lint: `npm run lint` (oxlint).
- `backend/` — Laravel (PHP 8.4) + Filament v3 (CMS en `/admin`), API pública
  `/api/places`, `/api/notices`, Web Push VAPID (`minishlink/web-push`).
- PostgreSQL 16. `docker-compose.prod.yml` (Caddy+SSL) para producción autoalojada.

## Deploy (producción actual — todo gratis)

| Pieza | Dónde | Clave |
|---|---|---|
| PWA | Netlify | `netlify.toml`; vars `VITE_API_URL`, `VITE_VAPID_PUBLIC_KEY` (build-time: redeploy al cambiarlas) |
| Backend | Render web service `patagonia-austral-api` | blueprint `render.yaml`; secretos con `sync: false` |
| PostgreSQL | Neon (externa) | `DB_URL` como secreto en Render, con `?sslmode=require` |

Guía completa: `DEPLOY.md`. Push a `main` = redeploy automático de Render y Netlify.

## Reglas del proyecto

- **Secretos NUNCA en el repo** (aprendido a la mala: hubo que rotar claves).
  APP_KEY, VAPID_PRIVATE_KEY, DB_URL y ADMIN_PASSWORD viven solo en dashboards.
- **Idioma**: código y docs en español; contenido de la app bilingüe ES/EN
  (diccionario en `frontend/src/i18n.jsx`).
- **Flujo git**: rama de trabajo → merge fast-forward a `main` → push (el push
  a `main` despliega). No crear PRs salvo pedido explícito.
- El usuario semilla `test@example.com` solo existe fuera de producción; el
  seeder lo elimina en producción y crea el admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Push: el permiso se pide al instalar la PWA (`appinstalled`) + red de
  seguridad al abrir instalada. No reintroducir botones de activación visibles.
- Los avisos se envían UNA vez (`notificado_en`); en Render free no corre el
  scheduler (avisos programados a futuro no se despachan solos).
- Antes de commitear frontend: `npm run build --prefix frontend` debe pasar.
- No tocar `frontend/dev-dist/` (artefacto regenerado; revertir si aparece en el diff).

## Estado y objetivos

Historial y decisiones: `ESTADO_Y_PENDIENTES.md`. Roadmap (README):
- ✅ Fase 0 base · ✅ deploy Netlify+Render+Neon
- ✅ Fase 1 — Multi-localidad (modelo `Localidad`, selector, filtros)
- ✅ Fase 2 — Contenido (9 localidades, 67 lugares, tramo Coyhaique→Villa O'Higgins)
- **SIGUIENTE**: resolver pendientes de UX de Fase 2 (ver `ESTADO_Y_PENDIENTES.md`:
  chatbot filtrado por localidad ← crítico; "Toda la ruta" ordenada por GPS;
  selector con búsqueda), luego Fase 3.
- Fase 3 — Capa comercial (fichas destacadas, planes, analítica)
- Fase 4 — Producción definitiva (dominio propio, S3, respaldos, monitoreo)

**Dato de negocio**: la ruta la recorren **100.000–150.000 turistas/año**
(dimensiona la audiencia para la capa comercial de Fase 3).

**Alcance futuro** (anotado, no inmediato): ampliar a **toda la Carretera Austral,
de Puerto Montt a Villa O'Higgins** (sumar el tramo norte por fases; hoy la app
dice "Coyhaique a Villa O'Higgins").

Para trabajo de roadmap, usar el agente `roadmap` (`.claude/agents/roadmap.md`).
