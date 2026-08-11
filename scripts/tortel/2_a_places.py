#!/usr/bin/env python3
"""Convierte los POIs PUNTUALES de Tortel al formato de `places` del proyecto.

Segundo paso, después de `1_unificar.py`. Lee `tortel-pois.geojson` y escribe
`tortel_places.json` con la misma forma que `backend/database/seeders/data/places.json`,
listo para `TortelPlaceSeeder`.

**Dos decisiones tomadas con el fundador (10-ago-2026):**

  1. **Todo entra como BORRADOR** (`publicado: false`). Desde el 27-jul rige un
     servicio publicado por localidad y categoría; meter ~100 fichas de Tortel
     publicadas rompería esa regla y además metería a la app dato sin revisar.
     Es el mismo camino del lote SERNATUR: rango de ids propio, seeder aparte que
     NO corre en el deploy, y curación desde el CMS.
  2. **Las líneas no pasan por acá.** Senderos, rutas y pasarelas son trazados y
     `places` guarda un punto: van a su propia capa de rutas. Este script los
     saltea e informa cuántos dejó fuera.

**Por qué el mapeo de categorías está arriba y es explícito.** El mapa municipal
trae ~12 capas y `places` tiene 6 categorías fijas, así que el mapeo pierde
información por definición (artesanías y expediciones terminan las dos en
`servicio`). Peor sería que se perdiera en silencio: una capa que no esté en la
tabla **detiene el script** en vez de caer en un `else` que la manda a `servicio`.
Cuando aparezcan las capas que todavía no vimos, se agregan acá a mano.

Uso:  python3 scripts/tortel/2_a_places.py
"""

import json
import math
import os
import re
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
ENTRADA = os.path.join(RAIZ, 'tortel-pois.geojson')
SALIDA = os.path.join(RAIZ, 'tortel_places.json')

LOCALIDAD = 'caleta-tortel'
CENTRO = (-47.7967, -73.5360)  # el mismo de LocalidadSeeder, para calcular `dist`
ID_INICIAL = 4000  # 1–192 seed · 2000–2181 SERNATUR · 3001–3083 preliminares

# capa del mapa → categoría de `places`. Sin entrada acá, el script se detiene.
# `None` = la capa no va a `places` (son trazados: su lugar es la capa de rutas).
# Centinela para las capas que se resuelven por subtipo y no por capa.
POR_SUBTIPO = '_por_subtipo'

CATEGORIAS = {
    # Ojo: los nombres reales de las capas NO son los de la lista de archivos.
    # El mapa llama `cama` a los alojamientos y `rural` al turismo rural; por eso
    # la capa se toma del propio GeoJSON y no del nombre del archivo.
    'cama': 'alojamiento',
    'rural': 'alojamiento',
    'alojamientos': 'alojamiento',
    'cabana': 'alojamiento',
    'alimentacion': 'comida',
    'abarrotes': 'servicio',
    'artesanias': 'servicio',
    'expediciones': 'servicio',
    'mirador': 'atractivo',
    'miradores': 'atractivo',
    # `puntos_fijos` es la EXCEPCIÓN: no se mapea por capa sino por subtipo (ver
    # SUBTIPO_A_CATEGORIA). Adentro conviven la posta, Carabineros y Bomberos con
    # la bomba de bencina, la oficina de turismo y las plazas del pueblo — tres
    # categorías distintas en una sola capa. Mandarla entera a `servicio` habría
    # enterrado las TRES emergencias de Tortel, que es justo el dato que se busca
    # con urgencia y el único que no puede estar mal clasificado.
    'puntos_fijos': POR_SUBTIPO,
    # Trazados y áreas: no van a `places` (un punto), van a la tabla `rutas`.
    # Los procesa 3_a_rutas.py.
    'parque_latapera': None,
    'glaciarCHN': None,
    'glaciarCHS': None,
    'pasarelas': None,
    'Sendero_vigia': None,
    'Sendero_latapera': None,
    'RP_camposHN': None,
    'Ruta_camposHS': None,
    'Ruta_isla_muertos': None,
}

# Descripción base por categoría, en los dos idiomas. Son PLANTILLAS honestas —
# dicen lo que el dato sostiene y nada más. Se personalizan al curar; ese es el
# trabajo que el borrador deja preparado, no uno que este script pueda hacer.
PLANTILLAS = {
    'alojamiento': ('Alojamiento en {sector}, Caleta Tortel.',
                    'Accommodation in {sector}, Caleta Tortel.'),
    'comida': ('Servicio de alimentación en {sector}, Caleta Tortel.',
               'Food service in {sector}, Caleta Tortel.'),
    'servicio': ('Servicio en {sector}, Caleta Tortel.',
                 'Service in {sector}, Caleta Tortel.'),
    'atractivo': ('Atractivo turístico de Caleta Tortel, sector {sector}.',
                  'Tourist attraction in Caleta Tortel, {sector} area.'),
    # La emergencia se redacta distinto a propósito: se lee cuando algo ya pasó,
    # así que abre con dónde está y no con adjetivos.
    'emergencia': ('Servicio de emergencia en Caleta Tortel, sector {sector}.',
                   'Emergency service in Caleta Tortel, {sector} area.'),
}

# Subtipo → categoría, para las capas marcadas POR_SUBTIPO. El criterio es qué
# busca el viajero, no cómo lo clasifica la municipalidad:
#   · emergencia = lo que se busca cuando algo salió mal;
#   · servicio   = lo que resuelve un trámite o una necesidad del viaje;
#   · atractivo  = lo que se visita.
# Por eso el gimnasio, la pérgola y las plazas quedan en `atractivo` (son el
# espacio público del pueblo) y el paradero o la ferretería en `servicio`.
SUBTIPO_A_CATEGORIA = {
    'health service': 'emergencia',
    'police': 'emergencia',
    'firemen': 'emergencia',

    'fuel station': 'servicio',
    'ferry tickets': 'servicio',
    'tourism information office': 'servicio',
    'city hall': 'servicio',
    'civil registry': 'servicio',
    'public library': 'servicio',
    'hardware store': 'servicio',
    'custodia/luggage storage': 'servicio',

    'plaza/square': 'atractivo',
    'espacio multiuso/public facilities': 'atractivo',
    'espacio recreacional/playground': 'atractivo',
    'trail shelter': 'atractivo',
}

# El único punto SIN subtipo en el origen es la oficina de CONAF. Se resuelve por
# nombre en vez de dejar un `None` mudo en la tabla de arriba, que el día que
# aparezca otro punto sin subtipo lo mandaría al cajón equivocado en silencio.
SIN_SUBTIPO_POR_NOMBRE = {
    'conaf': 'servicio',
}

# El `Subtipo` del origen a veces trae las dos lenguas ("Hospedaje/accommodation")
# y a veces no ("Restaurante"), y cuando trae dos partes no siempre la segunda es
# inglés ("Turismo rural/Alojamiento" son las dos en español). Por eso la
# traducción va en una tabla explícita en vez de partir por "/" y confiar: es la
# diferencia entre una ficha en inglés que se entiende y una que dice
# "Alojamiento". Un subtipo no listado cae al texto original en ambos idiomas y
# sale avisado al final, para agregarlo acá.
SUBTIPOS = {
    'hospedaje/accommodation': ('Hospedaje', 'Guesthouse'),
    'residencial/accommodation': ('Residencial', 'Guesthouse'),
    'turismo rural/alojamiento': ('Turismo rural', 'Rural lodging'),
    'camping': ('Camping', 'Campsite'),
    'cabaña': ('Cabaña', 'Cabin'),
    'restaurante': ('Restaurante', 'Restaurant'),
    'comida al paso/fast food': ('Comida al paso', 'Fast food'),
    'cabañas/cabins': ('Cabañas', 'Cabins'),
    'hostal': ('Hostal', 'Guesthouse'),
    'hostel': ('Hostel', 'Hostel'),
    'lodge': ('Lodge', 'Lodge'),
    'artesanías/crafts': ('Artesanías', 'Crafts'),
    'venta abarrotes/grocery store': ('Venta de abarrotes', 'Grocery store'),
    'expediciones fluviales/boat trip': ('Expediciones fluviales', 'Boat trips'),
    'senderismo/hiking': ('Senderismo', 'Hiking'),
    'mirador/viewpoint': ('Mirador', 'Viewpoint'),
    # Los de `puntos_fijos` vienen solo en inglés en el origen: acá se les pone
    # el nombre en español, que es como los busca quien está en el pueblo.
    'health service': ('Servicio de salud', 'Health service'),
    'police': ('Carabineros', 'Police'),
    'firemen': ('Bomberos', 'Fire station'),
    'fuel station': ('Estación de combustible', 'Fuel station'),
    'ferry tickets': ('Venta de pasajes de barcaza', 'Ferry tickets'),
    'tourism information office': ('Oficina de información turística',
                                   'Tourist information office'),
    'city hall': ('Municipalidad', 'City hall'),
    'civil registry': ('Registro Civil', 'Civil registry'),
    'public library': ('Biblioteca pública', 'Public library'),
    'hardware store': ('Ferretería', 'Hardware store'),
    'custodia/luggage storage': ('Custodia de equipaje', 'Luggage storage'),
    'plaza/square': ('Plaza', 'Square'),
    'espacio multiuso/public facilities': ('Espacio público', 'Public facility'),
    'espacio recreacional/playground': ('Espacio recreacional', 'Playground'),
    'trail shelter': ('Refugio de sendero', 'Trail shelter'),
}


def formatear_fono(crudo):
    """569XXXXXXXX → +56 9 XXXX XXXX. Lo que no reconoce, lo deja como viene."""
    d = re.sub(r'\D', '', str(crudo or ''))
    if len(d) == 11 and d.startswith('569'):
        return f'+56 9 {d[3:7]} {d[7:]}'
    if len(d) == 11 and d.startswith('56'):
        return f'+56 {d[2:4]} {d[4:7]} {d[7:]}'
    if len(d) == 9 and d.startswith('9'):
        return f'+56 9 {d[1:5]} {d[5:]}'
    return str(crudo).strip() or None


def distancia_km(lat, lng):
    """Haversine hasta el centro del pueblo, para el campo `dist`."""
    r = 6371.0
    dlat, dlng = math.radians(lat - CENTRO[0]), math.radians(lng - CENTRO[1])
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(CENTRO[0])) * math.cos(math.radians(lat))
         * math.sin(dlng / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def texto_dist(km):
    """En Tortel casi todo se mide caminando: el pueblo son pasarelas, no calles."""
    if km < 0.15:
        return {'es': 'En el pueblo', 'en': 'In the village'}
    if km < 2:
        minutos = max(1, round(km * 1000 / 75))  # ~4,5 km/h, con escaleras
        return {'es': f'{km * 1000:.0f} m · {minutos} min a pie',
                'en': f'{km * 1000:.0f} m · {minutos} min walk'}
    return {'es': f'{km:.1f} km desde el pueblo', 'en': f'{km:.1f} km from the village'}


def main():
    if not os.path.isfile(ENTRADA):
        sys.exit(f'Falta {ENTRADA}. Corre antes: python3 scripts/tortel/1_unificar.py')

    with open(ENTRADA, encoding='utf-8') as f:
        coleccion = json.load(f)

    # Una capa desconocida detiene TODO antes de escribir nada: es preferible
    # revisar tres nombres a descubrir después que media docena de fichas quedaron
    # con la categoría equivocada dentro de las ~100.
    desconocidas = sorted({
        (rasgo['properties'] or {}).get('capa')
        for rasgo in coleccion.get('features', [])
    } - set(CATEGORIAS))
    if desconocidas:
        sys.exit('Capas sin categoría asignada: ' + ', '.join(map(str, desconocidas))
                 + '\nAgrégalas a CATEGORIAS en este archivo (None si son trazados).')

    lugares, saltados_linea, sin_nombre = [], 0, 0
    subtipos_sin_traducir = set()
    subtipos_sin_categoria = set()
    sin_categoria = []
    lejos = []
    siguiente_id = ID_INICIAL

    for rasgo in coleccion.get('features', []):
        props = rasgo.get('properties') or {}
        geo = rasgo.get('geometry') or {}
        capa = props.get('capa')
        categoria = CATEGORIAS.get(capa)

        if categoria == POR_SUBTIPO:
            sub = (props.get('subtipo') or '').strip().lower()
            if sub:
                categoria = SUBTIPO_A_CATEGORIA.get(sub)
                if categoria is None:
                    subtipos_sin_categoria.add(props.get('subtipo'))
                    continue
            else:
                # Sin subtipo: se resuelve por nombre, y si tampoco está, se
                # reporta en vez de adivinar.
                clave = (props.get('nombre') or '').strip().lower()
                categoria = SIN_SUBTIPO_POR_NOMBRE.get(clave)
                if categoria is None:
                    sin_categoria.append(props.get('nombre') or '(sin nombre)')
                    continue

        if categoria is None or geo.get('type') != 'Point':
            saltados_linea += 1
            continue

        nombre = props.get('nombre')
        if not nombre:
            sin_nombre += 1
            continue

        lng, lat = geo['coordinates'][0], geo['coordinates'][1]
        sector = props.get('sector') or 'Caleta Tortel'
        base_es, base_en = PLANTILLAS[categoria]
        desc_es = base_es.format(sector=sector)
        desc_en = base_en.format(sector=sector)

        # El subtipo y la capacidad son dato real del municipio: se suman al texto
        # en vez de quedar enterrados en el JSON.
        subtipo = (props.get('subtipo') or '').strip()
        if subtipo:
            clave = subtipo.lower()
            if clave in SUBTIPOS:
                sub_es, sub_en = SUBTIPOS[clave]
            else:
                sub_es = sub_en = subtipo.split('/')[0].strip()
                subtipos_sin_traducir.add(subtipo)
            desc_es = f'{sub_es}. {desc_es}'
            desc_en = f'{sub_en}. {desc_en}'
        if props.get('capacidad'):
            desc_es += f" Capacidad: {props['capacidad']} personas."
            desc_en += f" Capacity: {props['capacidad']} people."

        telefonos = props.get('telefonos') or []
        km = distancia_km(lat, lng)

        # Hay lugares de la COMUNA que no están en el pueblo (Puerto Yungay, El
        # Quetru, Lago Leal: decenas de km por camino o por agua). Entran igual
        # —son servicios reales de la zona— pero se listan aparte: hay que
        # decidir a mano si su ficha cuelga de Caleta Tortel o confunde al
        # viajero que busca dónde dormir esta noche en el pueblo.
        if km > 5:
            lejos.append((nombre, sector, km))

        lugares.append({
            'id': siguiente_id,
            'cat': categoria,
            'localidad': LOCALIDAD,
            'lat': round(lat, 7),
            'lng': round(lng, 7),
            'tel': formatear_fono(telefonos[0]) if telefonos else None,
            # Los nombres propios no se traducen: "Camping Tortel" es "Camping
            # Tortel" en inglés. Poner una traducción inventada sería peor dato.
            'nombre': {'es': nombre, 'en': nombre},
            'desc': {'es': desc_es, 'en': desc_en},
            'como': {'es': f'Sector {sector}, Caleta Tortel.',
                     'en': f'{sector} area, Caleta Tortel.'},
            'dist': texto_dist(km),
            'publicado': False,
            # Trazabilidad y lo que `places` no sabe guardar (segundo teléfono,
            # correo, links). No lo lee el seeder: viaja para que al curar la
            # ficha esté todo a mano y no haya que volver al mapa municipal.
            '_origen': {
                'fuente': props.get('fuente'),
                'fecha_extraccion': props.get('fecha_extraccion'),
                'capa': capa,
                'telefonos': telefonos,
                'email': props.get('email'),
                'links': props.get('links'),
                'extra': props.get('extra') or {},
            },
        })
        siguiente_id += 1

    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(lugares, f, ensure_ascii=False, indent=2)

    porcat = {}
    for l in lugares:
        porcat[l['cat']] = porcat.get(l['cat'], 0) + 1

    print(f'Fichas generadas: {len(lugares)}  (ids {ID_INICIAL}–{siguiente_id - 1})')
    for cat, n in sorted(porcat.items()):
        print(f'  {cat}: {n}')
    print(f'Saltados por ser trazados o no-punto: {saltados_linea}')
    print(f'Saltados por no tener nombre: {sin_nombre}')
    print(f'Con teléfono: {sum(1 for l in lugares if l["tel"])} de {len(lugares)}')
    print(f'Con correo (va en _origen, `places` no tiene columna): '
          f'{sum(1 for l in lugares if l["_origen"]["email"])}')

    if lejos:
        print(f'\nFUERA DEL PUEBLO ({len(lejos)}) — revisar si cuelgan de Caleta Tortel:')
        for nombre, sector, km in sorted(lejos, key=lambda x: -x[2]):
            print(f'  {km:6.1f} km  {nombre}  ({sector})')

    if subtipos_sin_categoria or sin_categoria:
        print(f'\nPUNTOS OMITIDOS POR NO SABER SU CATEGORÍA '
              f'({len(subtipos_sin_categoria) + len(sin_categoria)}):')
        for x in sorted(subtipos_sin_categoria):
            print(f'  subtipo desconocido: "{x}" → agrégalo a SUBTIPO_A_CATEGORIA')
        for x in sin_categoria:
            print(f'  sin subtipo: "{x}" → agrégalo a SIN_SUBTIPO_POR_NOMBRE')

    if subtipos_sin_traducir:
        print(f'\nSUBTIPOS SIN TRADUCCIÓN ({len(subtipos_sin_traducir)}) — '
              f'agrégalos a SUBTIPOS en este archivo:')
        for s in sorted(subtipos_sin_traducir):
            print(f'  "{s}"')

    print(f'\n→ {SALIDA}')
    print('Todas quedan con publicado=false. Se revisan y publican desde /admin.')


if __name__ == '__main__':
    main()
