#!/usr/bin/env python3
"""Extrae los DATOS DE CONTACTO de los servicios que lista carretera-austral.cl.

Primer paso del pipeline. Recorre el sitio y escribe `ca-fichas.json` (datos
crudos ya normalizados) + `informe.txt` (lo que hay que mirar a ojo). El
segundo paso, `2_a_places.py`, es el que decide categorías y localidades y
produce el JSON del seeder.

QUÉ SE EXTRAE Y QUÉ NO — la regla más importante de este script
---------------------------------------------------------------
Se extraen **hechos**: nombre del negocio, teléfono, WhatsApp, correo, sitio
web, dirección, horario y coordenadas. Un teléfono no es de nadie: es el mismo
número en cualquier guía, y por eso se puede tomar.

**NO se extrae la prosa.** Las descripciones, las reseñas y los textos de
carretera-austral.cl son obra de ese sitio —una guía comercial ajena, que
además vende sus propios paquetes— y copiarlos sería quedarse con su trabajo,
no con un dato público. Este script guarda el HTML completo en `crudos/` para
que quien cure la ficha pueda LEER el original, pero el JSON de salida no
arrastra ni una línea de texto descriptivo: las descripciones de la app se
escriben acá, bilingües, como se hizo con SERNATUR y con Tortel.

Por lo mismo se saltan por defecto las páginas `/producto/…`: son los paquetes
turísticos que vende el propio sitio. No son dato de servicio de la ruta, son
su catálogo.

Además: el dato que llega acá se REVISA antes de publicarse. Una guía ajena
también tiene teléfonos viejos, y el proyecto no se está diferenciando por
copiar rápido sino por tener el dato bueno.

CÓMO SE PORTA CON EL SITIO
--------------------------
  · Respeta `robots.txt` (si prohíbe una ruta, no la pide; si prohíbe todo, se
    detiene y lo dice).
  · Espera 3–6 s entre páginas, en serie, nunca en paralelo.
  · Se identifica con un User-Agent propio que apunta a rutaaustral.cl.
  · Cachea todo en `crudos/`: una segunda corrida no vuelve a pedir nada. Es
    reanudable — si se corta, se relanza el mismo comando.

OJO: este script se corre EN LOCAL
----------------------------------
Desde una sesión web de Claude Code no hay salida de red hacia
carretera-austral.cl (la bloquea el proxy del entorno, igual que con tortel.cl:
`403` al CONNECT). Por eso el script se escribió a ciegas, defensivo y contando
lo que encuentra: la primera corrida de verdad es `--explorar`, y el informe es
el que manda.

Uso (en Windows, `py` en vez de `python3`: el `python3` de PowerShell es el
stub del Microsoft Store y no ejecuta nada):
    python3 scripts/carretera-austral/1_extraer.py --explorar   # reconocimiento
    python3 scripts/carretera-austral/1_extraer.py --limite 20  # prueba corta
    python3 scripts/carretera-austral/1_extraer.py              # todo

Sin dependencias: solo biblioteca estándar (así no hace falta venv en Windows).
"""

import argparse
import gzip
import hashlib
import html as html_mod
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import date

SITIO = 'https://carretera-austral.cl'

# El comando con el que este mismo script se invoca, para que los mensajes de
# "corre esto ahora" digan el que funciona en la máquina de quien los lee. En
# Windows `python3` es el stub del Microsoft Store: no ejecuta nada.
PY_CMD = 'py' if os.name == 'nt' else 'python3'

# Nos identificamos y dejamos dónde reclamar. A propósito NO va un correo
# personal acá: es una cabecera que viaja a un tercero. Si quieres ser
# contactable, pon una dirección de contacto del proyecto en CONTACTO.
CONTACTO = ''
UA = ('PatagoniaAustralBot/1.0 (+https://rutaaustral.cl'
      + (f'; {CONTACTO}' if CONTACTO else '') + ')')

DEMORA = (3.0, 6.0)      # segundos entre páginas
TIMEOUT = 30
REINTENTOS = 3

RAIZ = os.path.dirname(os.path.abspath(__file__))
CRUDOS = os.path.join(RAIZ, 'crudos')
SALIDA = os.path.join(RAIZ, 'ca-fichas.json')
INFORME = os.path.join(RAIZ, 'informe.txt')

# Tipos de JSON-LD que SON un negocio de la ruta. Lo que no está acá se ignora:
# el `Organization` del propio sitio, `WebPage`, `BreadcrumbList` y compañía no
# son fichas, y colarlos significa importar a carretera-austral.cl como si
# fuera un hospedaje de Cochrane.
TIPOS_NEGOCIO = {
    'localbusiness', 'lodgingbusiness', 'hotel', 'motel', 'hostel', 'resort',
    'bedandbreakfast', 'campground', 'apartment', 'houseboat',
    'restaurant', 'cafeorcoffeeshop', 'foodestablishment', 'bakery', 'bar',
    'touristattraction', 'touristdestination', 'travelagency', 'store',
    'gasstation', 'automotivebusiness', 'healthandbeautybusiness',
    'sportsactivitylocation', 'campingpitch', 'place',
}

# Rutas que no se piden nunca: la maquinaria de la tienda, las taxonomías y el
# ruido de WordPress.
#
# OJO CON `/producto/` — NO está acá, y es a propósito (24-ago-2026). La primera
# versión lo excluía creyendo que eran los paquetes que el sitio vende. No lo
# son: `/producto/` es **el directorio de negocios**. Detrás de
# `camping-en-cochrane` está el Camping Aquasol, y detrás de
# `cabanas-y-tinaja-en-cochrane` las Cabañas Patagonino. Son 429 fichas, o sea
# el grueso del dato útil del sitio, y estaban quedando fuera.
#
# Los paquetes que el sitio SÍ vende viven en el mismo lugar
# (`carretera-austral-10-dias-9-noches`, `paquete-turistico-caleta-tortel`),
# pero se caen solos en el paso 2: sus slugs no nombran una localidad, y la
# regla de no adivinar los descarta sin que haya que enumerarlos.
EXCLUIR_RUTA = re.compile(
    r'/(etiqueta-producto|categoria-producto|product-tag|product-category'
    r'|tienda|shop|carrito|cart|checkout|mi-cuenta|my-account'
    r'|wp-admin|wp-content|wp-includes|feed|author|tag|comment-page|\?)',
    re.I)

# Las páginas del sitio SOBRE SÍ MISMO. No son servicios de la ruta y varias
# traen su propio teléfono: sin esto, la guía terminaría importada como si fuera
# un hospedaje. (Hoy las salva el filtro de localidad, que no encuentra ninguna
# en esas URLs, pero descartarlas acá ahorra la petición y no depende de eso.)
EXCLUIR_PROPIAS = re.compile(
    r'^/(contacto|nosotros|club-de-amigos|anunciate|politica-|privacidad'
    r'|finalizar-compra|redes-sociales|supercustom-menus|blog)/', re.I)

# Extensiones que no son páginas.
EXCLUIR_EXT = re.compile(r'\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mp3|kml|gpx)$', re.I)


# ───────────────────────────── red y caché ──────────────────────────────

def _ruta_cache(url):
    return os.path.join(CRUDOS, hashlib.sha1(url.encode()).hexdigest() + '.html')


def pedir(url, usar_cache=True):
    """Devuelve (texto, cabeceras, desde_cache). Reintenta con espera creciente.

    El texto de una página ya vista sale del disco: reanudar una corrida
    interrumpida no le cuesta ni una petición al sitio.
    """
    ruta = _ruta_cache(url)
    if usar_cache and os.path.isfile(ruta):
        with open(ruta, encoding='utf-8') as f:
            return f.read(), {}, True

    ultimo = None
    for intento in range(REINTENTOS):
        try:
            pet = urllib.request.Request(url, headers={
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/json,*/*',
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.6',
                'Accept-Encoding': 'gzip',
            })
            with urllib.request.urlopen(pet, timeout=TIMEOUT) as r:
                bruto = r.read()
                if r.headers.get('Content-Encoding') == 'gzip':
                    bruto = gzip.decompress(bruto)
                # El charset declarado manda; si miente, no se cae por eso.
                juego = r.headers.get_content_charset() or 'utf-8'
                texto = bruto.decode(juego, errors='replace')
                cab = dict(r.headers)
            os.makedirs(CRUDOS, exist_ok=True)
            with open(ruta, 'w', encoding='utf-8') as f:
                f.write(texto)
            return texto, cab, False
        except urllib.error.HTTPError as e:
            # Un 404 o un 403 no mejoran reintentando.
            if e.code in (404, 403, 410):
                return None, {'_error': f'HTTP {e.code}'}, False
            ultimo = f'HTTP {e.code}'
        except Exception as e:                      # noqa: BLE001
            ultimo = f'{type(e).__name__}: {e}'
        time.sleep(2 ** intento)
    return None, {'_error': ultimo or 'desconocido'}, False


def esperar():
    time.sleep(random.uniform(*DEMORA))


# ─────────────────────────── descubrimiento ─────────────────────────────

def leer_robots():
    """(parser, sitemaps). Si robots.txt no se puede leer, se asume permitido
    solo lo que no esté en EXCLUIR_RUTA y se avisa en el informe."""
    rp = urllib.robotparser.RobotFileParser()
    texto, cab, _ = pedir(SITIO + '/robots.txt', usar_cache=False)
    sitemaps = []
    if texto is None:
        rp.parse([])
        return rp, sitemaps, cab.get('_error', 'sin respuesta')
    rp.parse(texto.splitlines())
    for linea in texto.splitlines():
        if linea.lower().startswith('sitemap:'):
            sitemaps.append(linea.split(':', 1)[1].strip())
    return rp, sitemaps, None


def permitido(rp, url):
    try:
        return rp.can_fetch(UA, url)
    except Exception:                                # noqa: BLE001
        return True


def tipos_wp():
    """Tipos de contenido publicados por la API REST de WordPress, con su total.

    Es la vía preferida: da la lista completa y paginada sin adivinar HTML. Si
    el sitio la tiene apagada, devuelve {} y se cae al sitemap.
    """
    texto, _, _ = pedir(SITIO + '/wp-json/wp/v2/types')
    if not texto:
        return {}
    try:
        datos = json.loads(texto)
    except ValueError:
        return {}
    tipos = {}
    for clave, info in (datos or {}).items():
        base = ((info or {}).get('rest_base') or '').strip()
        # Los tipos internos del editor de bloques declaran un rest_base con
        # placeholder ("font-families/(?P<font_family_id>[\d]+)/font-faces"):
        # eso no es una URL que se pueda pedir.
        if not base or '(?P<' in base:
            continue
        tipos[clave] = {'rest_base': base, 'total': None}
    return tipos


def total_wp(rest_base):
    texto, cab, _ = pedir(f'{SITIO}/wp-json/wp/v2/{rest_base}?per_page=1', usar_cache=False)
    if texto is None:
        return None
    for k, v in cab.items():
        if k.lower() == 'x-wp-total':
            try:
                return int(v)
            except ValueError:
                return None
    return None


def urls_wp(rest_base):
    """Recorre /wp-json/wp/v2/<tipo> paginado y devuelve [(url, titulo)]."""
    salida, pagina = [], 1
    while True:
        u = f'{SITIO}/wp-json/wp/v2/{rest_base}?per_page=100&page={pagina}&_fields=link,title,type'
        texto, _, cacheado = pedir(u)
        if not texto:
            break
        try:
            lote = json.loads(texto)
        except ValueError:
            break
        if not isinstance(lote, list) or not lote:
            break
        for it in lote:
            enlace = (it or {}).get('link')
            titulo = html_mod.unescape(((it or {}).get('title') or {}).get('rendered', '')).strip()
            if enlace:
                salida.append((enlace, titulo))
        if len(lote) < 100:
            break
        pagina += 1
        if not cacheado:
            esperar()
    return salida


def urls_sitemap(url, vistos=None, profundidad=0):
    """Sitemaps anidados → lista plana de URLs de páginas."""
    vistos = vistos if vistos is not None else set()
    if url in vistos or profundidad > 3:
        return []
    vistos.add(url)
    texto, _, cacheado = pedir(url)
    if not texto:
        return []
    if not cacheado:
        esperar()
    locs = [html_mod.unescape(m) for m in re.findall(r'<loc>\s*(.*?)\s*</loc>', texto, re.S)]
    if '<sitemapindex' in texto:
        salida = []
        for sub in locs:
            salida += urls_sitemap(sub, vistos, profundidad + 1)
        return salida
    return locs


# ──────────────────────── extracción de una página ──────────────────────

def _sin_etiquetas(fragmento):
    fragmento = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', fragmento, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', html_mod.unescape(re.sub(r'<[^>]+>', ' ', fragmento))).strip()


def jsonld(texto):
    """Todos los objetos JSON-LD de la página, con el @graph aplanado."""
    objetos = []
    for bloque in re.findall(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            texto, re.S | re.I):
        try:
            datos = json.loads(html_mod.unescape(bloque.strip()))
        except ValueError:
            continue
        pila = [datos]
        while pila:
            x = pila.pop()
            if isinstance(x, list):
                pila.extend(x)
            elif isinstance(x, dict):
                if '@graph' in x:
                    pila.append(x['@graph'])
                objetos.append(x)
    return objetos


def _tipos(obj):
    t = obj.get('@type') or obj.get('type') or []
    if isinstance(t, str):
        t = [t]
    return {str(x).lower() for x in t}


def negocios_jsonld(objetos):
    """Los objetos que son un negocio, ya con sus campos planos."""
    salida = []
    for o in objetos:
        if not (_tipos(o) & TIPOS_NEGOCIO):
            continue
        nombre = o.get('name')
        if not isinstance(nombre, str) or not nombre.strip():
            continue
        dom = urllib.parse.urlparse(SITIO).netloc.lower()
        # El propio sitio se describe con schema; no es una ficha de la ruta.
        if dom in str(o.get('url', '')).lower() and 'carretera austral' in nombre.lower():
            continue
        dir_ = o.get('address')
        if isinstance(dir_, dict):
            partes = [dir_.get('streetAddress'), dir_.get('addressLocality'),
                      dir_.get('addressRegion')]
            dir_ = ', '.join(p for p in partes if isinstance(p, str) and p.strip())
        elif not isinstance(dir_, str):
            dir_ = None
        geo = o.get('geo') if isinstance(o.get('geo'), dict) else {}
        horario = o.get('openingHours')
        if isinstance(horario, list):
            horario = '; '.join(str(h) for h in horario)
        salida.append({
            'nombre': html_mod.unescape(nombre).strip(),
            'telefonos': [t for t in [o.get('telephone')] if isinstance(t, str)],
            'emails': [e for e in [o.get('email')] if isinstance(e, str)],
            'webs': [w for w in [o.get('url'), o.get('sameAs')] if isinstance(w, str)],
            'direccion': dir_,
            'horario': horario if isinstance(horario, str) else None,
            'lat': geo.get('latitude'),
            'lng': geo.get('longitude'),
            'tipos_jsonld': sorted(_tipos(o)),
            'estrategia': 'json-ld',
        })
    return salida


RE_TEL = re.compile(r'href=["\']tel:([^"\']+)["\']', re.I)
RE_MAIL = re.compile(r'href=["\']mailto:([^"\'?]+)', re.I)
RE_WA = re.compile(r'(?:wa\.me/|api\.whatsapp\.com/send\?phone=|web\.whatsapp\.com/send\?phone=)'
                   r'\+?(\d{6,15})', re.I)
RE_ENC = re.compile(r'<h([1-6])[^>]*>(.*?)</h\1>', re.S | re.I)


def tarjetas_por_contacto(texto):
    """Heurística de respaldo: un `tel:` (o un wa.me) marca una tarjeta.

    Muchas guías WordPress listan varios negocios en UNA página, sin schema. El
    nombre se toma del último encabezado ANTES del enlace, que es como se ven
    esas tarjetas. Es una heurística, y por eso el informe cuenta cuántas fichas
    salieron por esta vía: son las que hay que mirar una por una.
    """
    anclas = [(m.start(), 'tel', m.group(1)) for m in RE_TEL.finditer(texto)]
    anclas += [(m.start(), 'wa', m.group(1)) for m in RE_WA.finditer(texto)]
    if not anclas:
        return []
    encabezados = [(m.start(), _sin_etiquetas(m.group(2))) for m in RE_ENC.finditer(texto)]

    tarjetas = {}
    for pos, clase, valor in sorted(anclas):
        previos = [e for e in encabezados if e[0] < pos]
        nombre = previos[-1][1] if previos else None
        if not nombre or len(nombre) > 120:
            continue
        t = tarjetas.setdefault(nombre, {
            'nombre': nombre, 'telefonos': [], 'emails': [], 'webs': [],
            'direccion': None, 'horario': None, 'lat': None, 'lng': None,
            'tipos_jsonld': [], 'estrategia': 'encabezado+contacto',
        })
        destino = 'telefonos' if clase == 'tel' else 'whatsapp'
        t.setdefault(destino, [])
        if valor not in t[destino]:
            t[destino].append(valor)
    return list(tarjetas.values())


RE_COORD = [
    re.compile(r'!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)'),           # embed de Google Maps
    re.compile(r'[?&]q=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)'),       # ...maps?q=lat,lng
    re.compile(r'@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)'),               # .../@lat,lng,15z
    re.compile(r'data-lat=["\'](-?\d{1,2}\.\d+)["\'][^>]*data-lng=["\'](-?\d{1,3}\.\d+)'),
    re.compile(r'"lat(?:itude)?"\s*:\s*"?(-?\d{1,2}\.\d+)"?\s*,\s*"l(?:ng|on|ongitude)"\s*:\s*"?(-?\d{1,3}\.\d+)'),
]

# Caja que contiene la Carretera Austral con holgura (Puerto Montt → O'Higgins).
# Un punto fuera de acá no es un lugar lejano: es un dato malo o un lat/lng dado
# vuelta, y vale más descartarlo que poner un pin en el mar.
CAJA = (-49.5, -40.5, -75.5, -70.5)   # lat_min, lat_max, lng_min, lng_max


def en_caja(lat, lng):
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return False
    return CAJA[0] <= lat <= CAJA[1] and CAJA[2] <= lng <= CAJA[3]


def coords(texto):
    for rx in RE_COORD:
        for m in rx.finditer(texto):
            lat, lng = m.group(1), m.group(2)
            if en_caja(lat, lng):
                return float(lat), float(lng)
    return None, None


def titulo(texto):
    m = re.search(r'<title[^>]*>(.*?)</title>', texto, re.S | re.I)
    if not m:
        return None
    t = _sin_etiquetas(m.group(1))
    # "Camping Aquasol | Carretera Austral" → "Camping Aquasol"
    return re.split(r'\s*[|–—]\s*', t)[0].strip() or None


def extraer(url, texto):
    """Una página → cero o más fichas, solo con datos de contacto."""
    fichas = negocios_jsonld(jsonld(texto))
    if not fichas:
        fichas = tarjetas_por_contacto(texto)

    correos_pag = [html_mod.unescape(e).strip() for e in RE_MAIL.findall(texto)]
    lat_pag, lng_pag = coords(texto)
    t_pag = titulo(texto)

    # Una sola ficha en la página: los datos sueltos de la página son suyos.
    if len(fichas) == 1:
        f = fichas[0]
        if not f.get('emails'):
            f['emails'] = correos_pag[:2]
        if not f.get('whatsapp'):
            f['whatsapp'] = RE_WA.findall(texto)[:2]
        if not f.get('telefonos'):
            f['telefonos'] = [html_mod.unescape(x).strip() for x in RE_TEL.findall(texto)][:2]
        if f.get('lat') is None and lat_pag is not None:
            f['lat'], f['lng'] = lat_pag, lng_pag

    # Ninguna ficha pero la página tiene contacto propio: es un negocio sin
    # schema y sin tarjetas. Entra con el título de la página como nombre.
    if not fichas:
        tels = [html_mod.unescape(x).strip() for x in RE_TEL.findall(texto)]
        was = RE_WA.findall(texto)
        if (tels or was) and t_pag:
            fichas = [{
                'nombre': t_pag, 'telefonos': tels[:2], 'whatsapp': was[:2],
                'emails': correos_pag[:2], 'webs': [], 'direccion': None,
                'horario': None, 'lat': lat_pag, 'lng': lng_pag,
                'tipos_jsonld': [], 'estrategia': 'pagina-completa',
            }]

    hoy = date.today().isoformat()
    for f in fichas:
        f.setdefault('whatsapp', [])
        f['url'] = url
        f['titulo_pagina'] = t_pag
        f['fuente'] = 'carretera-austral.cl'
        f['fecha_extraccion'] = hoy
        f['ruta'] = [p for p in urllib.parse.urlparse(url).path.split('/') if p]
        if f.get('lat') is not None and not en_caja(f['lat'], f['lng']):
            f['lat'] = f['lng'] = None
    return fichas


# ──────────────────────────────── main ──────────────────────────────────

def anotar(informe, linea=''):
    """Va al informe Y a la pantalla, en el momento.

    Antes el informe se juntaba en una lista y se imprimía TODO al final. Con
    3–6 s de espera por página y un inventario que puede tardar minutos, eso
    deja la consola muda un rato largo, y un script mudo parece colgado: el
    primer reflejo de cualquiera —con razón— es cortarlo con Ctrl-C.
    """
    informe.append(linea)
    print(linea, flush=True)


def inventario(rp, sitemaps, informe):
    """URLs candidatas: primero la API REST de WordPress, si no el sitemap."""
    urls, origen = [], None
    print('Consultando la API REST de WordPress…', flush=True)
    tipos = tipos_wp()
    if tipos:
        origen = 'wp-json'
        anotar(informe, f'API REST de WordPress: {len(tipos)} tipos de contenido')
        for clave, info in sorted(tipos.items()):
            n = total_wp(info['rest_base'])
            info['total'] = n
            anotar(informe, f"  · {clave} (/{info['rest_base']}): "
                            f"{n if n is not None else '?'}")
            esperar()   # contar tipos también son peticiones: no ráfaga
        for clave, info in sorted(tipos.items()):
            if clave in ('attachment', 'wp_block', 'nav_menu_item', 'product_variation'):
                continue
            print(f'  listando /{info["rest_base"]}…', flush=True)
            urls += urls_wp(info['rest_base'])
    if not urls:
        origen = 'sitemap'
        candidatos = sitemaps or [SITIO + '/wp-sitemap.xml', SITIO + '/sitemap_index.xml',
                                  SITIO + '/sitemap.xml']
        anotar(informe, 'Sin API REST utilizable; se usa sitemap: ' + ', '.join(candidatos))
        for s in candidatos:
            urls += [(u, None) for u in urls_sitemap(s)]

    # Filtro: fuera la tienda, los adjuntos y lo que robots.txt prohíba.
    limpias, descartadas, prohibidas = [], 0, 0
    vistas = set()
    for u, t in urls:
        if u in vistas:
            continue
        vistas.add(u)
        ruta_u = urllib.parse.urlparse(u).path
        if (EXCLUIR_RUTA.search(u) or EXCLUIR_EXT.search(u)
                or EXCLUIR_PROPIAS.match(ruta_u)):
            descartadas += 1
            continue
        if not permitido(rp, u):
            prohibidas += 1
            continue
        limpias.append((u, t))
    anotar(informe, f'URLs candidatas: {len(limpias)}  '
                    f'(descartadas por ser tienda/adjunto: {descartadas}; '
                    f'prohibidas por robots.txt: {prohibidas})')
    return limpias, origen


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--explorar', action='store_true',
                    help='solo reconocimiento: no baja las páginas, dice qué hay')
    ap.add_argument('--limite', type=int, default=None,
                    help='máximo de páginas a BAJAR (el inventario se arma entero igual)')
    ap.add_argument('--solo', default=None,
                    help='filtra las URLs que contengan este texto (p. ej. visita-cochrane)')
    args = ap.parse_args()

    os.makedirs(CRUDOS, exist_ok=True)
    informe = [f'Extracción de {SITIO} — {date.today().isoformat()}',
               f'User-Agent: {UA}', '']

    print(f'Leyendo {SITIO}/robots.txt…', flush=True)
    rp, sitemaps, err = leer_robots()
    if err:
        anotar(informe, f'robots.txt: NO se pudo leer ({err}). '
                        'Se sigue solo con las rutas de la lista blanca interna.')
    else:
        anotar(informe, f'robots.txt leído. Sitemaps declarados: {len(sitemaps)}')
        if not permitido(rp, SITIO + '/'):
            print('robots.txt PROHÍBE recorrer el sitio con este User-Agent. '
                  'No se extrae nada.', file=sys.stderr)
            sys.exit(2)

    urls, origen = inventario(rp, sitemaps, informe)
    if args.solo:
        urls = [(u, t) for u, t in urls if args.solo in u]
        anotar(informe, f'Filtro --solo="{args.solo}": quedan {len(urls)} URLs')
    if args.limite:
        urls = urls[:args.limite]

    if args.explorar:
        anotar(informe)
        anotar(informe, 'MODO EXPLORAR — no se bajó ninguna página de contenido.')
        secciones = {}
        for u, _ in urls:
            partes = [p for p in urllib.parse.urlparse(u).path.split('/') if p]
            secciones.setdefault(partes[0] if partes else '(raíz)', []).append(u)
        anotar(informe, f'Secciones de primer nivel: {len(secciones)}')
        for s, us in sorted(secciones.items(), key=lambda x: -len(x[1])):
            anotar(informe, f'  {len(us):4d}  /{s}/')
            for u in us[:3]:
                anotar(informe, f'          {u}')
        with open(INFORME, 'w', encoding='utf-8') as f:
            f.write('\n'.join(informe) + '\n')
        print(f'\n→ {INFORME}')
        print('Revisa las secciones y después corre sin --explorar.')
        return

    fichas, errores, sin_datos = [], [], 0

    def guardar(paginas, parcial):
        with open(SALIDA, 'w', encoding='utf-8') as f:
            json.dump({'metadata': {'fuente': SITIO, 'origen_inventario': origen,
                                    'fecha': date.today().isoformat(),
                                    'paginas': paginas, 'parcial': parcial},
                       'fichas': fichas}, f, ensure_ascii=False, indent=2)

    print(f'\nBajando {len(urls)} páginas, con 3–6 s de espera entre cada una. '
          f'Estimado: ~{len(urls) * 4.5 / 60:.0f} min.', flush=True)
    for i, (u, t) in enumerate(urls, 1):
        try:
            texto, cab, cacheado = pedir(u)
            if texto is None:
                errores.append((u, cab.get('_error', '?')))
                if not cacheado:
                    esperar()
                continue
            nuevas = extraer(u, texto)
            if not nuevas:
                sin_datos += 1
            fichas += nuevas
            if i % 10 == 0 or i == len(urls):
                print(f'  {i}/{len(urls)} páginas · {len(fichas)} fichas', flush=True)
                guardar(i, i < len(urls))   # si se corta, lo extraído no se pierde
            if not cacheado:
                esperar()
        except KeyboardInterrupt:
            # Cortar a mano es lo ESPERADO en una corrida de media hora, no un
            # error: se guarda lo que hay y se dice dónde quedó, en vez de tirar
            # un traceback de cuarenta líneas encima del trabajo hecho.
            guardar(i, True)
            print(f'\n\nCortado a mano en la página {i} de {len(urls)}. '
                  f'{len(fichas)} fichas guardadas.')
            print(f'→ {SALIDA} (parcial)')
            print('Las páginas bajadas quedan en crudos/: al relanzar el mismo '
                  'comando sigue donde quedó, sin volver a pedirlas.')
            return

    guardar(len(urls), False)

    por_estrategia, por_seccion = {}, {}
    for f in fichas:
        por_estrategia[f['estrategia']] = por_estrategia.get(f['estrategia'], 0) + 1
        s = f['ruta'][0] if f['ruta'] else '(raíz)'
        por_seccion[s] = por_seccion.get(s, 0) + 1

    for linea in [
        '', f'Páginas visitadas: {len(urls)}  ·  sin ningún dato de contacto: {sin_datos}',
        f'Fichas extraídas: {len(fichas)}',
        f'  con teléfono:   {sum(1 for f in fichas if f["telefonos"])}',
        f'  con WhatsApp:   {sum(1 for f in fichas if f["whatsapp"])}',
        f'  con correo:     {sum(1 for f in fichas if f["emails"])}',
        f'  con dirección:  {sum(1 for f in fichas if f["direccion"])}',
        f'  con coordenada: {sum(1 for f in fichas if f["lat"] is not None)}',
        '', 'Por estrategia de extracción (las que NO son json-ld hay que revisarlas a ojo):',
    ]:
        anotar(informe, linea)
    for k, v in sorted(por_estrategia.items(), key=lambda x: -x[1]):
        anotar(informe, f'  {v:5d}  {k}')
    anotar(informe)
    anotar(informe, 'Por sección del sitio:')
    for k, v in sorted(por_seccion.items(), key=lambda x: -x[1]):
        anotar(informe, f'  {v:5d}  /{k}/')
    if errores:
        anotar(informe)
        anotar(informe, f'URLs con error ({len(errores)}):')
        for u, e in errores[:40]:
            anotar(informe, f'  {e}  {u}')

    with open(INFORME, 'w', encoding='utf-8') as f:
        f.write('\n'.join(informe) + '\n')
    print(f'\n→ {SALIDA}\n→ {INFORME}')
    print(f'Siguiente paso: {PY_CMD} scripts/carretera-austral/2_a_places.py')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\nCortado a mano durante el inventario. Lo que alcanzó a bajar '
              'queda en crudos/ y la próxima corrida lo reusa.', file=sys.stderr)
        sys.exit(130)
