# Brief de diseño — Landing de presentación del proyecto

> **Qué es este archivo.** El encargo para que una IA de diseño (Claude Design u
> otra) produzca la landing. Está escrito para **pegarse tal cual** como prompt:
> todo lo que hace falta está acá, incluidos los datos verificados, las
> coordenadas para dibujar el mapa y lo que está prohibido inventar.
>
> **Versión 2 (29-jul-2026).** La v1 produjo una página *correcta y aburrida*: bien
> organizada, honesta, y sin una sola razón para mirarla dos veces. Este brief
> corrige esa calibración. Hay una versión provisoria en
> `frontend/public/proyecto.html` que sirve **solo** como referencia de
> restricciones técnicas — su contenido tiene el argumento equivocado (ver §2) y su
> diseño es justamente lo que hay que superar.

---

## 1. El encargo

Una página que haga que **una encargada de turismo municipal, un alcalde o el
dueño de una cabaña en la Carretera Austral** manden los datos reales de su
localidad o de su negocio.

No busca usuarios: busca **datos**. El turista no es el destinatario.

### Nivel de ambición — leer esto antes que nada

Esta página es **editorial, no utilitaria**. Es la cara del proyecto frente a
autoridades y a los dueños de los negocios que queremos listar; es lo que decide
si una campaña de correos se responde o se archiva. Una página "prolija" no
alcanza: tiene que dar la impresión de que detrás hay algo serio y hecho con
cuidado, porque eso es literalmente lo que se está pidiendo que crean.

**Qué falló en el intento anterior**, para no repetirlo:

- No tenía **ninguna pieza visual**. Solo texto en tarjetas. Un muro de prosa
  ordenada no persuade a nadie que recibe diez correos al día.
- La estructura era una **pila de secciones intercambiables** — se le podía
  cambiar el texto y servía para cualquier otro producto.
- La tipografía no decía nada: tamaños distintos del mismo tipo de letra.
- Cero movimiento, cero jerarquía dramática, cero momento memorable.

**La vara:** que un alcalde la abra en el teléfono y le muestre la pantalla a
alguien. Si no da para eso, no está lista.

---

## 2. La corrección que manda sobre todo lo demás

**El argumento "no hay señal" está mal planteado y hay que reemplazarlo.**

Corrección del fundador, que vive y trabaja en la ruta (jul-2026):

> En los **pueblos sí hay señal**, y buena — sobre todo Entel. La falta de
> cobertura está **en la ruta entre pueblos y en las afueras**, no dentro de ellos.

Consecuencias, en orden:

1. **La página NO puede abrir con "el turista no puede buscar en Google".** En el
   pueblo sí puede. Ese argumento es falso y lo va a leer alguien que vive ahí y
   lo sabe: la credibilidad se pierde en el primer párrafo.
2. **El argumento fuerte es la CALIDAD DEL DATO.** El turista busca y encuentra
   algo incompleto, desactualizado o ausente. Los servicios chicos de la Austral
   están mal representados en las plataformas globales. Ese problema el municipio
   y el dueño lo reconocen como propio **y pueden resolverlo** — que es justo lo
   que se les va a pedir.
3. **El offline es la segunda razón, no la primera**, y va ubicado donde ocurre:
   **la decisión de dónde parar se toma en la ruta, antes de llegar.** Sin señal,
   entre dos pueblos, decidiendo si sigues al próximo o si te alcanza la bencina.
4. **El crowdsourcing gana coherencia con esto:** el reporte se *hace* en la ruta
   sin señal y se *entrega* al llegar al pueblo con señal (la app ya tiene esa
   cola offline). Es el ciclo natural del viaje.

**Regla dura:** ninguna afirmación que diga o insinúe que los pueblos están
incomunicados.

---

## 3. A quién le habla (tres lectores)

| Lector | Qué le importa | Qué le pedimos |
|---|---|---|
| **Encargada de turismo municipal** — lectora principal | Que su comuna esté bien representada; que no le sumen pega | El listado de servicios en operación con teléfonos vigentes, y un contacto al que volver |
| **Alcalde / concejo** | Que la comuna aparezca; que no cueste plata ni comprometa al municipio | Respaldo, y que le diga a la encargada que mande los datos |
| **Dueño de alojamiento, restaurante o servicio** | Que lo encuentren; desconfía de que le cobren | Sus datos y **fotos propias** |

La encargada de turismo es quien tiene los datos y quien va a contestar. El
alcalde tiene que poder hojearla en un minuto y ver que no hay riesgo. El dueño
necesita ver **sin buscar** que es gratis.

---

## 4. La pieza central: el mapa de la ruta

**Esto es lo que salva la página de ser un documento.** No es decoración: es el
argumento. Un alcalde que ve su pueblo dibujado en la ruta entiende el proyecto
antes de leer una línea.

**Hay que dibujarlo en SVG, a mano, dentro del HTML.** No hay teselas ni mapas
embebidos (§8 lo prohíbe) y **no hay fotografías disponibles** — no tenemos
imágenes con licencia y está prohibido tomarlas de terceros. Es decir: **el peso
visual de la página lo carga la cartografía dibujada, la tipografía y el color.**
Esa restricción no es un problema, es la dirección: así se ven las guías de ruta.

**Coordenadas reales de las 26 localidades, norte→sur.** Son las que usa la app;
usarlas para que el trazado sea fiel y no una línea inventada.

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

Rango: latitud −41,47 a −48,47 · longitud −71,69 a −73,54. **Es un territorio
alto y angosto** (7° de latitud por menos de 2° de longitud): en pantalla es una
franja vertical, y esa proporción es una virtud de composición, no un estorbo —
la ruta cae como una columna y el texto puede convivir a su lado.

**Requisitos del mapa:**

- Orden **norte→sur**, de arriba abajo. Puerto Montt es el **km 0** y Villa
  O'Higgins el extremo sur (~km 1.240). Esos dos hitos se rotulan; los km
  intermedios **no los tenemos**, así que no inventarlos.
- Las **26 localidades marcadas y nombradas**. Es el momento de "ahí está mi
  pueblo": si un nombre no se lee, el mapa falló.
- **Regla de rotulación** (la misma que usa la app): el nombre va hacia **afuera**
  de la línea de ruta, nunca cruzándola. Los desvíos al oeste —Puerto Cisnes,
  Puerto Aysén, Puerto Chacabuco, Raúl Marín Balmaceda, Puerto Río Tranquilo,
  Caleta Tortel— rotulan a la izquierda; el resto a la derecha.
- Distinguir las **dos regiones**: 8 localidades en Los Lagos (Puerto Montt →
  Palena) y 18 en Aysén (La Junta → Villa O'Higgins).
- Se puede simplificar la costa y los fiordos, pero **la silueta tiene que ser
  reconocible**: alguien de la zona debe reconocer el lago General Carrera y el
  brazo de los fiordos. Una línea recta con puntos no sirve.

**Segunda pieza gráfica sugerida:** un **mapa de Chile completo, chico**, que
ubique el tramo dentro del país. Mucha gente —incluso en Chile— no sabe dónde
empieza la Carretera Austral. Sirve de ancla en la portada y se reutiliza después
en redes y en un impreso.

---

## 5. Dirección visual

**Referencia principal: las guías Chiletur de Copec** (editadas por Copesa,
distribuidas por Copec, más de 30 años; mapas de Editorial Compass; se venden en
las estaciones de servicio y las conoce cualquier chileno que maneje).

Lo que hay que tomar de ellas:

- **Lenguaje de guía de ruta, no de software.** Cartografía, kilometraje,
  simbología de servicios, orden geográfico. Nada de mockups de teléfono flotando
  en un degradado.
- **Densidad honesta.** Una Chiletur está llena de información y aun así se lee.
  La página puede ser densa si está bien jerarquizada; no tiene que ser aireada y
  minimalista para verse cuidada.
- **Autoridad tranquila.** Seria y útil, no vendedora.

Segunda fuente para el detalle: **señalética vial chilena y cartografía impresa** —
hitos de kilómetro, símbolos de servicio, curvas de nivel, escalas gráficas,
retículas de coordenadas.

**Paleta** — partir de la de la app, para que página y producto se reconozcan como
lo mismo. Ampliarla si el diseño lo pide, pero sin perder el verde como identidad.

```
--verde      #0f6e56   marca
--crema      #f7f5f0   fondo
--tinta      #1e2a28   texto
--gris       #6b7572   texto secundario
--borde      #e2e0d8
--acento     #d85a30   coral, SOLO para la acción principal
--amarillo   #f5a623   advertencias / señalética
```

**Tipografía — acá se ganó o se perdió la v1.** No se pueden cargar fuentes
externas (§8), así que hay dos caminos legítimos: combinar **stacks del sistema
con intención** (una familia con carácter para titulares, otra para lectura, y una
monoespaciada para datos, coordenadas y rótulos de mapa — que además es el guiño
cartográfico correcto), o **incrustar una fuente como data URI**. Lo que no vale
es una sola familia en cuatro tamaños. Números tabulares donde haya cifras.

**Movimiento — con criterio, no de adorno.** Un momento orquestado vale más que
cinco efectos sueltos. El candidato natural es **la ruta trazándose de norte a
sur** al cargar (o al entrar en viewport), con las localidades apareciendo a su
paso: cuenta el recorrido con el gesto mismo. Respetar
`prefers-reduced-motion`.

**Prohibido:** el aspecto de landing de startup — degradado morado-azul, tarjetas
redondeadas con barrita de acento, emojis como iconos de sección, todo centrado,
"Inter para todo", tres columnas de beneficios con íconos genéricos. **Si el
resultado sirve para cualquier producto cambiándole el texto, está mal.**

---

## 6. Estructura

El orden está pensado para el lector municipal; se puede ajustar con criterio.

1. **Portada.** Qué es y para quién. **El mapa manda acá** — con las 26
   localidades, o con el mapa de Chile como ancla y el detalle más abajo.
   Tiene que decir claramente el nombre del producto: **Patagonia Austral**. (Ojo:
   el dominio dirá `rutaaustral.cl`, distinto del nombre de la app, así que quien
   llegue por el dominio necesita saber cómo se llama lo que va a instalar.)
2. **El problema, bien planteado** (§2): lo que se encuentra hoy sobre estos
   pueblos está incompleto o equivocado, y la decisión se toma en la ruta.
3. **Qué es la app.** Ficha por localidad (seis categorías), funciona sin señal en
   la ruta, y estado del camino reportado por los propios viajeros. Bilingüe
   ES/EN, gratis, sin publicidad, sin cuenta.
4. **Por qué ahora.** Plan Ruta Austral del MOP: obras 2026–2030 en Aysén ⇒
   faenas, desvíos y cortes durante cuatro temporadas ⇒ información que cambia
   día a día y que nadie mantiene.
5. **El pedido, en dos columnas**: municipio y dueño de servicio. No se les pide
   lo mismo. Tiene que quedar clarísimo que sirve un Excel, un PDF o un WhatsApp,
   y que **no hay ningún formulario que llenar**.
6. **Qué reciben.** Municipio: presencia frente a un turista que ya está
   decidiendo, y un canal para avisos oficiales. Dueño: ficha con teléfono y foto,
   encontrable justo cuando buscan.
7. **Quién está detrás.** Un vecino de la zona que opera una hamburguesería en el
   km 1020 y transporte y encomiendas entre Tortel y Cochrane; vive el problema
   manejando ese tramo cada semana. **Con nombre y apellido** — sin eso un
   municipio no contesta.
8. **Contacto.** Correo y WhatsApp. El WhatsApp importa: los dueños contestan
   mucho más por ahí.

---

## 7. Datos verificados

**Todo lo de abajo es verificable. Nada fuera de esta lista se puede afirmar.**

**La ruta y el producto**
- Carretera Austral: **1.058 km**, Puerto Montt → Villa O'Higgins. Pavimentada al
  **58%** (faltan 443,5 km).
- **26 localidades** y más de **190 lugares** cargados y descritos.
- Bilingüe español/inglés. Gratis, sin publicidad, sin cuenta.
- Funciona sin conexión: lugares, teléfonos, descripciones y mapas quedan
  guardados en el teléfono al instalarla.
- Reportes de ruta de los propios viajeros (camino, bencina, barcaza, clima) con
  caducidad automática según el tipo.

**Demanda medida — temporada dic-2025 a mar-2026**
*Fuente: Red de Informadores Turísticos, Patagonia Chilena. Son atenciones en
oficinas de información turística y conteo de grupo de viaje: un indicador, NO el
total de turistas.*
- Región de Aysén: **16.998** personas en grupo de viaje; **6.357** atendidas en OIT.
- Cochrane: **1.312 atenciones — el destino n.º 1 de la región**.
- Caleta Tortel: **21 atenciones**, siendo uno de los destinos más icónicos.
- Provincia Capitán Prat (Cochrane, O'Higgins, Tortel): 5.477 personas; pico
  enero–febrero.
- Referencia general de la ruta completa: ~100.000–150.000 turistas al año.

> El contraste **Cochrane 1.312 / Tortel 21** es el dato más elocuente de la
> página y merece tratamiento gráfico, no una viñeta.

**Plan Ruta Austral (MOP, anunciado 30-abr-2026)**
- ~**$800 mil millones CLP**, **2026–2030, enfocado en la Región de Aysén**.
- 244 km intervenidos, 150,4 km de pavimentación definitiva.
- Puentes Palena y Rosselot; **dos barcazas nuevas** (lagos General Carrera y
  O'Higgins); puerto Yungay.
- **Precisión obligatoria:** es un plan **regional de Aysén**. NO decir ni
  insinuar que se pavimentará toda la ruta Puerto Montt–O'Higgins para 2030.

**Origen de los datos**
- El contenido de alojamiento parte de registros públicos de **SERNATUR** y se
  corrige con información entregada por municipios y dueños.

### Prohibido afirmar

- Que los pueblos no tienen señal o están incomunicados (§2).
- Vínculo, respaldo o convenio con SERNATUR, municipios, el MOP o cualquier
  organismo público. **Hay que decir explícitamente que es un proyecto privado e
  independiente y que no representa a ninguno.**
- Cifras de descargas, usuarios, visitas o negocios adheridos. **No las hay.**
- Testimonios, citas, logos de auspiciadores o sellos de terceros. Nada de eso
  existe, y falsificarlo hunde el proyecto con el primer municipio que pregunte.
- Fechas de lanzamiento o compromisos de servicio que no estén respaldados.
- **Fotografías de terceros.** No hay banco de imágenes ni fotos con licencia; no
  se raspan de Google Maps ni de sitios de turismo. Todo lo visual se dibuja.

### Lo que conviene decir aunque incomode

Hay fichas publicadas con datos preliminares y su texto lo dice: *"dato por
confirmar"*. **Es un argumento, no una debilidad**: se prefirió eso antes que
inventar un teléfono, y es exactamente lo que la página viene a resolver. Decirlo
de frente es lo que hace que un municipio conteste en vez de desconfiar.

---

## 8. Restricciones técnicas (no negociables)

- **Un solo archivo HTML autocontenido**, en `frontend/public/proyecto.html`. CSS
  en línea. Sin frameworks, sin build propio, sin dependencias.
- **Cero recursos externos**: nada de CDN, Google Fonts, analytics, teselas de
  mapa ni imágenes remotas. Lo que no esté incrustado, no existe. Todo gráfico va
  como **SVG en línea** (o Canvas si hay algo generativo).
- Se publica en **`/proyecto`** por la regla ya presente en `netlify.toml`, que va
  **antes** del catch-all del SPA (gana la primera regla que calza).
- **Fuera del precache del service worker** — ya está `globIgnores:
  ['proyecto.html']` en `vite.config.js`. **No tocar:** sin esa línea, cada turista
  se descarga en el teléfono una página dirigida a alcaldes.
- **Peso**: que el archivo no se desmadre. El SVG del mapa dibujado a mano es
  barato; una fuente incrustada en data URI no. Si se incrusta una, que sea una
  sola y subsetada.
- **No tocar `App.jsx` ni agregar routing.** Es un archivo estático aparte.
- **Solo español.** El destinatario es chileno. (La app sí es bilingüe; la página
  no.)
- **Responsive de verdad**: la encargada de turismo la abre en el teléfono. Sin
  scroll horizontal a ningún ancho. **El mapa vertical tiene que funcionar en
  360 px** — es la prueba de fuego del diseño, no un detalle de última hora.
- Accesible: contraste suficiente, foco visible, `prefers-reduced-motion`
  respetado, y el mapa con alternativa textual (la lista de las 26 localidades
  tiene que ser legible por un lector de pantalla).
- `npm run build` y el lint del frontend tienen que seguir pasando, y el precache
  quedar en **10 entradas / ~573 KiB**. Si sube, algo se coló.

---

## 9. Criterios de aceptación

1. Una encargada de turismo municipal la lee completa **en menos de dos minutos** y
   sabe exactamente qué mandar y a dónde.
2. Un alcalde la hojea y no le queda duda de que **no compromete al municipio ni
   cuesta plata**.
3. Un dueño de cabañas entiende **en el primer scroll** que aparecer es gratis.
4. Alguien de la zona reconoce la ruta en el mapa y **encuentra su pueblo**.
5. Nadie que viva ahí puede señalar una sola afirmación falsa.
6. **No se parece a la landing de un producto de software**, y no serviría para
   otro producto cambiándole el texto.
7. Funciona a 360 px de ancho tan bien como en escritorio.

---

## 10. Pendiente antes de publicar

Reemplazar los tres marcadores (déjalos visibles en rojo, para que no se escape
ninguno): **nombre y apellido** de quien firma, **correo** y **WhatsApp**.

Dominio decidido el 29-jul-2026: **`rutaaustral.cl`** (más `rutaustral.cl`
redirigiendo). El correo será `contacto@rutaaustral.cl`. Pendiente de registrar en
nic.cl; hasta que exista, el marcador se queda.
