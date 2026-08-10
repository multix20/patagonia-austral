#!/usr/bin/env python3
"""Unifica los .js del mapa turístico de Tortel en un solo GeoJSON.

**De dónde sale el dato.** El mapa oficial de la Municipalidad de Tortel
(https://www.tortel.cl/mapa-turismo-tortel-2024/) es un Leaflet que carga UNA
variable JavaScript por categoría, cada una con un FeatureCollection embebido:

    var alojamientos =
    { "type": "FeatureCollection", ... }

No hay un endpoint único que los devuelva todos, así que los archivos se juntan
a mano (DevTools → Network → filtro JS) y se dejan caer en `crudos/`. Este script
hace el resto.

**Qué hace, en orden:**
  1. Lee todos los `.js` de `crudos/`.
  2. Le saca el `var <nombre> =` de adelante y el `;` de atrás, y parsea el JSON.
  3. Normaliza `properties` a un esquema común — los archivos NO traen las mismas
     claves (alojamientos trae capacidad y dos teléfonos; un sendero traerá otra
     cosa). Nada se descarta: lo que no calza en el esquema queda en `extra`.
  4. Escribe `tortel-pois.geojson` con la trazabilidad de la fuente, y un
     `informe.txt` con lo que hay que mirar a ojo antes de importar nada.

**Lo que este script NO hace, a propósito:** no toca la base de datos ni decide
categorías del proyecto. Eso es un segundo paso y depende de decisiones
editoriales (ver README.md).

Uso:  python3 scripts/tortel/1_unificar.py
"""

import json
import os
import re
import unicodedata
from collections import Counter, defaultdict

RAIZ = os.path.dirname(os.path.abspath(__file__))
CRUDOS = os.path.join(RAIZ, 'crudos')
SALIDA = os.path.join(RAIZ, 'tortel-pois.geojson')
INFORME = os.path.join(RAIZ, 'informe.txt')

FUENTE = 'tortel.cl/mapa-turismo-tortel-2024'
FECHA_EXTRACCION = '2026-08-10'

# Caja que contiene la comuna de Tortel con holgura. Cualquier punto fuera de
# acá es un error de dato (o un lon/lat invertido), no un lugar lejano: la
# comuna entera cabe de sobra. Sirve para no importar basura sin darse cuenta.
BBOX = {'lon_min': -74.5, 'lon_max': -72.3, 'lat_min': -48.6, 'lat_max': -47.0}

# Sinónimos vistos y previsibles para cada campo del esquema común. Se comparan
# normalizados (sin tildes, sin espacios ni signos, en minúsculas), así que
# "Email/RRSS", "email rrss" y "EMAIL_RRSS" caen todos en el mismo lugar.
CAMPOS = {
    'nombre': ['nombre', 'name', 'titulo', 'nombrelugar'],
    'tipo': ['tipo', 'type', 'categoria'],
    'subtipo': ['subtipo', 'subtype', 'subcategoria'],
    'sector': ['sector', 'localidad', 'ubicacion'],
    'email': ['emailrrss', 'email', 'correo', 'rrss'],
    'links': ['links', 'link', 'web', 'sitioweb', 'url'],
    'capacidad': ['capacidad', 'capacity', 'pax'],
    'descripcion': ['descripcion', 'description', 'detalle', 'observaciones'],
    'dificultad': ['dificultad', 'difficulty'],
    'distancia': ['distancia', 'distance', 'largo', 'longitud'],
    'duracion': ['duracion', 'duration', 'tiempo'],
}

# Claves que se ignoran al normalizar porque ya viajan en `geometry` (las UTM se
# verificaron contra el WGS84: huso 18S, coincidencia exacta) o son ruido.
IGNORAR = {'coordx', 'coordy', 'x', 'y', 'fid', 'id', 'objectid'}


def _clave(texto):
    """Normaliza un nombre de campo para comparar: sin tildes, solo letras y números."""
    s = unicodedata.normalize('NFKD', str(texto))
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', s.lower())


def _limpiar(valor):
    """Convierte cadenas vacías y placeholders en None; recorta espacios."""
    if valor is None:
        return None
    if isinstance(valor, str):
        v = valor.strip()
        return None if v == '' or v.lower() in {'null', 's/i', 'sin informacion', '-'} else v
    return valor


def _telefonos(props):
    """Junta fono1, fono2, telefono… en una lista, sin repetir y sin vacíos.

    El proyecto guarda UN teléfono por ficha (`places.tel`), pero acá se
    conservan todos: elegir cuál va es una decisión editorial del paso 2, no del
    extractor. Perder el segundo teléfono en la extracción sería irreversible.
    """
    encontrados = []
    for clave_original, valor in props.items():
        k = _clave(clave_original)
        if k.startswith('fono') or k.startswith('telefono') or k in {'tel', 'celular'}:
            v = _limpiar(valor)
            if v is not None:
                v = re.sub(r'\s+', '', str(v))
                if v not in encontrados:
                    encontrados.append(v)
    return encontrados


def _extraer_geojson(texto):
    """Saca el objeto GeoJSON del archivo .js.

    Tolera las variantes que aparecen en la práctica: `var x = {...}`,
    `var x =\n{...};`, `const x = {...}` y el archivo que ya viene como JSON
    pelado. Se corta desde la primera llave hasta la última, que es más robusto
    que una expresión regular sobre todo el contenido.
    """
    inicio = texto.find('{')
    fin = texto.rfind('}')
    if inicio == -1 or fin == -1 or fin < inicio:
        raise ValueError('no encontré un objeto JSON en el archivo')
    return json.loads(texto[inicio:fin + 1])


def _puntos(geometria):
    """Devuelve las coordenadas [lon, lat] sueltas de cualquier geometría.

    Sirve para validar contra la caja: un sendero es una línea con decenas de
    vértices y basta con que TODOS caigan donde deben.
    """
    if not geometria:
        return []
    tipo = geometria.get('type')
    coords = geometria.get('coordinates') or []
    if tipo == 'Point':
        return [coords] if coords else []
    if tipo in ('MultiPoint', 'LineString'):
        return list(coords)
    if tipo in ('MultiLineString', 'Polygon'):
        return [c for parte in coords for c in parte]
    if tipo == 'MultiPolygon':
        return [c for poli in coords for anillo in poli for c in anillo]
    return []


def _normalizar_feature(feature, capa):
    """Lleva un feature al esquema común, sin perder nada por el camino."""
    props = feature.get('properties') or {}
    salida = {clave: None for clave in CAMPOS}
    usadas = set()

    for campo, sinonimos in CAMPOS.items():
        for clave_original, valor in props.items():
            if _clave(clave_original) in sinonimos:
                salida[campo] = _limpiar(valor)
                usadas.add(clave_original)
                break

    salida['telefonos'] = _telefonos(props)
    usadas.update(k for k in props if _clave(k).startswith(('fono', 'telefono')))

    # Todo lo que no calzó se conserva tal cual. Es la red de seguridad: si una
    # categoría trae un campo que nadie previó, aparece acá y no se pierde.
    salida['extra'] = {
        k: _limpiar(v) for k, v in props.items()
        if k not in usadas and _clave(k) not in IGNORAR
    }

    salida['capa'] = capa
    salida['fuente'] = FUENTE
    salida['fecha_extraccion'] = FECHA_EXTRACCION

    geometria = feature.get('geometry')
    # Un MultiPoint de un solo par es un Point disfrazado (así lo exporta QGIS).
    # Se simplifica para que el consumidor no tenga que desenvolverlo.
    if (geometria or {}).get('type') == 'MultiPoint' and len(geometria.get('coordinates') or []) == 1:
        geometria = {'type': 'Point', 'coordinates': geometria['coordinates'][0]}

    return {'type': 'Feature', 'properties': salida, 'geometry': geometria}


def main():
    if not os.path.isdir(CRUDOS):
        print(f'No existe {CRUDOS}. Crea la carpeta y deja ahí los .js del mapa.')
        return

    archivos = sorted(f for f in os.listdir(CRUDOS) if f.endswith('.js'))
    if not archivos:
        print(f'No hay archivos .js en {CRUDOS}.')
        return

    features, lineas_informe = [], []
    geometrias, claves_por_capa = Counter(), defaultdict(set)
    sin_nombre, fuera_caja, sin_geometria = [], [], []

    for archivo in archivos:
        capa = archivo[:-3]
        with open(os.path.join(CRUDOS, archivo), encoding='utf-8') as f:
            contenido = f.read()

        try:
            datos = _extraer_geojson(contenido)
        except (ValueError, json.JSONDecodeError) as e:
            lineas_informe.append(f'  ✗ {archivo}: NO SE PUDO LEER — {e}')
            continue

        propios = datos.get('features') or []
        tipos_capa = Counter()

        for feature in propios:
            claves_por_capa[capa].update((feature.get('properties') or {}).keys())
            normalizado = _normalizar_feature(feature, capa)
            geo = normalizado['geometry']
            tipo_geo = (geo or {}).get('type', 'SIN GEOMETRÍA')
            tipos_capa[tipo_geo] += 1
            geometrias[tipo_geo] += 1

            etiqueta = normalizado['properties']['nombre'] or '(sin nombre)'
            if not normalizado['properties']['nombre']:
                sin_nombre.append(f'{capa}: feature sin campo de nombre')
            if not geo:
                sin_geometria.append(f'{capa}: {etiqueta}')
            for lon, lat, *_ in _puntos(geo):
                if not (BBOX['lon_min'] <= lon <= BBOX['lon_max']
                        and BBOX['lat_min'] <= lat <= BBOX['lat_max']):
                    fuera_caja.append(f'{capa}: {etiqueta} → ({lon}, {lat})')
                    break

            features.append(normalizado)

        detalle = ', '.join(f'{n}×{t}' for t, n in tipos_capa.items())
        lineas_informe.append(f'  ✓ {archivo}: {len(propios):3d} features  [{detalle}]')

    coleccion = {
        'type': 'FeatureCollection',
        'name': 'tortel-pois',
        'crs': {'type': 'name', 'properties': {'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'}},
        'metadata': {
            'fuente': FUENTE,
            'fecha_extraccion': FECHA_EXTRACCION,
            'capas': [a[:-3] for a in archivos],
            'total_features': len(features),
            'nota': 'Coordenadas WGS84 [lon, lat]. Las Coord X/Y del origen son '
                    'UTM 18S y se descartaron por redundantes (verificado: '
                    'coinciden con el WGS84 al decímetro).',
        },
        'features': features,
    }

    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(coleccion, f, ensure_ascii=False, indent=1)

    informe = ['ARCHIVOS LEÍDOS', *lineas_informe, '',
               f'TOTAL: {len(features)} features de {len(archivos)} capas', '',
               'GEOMETRÍAS']
    informe += [f'  {t}: {n}' for t, n in geometrias.most_common()]
    informe += ['', 'CLAVES DE properties POR CAPA (para ver qué trae cada una)']
    for capa in sorted(claves_por_capa):
        informe.append(f'  {capa}: {", ".join(sorted(claves_por_capa[capa]))}')

    for titulo, lista in (('SIN NOMBRE', sin_nombre),
                          ('SIN GEOMETRÍA', sin_geometria),
                          ('FUERA DE LA CAJA DE TORTEL (revisar: ¿lon/lat invertidos?)', fuera_caja)):
        informe += ['', f'{titulo}: {len(lista)}']
        informe += [f'  {x}' for x in lista[:20]]
        if len(lista) > 20:
            informe.append(f'  … y {len(lista) - 20} más')

    texto = '\n'.join(informe)
    with open(INFORME, 'w', encoding='utf-8') as f:
        f.write(texto + '\n')

    print(texto)
    print(f'\n→ {SALIDA}')
    print(f'→ {INFORME}')


if __name__ == '__main__':
    main()
