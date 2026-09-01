# Campaña de correos — instructivo de envío

Los correos que convierten las fichas `preliminar` en dato real. Le escriben a
**quien tiene el dato**: encargadas de turismo municipal y dueños de servicios de
la ruta.

- **Qué se dice y por qué**: `POSICIONAMIENTO.md` (leerlo antes de tocar el copy).
- **Los textos**: `correo-1-municipios.md`, `correo-2-negocios.md`.
- **A quién**: `contactos.csv`, que **no está en el repo** (ver §5).
- **Cuándo**: `plan-20-dias.md`, el calendario día por día.
- **Ya resueltos**: `ola1-por-comuna.md`, los 14 correos municipales listos
  para copiar, con las localidades de cada comuna y su QR ya escritos.

> **Esta campaña decide el producto.** No es difusión: es la que consigue el
> teléfono que contesta. La difusión al viajero va **después**, cuando lo que se
> anuncie esté confirmado.

---

## 1. Antes de mandar el primer correo (media hora, en este orden)

1. **Medir la entregabilidad** con [mail-tester](https://www.mail-tester.com/):
   mandar un correo real desde `contacto@rutaaustral.cl` a la dirección que da el
   sitio y mirar el puntaje (`DEPLOY.md` §2.4.1, paso 8). **Menos de 8/10 = no se
   manda nada**: se arregla SPF/DKIM/DMARC o se migra el buzón. Un correo que sale
   pero cae en la carpeta de spam de una cuenta municipal falla igual que uno que
   rebota, solo que sin avisar — y quema la dirección para siempre.
2. **Poner la analítica en cero**: `/admin` → Analítica → Interacciones → "Poner
   en cero", con la fecha de ayer. Si no, la campaña se mide contra meses de
   pruebas propias. Anotar la fecha de corte acá abajo, en §6.
3. **El QR de cada oficina.** `frontend/public/qr/` tiene uno por localidad
   (`oit-cochrane.svg` → `rutaaustral.cl/?c=oit-cochrane`), más los de los
   canales que se imprimen. Se regeneran con
   `python frontend/scripts/generar-qr.py`.

   Al escribirle a una comuna, se le manda **el de su oficina**: así ese
   municipio ve en sus propios números cuánta gente instaló la guía en su mesón
   — y esa es la razón por la que va a querer ponerlo.

4. **Probar los enlaces con código**: abrir `https://rutaaustral.cl/?c=muni` en el
   teléfono, esperar medio minuto y ver que aparezca en Analítica → "Por dónde
   llegaron". Si no aparece, el código no está en `Interaccion::CANALES` y ese
   canal se va a mandar sin medir.
5. **Generar la lista de la ola 2**, sin copiar enlaces a mano.

   **Desde el teléfono:** `/admin` → Lugares → botón **«Lista de la campaña»**.
   Elige categoría, localidad o solo las fichas sin teléfono, y descarga el CSV.
   Es la única salida válida para este archivo: lleva los enlaces personales,
   que son credenciales, y el repo es público —así que **no** puede salir por un
   artefacto ni por un log de GitHub Actions—.

   **Desde el PC**, lo mismo por consola:

   ```bash
   php artisan campana:contactos --cat=alojamiento --salida=docs/campana/contactos.csv
   ```

   Saca una fila por ficha publicada con **su** enlace personal ya pegado al
   lado, en las columnas de `contactos.ejemplo.csv`. El separador es **`;`**,
   que es lo que Excel espera en configuración regional española: con comas se
   abre todo apilado en la primera columna.

   La columna **`correo`** sale del campo «Correo del dueño» de la ficha, que se
   carga en el CMS o lo trae el pipeline. **Una celda vacía ahí es la lista de a
   quién todavía no se le puede escribir**, y es lo que conviene mirar primero. Queda por llenar el correo
   del dueño, que no está en la base: sale de los pipelines de carga.

   - `--sin-telefono` deja solo las fichas que la campaña existe para arreglar.
   - `--localidad=cochrane` acota a un pueblo; `--seco` muestra la lista sin
     crear ninguna invitación.
   - Correrlo de nuevo **reusa** los enlaces ya creados: no genera dos para el
     mismo negocio.

   Hacerlo a mano desde `/admin` → Lugares → **"Enlace para actualizar"** sigue
   sirviendo para un caso suelto, pero para una tanda no: es donde se cuela el
   error caro —pegar el enlace de otro negocio, que le da acceso a editar una
   ficha ajena—. El comando saca el nombre y el enlace de la misma consulta, así
   que no se pueden cruzar.
6. **Mirar la ficha antes de nombrarla en el correo.** Si el correo dice "su
   ficha ya está publicada" y la ficha tiene el pin en el centro del pueblo y una
   descripción de plantilla, el remitente pierde en el primer clic.

## 2. Las olas

| Ola | A quién | Texto | Código del enlace | Cuándo |
|---|---|---|---|---|
| 1 | Encargadas de turismo municipal (una por comuna, no por localidad) | `correo-1-municipios.md` | `?c=muni` | Día 0 |
| 2 | Dueños de servicios con ficha publicada, **por rubro** | `correo-2-negocios.md` | `?c=negocio` + su enlace personal | Día 1–3 |
| 3 | Recordatorio a quien no respondió | El bloque "Recordatorio" de cada archivo | El mismo de su ola | Día 10 |

El «Día 0» de esa tabla es el primer día de **envío**, que en
`plan-20-dias.md` cae en el día 3: los dos primeros se van en preparar. Ese
archivo es el que manda sobre las fechas; esta tabla dice el orden.

La ola 2 no sale de una vez: va **por rubro**, en el orden de la tabla de
`correo-2-negocios.md` (alojamiento → gastronomía → combustible → transporte →
barcazas → guías → comercio). Dos razones prácticas: el buzón es nuevo y no
aguanta cien correos en un día, y las respuestas del primer rubro corrigen el
texto del siguiente antes de gastarlo. A **salud y emergencias no se les escribe**
como negocio: esas fichas se confirman con la municipalidad en la ola 1.

La ola 1 va primero **a propósito**: si la encargada de turismo ya conoce el
proyecto, el correo al dueño del hospedaje deja de ser frío ("hablé con la
municipalidad") y la tasa de respuesta cambia por completo.

**Quién no respondió sale del CSV, no del CMS.** El estado `enviada` del CMS se
pone al **generar** el enlace, no al mandarlo —bajar la lista de una categoría
entera marca de golpe decenas de fichas—, así que esa pantalla no sabe a quién
le escribiste. El registro de envío es el CSV: las columnas `enviado_en` y
`recordado_en`, que llenas tú. El CMS sabe lo otro, que es lo que de verdad le
consta: si el dueño **respondió**.

## 3. Reglas de envío (son de entregabilidad, no de estilo)

- **Uno a uno, personalizado.** Nada de BCC con 30 direcciones: es la forma más
  rápida de que un buzón nuevo quede marcado como spam.
- **Máximo ~20 al día** los primeros días, subiendo de a poco. El dominio es
  nuevo y no tiene reputación todavía.
- **Sin adjuntos y sin imágenes.** Texto plano o casi. Un PDF adjunto en un
  correo frío institucional multiplica el riesgo de filtro.
- **Un solo enlace visible** por correo (dos en el de negocios: la app y su
  ficha). Tres enlaces cortos y un logo es la firma clásica de un boletín.
- **Sin acortadores** (`bit.ly` y compañía). El dominio propio es justamente lo
  que hace que el enlace se pueda dictar por teléfono y no parezca phishing.
- **Asunto en minúscula sensata, sin signos de exclamación, sin "GRATIS".**
- **Responder desde el mismo buzón** y rápido: una respuesta ese mismo día es
  parte del argumento (ver `POSICIONAMIENTO.md` §10).

## 4. Qué hacer con cada respuesta

| Lo que llega | Qué se hace | Plazo |
|---|---|---|
| Correcciones escritas en el cuerpo del correo | Editar la ficha en el CMS, sacar `preliminar`, responder "ya está arriba" con el enlace a su localidad | Mismo día |
| Usó el enlace personal | `/admin` → Propuestas → revisar el ANTES/DESPUÉS → aplicar | Mismo día |
| Foto | Cargarla en la ficha (R2). Si viene por WhatsApp **como foto**, ya perdió el GPS: no sirve para ubicar, sí para publicar | 48 h |
| "¿Quiénes son ustedes?" | La landing `rutaaustral.cl/proyecto` + ofrecer llamada por WhatsApp | Mismo día |
| "No quiero aparecer" | Despublicar (`publicado: false`, **no** borrar) y confirmarlo por correo, sin discutir | Mismo día |
| "¿Cuánto cuesta?" | Nada, y no hay comisión. La capa comercial futura se menciona solo si preguntan | Mismo día |
| Nada | Recordatorio a los 10 días; después la ficha queda `preliminar` sin teléfono | Día 10 |

## 5. La lista de contactos NO va al repo

Son **datos personales de terceros** (correos de dueños de negocios y de
funcionarias municipales). El repo es público y ya hubo que rotar claves una vez
por subir lo que no correspondía.

- La lista viva es `docs/campana/contactos.csv`, **ignorada por git**
  (ver `.gitignore`). En el repo queda solo `contactos.ejemplo.csv`, con las
  columnas y tres filas de ejemplo.
- Las direcciones de los dueños salen de los pipelines de carga, cuyos JSON
  tampoco están versionados (`scripts/sernatur/`, `scripts/carretera-austral/`),
  y desde el 25-ago-2026 quedan guardadas en la ficha (campo «Correo del dueño»)
  para que la lista salga completa sin pasar por el computador. **Ese campo no
  viaja en `/api/places`**: la API es pública y publicar ahí los correos sería
  repartir una lista lista para raspar.
- Las de las municipalidades se sacan a mano de cada sitio `.cl` institucional —
  suele ser `turismo@municipalidadXXX.cl` o la Dirección de Desarrollo
  Económico Local (DIDEL).
- **Una comuna, un correo.** Las 28 localidades de la app se agrupan en 14
  comunas, y mandar cuatro correos a la misma oficina —uno por caleta— es la
  forma más rápida de que los cuatro se ignoren. Se nombran las localidades de
  esa comuna adentro del correo, que es lo que ya está resuelto en
  `ola1-por-comuna.md`.

## 6. Qué se mira después, y cuándo

Todo en `/admin` → Analítica → Interacciones, con **un solo periodo** para toda
la página.

| Cuándo | Qué se mira | Qué se decide |
|---|---|---|
| Día 0 | Fecha del "Poner en cero" → anotar acá: `________` | Es la línea base de todo lo demás |
| Día 2 | "Por dónde llegaron" → `muni` / `negocio` | Si casi nadie entró, el problema es el **asunto** del correo |
| Día 2 | Aperturas vs **Fichas vistas** | Si menos de la mitad llega a una ficha, el problema es la primera pantalla |
| Día 10 | Propuestas recibidas / enlaces mandados | Menos de 1 de cada 4: se reescribe el correo antes de la ola siguiente |
| Día 21 | Contactos a un negocio | Es la cifra que se le muestra a un negocio para la capa comercial |

**Lo que estos números no van a decir nunca es quién.** La analítica es anónima
por diseño: no hay cuenta, ni sesión, ni dispositivo, ni IP. Se sabe que hoy
entraron cuatro personas por `?c=muni`; no se sabe cuál de las municipalidades ni
qué miró cada una. Para saberlo habría que agregar seguimiento, que es una
decisión de producto distinta y hoy está tomada al revés.

## 7. Agregar un canal nuevo

Los códigos válidos son una lista cerrada en `Interaccion::CANALES`
(`backend/app/Models/Interaccion.php`). Un código que no esté ahí **se descarta
en silencio**: el enlace funciona, la visita se cuenta como apertura y el canal
queda sin medir.

Un canal nuevo es solo backend —la PWA manda el código tal como venga en la
URL—, así que el orden es: agregarlo a la lista → esperar el despliegue de Render
→ recién ahí repartir el enlace. Al revés, las primeras visitas del canal se
pierden sin dejar rastro.

La misma precaución, en grande, vale para un **tipo** de evento nuevo: Netlify
publica en minutos y Render tarda más, así que en esa ventana la PWA manda algo
que el backend no conoce, este responde 422 y la app descarta el lote entero —
con las fichas y los contactos de esos minutos adentro.
