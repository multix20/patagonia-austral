# Ramas archivadas — limpieza del 29-jul-2026

Se borraron del remoto las **27 ramas de trabajo** que quedaban vivas después de
fusionar el PR #36. Antes de borrar se verificó, rama por rama, que **ninguna
aportaba contenido que `main` no tuviera ya**:

- **20 ramas** las certificó `git branch --merged` (fusionadas y punto).
- **6 ramas** aparecían como "no fusionadas" por el rebase del flujo de PR, pero
  `git cherry` —que compara el *parche*, no el SHA— confirmó que todos sus
  commits ya estaban en `main`.
- **1 rama** (`claude/minimalist-app-buttons-l4cxsq`) **no tiene ancestro común**
  con `main`: quedó colgando de una reescritura de historia anterior. Se revisó
  archivo por archivo — todo su contenido está en `main` en versión más nueva; lo
  único que ella tenía y `main` no eran las versiones viejas de esos mismos
  archivos. Los 12 lugares de la Fase 2 que "faltan" son exactamente los
  `(ejemplo)` que se quitaron a propósito en la pasada de "solo datos reales".

## Para revivir cualquiera

```bash
git push origin <sha>:refs/heads/<rama>
```

Funciona mientras GitHub conserve el objeto (semanas, no siempre). Esta tabla
existe justamente porque sin el SHA no hay forma de pedirlo.

## Ramas borradas

| Rama | SHA | Último commit |
|---|---|---|
| `claude/alojamiento-reportes-16tjfd` | `c64d421` | 2026-07-21 · Roadmap: refleja el giro de Fase 3 a siembra gratis |
| `claude/backlog-avisos-zona` | `dd5fa68` | 2026-07-21 · Backlog: avisos segmentados por zona (diseño) y avisos de actualizaciones |
| `claude/chatbot-markdown` | `1bdf035` | 2026-07-21 · ChatBot: Markdown en mensajes, historial en sesión e input sin autocorrección |
| `claude/contrast-city-highlighting-5ybf4r` | `a4b6d11` | 2026-07-26 · Mapa: Ruta 7 protagonista (halo + más cuerpo) y fix tramo Yungay |
| `claude/cosmetic-service-data-updates-6sq70v` | `d23ccc5` | 2026-07-28 · Traspaso: capacidad de contenido, estado de la rama y receta de pruebas locales |
| `claude/crowdsourcing-pmv-merge-iib4zg` | `f73defb` | 2026-07-28 · Traspaso: capacidad de contenido, estado de la rama y receta de pruebas locales |
| `claude/fase3-destacados` | `ffd9bbf` | 2026-07-21 · Docs: fija el flujo de trabajo (monorepo + local/web) en CLAUDE.md |
| `claude/fix-migracion-zoom-localidades` | `51f2e0b` | 2026-07-21 · Fix: agrega columna zoom a localidades e ignora dato fuente SERNATUR |
| `claude/flujo-pr-y-ci` | `b0a71e0` | 2026-07-20 · Adopta flujo de PR y añade CI (GitHub Actions) |
| `claude/fotos-r2` | `c5c44ba` | 2026-07-29 · Despliegue: los dos tropiezos de R2 que faltaba avisar |
| `claude/fuentes-datos-sernatur` | `70d2858` | 2026-07-22 · Documenta fuentes SERNATUR (alojamiento/comida) y prepara "dónde comer" |
| `claude/localidades-y-top20` | `c34a2e5` | 2026-07-22 · Mantener top 10 por localidad (revierte top 20); PR queda solo con localidades |
| `claude/mapa-clustering` | `93f45d1` | 2026-07-21 · UX: clustering de pines en el mapa (agrupa zonas densas) |
| `claude/mapa-sincronizado-lista` | `4d1eeb8` | 2026-07-21 · UX: mapa sincronizado con la lista (sigue y resalta el lugar activo) |
| `claude/mejorar-mapa-nitidez-l2bdox` | `4e56046` | 2026-07-24 · Mapa: fix etiquetas, capa Mapa/Satélite con más contraste; chatbot por localidad; coords desde Google Maps |
| `claude/minimalist-app-buttons-l4cxsq` | `95af9a4` | 2026-07-17 · Estado: pendientes de UX de Fase 2 marcados como resueltos (14-jul-2026) |
| `claude/placedetail-cta` | `54936c2` | 2026-07-21 · PlaceDetail: CTA "Cómo llegar" prominente, icono grande y botón compartir |
| `claude/plan-inversion` | `d067765` | 2026-07-29 · Plan de inversión: en qué orden gastar, y por qué ese orden |
| `claude/publicar-top-alojamientos` | `563a113` | 2026-07-22 · Migración publica la selección EXACTA del pipeline (102 ids del JSON) |
| `claude/roadmap-estrategico` | `e20d133` | 2026-07-23 · Roadmap estratégico 2026–2027 (ROADMAP.md) |
| `claude/selector-mejoras` | `a9a2bd1` | 2026-07-22 · Mapa: pin activo con halo pulsante y "estás aquí" por radio de localidad |
| `claude/sernatur-pwa-data-extraction-tez4qv` | `d553f25` | 2026-07-20 · Script 2: reubica coordenadas placeholder de SERNATUR al centro del pueblo |
| `claude/session-context-p6sogr` | `9832bcf` | 2026-07-20 · Chatbot: icono animado del huemul (emblema de Aysen) que aparece y desaparece |
| `claude/session-vd2wa4` | `1f1b65c` | 2026-07-21 · UX push iOS: tarjeta única "¿Quieres recibir avisos?" (respaldo iOS/Android) |
| `claude/ux-mapa-primero` | `e511136` | 2026-07-21 · UX: el mapa protagonista, pines outdoor y barra de categorías inferior |
| `claude/ux-pulido` | `6998693` | 2026-07-21 · UX: pulido header, card, FAB y tab activo (análisis de UX) |
| `claude/ux-ui-nuevas-tareas-snw9j0` | `c50bcb1` | 2026-07-24 · feat(mapa): destaca la Ruta 7 real y quita las líneas rectas entre pueblos |
