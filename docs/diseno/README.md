# Diseño — material visual del proyecto

Piezas de diseño que no son código de la app pero se derivan de él. Cada
subcarpeta trae su generador: **acá no se guardan imágenes ni HTML dibujados a
mano**, porque un dibujo hecho aparte se desincroniza del código a la primera
semana y después nadie sabe cuál de los dos manda.

## `canvas-mapa/` — Iconografía del mapa

Canvas de varios artboards con el sistema de pines de la PWA: los iconos por
subtipo de las seis categorías, el sello «Recomendado» (la llama) con sus
estados y su anatomía, el set de iconos, y la tarjeta rápida y la ficha
recreadas al pixel.

Está publicado como Artifact (privado hasta que se comparta):
<https://claude.ai/code/artifact/b53b4b7b-74f4-4141-9562-1d2ccbbd1082>

**De dónde sale cada cosa.** Los SVG los lee `generar.mjs` directamente de
`frontend/src/components/Icon.jsx`; los colores, radios, sombras y tipografías
están copiados de `frontend/src/styles.css` y `frontend/src/data/places.js`, y
las reglas de subtipo resumen `frontend/src/data/iconos.js`. Si cambias un
icono o un color de categoría en la app, **el canvas queda desfasado hasta que
lo regeneres** — es un retrato del código, a propósito, no una segunda fuente
de verdad.

### Regenerar los artboards

```bash
node docs/diseno/canvas-mapa/generar.mjs /tmp/canvas-mapa
```

Escribe los cinco `.dc.html` y el `canvas.json`. Con Playwright a mano conviene
comprobar que ningún marco corte su contenido (el marco no encoge lo que hay
dentro: lo recorta):

```bash
node docs/diseno/canvas-mapa/medir.mjs /tmp/canvas-mapa
```

Si avisa que algo se corta, sube el número en `MARCO` dentro de `generar.mjs`.

### Actualizar el canvas publicado

Se arma y se guarda con el skill `design` de Claude Code (`/design`), que es
quien sabe empaquetar los artboards y publicarlos en la misma URL.

**Ojo con una cosa antes de regenerar:** el canvas publicado se puede editar a
mano en el navegador, y esas ediciones viven solo ahí. Si alguien tocó el
canvas, regenerar desde `generar.mjs` las pisa. En ese caso hay que leer primero
el canvas publicado y trabajar sobre eso — o decidir a conciencia que se
descarta lo editado a mano.

`salida/` está en `.gitignore`: los `.dc.html` son producto del generador y no
se commitean.
