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
  y su UX (chatbot filtrado por localidad, "Toda la ruta" por GPS, selector con búsqueda)
- **SIGUIENTE**: Fase 2.5 — Contenido tramo norte (Coyhaique→Puerto Montt): sumar
  las localidades del norte de la Ruta 7 hasta el km 0 de la CA (Puerto Montt),
  pueblo por pueblo, y actualizar la identidad a "Puerto Montt a Villa O'Higgins".
  Va **antes** de la Fase 3. Detalle en `ESTADO_Y_PENDIENTES.md`.
- Fase 3 — Capa comercial (fichas destacadas, planes, analítica)
- Fase 4 — Producción definitiva (dominio propio, S3, respaldos, monitoreo)

**Datos de negocio**: ruta completa ~100.000–150.000 turistas/año (audiencia
amplia). Temporada alta 2026 en Aysén (Dic25–Mar26, fuente Red de Informadores
Turísticos): 16.998 personas (grupo de viaje), 6.357 atendidas en OIT.
**Cochrane es el destino #1 de la región por atenciones OIT (1.312)** → la zona
del proyecto es la más consultada de Aysén. Prov. Capitán Prat
(Cochrane/O'Higgins/Tortel) = 5.477 personas; pico ene–feb. Tortel solo 21
atenciones OIT pese a ser icónico → oportunidad: la app como "OIT digital" donde
no hay oficina fuerte. Detalle y desglose en `ESTADO_Y_PENDIENTES.md`.

**Negocios reales del fundador** (primeras fichas destacadas reales de Fase 3,
reemplazan los "(ejemplo)"): hamburguesería en el km 1020 (entre Caleta Tortel y
Cochrane) y un servicio de transporte (furgón 12 pax) + encomiendas Tortel↔Cochrane
(por lanzar). El transporte/encomiendas es además un caso real del problema de
conectividad que la app aborda.

**Fase 3 — idea central**: crowdsourcing tipo Waze (los viajeros reportan bencina,
cortes de camino, clima, barcazas) sobre el sistema de avisos, aplicando disciplina
de **PMF/APM** (segmento → validar problema → PMV mínimo → medir/pivotar; ojo con el
arranque en frío). Detalle en `.claude/agents/roadmap.md`.

**Contexto estratégico — Plan Ruta Austral** (MOP, anunciado 30-abr-2026;
fuente: mop.gob.cl). Inversión ~$800 mil millones CLP **2026–2030 enfocada en la
Región de Aysén** (244 km, límite regional→Lago Juncal): 150,4 km de pavimentación
definitiva, puentes Palena y Rosselot, **2 nuevas barcazas (lagos General Carrera y
O'Higgins)**, puerto Yungay. Contexto amplio: la Carretera Austral (1.058 km, Puerto
Montt→O'Higgins) está pavimentada al 58% (faltan 443,5 km). Viento a favor para el
producto — y las obras 2026–2030 caen **justo en Aysén, donde la app ya tiene todo
su contenido** → generan cortes/desvíos que agudizan el problema que el crowdsourcing
resuelve. (Ojo: es un plan regional de Aysén, NO pavimentar todo Puerto Montt→O'Higgins
para 2030.)

**Alcance norte — ahora es la Fase 2.5** (ya no es solo "futuro"): ampliar a **toda
la Carretera Austral, de Puerto Montt a Villa O'Higgins**, sumando el tramo norte
por fases (pueblo por pueblo) desde Coyhaique hasta el km 0 en Puerto Montt. Al
completarlo, la identidad de la app pasa de "Coyhaique a Villa O'Higgins" a
"Puerto Montt a Villa O'Higgins". Detalle en `ESTADO_Y_PENDIENTES.md` (Fase 2.5).

Para trabajo de roadmap, usar el agente `roadmap` (`.claude/agents/roadmap.md`).
