# Plan de 20 días — la campaña de correos

Veinte días dedicados a esto, con el calendario ya resuelto para no decidirlo
cada mañana. Este archivo dice **cuándo y cuánto**; el porqué de cada frase está
en `POSICIONAMIENTO.md` y el instructivo completo en `README.md`. Los correos
listos para copiar, en `ola1-por-comuna.md` y `correo-2-negocios.md`.

---

## Lo que 20 días alcanzan, y lo que no

Conviene fijarlo antes de empezar, porque el día 20 va a haber que leer un número
y decidir si la campaña sirvió.

**Lo que sí queda al día 20:**

- Los 14 correos municipales mandados y respondidos.
- Los siete rubros de la ola 2 mandados, con su recordatorio.
- Las fichas de quien contestó, corregidas y sin `preliminar`.
- El embudo medido contra una línea base limpia (aperturas → fichas vistas →
  contactos).
- **La lista de quién no contesta**, que también es dato: esas fichas se quedan
  preliminares y sin teléfono, y eso decide dónde buscar por otra vía.

**Lo que no va a estar, y no es un fracaso:**

- **El efecto completo.** Una oficina municipal contesta en semanas, no en días;
  varias van a responder después del día 20 y hay que seguir atendiéndolas.
- **"Contactos a un negocio" en volumen.** Ese número necesita viajeros, y la
  difusión al viajero es la fase **siguiente** — va después de la campaña
  justamente porque anunciar sobre fichas preliminares gasta la primera
  impresión. Lo que se lea el día 20 es **piso, no resultado**.

## La trampa de obsesionarse: el techo no es el esfuerzo

El límite de esta campaña **no** es cuánto se trabaja: es la reputación de un
buzón nuevo. Sobre ~20 correos al día, el dominio empieza a verse como spam y
entonces los correos siguen saliendo pero dejan de llegar — que es el peor de los
fallos porque no avisa. Así que veinte días de dedicación **no pueden significar
mandar más por día**. Significan otras tres cosas, y ahí sí no hay techo:

1. **Contestar el mismo día.** Es la parte del argumento que ninguna plataforma
   grande puede copiar: quien responde vive en la ruta y corrige la ficha esa
   tarde.
2. **Mirar la ficha antes de nombrarla.** Un correo que dice "su ficha ya está
   publicada" apuntando a una descripción de plantilla pierde en el primer clic.
3. **Que cada respuesta mejore el correo siguiente.** Por eso las tandas van
   escalonadas y no todas el mismo día.

---

## El día tipo, en este orden

Tres bloques, y el orden importa:

1. **Responder** lo que llegó (correo y WhatsApp). Siempre primero, aunque quede
   sin mandarse la tanda del día. Una respuesta tardía convierte al interesado en
   alguien que ya se olvidó.
2. **Aplicar** en el CMS: propuestas recibidas (`/admin` → Propuestas, revisar el
   ANTES/DESPUÉS), correcciones escritas en el cuerpo del correo, fotos, y las
   bajas de quien pidió no aparecer (`publicado: false`, nunca borrar).
3. **Mandar** la tanda del día y anotar `enviado_en` en `contactos.csv`. El CMS
   **no** sabe a quién le escribiste —su estado `enviada` se pone al generar el
   enlace, no al mandarlo—, así que el registro de envío es el CSV y lo llevas tú.

**Días de la semana.** Un correo institucional que llega viernes o sábado se lee
el lunes, enterrado. Los envíos **municipales** van martes, miércoles o jueves; si
un día de envío de la tabla cae fin de semana, se corre al martes siguiente. Los
días de responder y curar no se corren nunca: si llegó una respuesta el domingo,
se contesta el domingo.

---

## El calendario

### Días 1–2 · Armar. No sale ningún correo.

| Día | Qué |
|---|---|
| 1 | **mail-tester** desde `contacto@rutaaustral.cl` (`DEPLOY.md` §2.4.1, paso 8). **Bajo 8/10 no se manda nada**: se arregla SPF/DKIM/DMARC primero. Y la curaduría que la campaña va a exponer: la **ficha duplicada de Puerto Aysén**, los alojamientos publicados de más en esa localidad (rige **uno por localidad y categoría**) y los nombres que quedaron en MAYÚSCULAS del volcado SERNATUR |
| 2 | **Analítica en cero** (`/admin` → Analítica → "Poner en cero", con fecha de ayer) y anotar la fecha en la tabla del final. Probar desde el teléfono `rutaaustral.cl/?c=muni` y un `?c=oit-cochrane`, y verificar que aparezcan en "Por dónde llegaron". Bajar la **Lista de la campaña** desde `/admin` → Lugares. Buscar las 14 direcciones municipales en los sitios institucionales |

> **Puerta — PASADA el 1-sep-2026 con 10/10.** Si mail-tester no da 8/10, el día
> 3 no manda: se arregla y el calendario entero corre. Un buzón quemado no se
> recupera dentro de estos 20 días. **Ya no aplica**: SPF, DKIM y DMARC salieron
> los tres en verde, sin listas negras y con SpamAssassin conforme sobre el texto
> real del correo a Tortel. Detalle en `DEPLOY.md` §2.4.1, paso 8.

### Días 3–9 · Ola 1 — las 14 municipalidades

Van escalonadas a propósito: la tanda 1 es tu propia zona, y sus respuestas se
citan por nombre en las que siguen.

| Día | Tanda | Comunas | Correos |
|---|---|---|---|
| 3 | 1 — Capitán Prat | Tortel · Cochrane · O'Higgins | 3 |
| 4 | 2 — las vecinas del lago | Chile Chico · Río Ibáñez | 2 |
| 5 | 3a | Cisnes · Lago Verde · Aysén · Chaitén | 4 |
| 6 | 3b | Futaleufú · Palena · Hualaihué | 3 |

> **Chaitén va en la tanda 3a por reparto de carga, no por región**: es de Los
> Lagos, como las tres del día 6. Se dice acá porque el correo de Chaitén nombra
> cuatro localidades (Chaitén, El Amarillo, Villa Santa Lucía y Caleta Gonzalo) y
> equivocarse de región en ese es de los errores que no se perdonan.
| 9 | 4 — las grandes | Coyhaique · Puerto Montt | 2 |

La tanda 4 va al final **con la región ya respondida**: son las oficinas más
lentas y las que menos necesitan la app, así que se mueven solo si el correo llega
con respaldo. A cada comuna se le manda **el QR de su oficina** (`qr/oit-*.svg`),
que es la razón por la que va a querer contestar: ve en sus propios números
cuánta gente instaló la guía en su mesón.

### Días 7–8 · Ola 2 arranca — rubro 1

| Día | Qué |
|---|---|
| 7 | **Alojamiento**, empezando por las localidades cuyo municipio ya respondió: ese correo deja de ser frío ("hablé con la municipalidad") |
| 8 | **Alojamiento**, el resto. Tope ~20 al día |

### Día 10 · Corte, recordatorio y la primera decisión

- **Recordatorio** a quien no respondió de las tandas 1–3 (el bloque
  "Recordatorio" de `correo-1-municipios.md`), con el mismo código de su ola.
- **La puerta de decisión** (`POSICIONAMIENTO.md` §8). **Si responde menos de 1
  de cada 4 comunas, se reescribe el correo antes de seguir con los rubros que
  faltan.** No se manda más del mismo texto esperando que cambie: si no funcionó
  en catorce municipalidades, no va a funcionar en la quince.

  **Y se mide distinto en cada ola, porque el dato no está en el mismo lado.** La
  ola 1 **no** se cuenta con "propuestas sobre enlaces mandados": las comunas
  reciben `?c=muni`, no un enlace personal, así que el CMS no sabe nada de ellas.
  Su tasa es a mano, en el buzón, anotada en el CSV. La del CMS (`/admin` →
  Propuestas) vale para la **ola 2**, que sí lleva enlace personal.
- Mirar también **aperturas vs fichas vistas**: si menos de la mitad de quien
  abre llega a ver una ficha, el problema no es el correo sino la primera
  pantalla, y eso se arregla en la app, no en el texto.

### Días 11–17 · Ola 2 — los rubros 2 a 7

> **Lo que puede romper estos días no es el calendario: es la columna `correo`.**
> Un día de la ola 2 vale lo que valga la lista del día 2. Si un rubro tiene tres
> fichas con correo del dueño, ese día son tres correos y no hay nada que
> arreglar — pero conviene saberlo el día 2, mirando cuántas filas traen correo
> por rubro, y no el día 11 con la tanda a medio armar.

Uno por día, en el orden de `correo-2-negocios.md`. El orden no es arbitrario: va
del dato que más envejece al que menos.

| Día | Rubro | El dato que se pide |
|---|---|---|
| 11 | Gastronomía | **Horario**, y si atiende fuera de temporada |
| 12 | Gastronomía (resto) | — |
| 13 | Combustible y mecánica | Horario y **si aceptan tarjeta o solo efectivo** |
| 14 | Transporte y encomiendas | **Días y hora de salida**, dónde para |
| 15 | Barcazas y navieras | Confirmar zarpes y **tarifa con su fecha** — acá ya hay dato cargado, se pide confirmación |
| 16 | Guías, tour operadores y arriendos | Temporada, reserva previa, punto de encuentro |
| 17 | Artesanía y comercio local | Horario y qué venden de verdad |

A **salud y emergencias no se les escribe** como negocio: esas fichas se
confirman con la municipalidad en la ola 1, y no se califican.

### Días 18–20 · Cerrar

| Día | Qué |
|---|---|
| 18 | **Recordatorio de la ola 2** a los rubros 1–3, que ya llevan más de una semana |
| 19 | **Curar todo lo que llegó**: aplicar las propuestas pendientes, sacar `preliminar` de lo confirmado, despublicar lo que pidieron dar de baja, cargar las fotos que llegaron |
| 20 | **Leer el embudo** con la ventana desde el día 2 y escribir el resultado en la tabla del final. Decidir si la difusión al viajero arranca o si falta otra vuelta de datos |

---

## Lo que NO se hace en estos 20 días

- **No arranca la difusión al viajero** (volantes, redes, prensa). Va después,
  cuando lo que se anuncie esté confirmado. Anunciar sobre fichas preliminares
  gasta la única primera impresión que hay.
- **No se agregan funcionalidades.** Lo único que se toca del código es lo que la
  campaña necesita: un canal nuevo en `Interaccion::CANALES` (y **desplegado
  antes** de repartir su enlace), o la corrección de una ficha.
- **No se publican recuentos de fichas** en ningún correo. Cambian cada semana y
  el número escrito queda mintiendo.
- **No se manda con adjuntos, ni en copia oculta, ni con acortadores.** Las
  reglas de entregabilidad están en `README.md` §3 y son de llegar, no de estilo.

---

## La bitácora

Se llena a mano, un renglón por día. Es lo que permite el día 20 leer una
tendencia en vez de una sensación.

| Día | Fecha | Mandados | Respuestas | Propuestas aplicadas | Nota |
|---|---|---|---|---|---|
| 1 | 1-sep-2026 | 0 | — | — | **mail-tester: 10/10** ✅ |
| 2 |  | 0 | — | — | analítica en cero el: ___ |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |
| 5 |  |  |  |  |  |
| 6 |  |  |  |  |  |
| 7 |  |  |  |  |  |
| 8 |  |  |  |  |  |
| 9 |  |  |  |  |  |
| 10 |  |  |  |  | comunas que respondieron: ___ /14 |
| 11 |  |  |  |  |  |
| 12 |  |  |  |  |  |
| 13 |  |  |  |  |  |
| 14 |  |  |  |  |  |
| 15 |  |  |  |  |  |
| 16 |  |  |  |  |  |
| 17 |  |  |  |  |  |
| 18 |  |  |  |  |  |
| 19 |  |  |  |  |  |
| 20 |  |  |  |  | aperturas ___ · fichas vistas ___ · contactos ___ |

## Después del día 20

Tres cosas quedan abiertas y hay que seguirlas, aunque la campaña "termine":

1. **Las respuestas atrasadas.** Siguen llegando semanas después y se atienden
   igual: el mismo día, con la ficha corregida.
2. **Los que no contestaron.** Su ficha queda `preliminar` sin teléfono. La vía
   siguiente no es otro correo: es el mesón de la OIT con su QR, o pasar en
   persona — que en esta ruta es una ventaja que nadie más tiene.
3. **La difusión al viajero**, que arranca recién acá y con la analítica ya
   corriendo. Plan y canales en `ESTADO_Y_PENDIENTES.md` → "Publicitar la app".
