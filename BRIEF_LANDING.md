# Brief — Landing de Patagonia Austral

Encargo de diseño, listo para pegarse completo como prompt. Todo lo necesario
está acá: contenido, datos verificados, coordenadas para el mapa, restricciones y
criterios de aceptación.

---

## 1. Qué hay que hacer

Una página web, en español, que convenza a **encargadas de turismo municipal,
alcaldes y dueños de servicios turísticos de la Carretera Austral** de mandar los
datos reales de su localidad o de su negocio.

Busca **datos**, no usuarios. El turista no es el destinatario.

Acompaña a una campaña de correos: el correo lleva el enlace, la página cierra.

## 2. Las cinco cosas que la página tiene que lograr

1. Que un correo de un desconocido deje de parecer un pedido y pase a ser una
   invitación a algo que **ya existe y ya tiene su pueblo adentro**.
2. Que se pueda evaluar el proyecto en **dos minutos y sin instalar nada** (es una
   PWA, no está en ninguna tienda de apps).
3. Que responda sin que nadie pregunte las dos dudas que matan la conversación:
   **¿me van a cobrar?** y **¿esto compromete al municipio?**
4. Que la encargada de turismo **pueda reenviarla** y defender el proyecto en una
   reunión a la que nosotros no vamos.
5. Que sirva después de la campaña: **QR en un furgón, en un local, adjunto de una
   postulación**.

## 3. Nivel de ambición

Editorial, no utilitaria. Es la cara del proyecto frente a autoridades, y decide
si un correo se responde o se archiva.

**La vara:** que un alcalde la abra en el teléfono y le muestre la pantalla a
alguien.

Una página prolija pero plana no sirve. Necesita una pieza visual que la cargue
(§5), tipografía con carácter y una estructura que no serviría para otro producto
cambiándole el texto.

---

## 4. La verdad del problema (esto manda sobre el copy)

**En los pueblos hay señal, y buena** — sobre todo Entel. La falta de cobertura
está **en la ruta entre pueblos y en las afueras**. Dato del fundador, que vive y
trabaja ahí.

Por lo tanto:

- **Prohibido** abrir con "el turista no puede buscar en Google". En el pueblo sí
  puede, y quien lea la página vive ahí y lo sabe.
- **El argumento real es la calidad del dato:** el turista busca y encuentra algo
  incompleto, desactualizado o ausente. Los servicios chicos de la Austral están
  mal representados en las plataformas globales. Ese problema el municipio y el
  dueño lo reconocen como propio **y pueden resolverlo** — que es justo lo que se
  les pide.
- **El offline es la segunda razón**, y va donde ocurre: **la decisión de dónde
  parar se toma en la ruta, antes de llegar**, sin señal, entre dos pueblos.
- **Los reportes de los viajeros** cierran el ciclo: se hacen en la ruta sin señal
  y se envían solos al llegar al pueblo.

Ninguna frase puede insinuar que los pueblos están incomunicados.

---

## 5. La pieza central: el mapa de la ruta

**No hay fotografías.** No tenemos imágenes con licencia y está prohibido tomarlas
de terceros. Eso define la dirección visual: **el peso lo cargan la cartografía
dibujada, la tipografía y el color** — que es exactamente cómo se ven las guías de
ruta. La restricción es la identidad, no un obstáculo.

El mapa se dibuja **en SVG dentro del HTML**. No es decoración: es el argumento.
Un alcalde que ve su pueblo en la ruta entiende el proyecto antes de leer.

**Coordenadas reales de las 26 localidades, norte→sur** (son las que usa la app):

| # | Localidad | Lat | Lng |
|---|---|---|---|
| 1 | Puerto Montt | −41.4693 | −72.9424 |
| 2 | Hornopirén | −41.9578 | −72.4372 |
| 3 | Caleta Gonzalo (Pumalín) | −42.5633 | −72.5989 |
| 4 | Chaitén | −42.9169 | −72.7086 |
| 5 | El Amarillo | −42.9333 | −72.5333 |
| 6 | Villa Santa Lucía | −43.4167 | −72.3667 |
| 7 | Futaleufú | −43.1847 | −71.8697 |
| 8 | Palena | −43.6167 | −71.8000 |
| 9 | La Junta | −43.9756 | −72.4058 |
| 10 | Raúl Marín Balmaceda | −43.7783 | −72.9603 |
| 11 | Puyuhuapi | −44.3286 | −72.5567 |
| 12 | Villa Amengual | −44.7167 | −72.1667 |
| 13 | Puerto Cisnes | −44.7422 | −72.6889 |
| 14 | Villa Mañihuales | −45.2103 | −72.1547 |
| 15 | Puerto Aysén | −45.4033 | −72.6947 |
| 16 | Puerto Chacabuco | −45.4667 | −72.8167 |
| 17 | Coyhaique | −45.5719 | −72.0683 |
| 18 | Balmaceda | −45.9137 | −71.6947 |
| 19 | Villa Cerro Castillo | −46.1216 | −72.1636 |
| 20 | Puerto Río Tranquilo | −46.6252 | −72.6735 |
| 21 | Puerto Guadal | −46.8442 | −72.7027 |
| 22 | Chile Chico | −46.5399 | −71.7288 |
| 23 | Puerto Bertrand | −47.0219 | −72.8247 |
| 24 | Cochrane | −47.2539 | −72.5732 |
| 25 | Caleta Tortel | −47.7967 | −73.5360 |
| 26 | Villa O'Higgins | −48.4686 | −72.5601 |

Rango: lat −41,47 a −48,47 · lng −71,69 a −73,54. **Territorio alto y angosto**
(7° de latitud por menos de 2° de longitud): en pantalla es una franja vertical, y
esa proporción es una virtud de composición — la ruta cae como columna y el texto
convive al lado.

Requisitos:

- Norte→sur, de arriba abajo. **Puerto Montt es el km 0**; Villa O'Higgins el
  extremo sur (~km 1.240). Solo esos dos hitos llevan kilometraje: **los km
  intermedios no los tenemos, no inventarlos.**
- **Las 26 nombradas y legibles.** Es el momento de "ahí está mi pueblo": si un
  nombre no se lee, el mapa falló.
- **Rotulación hacia afuera de la línea de ruta, nunca cruzándola.** Van a la
  izquierda los desvíos al oeste: Raúl Marín Balmaceda, Puerto Cisnes, Puerto
  Aysén, Puerto Chacabuco, Puerto Río Tranquilo y Caleta Tortel. El resto, a la
  derecha.
- Distinguir las dos regiones: **8 en Los Lagos** (Puerto Montt → Palena) y
  **18 en Aysén** (La Junta → Villa O'Higgins).
- Silueta **reconocible**: alguien de la zona debe ubicar el lago General Carrera
  y el brazo de los fiordos. Una línea recta con puntos no sirve.

**Segunda pieza:** un mapa de Chile chico que ubique el tramo dentro del país.
Mucha gente no sabe dónde empieza la Carretera Austral.

---

## 6. Dirección visual

**Referencia: las guías Chiletur de Copec** — el mapa rutero que se vende en las
estaciones de servicio y que conoce cualquier chileno que maneje.

- **Lenguaje de guía de ruta, no de software.** Cartografía, kilometraje,
  simbología de servicios, orden geográfico. Nada de mockups de teléfono flotando
  en un degradado.
- **Densidad honesta.** Una Chiletur está llena de información y aun así se lee.
  No hace falta ser minimalista para verse cuidada.
- **Autoridad tranquila.** Seria y útil, no vendedora.
- Detalle: señalética vial chilena y cartografía impresa — hitos de kilómetro,
  escalas gráficas, retículas de coordenadas.

**Paleta** (de la app, para que página y producto se reconozcan como lo mismo;
ampliable sin perder el verde):

```
--verde    #0f6e56   marca
--crema    #f7f5f0   fondo
--tinta    #1e2a28   texto
--gris     #6b7572   texto secundario
--borde    #e2e0d8
--acento   #d85a30   coral, SOLO para la acción principal
--amarillo #f5a623   advertencias / señalética
```

**Tipografía.** No se pueden cargar fuentes externas (§9). Dos caminos válidos:
combinar stacks del sistema con intención —una familia con carácter para
titulares, otra para lectura, una monoespaciada para datos y rótulos de mapa, que
además es el guiño cartográfico correcto— o incrustar **una** fuente subsetada
como data URI. Lo que no vale es una sola familia en cuatro tamaños. Números
tabulares donde haya cifras.

**Movimiento.** Un momento orquestado vale más que cinco efectos sueltos. El
candidato natural: **la ruta trazándose de norte a sur** al entrar en viewport,
con las localidades apareciendo a su paso. Respetar `prefers-reduced-motion`.

**Prohibido:** degradado morado-azul, tarjetas redondeadas con barrita de acento,
emojis como iconos de sección, todo centrado, "Inter para todo", tres columnas de
beneficios con íconos genéricos.

---

## 7. Estructura

1. **Portada.** Qué es, para quién, y **el mapa**. Tiene que decir el nombre del
   producto: **Patagonia Austral**. (El dominio será `rutaaustral.cl`, distinto del
   nombre de la app: quien llegue por el dominio necesita saber cómo se llama lo
   que va a instalar.)
2. **El problema** (§4): lo que hoy se encuentra sobre estos pueblos está
   incompleto o equivocado, y la decisión se toma en la ruta.
3. **Qué es la app.** Ficha por localidad en seis categorías · funciona sin señal
   en la ruta · estado del camino reportado por los viajeros. Bilingüe ES/EN,
   gratis, sin publicidad, sin cuenta.
4. **Por qué ahora.** Plan Ruta Austral del MOP: obras 2026–2030 en Aysén ⇒
   faenas, desvíos y cortes durante cuatro temporadas ⇒ información que cambia día
   a día y que nadie mantiene.
5. **El pedido, en dos columnas** — municipio y dueño de servicio, porque no se
   les pide lo mismo. Clarísimo que sirve un Excel, un PDF o un WhatsApp y que
   **no hay formulario que llenar**.
6. **Qué reciben.** Municipio: presencia frente a un turista que ya está
   decidiendo, y un canal para avisos oficiales. Dueño: ficha con teléfono y foto,
   encontrable justo cuando lo buscan.
7. **Quién está detrás.** Un vecino de la zona que opera una hamburguesería en el
   km 1020 y transporte y encomiendas entre Tortel y Cochrane; maneja ese tramo
   cada semana. **Con nombre y apellido.**
8. **Contacto.** Correo y WhatsApp — los dueños contestan mucho más por WhatsApp.

---

## 8. Datos verificados

**Nada fuera de esta lista se puede afirmar.**

**Ruta y producto**
- Carretera Austral: **1.058 km**, Puerto Montt → Villa O'Higgins. Pavimentada al
  **58%** (faltan 443,5 km).
- **26 localidades**, más de **190 lugares** cargados y descritos.
- Bilingüe ES/EN. Gratis, sin publicidad, sin cuenta.
- Funciona sin conexión: lugares, teléfonos, descripciones y mapas quedan en el
  teléfono al instalarla.
- Reportes de ruta de los viajeros (camino, bencina, barcaza, clima), con
  caducidad automática según el tipo.

**Demanda medida — temporada dic-2025 a mar-2026**
*Fuente: Red de Informadores Turísticos, Patagonia Chilena. Son atenciones en
oficinas de información turística y conteo de grupo de viaje: un indicador, NO el
total de turistas.*
- Región de Aysén: **16.998** personas en grupo de viaje; **6.357** atendidas en OIT.
- **Cochrane: 1.312 atenciones — destino n.º 1 de la región.**
- **Caleta Tortel: 21 atenciones**, siendo uno de los destinos más icónicos.
- Provincia Capitán Prat (Cochrane, O'Higgins, Tortel): 5.477 personas; pico
  enero–febrero.
- Referencia de la ruta completa: ~100.000–150.000 turistas al año.

> **Cochrane 1.312 / Tortel 21** es el dato más elocuente de la página: merece
> tratamiento gráfico, no una viñeta.

**Plan Ruta Austral (MOP, 30-abr-2026)**
- ~**$800 mil millones CLP**, **2026–2030, en la Región de Aysén**.
- 244 km intervenidos · 150,4 km de pavimentación definitiva.
- Puentes Palena y Rosselot · **dos barcazas nuevas** (lagos General Carrera y
  O'Higgins) · puerto Yungay.
- **Es un plan regional de Aysén.** No decir ni insinuar que se pavimentará toda
  la ruta Puerto Montt–O'Higgins para 2030.

**Origen de los datos**
- El alojamiento parte de registros públicos de **SERNATUR** y se corrige con
  información entregada por municipios y dueños.

### Prohibido

- Insinuar que los pueblos no tienen señal (§4).
- Vínculo, respaldo o convenio con SERNATUR, municipios, el MOP o cualquier
  organismo público. **Hay que decir explícitamente que es un proyecto privado e
  independiente que no representa a ninguno.**
- Cifras de descargas, usuarios, visitas o negocios adheridos: **no las hay**.
- Testimonios, citas, logos de auspiciadores, sellos de terceros.
- Fechas de lanzamiento o compromisos de servicio sin respaldo.
- Fotografías de terceros.

### Decir aunque incomode

Hay fichas publicadas con datos preliminares y su texto lo dice: *"dato por
confirmar"*. **Es un argumento, no una debilidad**: se prefirió eso antes que
inventar un teléfono, y es exactamente lo que la página viene a resolver.

---

## 9. Restricciones técnicas

- **Un archivo HTML autocontenido** en `frontend/public/proyecto.html`. CSS en
  línea. Sin frameworks ni dependencias.
- **Cero recursos externos**: nada de CDN, Google Fonts, analytics, teselas ni
  imágenes remotas. Todo gráfico va como **SVG en línea**.
- Se publica en **`/proyecto`** (regla ya presente en `netlify.toml`, antes del
  catch-all del SPA).
- **Fuera del precache del service worker** — ya está `globIgnores:
  ['proyecto.html']` en `vite.config.js`. **No tocar**, o cada turista se descarga
  en el teléfono una página dirigida a alcaldes.
- **No tocar `App.jsx` ni agregar routing.**
- **Solo español.**
- **Responsive**: sin scroll horizontal a ningún ancho. **El mapa vertical tiene
  que funcionar a 360 px** — es la prueba de fuego, no un detalle final.
- Accesible: contraste, foco visible, `prefers-reduced-motion`, y el mapa con
  alternativa textual legible por lector de pantalla.
- `npm run build` y el lint tienen que seguir pasando; el precache debe quedar en
  **10 entradas / ~573 KiB**.

## 10. Criterios de aceptación

1. Una encargada de turismo la lee completa **en menos de dos minutos** y sabe qué
   mandar y a dónde.
2. Un alcalde la hojea y no le queda duda de que **no compromete al municipio ni
   cuesta plata**.
3. Un dueño de cabañas entiende **en el primer scroll** que aparecer es gratis.
4. Alguien de la zona reconoce la ruta y **encuentra su pueblo**.
5. Nadie que viva ahí puede señalar una afirmación falsa.
6. **No serviría para otro producto cambiándole el texto.**
7. Funciona a 360 px tan bien como en escritorio.

## 11. Por rellenar antes de publicar

Tres marcadores, visibles en rojo para que no se escape ninguno: **nombre y
apellido** de quien firma, **correo** y **WhatsApp**.

Dominio: **`rutaaustral.cl`** (con `rutaustral.cl` redirigiendo). El correo será
`contacto@rutaaustral.cl`, pendiente de registrar en nic.cl.
