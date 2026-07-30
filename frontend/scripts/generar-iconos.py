#!/usr/bin/env python3
"""Genera los iconos de la PWA a partir de un solo diseño.

El diseño es el **7 de la Ruta 7** (la Carretera Austral es la Ruta 7) en crema
sobre la silueta de la cordillera, con el sol en amarillo. Los colores salen de
`src/styles.css`.

Por qué un número y no un paisaje: el icono se ve casi siempre a 48 px en el
lanzador del celular. Ahí un camino en perspectiva o unas cumbres con detalle se
vuelven un borrón —y el icono anterior (montaña + sol en blanco) se confundía
con el glifo de "imagen rota". Una forma sola, gruesa y con mucho contraste
aguanta el tamaño y además identifica la ruta.

Se generan cuatro variantes porque cada plataforma recorta distinto:

  icon-192 / icon-512      "any": esquinas redondeadas propias (Chrome escritorio,
                           Windows). Es la que se ve sin recorte del sistema.
  icon-maskable-512        "maskable": a sangre y con el contenido dentro del
                           círculo seguro del 80% (Android le aplica su propia
                           máscara: círculo, squircle, gota...).
  apple-touch-icon         iOS: cuadrado a sangre y SIN alfa — iOS pone el
                           squircle y rellena de negro cualquier transparencia.

Uso:  python3 scripts/generar-iconos.py
"""

import os

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'public', 'icons')

# Paleta (misma de src/styles.css)
VERDE = (15, 110, 86)
VERDE_OSC = (8, 80, 65)
CREMA = (247, 245, 240)
AMARILLO = (245, 166, 35)

LADO = 512  # espacio de diseño
SS = 4  # supersampling: se dibuja a 4x y se reduce con LANCZOS

# Escala del contenido en la variante maskable. Con 0.72 lo importante (el 7 y
# el sol) queda holgadamente dentro del círculo seguro de radio 205.
ESCALA_MASKABLE = 0.72


def _t(p, escala, centro=LADO / 2):
    """Escala un punto respecto del centro (para la variante maskable)."""
    x, y = p
    return (centro + (x - centro) * escala, centro + (y - centro) * escala)


def _cordillera():
    """Silueta de la cordillera. Cierra fuera del lienzo para que el suelo llegue
    a sangre al borde inferior: un cierre plano dibujaría una línea recta que
    parte el icono en dos."""
    cumbres = [
        (-20, 300), (58, 196), (140, 258), (232, 150),
        (330, 244), (410, 186), (532, 268),
    ]
    return cumbres + [(532, 620), (-20, 620)]


def _siete():
    """El 7, como polígono geométrico: barra superior y asta diagonal de ancho
    constante. Dibujado a mano para no depender de una tipografía instalada."""
    return [
        (144, 124), (376, 124), (376, 192),
        (290, 410), (208, 410), (294, 192), (144, 192),
    ]


SOL = ((432, 104), 34)  # (centro, radio)


def _dibujar(escala):
    """Dibuja el diseño completo a sangre, con el contenido escalado."""
    img = Image.new('RGB', (LADO * SS, LADO * SS), VERDE)
    d = ImageDraw.Draw(img)

    def esc(pts):
        return [tuple(c * SS for c in _t(p, escala)) for p in pts]

    d.polygon(esc(_cordillera()), fill=VERDE_OSC)

    (sx, sy), sr = SOL
    cx, cy = _t((sx, sy), escala)
    r = sr * escala
    d.ellipse(
        [(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS],
        fill=AMARILLO,
    )

    d.polygon(esc(_siete()), fill=CREMA)

    return img.resize((LADO, LADO), Image.LANCZOS)


def _redondear(img, radio_rel=0.1875):
    """Aplica esquinas redondeadas (solo para la variante 'any')."""
    n = img.size[0]
    mascara = Image.new('L', (n * SS, n * SS), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(
        [0, 0, n * SS - 1, n * SS - 1], radius=int(n * radio_rel * SS), fill=255
    )
    salida = img.convert('RGBA')
    salida.putalpha(mascara.resize((n, n), Image.LANCZOS))
    return salida


def main():
    os.makedirs(SALIDA, exist_ok=True)
    base = _dibujar(1.0)

    # "any": esquinas propias, en 512 y 192.
    _redondear(base).save(os.path.join(SALIDA, 'icon-512.png'))
    _redondear(base.resize((192, 192), Image.LANCZOS)).save(
        os.path.join(SALIDA, 'icon-192.png')
    )

    # "maskable": a sangre, contenido dentro del círculo seguro del 80%.
    _dibujar(ESCALA_MASKABLE).convert('RGBA').save(
        os.path.join(SALIDA, 'icon-maskable-512.png')
    )

    # iOS: cuadrado, sin alfa.
    base.resize((180, 180), Image.LANCZOS).save(
        os.path.join(SALIDA, 'apple-touch-icon.png')
    )

    # Favicon vectorial, con los mismos puntos del diseño.
    def d2s(pts):
        return ' '.join(f'{x:.0f},{y:.0f}' for x, y in pts)

    (sx, sy), sr = SOL
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="rgb{VERDE}"/>
  <polygon points="{d2s(_cordillera())}" fill="rgb{VERDE_OSC}"/>
  <circle cx="{sx}" cy="{sy}" r="{sr}" fill="rgb{AMARILLO}"/>
  <polygon points="{d2s(_siete())}" fill="rgb{CREMA}"/>
</svg>
"""
    with open(os.path.join(SALIDA, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)

    for n in sorted(os.listdir(SALIDA)):
        print(f'  {n}  {os.path.getsize(os.path.join(SALIDA, n)) // 1024} KB')


if __name__ == '__main__':
    main()
