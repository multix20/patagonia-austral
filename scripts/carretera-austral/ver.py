#!/usr/bin/env python3
"""Muestra qué hay REALMENTE en una página ya bajada, sin volver a pedirla.

Cuando el extractor no saca nada de una página, la pregunta es siempre la
misma: ¿la página no tiene el dato, o lo tiene de una forma que el extractor no
mira? Esto responde eso leyendo el HTML que quedó en `crudos/`.

    python ver.py whatsapp-accounts        # las que tengan eso en la URL
    python ver.py servicios-gastronomicos --texto 4000
    python ver.py aysen-ranch --crudo      # vuelca el HTML entero a un archivo

No usa red: trabaja sobre la caché. Si una URL no está bajada, no aparece.
"""

import argparse
import html as html_mod
import importlib.util
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
CRUDOS = os.path.join(RAIZ, 'crudos')

# 1_extraer.py empieza con un dígito: no se puede importar por nombre.
_spec = importlib.util.spec_from_file_location('extraer', os.path.join(RAIZ, '1_extraer.py'))
ex = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ex)

# El nombre del archivo en caché es un hash, así que la URL se recupera del
# propio HTML: WordPress siempre deja canonical y og:url.
RE_URL = [
    re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', re.I),
    re.compile(r'<meta[^>]+property=["\']og:url["\'][^>]+content=["\']([^"\']+)', re.I),
]


def url_de(texto):
    for rx in RE_URL:
        m = rx.search(texto)
        if m:
            return html_mod.unescape(m.group(1))
    return None


def visible(texto):
    """El texto que ve una persona: sin scripts, estilos ni etiquetas."""
    t = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', texto, flags=re.S | re.I)
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'[ \t]*\n[ \t]*', '\n', re.sub(r'[ \t]+', ' ', html_mod.unescape(t))).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('filtro', help='trozo de la URL a buscar en la caché')
    ap.add_argument('--texto', type=int, default=2500,
                    help='cuántos caracteres de texto visible mostrar (0 = nada)')
    ap.add_argument('--max', type=int, default=3, help='cuántas páginas mostrar')
    ap.add_argument('--crudo', action='store_true',
                    help='además, copia el HTML entero a ver_<n>.html para abrirlo')
    args = ap.parse_args()

    if not os.path.isdir(CRUDOS):
        sys.exit(f'No existe {CRUDOS}. Corre antes 1_extraer.py.')

    encontrados = 0
    for nombre in sorted(os.listdir(CRUDOS)):
        if encontrados >= args.max:
            break
        ruta = os.path.join(CRUDOS, nombre)
        if not nombre.endswith('.html'):
            continue
        with open(ruta, encoding='utf-8', errors='replace') as f:
            texto = f.read()
        u = url_de(texto) or ''
        if args.filtro not in u and args.filtro not in nombre:
            continue
        encontrados += 1

        print('=' * 78)
        print(f'URL      : {u or "(sin canonical)"}')
        print(f'archivo  : {nombre}  ({len(texto):,} caracteres)')
        print(f'título   : {ex.titulo(texto)}')

        objetos = ex.jsonld(texto)
        tipos = sorted({t for o in objetos for t in ex._tipos(o)})
        print(f'JSON-LD  : {len(objetos)} objetos · tipos: {", ".join(tipos) or "(ninguno)"}')
        negocios = ex.negocios_jsonld(objetos)
        print(f'  negocios reconocidos: {len(negocios)}')
        for n in negocios[:5]:
            print(f'    · {n["nombre"]} · tel={n["telefonos"]} · dir={n["direccion"]}')

        print(f'tel:     : {ex.RE_TEL.findall(texto)[:8]}')
        print(f'wa.me    : {ex.RE_WA.findall(texto)[:8]}')
        print(f'mailto:  : {ex.RE_MAIL.findall(texto)[:5]}')
        print(f'coords   : {ex.coords(texto)}')

        # Cualquier número que PAREZCA un teléfono chileno, esté o no enlazado:
        # es la diferencia entre "la página no tiene el dato" y "lo tiene escrito
        # como texto y nadie lo estaba mirando".
        sueltos = re.findall(r'(?:\+?56[\s.-]?)?9[\s.-]?\d{4}[\s.-]?\d{4}', visible(texto))
        print(f'fonos en el texto (sin enlace): {len(sueltos)} → {sueltos[:8]}')

        fichas = ex.extraer(u or 'https://carretera-austral.cl/', texto)
        print(f'>>> el extractor saca {len(fichas)} ficha(s)'
              + (f' por {fichas[0]["estrategia"]}' if fichas else ''))

        if args.texto:
            print('-' * 78)
            print(visible(texto)[:args.texto])

        if args.crudo:
            destino = os.path.join(RAIZ, f'ver_{encontrados}.html')
            with open(destino, 'w', encoding='utf-8') as f:
                f.write(texto)
            print(f'\n(HTML completo copiado a {destino})')

    print('=' * 78)
    print(f'{encontrados} página(s) mostradas para el filtro "{args.filtro}".')
    if not encontrados:
        print('Ninguna coincide. Ojo: solo se busca en lo que YA está bajado '
              '(crudos/), y el filtro se compara contra la URL canónica.')


if __name__ == '__main__':
    main()
