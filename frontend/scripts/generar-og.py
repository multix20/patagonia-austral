#!/usr/bin/env python3
"""Genera la imagen de vista previa (Open Graph) de rutaaustral.cl.

**Para qué es.** Cada vez que alguien comparte el enlace de la app —WhatsApp a un
amigo, el estado del furgón, un grupo de Facebook de la Carretera Austral, la bio
de Instagram, el correo a un municipio— la plataforma no muestra la app: muestra
la tarjeta que arma con las etiquetas `og:` del HTML. Sin `og:image` el enlace sale
como una línea de texto azul y no lo abre nadie. O sea: sin este archivo no se
puede publicitar la app, por bien que esté la app.

**Por qué un PNG y no el SVG que ya existe.** WhatsApp, Facebook e Instagram no
renderizan SVG en la vista previa. Tiene que ser un raster de 1200×630 (la
proporción 1.91:1 que esperan todas), y liviano: la miniatura de WhatsApp se
descarga con la señal que haya.

**El diseño no se reinventa acá.** El badge es exactamente el icono de la PWA
—se importa `generar-iconos.py` y se llama a su dibujo— para que la tarjeta que
ve alguien en WhatsApp sea la misma marca que después le queda en el lanzador del
teléfono. Lo único propio de este archivo es la composición horizontal: el icono
es cuadrado y la tarjeta es panorámica, así que la cordillera se dibuja de nuevo
con sus proporciones.

Uso:  python3 scripts/generar-og.py     (requiere Pillow)
"""

import importlib.util
import os

from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'public', 'og-rutaaustral.png')

ANCHO, ALTO = 1200, 630  # 1.91:1, el formato que piden Open Graph y Twitter
SS = 2  # supersampling: se dibuja al doble y se reduce con LANCZOS


def _iconos():
    """Carga `generar-iconos.py` como módulo (el guion del nombre impide el
    `import` normal). De ahí salen la paleta y el dibujo del icono."""
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generar-iconos.py')
    spec = importlib.util.spec_from_file_location('generar_iconos', ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


IC = _iconos()
VERDE, VERDE_OSC = IC.VERDE, IC.VERDE_OSC
CREMA, AMARILLO = IC.CREMA, IC.AMARILLO

# Fuentes candidatas por sistema: el generador tiene que correr igual en el
# contenedor de CI (DejaVu), en el Windows del fundador (Segoe UI / Arial) y en
# un Mac. Se toma la primera que exista; si no hay ninguna, Pillow cae en su
# fuente de mapa de bits y la tarjeta sale fea pero el script no revienta.
FUENTES_NEGRITA = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
]
FUENTES_NORMAL = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
]


def _fuente(candidatas, tam):
    for ruta in candidatas:
        if os.path.exists(ruta):
            return ImageFont.truetype(ruta, tam)
    return ImageFont.load_default()


def _cordillera(ancho, alto):
    """Silueta baja, a lo ancho de la tarjeta. Es propia y no la del icono: aquel
    lienzo es cuadrado y estas cumbres tienen que cruzar 1200 px sin estirarse."""
    base = alto * 0.72
    cumbres = [
        (-40, base + 40), (90, base - 34), (250, base + 16), (430, base - 58),
        (600, base + 6), (760, base - 44), (940, base + 24), (1090, base - 30),
        (1240, base + 34),
    ]
    return [(x * ancho / 1200, y) for x, y in cumbres] + [
        (ancho + 40, alto + 40), (-40, alto + 40)
    ]


def _badge(lado):
    """El icono de la PWA, tal cual, con sus esquinas redondeadas."""
    return IC._redondear(IC._dibujar(1.0)).resize((lado, lado), Image.LANCZOS)


def main():
    img = Image.new('RGB', (ANCHO * SS, ALTO * SS), VERDE)
    d = ImageDraw.Draw(img)

    d.polygon(
        [(x * SS, y * SS) for x, y in _cordillera(ANCHO, ALTO)], fill=VERDE_OSC
    )

    # Sol arriba a la derecha, el mismo gesto del icono.
    cx, cy, r = 1055, 132, 46
    d.ellipse(
        [(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=AMARILLO
    )

    x = 80  # margen izquierdo, común a todas las líneas
    # El badge va pegado CON su alfa como máscara: sus esquinas redondeadas son
    # transparentes y, sin máscara, Pillow las rellena de negro (el icono queda
    # con cuatro escuadras negras sobre el verde).
    badge = _badge(132 * SS)
    img.paste(badge, (x * SS, 84 * SS), badge)

    # Jerarquía pensada para la MINIATURA, no para verla a 1200 px: en WhatsApp
    # esta tarjeta se ve del porte de un timbre, así que el nombre manda y el
    # resto acompaña.
    d.text((x * SS, 268 * SS), 'Patagonia Austral',
           font=_fuente(FUENTES_NEGRITA, 86 * SS), fill=CREMA)
    d.text((x * SS, 376 * SS), 'La guía de la Carretera Austral',
           font=_fuente(FUENTES_NORMAL, 44 * SS), fill=CREMA)
    d.text((x * SS, 442 * SS), '26 localidades · Puerto Montt a Villa O\u2019Higgins',
           font=_fuente(FUENTES_NORMAL, 34 * SS), fill=(205, 224, 216))
    d.text((x * SS, 522 * SS), 'rutaaustral.cl',
           font=_fuente(FUENTES_NEGRITA, 40 * SS), fill=AMARILLO)

    img.resize((ANCHO, ALTO), Image.LANCZOS).save(SALIDA, optimize=True)
    print(f'  {os.path.basename(SALIDA)}  {os.path.getsize(SALIDA) // 1024} KB')


if __name__ == '__main__':
    main()
