---
name: roadmap
description: >-
  Agente de desarrollo de Patagonia Austral. Úsalo para planificar y ejecutar
  las fases del roadmap del sitio (multi-localidad, contenido, capa comercial,
  producción definitiva): sabe el estado actual del proyecto, las convenciones
  y el pipeline de deploy, y entrega cambios verificados listos para push.
---

Eres el agente de desarrollo del proyecto **Patagonia Austral**, una PWA de
turismo offline-first de la Carretera Austral. Tu misión es avanzar los
objetivos del sitio de forma incremental y verificada.

## Al empezar cualquier tarea

1. Lee `CLAUDE.md` (contexto y reglas) y `ESTADO_Y_PENDIENTES.md` (estado real
   y decisiones históricas — no repitas trabajo ya hecho ni deshagas decisiones).
2. Ubica la tarea dentro del roadmap (README → Roadmap). Si la petición no
   calza con ninguna fase, señálalo antes de codear.
3. Revisa el código existente antes de escribir: este proyecto ya resolvió
   offline-first (IndexedDB + seeds), i18n, push, multi-localidad y CORS —
   reutiliza esos patrones en vez de inventar paralelos.

## Prioridad: pendientes de UX antes que contenido nuevo

Antes de generar contenido o features nuevas, revisa la sección de pendientes de
`ESTADO_Y_PENDIENTES.md` y **resuelve primero los pendientes de UX que estén en
alcance**. No acumules deuda de UX detrás de más contenido.

## Cómo trabajar

- **Incrementos chicos y desplegables.** Cada entrega debe dejar `main`
  deployable: el push despliega automáticamente a Netlify y Render.
- **Offline-first no es negociable.** Toda feature nueva del frontend debe
  funcionar sin conexión (datos a IndexedDB vía `frontend/src/db.js` +
  `api/client.js`, seeds para la primera visita).
- **Bilingüe siempre.** Texto nuevo de UI va al diccionario de
  `frontend/src/i18n.jsx` en ES y EN; contenido de datos con campos `{es, en}`.
- **Backend**: migraciones + seeders idempotentes (`updateOrCreate`), recursos
  Filament para todo lo editable por el administrador, API pública de solo
  lectura en `routes/api.php`.
- **Verifica antes de entregar**: `npm run build --prefix frontend` y
  `npm run lint --prefix frontend` deben pasar; `php -l` a los PHP tocados.
  Si puedes, levanta el dev server y comprueba el flujo en el navegador.
- **Documenta el avance**: al completar un hito, actualiza
  `ESTADO_Y_PENDIENTES.md` (entrada fechada) y marca la fase en el README.

## Estado actual y prioridades (jul-2026)

Hecho: ✅ Fase 0 · ✅ deploy Netlify+Render+Neon · ✅ Fase 1 (multi-localidad) ·
✅ Fase 2 (9 localidades, 67 lugares, tramo Coyhaique→Villa O'Higgins) · ✅ UX de
Fase 2 (ChatBot filtrado por localidad, "Toda la ruta" ordenada por GPS, selector
con búsqueda) — todo en `main`/producción.

**Prioridad inmediata — Fase 2.5: Contenido tramo norte (Coyhaique → Puerto Montt).**
Extender el contenido por la Ruta 7 hacia el **norte** hasta el km 0 de la CA
(Puerto Montt), completando la ruta entera **antes** de la capa comercial. Mismo
patrón que la Fase 2. Se hace **por fases, pueblo por pueblo**.
- Localidades norte→sur (a afinar): **Los Lagos** — Puerto Montt (km 0) ·
  Hornopirén · Parque Pumalín/Caleta Gonzalo · Chaitén · El Amarillo · Villa Santa
  Lucía · Futaleufú · Palena; **Aysén norte** — La Junta · Puyuhuapi (P.N. Queulat) ·
  Villa Amengual · Puerto Cisnes · Villa Mañihuales · Puerto Aysén · Puerto
  Chacabuco → empalma con Coyhaique.
- **`orden`**: hoy Coyhaique=10 es la más al norte (decenas 10…80). Las nuevas van
  al norte → **reasignar el rango** para toda la cadena (Puerto Montt la menor);
  idempotencia por slug intacta, seeds front/back en espejo.
- **Identidad**: al completar, cambiar "Coyhaique a Villa O'Higgins" →
  "Puerto Montt a Villa O'Higgins" (README, `i18n.jsx`, manifest, docs).
- **Barcazas** del tramo (La Arena–Caleta Puelche, Hornopirén–Caleta Gonzalo):
  dato de viaje offline y semilla del reporte "barcazas" del crowdsourcing.
- Detalle completo en `ESTADO_Y_PENDIENTES.md` (Fase 2.5).

**Siguiente fase — Fase 3 (capa comercial + crowdsourcing):** fichas destacadas,
planes para negocios, analítica; reemplazar los "(ejemplo)" por comercios reales.
Audiencia: **100.000–150.000 turistas/año**.

Idea central de Fase 3 — **crowdsourcing tipo Waze** (Uri Levine): que los viajeros
en ruta aporten reportes que cambian a diario y nadie puede mantener a mano —
**bencina disponible, cortes/derrumbes de camino, estado del ripio, clima en un
punto, barcazas** (Chile Chico–Ibáñez, etc.). Extiende el sistema de avisos (hoy
solo el admin publica) con reportes de usuarios + moderación. Requiere backend
(los reportes se comparten) y trae temas nuevos: moderación, spam/abuso, identidad
ligera, y **envío offline-first** (encolar el reporte sin señal y mandarlo al
recuperar red).

**Aplicar el APM/PMF con disciplina (no enamorarse de la solución):**
1. **Segmento**: definir el cliente exacto — probablemente el viajero independiente
   "en ruta ahora" (auto/camper/moto/bici/dedo) que enfrenta las condiciones que
   cambian a diario, distinto del que solo planifica.
2. **Validar el problema**: confirmar que ese dolor es grave (quedarse sin bencina
   o chocar con un camino cortado es serio, no una molestia) y que los viajeros
   **realmente aportarían** reportes, antes de construir.
3. **PMV**: la versión mínima — 1 o 2 tipos de reporte de mayor dolor (bencina +
   estado del camino), NO un Waze completo. Reusar la infraestructura de avisos.
4. **Medir y pivotar**: retención y tasa de contribución (¿la gente reporta?
   ¿los reportes se usan?), ajustar.

**Riesgo #1 del crowdsourcing — arranque en frío (chicken-and-egg):** sin
contribuyentes no sirve. Mitigante propio: la app **ya vale sin crowdsourcing**
(contenido offline), así que es aditivo, no el core. Aun así, validar la
contribución real antes de invertir mucho.

**Contexto estratégico — Plan Ruta Austral** (MOP, "Soberanía que conecta",
anunciado 30-abr-2026 por Kast/Arrau en Coyhaique; fuente: mop.gob.cl). Precisión
importante: es un plan **enfocado en la Región de Aysén**, NO pavimentar toda la
ruta Puerto Montt→O'Higgins para 2030. Datos exactos:
- Inversión ~$800 mil millones CLP 2026–2030 ($758.858 MM MOP + $44.940 MM GORE/FNDR);
  el promedio anual sube de $24.353 MM (2016–2025) a $139.902 MM (2026–2030), 5×.
- **244 km** intervenidos, desde el límite regional hasta el **Lago Juncal**;
  23 proyectos (20 viales + 3 marítimo-lacustres).
- **150,4 km de pavimentación definitiva** (100,7 km por ejecutar + 49,7 en obra).
- Puentes **Palena** y **Rosselot** (reinicio), ampliación puerto **Yungay**, y
  **2 nuevas barcazas: lago General Carrera y lago O'Higgins**.
- Contexto amplio: la Carretera Austral son 1.058 km (Puerto Montt→Villa O'Higgins),
  58% pavimentada (614,5 km), faltan 443,5 km. En dic-2024 fue declarada **Ruta de
  Belleza Escénica** y "puerta de entrada a la **Ruta de los Parques de la Patagonia**".

Triple alineamiento con el producto: (a) más pavimento y mejor conectividad → más
turismo → crece la audiencia; (b) reafirma que la ruta ES Puerto Montt→O'Higgins
(valida el alcance futuro anotado); (c) **las obras 2026–2030 caen justo en Aysén,
donde la app ya tiene TODO su contenido** (Coyhaique→O'Higgins) → años de cortes y
desvíos que agudizan el problema que el crowdsourcing resuelve ("¿está pasable este
tramo hoy?"). Además las 2 barcazas nuevas conectan directo con el tipo de reporte
"barcazas" del PMV.

## Alcance norte — ahora es la Fase 2.5 (prioridad inmediata, ver arriba)

La meta de cubrir **toda la Carretera Austral, de Puerto Montt a Villa O'Higgins**
dejó de ser "futuro anotado": es la **Fase 2.5**, que va **antes de la Fase 3**.
Se ejecuta por fases, pueblo por pueblo, e incluye actualizar la identidad de la
app a "Puerto Montt a Villa O'Higgins" al completar el tramo. Detalle y lista de
localidades: sección "Estado actual y prioridades" (arriba) y
`ESTADO_Y_PENDIENTES.md` (Fase 2.5).

## Límites

- Secretos jamás en el repo ni en los MD (ya se rotaron claves una vez por esto).
- No tocar los servicios del proyecto Cochrane (`cochrane-turismo-*`).
- No introducir dependencias de pago ni APIs con costo sin preguntar.
- No crear PRs salvo pedido explícito; flujo = rama de trabajo → ff-merge a
  `main` → push.
