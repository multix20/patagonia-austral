# Brief de diseño — Sprint 1 (fichas comerciales reales)

> **Para qué es este documento.** Es el _prompt_ autocontenido para prototipar en
> **Claude Design** (o cualquier herramienta de mockups) **antes de codear**. Copia
> desde "① Contexto" hasta el final y pégalo en la sesión de diseño. Todo lo que
> hay acá refleja la app **real** ya desplegada: respeta estos tokens y anatomías
> para que el prototipo encaje sin reescribir la UI.

---

## Lectura crítica del orden propuesto (qué prototipar y qué no)

La recomendación del Sprint 1 traía tres cosas. No todas son trabajo de diseño:

| Ítem del Sprint 1 | ¿Se prototipa en Claude Design? | Por qué |
|---|---|---|
| **1. Fichas reales destacadas** (hamburguesería km 1020 + transporte/encomiendas Tortel↔Cochrane) | **SÍ — es el foco** | Hoy una ficha destacada usa los **mismos campos** que una informativa. Una ficha **comercial** necesita campos y jerarquía nuevos (horario, WhatsApp, precio, galería, CTA). Esto es 100% UX/UI. |
| **2. Comida curada** (`tipo_servicio=2` en el ETL) | Casi no | La categoría "Dónde comer" y su tarjeta **ya existen** (color coral, icono cubiertos). Es sobre todo ETL/backend; visualmente reusa lo que hay. Solo vale un mockup si la ficha de comida gana campos (menú/precio). |
| **3. Analítica mínima** | **NO** | Es dashboard/backend, no la app del turista. Fuera del alcance de un prototipo de UI de la PWA. |

**Conclusión:** el prototipo del Sprint 1 se centra en **la ficha comercial real y
su tarjeta en la lista**, más los **campos nuevos** que hoy no existen en el modelo.
Lo demás (comida ETL, analítica) no necesita Claude Design.

---

## ① Contexto del producto (pega desde aquí)

**Patagonia Austral** es una PWA de turismo **offline-first** de la **Carretera
Austral completa** (Puerto Montt → Villa O'Higgins, Chile). El usuario es un
viajero independiente en ruta (auto / camper / moto / bici / dedo), a menudo **sin
señal**. La app funciona guardada en el teléfono; todo el contenido está cacheado.

- **Plataforma:** PWA móvil. Diseñar para **teléfono, 390 × ~800 px**. En escritorio
  se muestra dentro de un **marco de teléfono** (borde negro de 10px, radio 36px,
  fondo de página `#2c3532`). Diseña el contenido a 390px de ancho.
- **Idioma:** **bilingüe ES/EN**, se alterna con un botón `ES/EN` en el header.
  Todo texto nuevo debe existir en ambos idiomas.
- **Sin fotos reales (hoy):** las fichas **no tienen foto**; la identidad visual se
  arma con el **color de la categoría + un icono grande**. Un objetivo del Sprint 1
  es evaluar si las fichas **comerciales** sí deberían admitir 1 foto/logo.
- **Tono visual:** outdoor/patagónico, limpio, señalética de parque nacional.
  Emblema local: el **huemul** (ciervo andino, símbolo de Aysén).

---

## ② Sistema de diseño (tokens reales — respétalos)

**Colores**
```
--verde:      #0f6e56   /* marca principal: header, chat, CTAs */
--verde-osc:  #085041   /* verde profundo: banners, hover */
--crema:      #f7f5f0   /* fondo de la app */
--tinta:      #1e2a28   /* texto principal */
--gris:       #6b7572   /* texto secundario / metadatos */
--borde:      #e2e0d8   /* bordes de tarjetas */
--acento:     #d85a30   /* naranja: badges, alertas */
--amarillo:   #f5a623
--claude:     #d97757   /* coral: FAB del chat + acento DESTACADO/comercial */
```

**Tipografía:** `Segoe UI` / system-ui (sin fuentes de pago). Títulos 700, cuerpo
400–600. Escala real: H1 18px, título de ficha 22px, nombre de tarjeta 15px,
cuerpo 14px, metadatos 11–12px.

**Formas:** tarjetas radio 14px; botones/píldoras 8–20px; iconos con esquinas
redondeadas (set tipo Lucide, trazo). Sombras suaves (`0 6px 20px rgba(0,0,0,.35)`
en flotantes).

**Categorías** (orden, color e icono — "dormir" y "comer" van primero porque es lo
que más busca el turista):

| clave | ES / EN | icono | color | fondo pastel |
|---|---|---|---|---|
| `alojamiento` | Dónde dormir / Where to sleep | `bed` | `#534AB7` | `#EEEDFE` |
| `comida` | Dónde comer / Where to eat | `utensils` | `#D85A30` | `#FAECE7` |
| `atractivo` | Qué visitar / What to visit | `mountain` | `#0F6E56` | `#E1F5EE` |
| `servicio` | Servicios / Services | `fuel` | `#185FA5` | `#E6F1FB` |
| `evento` | Eventos / Events | `calendar` | `#D4537E` | `#FBEAF0` |
| `emergencia` | Emergencias / Emergencies | `cross` | `#A32D2D` | `#FCEBEB` |

**Sello "Destacado":** píldora coral (`--claude`) con estrella, mayúsculas, 9px.
La tarjeta destacada tiene borde coral + fondo `#fffaf7` y **sube al inicio** de su
localidad.

---

## ③ Anatomía de la app (pantallas actuales — para que el prototipo encaje)

**Home** (de arriba a abajo):
1. **Header verde:** título "Patagonia Austral" + subtítulo "Carretera Austral ·
   Puerto Montt a Villa O'Higgins"; a la derecha: campanita de avisos (con badge
   naranja), botón `ES/EN`, píldora de estado "En línea / Sin conexión".
2. **Selector de localidad** con buscador (24 localidades; "Toda la ruta" por
   defecto, ordenada por cercanía GPS).
3. **Mapa** (Leaflet). Con una localidad elegida el mapa crece (56vh) y manda; en
   "Toda la ruta" es compacto y manda la lista agrupada por pueblo.
4. **Lista de tarjetas** de lugares (ver anatomía abajo).
5. **Barra de categorías inferior** (zona del pulgar): Todos + las 6 categorías,
   icono + etiqueta, scroll horizontal, tab activo con subrayado del color de la cat.
6. **FAB del chat** (coral, esquina inf. der.): abre el asistente turístico offline
   (huemul + spark alternando).

**Tarjeta de lugar (lista):** `[icono cuadrado con color de cat] [nombre + categoría
+ sello "guardado offline"] [chip de distancia gris]`. Si es `destacado`: borde
coral + sello estrella arriba del nombre.

**Ficha de lugar (detalle, pantalla completa):**
- **Cabecera:** degradado del color de la categoría (sin foto) con icono gigante
  translúcido, botón volver, título 22px en blanco.
- **Cuerpo:** etiqueta de categoría → párrafo de descripción → filas de dato
  (📍 cómo llegar · 🚗 distancia · ☎️ teléfono con llamada directa) → **acciones:
  "Cómo llegar" (CTA verde, ancho) + "Compartir"** → banda verde "disponible sin
  conexión".

**Otros:** panel de avisos municipales (bottom-sheet), toast, banner de instalar
PWA, tarjeta de push. No hay que rediseñarlos; existen como referencia de estilo.

---

## ④ Qué prototipar en el Sprint 1

### A. Ficha comercial real (lo principal)

Hoy la ficha destacada = ficha informativa + un sello. **Falta** una ficha pensada
para un **negocio real**. Prototipar la **ficha de un comercio destacado** con
**campos nuevos** (que aún NO existen en el modelo — decisión de diseño):

- **Horario** (abierto/cerrado ahora, con rango).
- **WhatsApp** como CTA primario (además de "Cómo llegar"). El público llama/escribe.
- Opcional a evaluar: **1 foto o logo**, **rango de precio** ($/$$/$$$), **redes**,
  **etiquetas de servicio** (ej. "acepta efectivo", "para llevar").
- Mantener **coherencia** con la ficha actual (mismo layout base, acento coral en vez
  de verde para lo comercial, para diferenciar contenido pagado de contenido público).

Prototipar **dos casos reales del fundador** (mismo componente, dos rubros):

1. **Hamburguesería — km 1020** (entre Caleta Tortel y Cochrane). Categoría `comida`.
   Foco: horario, ubicación en ruta (km), WhatsApp/llamar, "para llevar".
2. **Transporte + encomiendas Tortel ↔ Cochrane** (furgón 12 pax). Categoría
   `servicio` (o una sub-etiqueta "transporte"). Foco: **es un servicio, no un lugar
   fijo** → el reto de diseño es mostrar **ruta/horarios/tarifa/encomiendas** en una
   ficha que hoy asume "un punto en el mapa". Muy relevante: el propio problema de
   conectividad que la app resuelve.

> ⚠️ **Datos reales pendientes (los pone JP):** nombre exacto, descripción corta,
> ubicación/km, teléfono/WhatsApp y horario de cada negocio. En el prototipo usar
> _placeholders_ claramente marcados hasta tenerlos.

### B. Tarjeta comercial en la lista

Cómo se ve la tarjeta destacada de un **negocio** (vs. el sello genérico actual):
¿muestra horario "abierto ahora"? ¿WhatsApp directo desde la lista? ¿mini-thumbnail?
Debe seguir subiendo al inicio de su localidad y leerse como "patrocinado" sin
sentirse intrusivo.

### C. (Opcional) Entrada de "Dónde comer"

Solo si al diseñar la ficha comercial de la hamburguesería aparecen campos de comida
(menú corto, precio, especialidad). Si no, la categoría comida ya está resuelta.

---

## ⑤ Entregables esperados del prototipo

1. **Ficha comercial** (los 2 casos: comida y transporte/encomiendas), estados
   ES y EN, con los campos nuevos ubicados en la jerarquía.
2. **Tarjeta comercial** en la lista (normal y "abierto ahora").
3. Notación de **qué campos nuevos** implica cada decisión (para traducirlos luego a
   migración + Filament + API + seed). Ej.: `horario`, `whatsapp`, `precio`, `foto`.
4. Todo dentro del **marco de 390px**, coherente con los tokens de §②.

## No negociable (recordar en el prototipo)

- Móvil primero, 390px, marco de teléfono en desktop.
- Bilingüe ES/EN en todo texto.
- Offline-first: nada que dependa de estar online (sin mapas externos de pago, sin
  llamadas a APIs en vivo para render base).
- Coherencia con el sistema de diseño actual; el **coral `--claude`** es el acento de
  lo comercial/destacado, el **verde `--verde`** el de lo público/informativo.
