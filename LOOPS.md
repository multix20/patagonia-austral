# Loops — cómo se usan en Patagonia Austral

Este documento complementa `CLAUDE.md`. Un **loop** son dos piezas: un
**disparador** (lo que lo enciende) y una **meta verificable** (lo que decide
cuándo parar). No es una automatización de ramas — el modelo decide qué hacer
en cada vuelta hasta cumplir la meta.

## Las dos herramientas de Claude Code

- **`/goal`** — loop **cerrado/limitado**. Úsalo cuando el criterio de éxito
  es objetivo y cuantificable (tests pasan, N fichas cargadas, build limpio).
  Es lo normal para trabajar sobre este repo. **Ojo: no está disponible en todos
  los entornos** — ver la tabla de la sección siguiente antes de usarlo.
- **`/loop`** — loop **abierto/ilimitado**, con intervalo de tiempo. Úsalo
  solo para tareas de mejora continua sin fin natural (monitoreo, research).
  **Nunca sobre `main` sin supervisión** en este repo — párralo tú cuando
  hayas revisado el resultado.

## ⚠ Dónde funciona cada cosa (comprobado el 5-ago-2026)

**Los comandos disponibles cambian según dónde corras Claude Code**, y este
proyecto se trabaja desde dos lados (local y sesión web, ver `CLAUDE.md`). Lo
verificado hasta ahora:

| | Claude Code local | Sesión web (Claude Code on the web) |
|---|---|---|
| `/goal` | disponible | **NO disponible** — comprobado listando las skills habilitadas |
| `/loop` | disponible | disponible |
| Salida a internet | sí | **NO** — la política de red del entorno rechaza el CONNECT |
| Backend corriendo (BD, tests) | sí | sí, pero hay que montarlo (receta en `ESTADO_Y_PENDIENTES.md`) |

Consecuencias prácticas, para no perder tiempo:

- **En la sesión web, pegar una plantilla con el prefijo `/goal` no dispara
  nada**: se lee como texto suelto y el modelo hace la primera parte y para.
- **El patrón sí funciona sin el comando.** Pega la misma plantilla **quitando
  el `/goal` del principio**. Lo que hace el trabajo no es la palabra mágica,
  son las dos piezas del encabezado de este documento: la meta y el criterio de
  término. Escritas en un mensaje normal cumplen igual — el "No pares hasta
  que…" es lo que evita que se entregue a medias.
- **Los `/loop` de research no sirven desde la web.** El caso 4 de más abajo
  necesita consultar sitios de SERNATUR y municipalidades, y desde la sesión web
  no hay salida a internet. Ese va sí o sí en local.
- Si alguna vez `/goal` aparece en la web, esta tabla queda vieja: **lo que
  manda es listar las skills disponibles en el momento**, no lo que diga acá.

## Regla de oro de este repo

**El agente que construye no se audita a sí mismo.** El agente `roadmap`
(`.claude/agents/roadmap.md`) hace el trabajo. El agente `verifier`
(`.claude/agents/verifier.md`) lo audita corriendo lint/build/tests él mismo,
no confiando en lo que diga `roadmap`. Todo `/goal` sobre código debe cerrar
pidiendo explícitamente que `verifier` dé el veredicto final, no `roadmap`.
**Esto aplica exista o no el comando**: si estás en la web y pegaste la
plantilla sin el prefijo, el criterio "(c) el agente verifier confirma…" sigue
siendo obligatorio — es la parte que no se puede saltar.

## Plantillas listas para usar (ejemplos reales del roadmap actual)

> **Cómo pegarlas.** En local, tal cual. **En la sesión web, sin el `/goal` del
> principio** (ver la tabla de arriba): el resto del texto va idéntico y funciona
> igual. Lo que hace el trabajo es el "No pares hasta que…", no el prefijo.

### 1. Siembra de fichas SERNATUR (Fase 3 — determinístico, fácil de verificar)

```
/goal usa el agente roadmap para avanzar la siembra de fichas siguiendo
scripts/sernatur/ y las reglas de Fase 3 en CLAUDE.md (un servicio publicado
por localidad y categoría, deduplicado, preliminar:true sin dato oficial).
No pares hasta que: (a) no queden localidades con cupos vacíos sin ficha
preliminar, (b) el reporte seleccion_gratis.csv se generó sin errores, y
(c) el agente verifier confirma lint+build+tests en verde y que no se
reintrodujeron los "(ejemplo)" purgados.
```

### 2. Reportes cerca — push (Fase 3→4, backend)

```
/goal implementa el push de "reporte cerca" sobre el worker de colas de
Fase 4 (ver pendiente en ESTADO_Y_PENDIENTES.md, sección Fase 3). Reusa
minishlink/web-push ya integrado. No pares hasta que: (a) exista un test
Feature nuevo que cubra el envío del push al crear un reporte dentro del
radio, (b) php artisan test pasa completo, y (c) verifier confirma que no
se rompió ReporteApiTest.php ni el resto de la suite.
```

### 3. Filtrar reportes por tramo/localidad en el mapa (frontend, UX)

```
/goal agrega filtro por tramo/localidad a la vista de reportes en el mapa
(frontend/src). Respeta offline-first (IndexedDB) y bilingüe (i18n.jsx ES/EN).
No pares hasta que: (a) npm run lint y npm run build pasen limpios, (b) el
filtro funciona probado en el navegador con al menos 2 localidades distintas,
y (c) verifier confirma que no quedaron strings sin traducir.
```

### 4. Research de contenido / monitoreo (bajo riesgo — loop abierto, sí aplica)

> **Este va sí o sí en Claude Code local.** Desde la sesión web no hay salida a
> internet, así que el loop no puede consultar SERNATUR ni las municipalidades:
> daría vueltas sin encontrar nada y reportaría cero cada hora.

```
/loop 60 minutos: revisa fuentes públicas nuevas (SERNATUR, municipalidades,
redes de negocios) para localidades con fichas "preliminar:true" y deja un
borrador de los datos de contacto encontrados en un archivo aparte
(no toques places.json directamente). Reporta cada vuelta cuántas fichas
preliminares quedaron resueltas.
```
Este es el único tipo de caso donde un `/loop` sin límite tiene sentido en
este repo: no toca código de producción, solo junta información para que tú
decidas qué entra.

## Lo que NO se debe dejar como loop largo sin supervisión

- Cualquier cambio a `backend/database` (migraciones) — riesgo de romper el
  schema en producción.
- Cualquier cambio a los flujos de pago/rate-limit de `/api/reportes`.
- Nada directo a `main` — todo pasa por PR + CI en verde (regla ya existente
  en `CLAUDE.md`), el loop trabaja en su rama, no salta el flujo.

## Costo

Cada `/goal` o `/loop` gasta cómputo de tu sesión de Claude Code. Para tareas
acotadas (siembra, un bug, un filtro) usa `/goal` — termina solo cuando
corresponde y no sigues pagando de más. Guarda `/loop` abierto solo para el
caso 4 de arriba, y páralo apenas tengas lo que necesitas.

**Lo barato es el criterio de término, no el comando.** Una meta con "No pares
hasta que…" bien escrita se detiene sola, tenga o no prefijo. Un `/loop` por
intervalo, en cambio, sigue despertando aunque no haya nada que hacer: si lo que
esperas es que termine algo puntual, no lo pongas a mirar cada 10 minutos —
pídelo como meta y déjalo cerrar.
