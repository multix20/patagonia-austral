# Patagonia Austral — Roadmap Estratégico 2026–2027

> **Documento estratégico (vivo).** El registro operativo día a día está en
> `ESTADO_Y_PENDIENTES.md`; las convenciones y el estado técnico en `CLAUDE.md`.
> Este documento fija el **rumbo** y la **priorización**, no el detalle de cada tarea.
>
> **Principio rector (decidido jul-2026): _curar, no acumular._** El valor no es
> tener los ~4.000 servicios de SERNATUR de Aysén, sino los **correctos** + la
> **información viva**. Ver §3 y §13.

## Índice
1. Visión
2. Estado actual
3. Objetivos 2026–2027
4. Arquitectura (frontend)
5. ETL / Pipeline de datos
6. Frontend / UX
7. Mapa inteligente
8. IA / Asistente
9. CMS
10. Plataforma de datos / Infraestructura
11. Roadmap por sprints
12. Priorización
13. Riesgos
14. Ideas futuras

---

## 1. Visión

Ser la herramienta **offline-first de referencia** del viajero en la Carretera
Austral completa (Puerto Montt → Villa O'Higgins): saber **dónde dormir, comer y
cargar bencina**, y sobre todo **si el camino o la barcaza están pasables hoy** —
justo donde no hay señal ni una oficina de información turística fuerte. En una
frase: **la "OIT digital" de la Austral**.

**Apuesta estratégica.** El _moat_ **no es el directorio** — Google Maps y el
propio SERNATUR ya tienen todos los listados. El diferenciador es:
1. **Capa comercial local**: fichas destacadas y negocios reales que no están bien
   representados en las plataformas globales.
2. **Crowdsourcing tipo Waze**: condiciones que cambian a diario (bencina, cortes,
   ripio, clima, barcazas) que nadie mantiene a mano y Google no tiene para la Austral.

Todo sobre la base **offline-first** (la app ya vale sin conexión), que es lo que
hace usable el resto donde no hay señal.

---

## 2. Estado actual (jul-2026)

**Hecho:** Fases 0 → 2.5 completas y Fase 3 arrancada.
- **Cobertura**: 26 localidades, toda la Carretera Austral. Multi-localidad, i18n
  ES/EN, PWA offline (IndexedDB + Workbox), Web Push, mapa Leaflet.
- **Fase 3 en curso**: destacados (capa comercial base), **top 10 de alojamiento
  publicado** (11 localidades, selección exacta del pipeline), mapa (sincronizado
  con la lista, clustering, pin activo, "estás aquí" por radio, pines outdoor),
  ChatBot (Markdown + historial), pulido UX (análisis Figma **completo**).

**Fortalezas reales.** React + Vite + PWA offline sólida · Leaflet · scraper
SERNATUR funcional · flujo PR + CI en verde · deploy **gratis** (Netlify + Render
+ Neon).

**Gaps honestos (dónde duele de verdad):**
- **Sin infra always-on** → el crowdsourcing en tiempo real está **bloqueado** (Render
  free no corre worker/scheduler y se duerme). Es el cuello de botella #1 (ver §10).
- **Datos**: solo alojamiento; **comida pendiente**; localidades nuevas (Balmaceda,
  Raúl Marín) y varias del norte aún **sin servicios**.
- **Analítica: 0** — no medimos uso real, así que decidimos el PMF **a ciegas**.
- **Monetización: 0** — aún no cobramos nada.
- **Frontend**: `App.jsx` ya en **607 líneas** con lógica y UI mezcladas (deuda
  incipiente, no urgente). No hay `hooks/` ni `pages/`; `api/`, `db.js` y `push.js`
  ya son "servicios" de facto pero sin carpeta.
- **ETL**: herramienta de un solo uso, corre en local, sin logging/validación formales.

---

## 3. Objetivos 2026–2027

En orden de importancia estratégica:

1. **Salir de volar a ciegas** — analítica mínima y respetuosa para validar el PMF
   del viajero "en ruta ahora".
2. **Encender la capa comercial** — primeras fichas reales de pago (negocios del
   fundador + locales), no solo el directorio gratis.
3. **Lanzar el PMV de crowdsourcing** (bencina + estado de camino) — requiere la
   Fase 4 (infra always-on).
4. **Cobertura _útil_, no exhaustiva** — top 10 dormir + top 10 comer + servicios
   clave (bencina/salud/barcazas) por localidad ≈ **700–1.000 servicios curados**.
   **NO** cargar los ~4.000 de SERNATUR.
5. **Sostenibilidad** — infra que no se caiga y datos que no se pudran.

> **Métrica norte:** no "cantidad de servicios", sino **retención del viajero** y,
> cuando exista, **tasa de contribución** al crowdsourcing.

---

## 4. Arquitectura (frontend)

**Tu propuesta:** carpetas `hooks/`, `services/`, `pages/` y modularizar
`App.jsx`. Marcada 🔴 Alta.

**Mi lectura honesta: 🟡 Media, no Alta — e incremental.** `App.jsx` (607 líneas)
empieza a doler pero **no bloquea features hoy**; un refactor de arquitectura
grande antes de tener PMF es "procrastinación productiva". Que el refactor lo
**empuje una feature**, no un big-bang.

Plan pragmático (barato y sin regresiones):
- [ ] `services/` — mover `api/client.js`, `db.js`, `push.js` (ya son servicios).
- [ ] `hooks/` — extraer cuando se repita lógica: `usePush`, `useGeolocalizacion`,
      `useAvisos`, `useLocalidad` (hoy viven como `useEffect` sueltos en `App.jsx`).
- [ ] Partir `App.jsx` en componentes por sección (`Header`, `Lista`,
      `BarraCategorias`) **cuando toque tocarlos**.
- [ ] `pages/` **solo si** aparece routing real. Hoy es **una sola vista** — no forzar.

---

## 5. ETL / Pipeline de datos

**Tus ideas:** parser independiente, cache HTML, logging, validadores, SQLite
temporal.

**Mi lectura honesta:** es una herramienta que corres **pocas veces, en local, con
cientos de fichas** (no millones). Meterle infra pesada = **bajo retorno**. Separo:

**Vale la pena (calidad de datos):**
- [ ] **Validadores** — coords en rango, teléfono con formato, campos requeridos;
      evita basura en la BD.
- [ ] **Logging** simple — qué se extrajo / qué falló (hoy hay estados `OK/ERROR`;
      formalizarlo en un log).
- [ ] **Cache HTML** de fichas — evita re-scrapear y **respeta al servidor de
      SERNATUR** (buena ciudadanía).

**Sobra por ahora (over-engineering al volumen actual):**
- [ ] ~~SQLite temporal~~ / ~~parser independiente~~ — CSV + JSON alcanza de sobra.

**El foco real del ETL es de datos, no de infra:**
- [ ] **Sumar "dónde comer"** (`tipo_servicio=2`) con **top-N por localidad**
      (adaptar el paso 2: categoría `comida` + descripción base). Fuentes ya
      documentadas en `scripts/sernatur/README.md`.
- [ ] **Refresco periódico** (semestral) del alojamiento — contra datos que se pudren.

---

## 6. Frontend / UX

Prácticamente **al día** (el análisis de UX de Figma quedó **completo**: mapa
protagonista, pines outdoor, barra de categorías, sincronización lista↔mapa,
clustering, ChatBot con Markdown, PlaceDetail con CTA/compartir, selector con
highlight). Queda en backlog, sin urgencia:
- Selector por **km / mini-mapa de ruta** (bloqueado por dato de km por localidad).
- Card como **bottom-sheet con swipe**.
- Peso de la PWA y accesibilidad bajo control.

Prioridad: 🟢 Baja — ya está pulido.

---

## 7. Mapa inteligente

**Hecho:** sincronización lista↔mapa, clustering, pin activo con halo, "estás
aquí" por radio, pines estilo señalética.

**Futuro (ligado al crowdsourcing):** capa de **reportes en vivo** sobre el mapa
(bencina disponible, cortes, barcazas), con filtros por tipo de reporte y frescura
("hace 2 h"). Es la misma base de marcadores + el sistema de avisos extendido.

Prioridad: 🟡 Media — se activa **cuando llegue el crowdsourcing** (§10).

---

## 8. IA / Asistente

**Hoy:** motor de **reglas offline** (sin costo, sin red, funciona sin señal) con
Markdown e historial de sesión. Cumple bien su rol.

**Decisión estratégica:** **NO** meter un LLM con costo/red al _core_ offline —
rompería el diferenciador (la gracia es que funciona sin internet en plena ruta).

**Camino de mejora, en este orden:**
- [ ] Ampliar el motor de reglas (más intenciones, mejor _matching_) — barato y offline.
- [ ] _Si_ algún día se suma un LLM, que sea **opcional y online** (nunca requisito),
      y con modelos **Claude** (según `CLAUDE.md`). Ej.: redactar fichas en el CMS,
      no responder al viajero sin señal.

Prioridad: 🟢 Baja — ya cumple.

---

## 9. CMS (Filament)

**Hoy:** gestión de lugares/avisos/localidades, publicar, **destacar**, Web Push.

**Futuro para habilitar monetización y crowdsourcing:**
- [ ] **Analítica por ficha** (vistas, clics a llamar / cómo llegar) — insumo para
      venderle a un negocio "tu ficha tuvo N visitas".
- [ ] **Planes de destacado** (el flag `destacado` ya existe; falta el modelo de
      cobro/vigencia).
- [ ] **Moderación de reportes** de crowdsourcing (cuando exista): aprobar/rechazar,
      anti-spam, caducidad.

Prioridad: 🟡 Media — es lo que convierte tráfico en ingreso.

---

## 10. Plataforma de datos / Infraestructura (Fase 4)

**El gran desbloqueador.** Sacar el backend del plan **free de Render** a un host
**always-on**:
- [ ] VPS ~5–6 USD/mes (Hetzner/DigitalOcean) con el `docker-compose.prod.yml` ya
      existente (Caddy + SSL) → **backend + Postgres + worker de colas + scheduler**,
      sin dormirse.
- [ ] Habilita **avisos programados** (scheduler) y el **crowdsourcing en tiempo
      real** (worker de colas), hoy imposibles en free.
- [ ] Imágenes de fichas/reportes en **S3-compatible** (Cloudflare R2, egress gratis).
- [ ] **Sentry** (free) para errores antes de tener usuarios masivos.
- [ ] **Respaldos** del Postgres (dump + retención).

**NO hacer:** reescribir el stack (React/Laravel/Filament es el adecuado); ni
adelantar infra que aún no se usa.

Prioridad: 🔴 **Alta en cuanto se encienda el crowdsourcing en serio.** Es el
cuello de botella #1 de la Fase 3 "real".

---

## 11. Roadmap por sprints (propuesto)

Cada sprint deja `main` desplegable. Orden pensado para **monetizar y medir antes
de invertir en infra**.

### Sprint 1 — Contenido real + comercial (sin infra nueva)
- [ ] **Fichas reales del fundador** (hamburguesería km 1020, transporte/encomiendas
      Tortel↔Cochrane) como **destacados** — primeras fichas comerciales reales.
- [ ] **Comida curada top-10** (adaptar paso 2 del ETL) para las localidades principales.
- [ ] **Validadores + cache** en el ETL.
- [ ] Rellenar a un **mínimo útil** las localidades vacías (Balmaceda, Raúl Marín, norte).

### Sprint 2 — Medir + comercial
- [ ] **Analítica mínima** (privada, sin cookies invasivas): qué localidades/categorías
      se usan, instalaciones, uso offline. Salir de volar a ciegas.
- [ ] **CMS**: analítica por ficha (vistas/llamadas) + primeros **planes de destacado**.
- [ ] **Avisos segmentados por zona** (diseño ya listo en el backlog).

### Sprint 3 — Infra + crowdsourcing PMV
- [ ] **Fase 4**: backend always-on + scheduler + worker (§10).
- [ ] **PMV de crowdsourcing**: 1–2 tipos de reporte (**bencina** + **estado de
      camino**), **offline-first** (encolar sin señal y enviar al recuperar red).
- [ ] Medir **tasa de contribución** → decidir si se escala (más tipos de reporte).

---

## 12. Priorización (con el lente estratégico)

**🔴 Alta — mueven la aguja:**
- Fichas reales del fundador + capa comercial mínima (**primer ingreso**).
- Infra always-on / Fase 4 (**desbloquea todo lo de tiempo real**).
- Analítica mínima (**dejar de decidir a ciegas**).

**🟡 Media:**
- Comida curada + validadores del ETL.
- CMS: analítica por ficha + planes de destacado.
- Refactor **incremental** del frontend (`services/`, `hooks/`).
- Avisos segmentados por zona.

**🟢 Baja / explícitamente NO ahora:**
- **Cargar los ~4.000 servicios de SERNATUR** — decisión consciente de _no hacerlo_.
- SQLite/parser independiente en el ETL.
- LLM en el asistente del viajero.
- `pages/` / routing (hoy es una sola vista).

---

## 13. Riesgos

- **Arranque en frío del crowdsourcing** (sin contribuyentes no sirve). _Mitigante:_
  la app **ya vale sin él** (contenido offline), así que es aditivo, no el core.
- **Datos que se pudren** (teléfonos, cierres). _Mitigante:_ curar top-N + refresco
  semestral — **no** 4.000 fichas imposibles de mantener siendo uno solo.
- **Fundador en solitario → dispersión.** _Mitigante:_ este documento existe para
  **decir que no** a lo que no mueve la aguja (empezando por los 4.000 servicios).
- **Infra free se cae/duerme.** _Mitigante:_ Fase 4 antes de prometer tiempo real.
- **Dependencia de scraping de SERNATUR** (su maquetación puede cambiar). _Mitigante:_
  extracción en capas + cache HTML + validadores.

---

## 14. Ideas futuras (parking, sin compromiso)

- Crowdsourcing completo tipo Waze (clima puntual, barcazas en vivo).
- Reseñas / valoraciones de la comunidad (con moderación).
- Integración con las **2 barcazas nuevas** del Plan Ruta Austral (lagos General
  Carrera y O'Higgins) — encajan directo con el tipo de reporte "barcazas".
- Itinerarios / rutas sugeridas por días.
- Modos de viaje (auto / camper / moto / bici / dedo) con filtros propios.
