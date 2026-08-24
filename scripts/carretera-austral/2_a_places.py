#!/usr/bin/env python3
"""Convierte las fichas de carretera-austral.cl al formato `places` del proyecto.

Segundo paso, después de `1_extraer.py`. Lee `ca-fichas.json` y escribe
`ca_places.json` con la misma forma que
`backend/database/seeders/data/places.json`, listo para
`CarreteraAustralPlaceSeeder`.

Acá se toman las decisiones EDITORIALES; el paso 1 solo junta datos.

Las cuatro reglas que gobiernan este archivo
--------------------------------------------
1. **Los textos se escriben acá, no se copian.** Del origen entran nombre y
   contacto —hechos—; la descripción sale de una PLANTILLA bilingüe honesta,
   que dice lo que el dato sostiene y nada más. Copiar la prosa de una guía
   ajena sería quedarse con su trabajo, y además dejaría la app con texto en un
   solo idioma cuando el proyecto es ES/EN obligatorio.

2. **Todo entra en BORRADOR** (`publicado: false`). Desde el 27-jul-2026 rige
   *un servicio publicado por localidad y categoría*: un lote externo publicado
   de golpe rompe esa regla. Es el camino de SERNATUR y de Tortel — rango de ids
   propio, seeder aparte que no corre en el deploy, curación desde el CMS.

3. **Lo que no se sabe clasificar NO se inventa: se deja fuera y se lista.** Una
   URL sin categoría conocida no cae a `servicio` por defecto; sale en el
   informe para agregarla a la tabla. Es la misma decisión que en Tortel, donde
   un `else` silencioso habría enterrado las emergencias del pueblo.

4. **Comercio sin forma de contactarlo, fuera.** Es la regla que quedó del
   post-mortem de Tortel: un alojamiento o un restorán sin teléfono ni WhatsApp
   no le sirve a nadie y solo satura el mapa. No se aplica a `atractivo` ni a
   `emergencia`, que no necesitan teléfono.

Uso:  python3 scripts/carretera-austral/2_a_places.py
      (en Windows, `py` en vez de `python3`)
"""

import hashlib
import json
import math
import os
import re
import sys
import unicodedata

# En Windows `python3` es el stub del Microsoft Store y no ejecuta nada.
PY_CMD = 'py' if os.name == 'nt' else 'python3'

RAIZ = os.path.dirname(os.path.abspath(__file__))
ENTRADA = os.path.join(RAIZ, 'ca-fichas.json')
SALIDA = os.path.join(RAIZ, 'ca_places.json')
INFORME = os.path.join(RAIZ, 'informe_places.txt')
PLACES_PROYECTO = os.path.join(RAIZ, '..', '..', 'backend', 'database', 'seeders',
                               'data', 'places.json')

# 1–195 seed a mano · 2000–2181 SERNATUR · 3001–3083 preliminares · 4000+ Tortel.
ID_INICIAL = 5000

# Localidades de la app (espejo de LocalidadSeeder). El centro se usa para
# calcular `dist` y para ubicar las fichas que llegan sin coordenada.
LOCALIDADES = {
    'puerto-montt': (-41.4693, -72.9424, 'Puerto Montt'),
    'hornopiren': (-41.9578, -72.4372, 'Hornopirén'),
    'caleta-gonzalo': (-42.5633, -72.5989, 'Caleta Gonzalo'),
    'chaiten': (-42.9169, -72.7086, 'Chaitén'),
    'el-amarillo': (-42.9333, -72.5333, 'El Amarillo'),
    'villa-santa-lucia': (-43.4167, -72.3667, 'Villa Santa Lucía'),
    'futaleufu': (-43.1847, -71.8697, 'Futaleufú'),
    'palena': (-43.6167, -71.8000, 'Palena'),
    'la-junta': (-43.9756, -72.4058, 'La Junta'),
    'raul-marin-balmaceda': (-43.7783, -72.9603, 'Raúl Marín Balmaceda'),
    'puyuhuapi': (-44.3286, -72.5567, 'Puyuhuapi'),
    'villa-amengual': (-44.7167, -72.1667, 'Villa Amengual'),
    'puerto-cisnes': (-44.7422, -72.6889, 'Puerto Cisnes'),
    'villa-manihuales': (-45.2103, -72.1547, 'Villa Mañihuales'),
    'puerto-aysen': (-45.4033, -72.6947, 'Puerto Aysén'),
    'puerto-chacabuco': (-45.4667, -72.8167, 'Puerto Chacabuco'),
    'coyhaique': (-45.5719, -72.0683, 'Coyhaique'),
    'balmaceda': (-45.9137, -71.6947, 'Balmaceda'),
    'villa-cerro-castillo': (-46.1216, -72.1636, 'Villa Cerro Castillo'),
    'puerto-rio-tranquilo': (-46.6252, -72.6735, 'Puerto Río Tranquilo'),
    'puerto-guadal': (-46.8442, -72.7027, 'Puerto Guadal'),
    'chile-chico': (-46.5399, -71.7288, 'Chile Chico'),
    'puerto-bertrand': (-47.0219, -72.8247, 'Puerto Bertrand'),
    'cochrane': (-47.2539, -72.5732, 'Cochrane'),
    'caleta-tortel': (-47.7967, -73.5360, 'Caleta Tortel'),
    'puerto-yungay': (-47.9343, -73.3241, 'Puerto Yungay'),
    'villa-ohiggins': (-48.4686, -72.5601, "Villa O'Higgins"),
}

# El sitio nombra algunas localidades distinto que la app. Solo alias: lo que no
# esté acá ni calce por nombre normalizado se reporta, no se adivina.
ALIAS_LOCALIDAD = {
    'tortel': 'caleta-tortel',
    'rio-tranquilo': 'puerto-rio-tranquilo',
    'cerro-castillo': 'villa-cerro-castillo',
    'guadal': 'puerto-guadal',
    'bertrand': 'puerto-bertrand',
    'manihuales': 'villa-manihuales',
    'mañihuales': 'villa-manihuales',
    'amengual': 'villa-amengual',
    'santa-lucia': 'villa-santa-lucia',
    'ohiggins': 'villa-ohiggins',
    'villa-o-higgins': 'villa-ohiggins',
    'aysen': 'puerto-aysen',
    'chacabuco': 'puerto-chacabuco',
    'cisnes': 'puerto-cisnes',
    'la-tapera': 'villa-amengual',        # sin localidad propia: la más cercana
    'lago-verde': 'la-junta',             # mismo criterio que el pipeline SERNATUR
    'marin-balmaceda': 'raul-marin-balmaceda',
    'raul-marin': 'raul-marin-balmaceda',
    'caleta-gonzalo-pumalin': 'caleta-gonzalo',
    'pumalin': 'caleta-gonzalo',
    # WordPress le pone un sufijo al slug cuando choca con otro: la guía de
    # Puerto Montt vive en /visita-puerto-montt-2/.
    'puerto-montt-2': 'puerto-montt',
    # Puerto Sánchez NO es una localidad de la app: es un caserío en la ribera
    # norte del lago General Carrera, y el sitio le dedica una guía propia. Se
    # ancla a Puerto Río Tranquilo, que es la localidad de la app más cercana
    # por camino — mismo criterio que Lago Verde → La Junta en el lote SERNATUR.
    # Si algún día tiene ficha propia, se saca de acá.
    'puerto-sanchez': 'puerto-rio-tranquilo',
}

# Segmento de URL → categoría de `places`. Se evalúan EN ORDEN sobre la ruta
# completa, así que lo más específico va primero. Las seis categorías del
# proyecto son fijas: atractivo · alojamiento · comida · servicio · evento ·
# emergencia.
REGLAS_CATEGORIA = [
    (r'hospital|posta|carabineros|bomberos|emergencia|rescate', 'emergencia'),
    (r'aloja|hotel|hostal|hospedaje|hosteri|cabana|cabaña|camping|lodge|refugio'
     r'|domo|departamento|bed-and-breakfast|donde-dormir', 'alojamiento'),
    (r'gastronom|restaurant|restoran|comida|cafeter|cafe|panaderi|donde-comer'
     r'|food-truck|bar-|cerveceri', 'comida'),
    (r'barcaza|ferry|transbordador|naveg|bus|transporte|traslado|arriendo'
     r'|rent-a-car|alquiler|combustible|bencina|banco|cajero|farmacia'
     r'|lavanderi|supermercado|abarrotes|mecanic|vulcaniz|guia|tour|excursion'
     r'|cabalgata|kayak|rafting|pesca|vuelo|seguro|termas|tinaja|bicicleta'
     r'|agencia|informacion-turistica'
     # Salidos del informe del 24-ago: el sitio dice "centros-termales" (no
     # "termas") y tiene una sección "experiencias-turisticas" que no calzaba
     # con ningún patrón.
     r'|termal|experiencia', 'servicio'),
    (r'que-hacer|atractiv|mirador|parque|reserva|sendero|trekking|caminata'
     r'|lago|laguna|glaciar|ventisquero|playa|cascada|salto|capilla|museo'
     r'|monumento|escalada|avistamiento', 'atractivo'),
    (r'fiesta|festival|rodeo|evento|aniversario', 'evento'),
]

# Respaldo por tipo de JSON-LD, cuando la URL no dice nada. Va DESPUÉS de la
# URL porque el schema de estos sitios suele ser genérico (`LocalBusiness` para
# todo), y la sección del sitio es más informativa que eso.
CATEGORIA_POR_TIPO = {
    'lodgingbusiness': 'alojamiento', 'hotel': 'alojamiento', 'motel': 'alojamiento',
    'hostel': 'alojamiento', 'resort': 'alojamiento', 'bedandbreakfast': 'alojamiento',
    'campground': 'alojamiento', 'apartment': 'alojamiento', 'campingpitch': 'alojamiento',
    'restaurant': 'comida', 'cafeorcoffeeshop': 'comida', 'foodestablishment': 'comida',
    'bakery': 'comida', 'bar': 'comida',
    'touristattraction': 'atractivo', 'touristdestination': 'atractivo',
    'travelagency': 'servicio', 'store': 'servicio', 'gasstation': 'servicio',
    'automotivebusiness': 'servicio', 'sportsactivitylocation': 'servicio',
}

# Plantillas honestas: dicen lo que el dato sostiene. El texto bueno se escribe
# al curar la ficha en el CMS; esto es el andamio para que el borrador se
# entienda mientras tanto.
PLANTILLAS = {
    'alojamiento': ('Alojamiento en {loc}.', 'Accommodation in {loc}.'),
    'comida': ('Servicio de alimentación en {loc}.', 'Food service in {loc}.'),
    'servicio': ('Servicio turístico en {loc}.', 'Tourist service in {loc}.'),
    'atractivo': ('Atractivo turístico en {loc}.', 'Tourist attraction in {loc}.'),
    'evento': ('Evento en {loc}.', 'Event in {loc}.'),
    # La emergencia se lee cuando algo ya pasó: abre por dónde está.
    'emergencia': ('Servicio de emergencia en {loc}.', 'Emergency service in {loc}.'),
}

# Categorías comerciales: sin teléfono ni WhatsApp no entran (regla del
# post-mortem de Tortel).
COMERCIALES = {'alojamiento', 'comida', 'servicio'}


def sin_tildes(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def normalizar(s):
    s = sin_tildes(s).lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def slugificar(s):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', sin_tildes(s).lower())).strip('-')


def localidad_de(ficha):
    """Localidad de la app a partir de la ruta de la URL. None si no se sabe."""
    candidatos = []
    for p in ficha.get('ruta') or []:
        p = p.lower()
        candidatos.append(re.sub(r'^(visita|visitar|guia|destino)-', '', p))
        candidatos.append(re.sub(r'^.*-(en|de)-', '', p))
        candidatos.append(p)
    for c in candidatos:
        c = slugificar(c)
        if c in LOCALIDADES:
            return c
        if c in ALIAS_LOCALIDAD:
            return ALIAS_LOCALIDAD[c]
    return None


def categoria_de(ficha):
    ruta = '/'.join(ficha.get('ruta') or []).lower()
    ruta = sin_tildes(ruta)
    for patron, cat in REGLAS_CATEGORIA:
        if re.search(patron, ruta):
            return cat
    for t in ficha.get('tipos_jsonld') or []:
        if t in CATEGORIA_POR_TIPO:
            return CATEGORIA_POR_TIPO[t]
    return None


def formatear_fono(crudo):
    """569XXXXXXXX → +56 9 XXXX XXXX. Lo que no reconoce, lo deja como viene."""
    d = re.sub(r'\D', '', str(crudo or ''))
    if len(d) == 11 and d.startswith('569'):
        return f'+56 9 {d[3:7]} {d[7:]}'
    if len(d) == 11 and d.startswith('56'):
        return f'+56 {d[2:4]} {d[4:7]} {d[7:]}'
    if len(d) == 9 and d.startswith('9'):
        return f'+56 9 {d[1:5]} {d[5:]}'
    if len(d) == 8:                     # fijo sin código de área
        return f'+56 67 {d[:3]} {d[3:]}' if d.startswith('2') else str(crudo).strip()
    return str(crudo).strip() or None


def solo_digitos(crudo):
    return re.sub(r'\D', '', str(crudo or ''))


# schema.org escribe los horarios en código ("Mo-Su 09:00-21:00"). El campo
# `horario` de la app es TEXTO LIBRE que el viajero lee en el chip de la
# tarjeta: dejarlo en código sería meter inglés abreviado en una app en
# español. Lo que no se reconoce se deja tal cual —es mejor un horario raro que
# uno inventado— y se corrige al curar.
DIAS = {'mo': 'Lu', 'tu': 'Ma', 'we': 'Mi', 'th': 'Ju', 'fr': 'Vi',
        'sa': 'Sá', 'su': 'Do'}


def normalizar_horario(crudo):
    h = (crudo or '').strip()
    if not h:
        return None
    if not re.search(r'\b(mo|tu|we|th|fr|sa|su)\b', h, re.I):
        return h
    def dia(m):
        return DIAS.get(m.group(0).lower(), m.group(0))
    h = re.sub(r'\b(Mo|Tu|We|Th|Fr|Sa|Su)\b', dia, h, flags=re.I)
    return re.sub(r'\s+', ' ', h).strip()


def distancia_km(lat, lng, centro):
    r = 6371.0
    dlat, dlng = math.radians(lat - centro[0]), math.radians(lng - centro[1])
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(centro[0])) * math.cos(math.radians(lat))
         * math.sin(dlng / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def texto_dist(km, nombre_loc):
    if km < 1:
        return {'es': f'En {nombre_loc}', 'en': f'In {nombre_loc}'}
    if km < 100:
        return {'es': f'{km:.1f} km desde {nombre_loc}',
                'en': f'{km:.1f} km from {nombre_loc}'}
    return {'es': f'{km:.0f} km desde {nombre_loc}', 'en': f'{km:.0f} km from {nombre_loc}'}


def dispersar(centro, semilla):
    """Ubica cerca del centro del pueblo, de forma estable entre corridas.

    Cuando el origen no trae coordenada hay que poner el pin en alguna parte.
    Apilar 30 fichas exactamente en el mismo punto las vuelve un solo pin
    inclicable, así que se esparcen ~150–450 m. El pin NO es la dirección real y
    por eso la ficha queda marcada: se corrige antes de publicar.
    """
    h = int(hashlib.sha1(semilla.encode()).hexdigest()[:12], 16)
    ang = (h % 3600) / 3600 * 2 * math.pi
    metros = 150 + (h // 3600) % 300
    dlat = (metros * math.cos(ang)) / 111_320
    dlng = (metros * math.sin(ang)) / (111_320 * math.cos(math.radians(centro[0])))
    return round(centro[0] + dlat, 6), round(centro[1] + dlng, 6)


def existentes_del_proyecto():
    """Índice nombre+localidad de lo que ya está en places.json.

    Es una PRIMERA pasada: places.json es el seed a mano, no la base completa
    (SERNATUR y Tortel entraron por su propio seeder). El deduplicado que
    manda es el del seeder, que compara contra la base de verdad.
    """
    ruta = os.path.abspath(PLACES_PROYECTO)
    if not os.path.isfile(ruta):
        return set()
    with open(ruta, encoding='utf-8') as f:
        datos = json.load(f)
    return {f"{normalizar((p.get('nombre') or {}).get('es'))}|{p.get('localidad')}"
            for p in datos}


def main():
    if not os.path.isfile(ENTRADA):
        sys.exit(f'Falta {ENTRADA}. Corre antes: '
                 f'{PY_CMD} scripts/carretera-austral/1_extraer.py')

    with open(ENTRADA, encoding='utf-8') as f:
        crudo = json.load(f)
    fichas = crudo.get('fichas') if isinstance(crudo, dict) else crudo
    if not isinstance(fichas, list):
        sys.exit('ca-fichas.json no tiene la forma esperada (falta la lista `fichas`).')

    ya_existen = existentes_del_proyecto()
    lugares = []
    sin_localidad, sin_categoria, sin_contacto, duplicados, sin_nombre = [], [], [], [], 0
    sin_coordenada = 0
    vistos = {}
    siguiente_id = ID_INICIAL

    for f in fichas:
        nombre = (f.get('nombre') or '').strip()
        # Los títulos genéricos de sección no son negocios.
        if not nombre or len(nombre) < 3 or len(nombre) > 120:
            sin_nombre += 1
            continue

        loc = localidad_de(f)
        if not loc:
            sin_localidad.append((nombre, f.get('url')))
            continue

        cat = categoria_de(f)
        if not cat:
            sin_categoria.append((nombre, f.get('url')))
            continue

        tel = next((formatear_fono(t) for t in (f.get('telefonos') or []) if solo_digitos(t)), None)
        wa = next((formatear_fono(w) for w in (f.get('whatsapp') or []) if solo_digitos(w)), None)
        if cat in COMERCIALES and not tel and not wa:
            sin_contacto.append((nombre, cat, f.get('url')))
            continue

        # Deduplicado dentro del lote: mismo nombre en la misma localidad, o el
        # mismo teléfono (el sitio lista al mismo negocio en varias secciones).
        clave_n = f'{normalizar(nombre)}|{loc}'
        clave_t = solo_digitos(tel or wa)
        if clave_n in vistos or (clave_t and clave_t in vistos):
            duplicados.append((nombre, f.get('url')))
            continue
        if clave_n in ya_existen:
            duplicados.append((nombre + ' (ya en places.json)', f.get('url')))
            continue
        vistos[clave_n] = True
        if clave_t:
            vistos[clave_t] = True

        centro = LOCALIDADES[loc][:2]
        nombre_loc = LOCALIDADES[loc][2]
        lat, lng, fuente_coord = f.get('lat'), f.get('lng'), 'origen'
        if lat is None or lng is None:
            lat, lng = dispersar(centro, clave_n)
            fuente_coord = 'centro_localidad'   # PIN APROXIMADO: corregir al curar
            sin_coordenada += 1

        km = distancia_km(float(lat), float(lng), centro)
        base_es, base_en = PLANTILLAS[cat]

        lugares.append({
            'id': siguiente_id,
            'cat': cat,
            'localidad': loc,
            'lat': round(float(lat), 6),
            'lng': round(float(lng), 6),
            'tel': tel,
            'whatsapp': wa,
            'horario': normalizar_horario(f.get('horario')),
            # Los nombres propios no se traducen.
            'nombre': {'es': nombre, 'en': nombre},
            # Plantilla, no la prosa del origen. Ver la regla 1 arriba.
            'desc': {'es': base_es.format(loc=nombre_loc),
                     'en': base_en.format(loc=nombre_loc)},
            'como': ({'es': f['direccion'].strip(), 'en': f['direccion'].strip()}
                     if f.get('direccion') else
                     {'es': f'En {nombre_loc}, Carretera Austral.',
                      'en': f'In {nombre_loc}, Carretera Austral.'}),
            'dist': texto_dist(km, nombre_loc),
            'publicado': False,
            # Trazabilidad y lo que `places` no sabe guardar. No lo lee el
            # seeder: viaja para tener todo a mano al curar la ficha.
            '_origen': {
                'fuente': f.get('fuente'),
                'fecha_extraccion': f.get('fecha_extraccion'),
                'url': f.get('url'),
                'estrategia': f.get('estrategia'),
                'coordenada': fuente_coord,
                'telefonos': f.get('telefonos') or [],
                'whatsapp': f.get('whatsapp') or [],
                'emails': f.get('emails') or [],
                'webs': f.get('webs') or [],
                'direccion': f.get('direccion'),
            },
        })
        siguiente_id += 1

    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(lugares, f, ensure_ascii=False, indent=2)

    por_cat, por_loc = {}, {}
    for l in lugares:
        por_cat[l['cat']] = por_cat.get(l['cat'], 0) + 1
        por_loc[l['localidad']] = por_loc.get(l['localidad'], 0) + 1

    inf = [f'Fichas generadas: {len(lugares)}  (ids {ID_INICIAL}–{siguiente_id - 1})', '',
           'Por categoría:']
    inf += [f'  {c}: {n}' for c, n in sorted(por_cat.items())]
    inf += ['', 'Por localidad:']
    inf += [f'  {l}: {n}' for l, n in sorted(por_loc.items(), key=lambda x: -x[1])]
    inf += ['',
            f'Con teléfono: {sum(1 for l in lugares if l["tel"])}',
            f'Con WhatsApp: {sum(1 for l in lugares if l["whatsapp"])}',
            f'Con horario:  {sum(1 for l in lugares if l["horario"])}',
            '',
            f'PIN APROXIMADO (sin coordenada en el origen): {sin_coordenada} de {len(lugares)}',
            '  Están puestas cerca del centro del pueblo, NO en su dirección real.',
            '  Corregir el pin antes de publicar la ficha (Fase 3 es calidad del dato).',
            '',
            f'Descartadas — sin localidad reconocida: {len(sin_localidad)}',
            f'Descartadas — sin categoría reconocida: {len(sin_categoria)}',
            f'Descartadas — comercio sin teléfono ni WhatsApp: {len(sin_contacto)}',
            f'Descartadas — duplicadas: {len(duplicados)}',
            f'Descartadas — sin nombre utilizable: {sin_nombre}']

    if sin_localidad:
        inf += ['', 'SIN LOCALIDAD (agregar el alias a ALIAS_LOCALIDAD si corresponde):']
        inf += [f'  {n}  ·  {u}' for n, u in sin_localidad[:60]]
    if sin_categoria:
        inf += ['', 'SIN CATEGORÍA (agregar el patrón a REGLAS_CATEGORIA):']
        inf += [f'  {n}  ·  {u}' for n, u in sin_categoria[:60]]
    if sin_contacto:
        inf += ['', 'COMERCIO SIN CONTACTO (regla del post-mortem de Tortel):']
        inf += [f'  [{c}] {n}  ·  {u}' for n, c, u in sin_contacto[:60]]

    texto = '\n'.join(inf)
    with open(INFORME, 'w', encoding='utf-8') as f:
        f.write(texto + '\n')
    print(texto)
    print(f'\n→ {SALIDA}\n→ {INFORME}')
    print('Todas quedan con publicado=false. Se revisan y publican desde /admin.')


if __name__ == '__main__':
    main()
