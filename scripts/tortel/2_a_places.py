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
CATEGORIAS = {
    'alojamientos': 'alojamiento',
    'cabana': 'alojamiento',
    'alimentacion': 'comida',
    'abarrotes': 'servicio',
    'artesanias': 'servicio',
    'expediciones': 'servicio',
    'mirador': 'atractivo',
    'parque_latapera': 'atractivo',
    'glaciarCHN': 'atractivo',
    'glaciarCHS': 'atractivo',
    'puntos_fijos': 'servicio',
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
    siguiente_id = ID_INICIAL

    for rasgo in coleccion.get('features', []):
        props = rasgo.get('properties') or {}
        geo = rasgo.get('geometry') or {}
        capa = props.get('capa')
        categoria = CATEGORIAS.get(capa)

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
        if props.get('subtipo'):
            desc_es = f"{props['subtipo']}. {desc_es}"
            desc_en = f"{props['subtipo']}. {desc_en}"
        if props.get('capacidad'):
            desc_es += f" Capacidad: {props['capacidad']} personas."
            desc_en += f" Capacity: {props['capacidad']} people."

        telefonos = props.get('telefonos') or []
        km = distancia_km(lat, lng)

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
    print(f'\n→ {SALIDA}')
    print('Todas quedan con publicado=false. Se revisan y publican desde /admin.')


if __name__ == '__main__':
    main()
