# Brief de diseño — Landing de presentación del proyecto

> **Qué es este archivo.** Las instrucciones para que una IA de diseño (Claude,
> u otra) produzca la landing. Está escrito para **pegarse tal cual** como
> prompt: todo lo que necesita saber quien diseñe está acá adentro, incluidos
> los datos verificados y lo que tiene prohibido inventar.
>
> **Estado (29-jul-2026):** hay una **primera versión provisoria** en
> `frontend/public/proyecto.html`, hecha antes de esta corrección de rumbo.
> **Su argumento de apertura es incorrecto** (ver §2) — sirve como referencia de
> estructura y de restricciones técnicas, **no** de contenido. No mergear a
> producción como está.

---

## 1. El encargo en una frase

Una página que haga que **una encargada de turismo municipal, un alcalde o el
dueño de una cabaña en la Carretera Austral** decidan mandar los datos reales de
su localidad o de su negocio.

No es una landing de descarga de app. No busca usuarios: busca **datos**. El
turista no es el destinatario de esta página.

---

## 2. La corrección que manda sobre todo lo demás

**El argumento "no hay señal" está mal planteado y hay que reemplazarlo.**

Corrección del fundador, que vive y trabaja en la ruta (jul-2026):

> En los **pueblos sí hay señal**, y buena — sobre todo Entel. La falta de
> cobertura está **en la ruta entre pueblos y en las afueras**, no dentro de
> ellos.

Consecuencias, en orden de importancia:

1. **La página NO puede abrir con "el turista no puede buscar en Google".** En el
   pueblo sí puede. Ese argumento es falso y, peor, lo va a leer alguien que vive
   ahí y sabe que es falso — se pierde la credibilidad en el primer párrafo.

2. **El argumento fuerte pasa a ser la CALIDAD DEL DATO, no la conectividad.** El
   turista busca y encuentra algo: incompleto, desactualizado o simplemente
   ausente. Los servicios chicos de la Austral están mal representados en las
   plataformas globales. Ese es el problema que el municipio y el dueño sí
   reconocen como propio, y sobre el que además pueden hacer algo — que es
   exactamente lo que les vamos a pedir.

3. **El offline sigue siendo real, pero es la segunda razón, no la primera**, y
   hay que ubicarlo donde de verdad ocurre: **la decisión se toma en la ruta,
   antes de llegar.** Sin señal, entre dos pueblos, es donde uno decide si sigue
   hasta el próximo, si va a alcanzar la bencina, si conviene parar antes. Ahí es
   donde la guía cargada en el teléfono vale, y ahí es donde no hay ninguna otra.

4. **El crowdsourcing gana coherencia con esta corrección, no la pierde.** El
   reporte se *hace* en la ruta sin señal y se *entrega* al llegar al pueblo con
   señal (la app ya tiene la cola offline que hace justamente eso). Es el ciclo
   natural del viaje, no un parche.

**Regla para quien diseñe:** ninguna afirmación sobre cobertura que diga o
insinúe que los pueblos están incomunicados.

---

## 3. A quién le habla (tres lectores, no uno)

| Lector | Qué le importa | Qué le pedimos |
|---|---|---|
| **Encargada de turismo municipal** | Que su comuna esté bien representada; que no le sumen trabajo | El listado de servicios en operación, con teléfonos vigentes, y un contacto al que volver |
| **Alcalde / Concejo** | Que la comuna aparezca; que no cueste plata ni comprometa al municipio | Respaldo y la instrucción de que le pasen los datos a la encargada |
| **Dueño de alojamiento, restaurante o servicio** | Que lo encuentren; desconfía de que le vayan a cobrar | Sus datos y **fotos propias** |

La encargada de turismo es **la lectora principal**: es quien tiene los datos y
quien va a contestar el correo. El alcalde tiene que poder hojearla en un minuto
y entender que no hay riesgo. El dueño de cabañas necesita ver, sin buscar, que
**es gratis**.

---

## 4. Dirección visual

**Referencia principal: las guías Chiletur de Copec** (editadas por Copesa,
distribuidas por Copec, más de 30 años en circulación; los mapas los hace
Editorial Compass). Se venden en las estaciones de servicio y todo chileno que
maneja las conoce.

Lo que hay que tomar de ellas:

- **Lenguaje de guía de ruta, no de software.** Mapas ruteros, kilometraje,
  simbología de servicios, orden geográfico. Nada de mockups de teléfono
  flotando en un degradado.
- **Densidad honesta.** Una guía Chiletur está llena de información y aun así se
  lee. La página puede ser densa si está bien jerarquizada; no necesita ser
  aireada y minimalista.
- **Autoridad tranquila.** Se ve seria y útil, no vendedora.
- **Orden por recorrido.** Norte a sur, de Puerto Montt a Villa O'Higgins. El
  lector encuentra su pueblo recorriendo la ruta, no buscando en una grilla.

Segunda fuente, para el detalle: **la señalética vial chilena y la cartografía**
—hitos de kilómetro, símbolos de servicio (bencina, hospital, camping), curvas
de nivel, la línea de la ruta.

**Paleta:** partir de la que ya usa la app, para que la página y el producto se
reconozcan como lo mismo.

```
--verde      #0f6e56   marca
--crema      #f7f5f0   fondo
--tinta      #1e2a28   texto
--gris       #6b7572   texto secundario
--borde      #e2e0d8
--acento     #d85a30   coral, SOLO para la acción principal
--amarillo   #f5a623   advertencias / señalética
```

**Restricción de tipografía:** no se pueden cargar fuentes externas (ver §7). Hay
que resolver la personalidad con stacks del sistema bien combinados o con una
fuente incrustada como data URI.

**Prohibido:** el aspecto de landing de startup genérica — hero con degradado
morado-azul, tarjetas redondeadas con barrita de acento, emojis como iconos de
sección, todo centrado, "Inter para todo". Si el resultado podría ser la landing
de cualquier SaaS cambiándole el texto, está mal.

---

## 5. Estructura pedida

En este orden. Se puede ajustar con criterio, pero el orden está pensado para el
lector municipal.

1. **Portada.** Qué es, para quién es la ruta, y **las 26 localidades listadas
   norte→sur**. Ese listado es la pieza más persuasiva de la página: el alcalde
   de Villa Amengual ve su pueblo y deja de leer como espectador. (Ver §6 para la
   lista exacta.)

2. **El problema, bien planteado** (§2). Lo que el turista encuentra hoy sobre
   estos pueblos es incompleto o está equivocado, y la decisión de dónde parar se
   toma en la ruta, antes de llegar.

3. **Qué es la app.** Tres capacidades concretas: ficha por localidad (seis
   categorías), funciona con el teléfono sin señal en la ruta, y estado del
   camino reportado por los propios viajeros. Bilingüe ES/EN, gratis, sin
   publicidad, sin cuenta.

4. **Por qué ahora.** El Plan Ruta Austral del MOP: obras 2026–2030 concentradas
   en Aysén ⇒ faenas, desvíos y cortes durante cuatro temporadas ⇒ información
   que cambia día a día y que nadie mantiene.

5. **El pedido, separado en dos columnas**: municipio y dueño de servicio. No se
   les pide lo mismo. Tiene que quedar clarísimo que sirve un Excel, un PDF o un
   WhatsApp — que **no** hay que llenar ningún formulario.

6. **Qué reciben.** Municipio: presencia frente a un turista que ya está
   decidiendo, y un canal para avisos oficiales. Dueño: ficha con teléfono y foto,
   encontrable justo cuando buscan.

7. **Quién está detrás.** Un vecino de la zona que opera una hamburguesería en el
   km 1020 y transporte y encomiendas entre Tortel y Cochrane. Vive el problema
   manejando ese tramo cada semana. **Con nombre y apellido** — sin eso, un
   municipio no contesta.

8. **Contacto.** Correo y WhatsApp. El WhatsApp importa: los dueños de servicios
   contestan mucho más por ahí que por correo.

---

## 6. Datos verificados que se pueden usar

**Todo lo de abajo es verificable. Nada fuera de esta lista se puede afirmar.**

**La ruta y el producto**
- Carretera Austral: 1.058 km, Puerto Montt → Villa O'Higgins. Pavimentada al 58%
  (faltan 443,5 km).
- La app cubre **26 localidades** y más de **190 lugares** cargados y descritos.
- Contenido bilingüe español/inglés. Gratis, sin publicidad, sin cuenta.
- Funciona sin conexión: lugares, teléfonos, descripciones y mapas quedan
  guardados en el teléfono al instalarla.
- Reportes de ruta de los propios viajeros (camino, bencina, barcaza, clima) con
  caducidad automática según el tipo.

**Las 26 localidades, norte→sur** (orden exacto, respetarlo)
Puerto Montt · Hornopirén · Caleta Gonzalo (Pumalín) · Chaitén · El Amarillo ·
Villa Santa Lucía · Futaleufú · Palena · La Junta · Raúl Marín Balmaceda ·
Puyuhuapi · Villa Amengual · Puerto Cisnes · Villa Mañihuales · Puerto Aysén ·
Puerto Chacabuco · Coyhaique · Balmaceda · Villa Cerro Castillo · Puerto Río
Tranquilo · Puerto Guadal · Chile Chico · Puerto Bertrand · Cochrane · Caleta
Tortel · Villa O'Higgins
*(8 en la Región de Los Lagos, 18 en la Región de Aysén.)*

**Demanda medida — temporada dic-2025 a mar-2026**
*Fuente: Red de Informadores Turísticos, Patagonia Chilena. Son atenciones en
oficinas de información turística y conteo de grupo de viaje: un indicador, NO el
total de turistas.*
- Región de Aysén: 16.998 personas en grupo de viaje; 6.357 atendidas en OIT.
- Cochrane: **1.312 atenciones — el destino n.º 1 de la región**.
- Caleta Tortel: **21 atenciones**, siendo uno de los destinos más icónicos.
- Provincia Capitán Prat (Cochrane, O'Higgins, Tortel): 5.477 personas; pico
  enero–febrero.
- Referencia general de la ruta completa: ~100.000–150.000 turistas al año.

**Plan Ruta Austral (MOP, anunciado 30-abr-2026)**
- ~$800 mil millones CLP, **2026–2030, enfocado en la Región de Aysén**.
- 244 km intervenidos, 150,4 km de pavimentación definitiva.
- Puentes Palena y Rosselot; **dos barcazas nuevas** (lagos General Carrera y
  O'Higgins); puerto Yungay.
- **Precisión obligatoria:** es un plan **regional de Aysén**. NO decir ni
  insinuar que se va a pavimentar toda la ruta Puerto Montt–O'Higgins para 2030.

**Origen de los datos**
- El contenido de alojamiento parte de registros públicos de **SERNATUR** y se
  corrige con información entregada por municipios y dueños.

### Prohibido afirmar

- Que los pueblos no tienen señal o están incomunicados (§2).
- Cualquier vínculo, respaldo o convenio con SERNATUR, municipios, el MOP o
  cualquier organismo público. **Hay que decir explícitamente que es un proyecto
  privado e independiente y que no representa a ninguno.**
- Cifras de descargas, usuarios, visitas o negocios adheridos. **No las hay.**
- Testimonios, citas, logos de auspiciadores o sellos de terceros. Nada de eso
  existe y falsificarlo hunde el proyecto con el primer municipio que pregunte.
- Fechas de lanzamiento, compromisos de cobertura o promesas de servicio que no
  estén respaldadas.

### Lo que conviene decir aunque incomode

Hay fichas publicadas con datos preliminares y su texto lo dice: *"dato por
confirmar"*. **Eso es un argumento, no una debilidad**: se prefirió eso antes que
inventar un teléfono, y es exactamente lo que la página viene a resolver. Decirlo
de frente es lo que hace que un municipio conteste en vez de desconfiar.

---

## 7. Restricciones técnicas (no negociables)

- **Un solo archivo HTML autocontenido**, en `frontend/public/proyecto.html`. CSS
  en línea. Sin frameworks, sin build propio, sin dependencias.
- **Cero recursos externos**: nada de CDN, Google Fonts, analytics ni imágenes
  remotas. Lo que no esté incrustado, no existe.
- Se publica en **`/proyecto`** por la regla ya presente en `netlify.toml`, que
  va **antes** del catch-all del SPA (gana la primera regla que calza).
- **Fuera del precache del service worker** — ya está `globIgnores:
  ['proyecto.html']` en `vite.config.js`. **No tocar eso:** sin esa línea, cada
  turista se descarga en el teléfono una página dirigida a alcaldes.
- **No tocar `App.jsx` ni agregar routing.** Es un archivo estático aparte.
- **Solo español.** El destinatario es chileno. (La app sí es bilingüe; la página
  no.)
- **Responsive de verdad**: la encargada de turismo la va a abrir en el teléfono.
  Sin scroll horizontal en ningún ancho.
- Accesible: contraste suficiente, foco visible, respeto a
  `prefers-reduced-motion`.
- El build (`npm run build`) y el lint del frontend tienen que seguir pasando, y
  el precache tiene que quedar en **10 entradas / ~573 KiB** — si sube, algo se
  coló.

---

## 8. Cómo se sabe si quedó buena

1. Una encargada de turismo municipal la lee completa **en menos de dos minutos**
   y sabe exactamente qué mandar y a dónde.
2. Un alcalde la hojea y no le queda ninguna duda de que **no compromete al
   municipio ni cuesta plata**.
3. Un dueño de cabañas entiende **en el primer scroll** que aparecer es gratis.
4. Nadie que viva en la ruta puede señalar una sola afirmación falsa.
5. No se parece a la landing de un producto de software.

---

## 9. Pendiente antes de publicar

Quedan **dos** marcadores (van visibles en rojo a propósito para que no se
escapen): nombre y apellido de quien firma, y WhatsApp.

El correo ya está puesto: **`contacto@rutaaustral.cl`** (dominio decidido el
3-ago-2026). Falta que el **buzón exista** — Zoho Mail free o Google Workspace —
antes de mandar la campaña: un `mailto:` a una casilla que rebota es peor que no
tener el botón. Era el punto 1 del plan de inversión precisamente porque de eso
depende que contesten.
