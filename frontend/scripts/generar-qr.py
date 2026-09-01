#!/usr/bin/env python3
"""Genera los códigos QR que se reparten, cada uno con su código de canal.

Por qué existe. El QR que se imprime es el mejor canal del proyecto —el viajero
lo escanea en el mesón y la guía le queda instalada— y hasta ahora apuntaba a
`rutaaustral.cl` pelado: sus instalaciones entraban al panel como aperturas sin
origen. Un enlace repartido sin código de canal es una llegada anónima Y
huérfana: se sabe que pasó, no de dónde vino.

**Uno por oficina, no uno genérico.** Cada localidad lleva el suyo
(`?c=oit-cochrane`), porque lo que un municipio quiere saber es cuánta gente
instaló la guía EN SU MESÓN — y eso es, además, la razón por la que va a querer
ponerlo. El código se valida en el servidor contra las localidades cargadas
(`Interaccion::canalesValidos`), así que un pueblo nuevo trae su QR sin que haya
que tocar una lista.

Salida: SVG, que es lo que se imprime sin perder nitidez a cualquier tamaño.

    pip install qrcode
    python frontend/scripts/generar-qr.py

Los archivos van a `frontend/public/qr/`, FUERA del precache del service worker
(ver globIgnores en vite.config.js): el QR vive en la landing y en el mesón, y al
viajero no le sirve de nada llevarlo guardado en el teléfono.
"""
import os
import re
import sys

try:
    import qrcode
    import qrcode.image.svg
except ImportError:
    sys.exit('Falta la biblioteca: pip install qrcode')

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SALIDA = os.path.join(RAIZ, 'public', 'qr')
SITIO = 'https://rutaaustral.cl'
VERDE = '#0F6E56'

# Los canales que se imprimen en algo físico. Los de correo y redes no llevan
# QR: se reparten como enlace.
CANALES_FIJOS = {
    'qr-rutaaustral': None,          # el general, sin código: va en la landing
    'qr-local': 'qr-local',
    'qr-furgon': 'qr-furgon',
    'qr-meson': 'qr-meson',
    'volante': 'volante',
}

# Espejo de LOCALIDADES_SEED (frontend/src/data/places.js) y de LocalidadSeeder.
# Se lee del propio seed para no mantener una tercera copia a mano.
SEED = os.path.join(RAIZ, 'src', 'data', 'places.js')


def slugs_de_localidades() -> list[str]:
    """Saca los slugs del seed del frontend, que es la lista viva."""
    with open(SEED, encoding='utf-8') as f:
        contenido = f.read()

    bloque = re.search(r'LOCALIDADES_SEED\s*=\s*\[(.*?)\n\]', contenido, re.S)
    if not bloque:
        sys.exit('No se encontró LOCALIDADES_SEED en places.js')

    return re.findall(r"slug:\s*'([a-z0-9-]+)'", bloque.group(1))


def escribir(nombre: str, url: str) -> None:
    qr = qrcode.QRCode(
        # Corrección alta: el QR del mesón termina rayado, con un vaso encima o
        # con una esquina despegada, y tiene que seguir leyéndose igual.
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image()
    destino = os.path.join(SALIDA, f'{nombre}.svg')
    img.save(destino)

    # El color de marca: la biblioteca dibuja en negro y no expone el relleno
    # del path en esta versión.
    with open(destino, encoding='utf-8') as f:
        svg = f.read()
    svg = svg.replace('fill="#000000"', f'fill="{VERDE}"').replace('fill:#000000', f'fill:{VERDE}')
    with open(destino, 'w', encoding='utf-8') as f:
        f.write(svg)

    print(f'  {nombre}.svg  →  {url}')


def main() -> int:
    os.makedirs(SALIDA, exist_ok=True)

    print('Canales fijos:')
    for nombre, codigo in CANALES_FIJOS.items():
        escribir(nombre, f'{SITIO}/?c={codigo}' if codigo else f'{SITIO}/')

    slugs = slugs_de_localidades()
    print(f'\nUna oficina por localidad ({len(slugs)}):')
    for slug in slugs:
        escribir(f'oit-{slug}', f'{SITIO}/?c=oit-{slug}')

    print(f'\nListo: {len(CANALES_FIJOS) + len(slugs)} códigos en {SALIDA}')
    print('Recordar: el código tiene que estar desplegado ANTES de repartir el QR,')
    print('o esas primeras visitas se pierden sin dejar rastro.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
