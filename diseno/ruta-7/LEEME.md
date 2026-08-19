# Ruta 7 — rediseño de la píldora del mapa

Cuatro direcciones para el elemento que hoy dice «Patagonia Austral · Ruta
completa» (`.loc-pill` en `frontend/src/App.jsx`, estilos en
`frontend/src/styles.css`). Pasa a decir solo **Ruta 7**.

- `Main.dc.html` — A · Placa de ruta (es también el archivo de entrada del lienzo)
- `OpcionB.dc.html` — B · Waze vivo
- `OpcionC.dc.html` — C · Cinta de asfalto
- `OpcionD.dc.html` — D · Vidrio nocturno
- `canvas.json` — posición de cada pantalla en el lienzo y las notas al margen

B, C y D **se generan** desde `Main.dc.html` con `node gen.mjs`: todo lo que
rodea a la píldora (mapa, campanita, idioma, rail, barra de categorías) es
idéntico en las cuatro a propósito, para que lo único que se compare sea la
píldora. Si hay que tocar el entorno, se toca en `Main.dc.html` y se vuelve a
correr `gen.mjs`.

El lienzo publicado se arma con el helper de la skill `design` y no se versiona
(pesa 2 MB porque lleva el editor dentro).
