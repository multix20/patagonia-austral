#!/usr/bin/env python3
"""Convierte las geometrías de LÍNEA y ÁREA de Tortel a la tabla `rutas`.

Tercer paso, hermano de `2_a_places.py`: aquel se lleva los puntos a `places`,
este se lleva lo que no cabe en un punto. Lee `tortel-pois.geojson` y escribe
`tortel_rutas.json` para `RutaSeeder`.

**Por qué existe una tabla aparte.** `places` guarda un punto por ficha, y las
pasarelas de Tortel son el pueblo entero: no hay calles, hay 214 tramos de
pasarela de madera. Un sendero es un trazado y un glaciar es un área. Ninguna de
las tres cosas es "un lugar con una coordenada".

**Las dos decisiones que definen este archivo:**

1. **Las 214 pasarelas se funden en UNA sola ruta.** Vienen como tramos del
   inventario municipal ("LONGITUDINAL 10", "TRANSVERSAL 40", con su estado de
   conservación): eso es dato de mantención de la municipalidad, no información
   de viaje. Al turista le sirve *la red* dibujada en el mapa, no 214 filas en el
   CMS. Se conserva la suma de metros lineales y el dibujo queda idéntico.

2. **Se simplifican las geometrías, y no es un detalle.** El origen trae 15
   decimales (precisión de nanómetro, absurda para un mapa) y el glaciar Steffen
   tiene 17.115 vértices: **669 KB en un solo polígono**, cuando el precache
   completo de la PWA son ~666 KB. Sin simplificar, esta capa duplicaría el peso
   de la app para dibujar un borde que a escala regional no se distingue. Se
   aplica Douglas-Peucker con tolerancia por tipo —cero para las pasarelas, que
   se miran de cerca; generosa para los glaciares, que se miran de lejos— y se
   redondea a 5 decimales (~1 m).

Uso:  python3 scripts/tortel/3_a_rutas.py
"""

import json
import math
import os
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
ENTRADA = os.path.join(RAIZ, 'tortel-pois.geojson')
SALIDA = os.path.join(RAIZ, 'tortel_rutas.json')

LOCALIDAD = 'caleta-tortel'
DECIMALES = 5  # ~1,1 m en latitud. Más que suficiente para dibujar.

# Tolerancia de simplificación en METROS, por tipo. El criterio es la escala a la
# que se mira cada cosa: las pasarelas se recorren a pie y se ven con el mapa
# encima del pueblo (simplificarlas movería el trazado sobre las casas); un
# glaciar de 443 km² se mira desde la vista regional, donde 60 m es menos de un
# píxel.
TOLERANCIA_M = {'pasarela': 0, 'sendero': 4, 'ruta': 15, 'area': 60}

# capa → cómo tratarla. `es`/`en` dicen DE DÓNDE sale cada idioma, porque el
# origen es inconsistente: en los senderos `nombre` viene en español y `subtipo`
# en inglés, y en las rutas es exactamente al revés ("Route to the Southern Ice
# Fields" está en el campo Nombre). Adivinarlo por el contenido sería frágil;
# esto se miró una vez y quedó escrito.
CAPAS = {
    'pasarelas': {'tipo': 'pasarela', 'fundir': True,
                  'es': 'Red de pasarelas de Caleta Tortel',
                  'en': 'Caleta Tortel boardwalk network'},
    'Sendero_vigia': {'tipo': 'sendero', 'es': 'nombre', 'en': 'subtipo'},
    'Sendero_latapera': {'tipo': 'sendero', 'es': 'nombre', 'en': 'subtipo'},
    'Ruta_camposHS': {'tipo': 'ruta', 'es': 'subtipo', 'en': 'nombre'},
    'Ruta_isla_muertos': {'tipo': 'ruta', 'es': 'subtipo', 'en': 'nombre'},
    'RP_camposHN': {'tipo': 'ruta', 'es': 'NOM_RUTA', 'en': 'CIRCUITO'},
    # Las áreas usan `nombre` en minúscula: el paso 1 ya normalizó su `NOMBRE`
    # original a la clave común. Buscar 'NOMBRE' acá las dejaba SIN NOMBRE, y
    # como el nombre propio no se traduce, ES y EN salen del mismo campo.
    'glaciarCHN': {'tipo': 'area', 'es': 'nombre', 'en': 'nombre'},
    'glaciarCHS': {'tipo': 'area', 'es': 'nombre', 'en': 'nombre'},
    'parque_latapera': {'tipo': 'area', 'es': 'nombre', 'en': 'nombre'},
}

DESCRIPCIONES = {
    'pasarela': (
        'Caleta Tortel no tiene calles: se recorre entera por pasarelas de ciprés '
        'sobre el agua y la ladera. Esta es la red completa, {n} tramos y unos '
        '{km} km en total. Las distancias parecen cortas en el mapa, pero casi '
        'todo el pueblo se sube y se baja por escaleras.',
        'Caleta Tortel has no streets: the whole village is crossed on cypress '
        'boardwalks over the water and the hillside. This is the full network, '
        '{n} sections and about {km} km. Distances look short on the map, but '
        'most of the village is stairs up and down.'),
    'sendero': ('Sendero de {largo} km en Caleta Tortel.',
                'A {largo} km trail in Caleta Tortel.'),
    'ruta': ('Ruta de {largo} km desde Caleta Tortel.',
             'A {largo} km route from Caleta Tortel.'),
    'area': ('Área protegida en el entorno de Caleta Tortel: {clasificacion}.',
             'Protected area near Caleta Tortel: {clasificacion}.'),
}


def _grados_por_metro(lat):
    """Cuánto vale un metro en grados, a esta latitud. La longitud se encoge con
    el coseno de la latitud, y en Tortel (−47,8°) eso es un factor de 0,67: no
    corregirlo simplificaría el eje este-oeste un 50% de más."""
    return 1 / 111320.0, 1 / (111320.0 * max(math.cos(math.radians(lat)), 0.01))


def _dist_punto_recta(p, a, b, escala):
    """Distancia perpendicular de p al segmento a-b, en metros aproximados."""
    (sy, sx) = escala
    px, py = p[0] / sx, p[1] / sy
    ax, ay = a[0] / sx, a[1] / sy
    bx, by = b[0] / sx, b[1] / sy
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplificar(puntos, tolerancia_m):
    """Douglas-Peucker iterativo (sin recursión: un glaciar de 17 mil vértices
    revienta la pila por defecto de Python)."""
    if tolerancia_m <= 0 or len(puntos) < 3:
        return puntos
    escala = _grados_por_metro(puntos[0][1])
    conservar = [False] * len(puntos)
    conservar[0] = conservar[-1] = True
    pila = [(0, len(puntos) - 1)]
    while pila:
        ini, fin = pila.pop()
        if fin <= ini + 1:
            continue
        peor, idx = 0.0, -1
        for i in range(ini + 1, fin):
            d = _dist_punto_recta(puntos[i], puntos[ini], puntos[fin], escala)
            if d > peor:
                peor, idx = d, i
        if peor > tolerancia_m and idx > 0:
            conservar[idx] = True
            pila.append((ini, idx))
            pila.append((idx, fin))
    return [p for p, c in zip(puntos, conservar) if c]


def _redondear(p):
    return [round(p[0], DECIMALES), round(p[1], DECIMALES)]


def procesar_coords(coords, tolerancia_m, profundidad):
    """Aplica simplificación + redondeo respetando el anidamiento de la geometría
    (LineString → lista de puntos; MultiPolygon → lista de listas de anillos)."""
    if profundidad == 0:
        simple = simplificar(coords, tolerancia_m)
        # Un anillo de polígono tiene que seguir cerrado después de simplificar.
        if len(coords) > 2 and coords[0] == coords[-1] and simple[0] != simple[-1]:
            simple.append(simple[0])
        return [_redondear(p) for p in simple]
    return [procesar_coords(c, tolerancia_m, profundidad - 1) for c in coords]


PROFUNDIDAD = {'LineString': 0, 'MultiLineString': 1, 'Polygon': 1, 'MultiPolygon': 2}


def _vertices(coords):
    if not coords:
        return 0
    if isinstance(coords[0][0], (int, float)):
        return len(coords)
    return sum(_vertices(c) for c in coords)


def main():
    if not os.path.isfile(ENTRADA):
        sys.exit(f'Falta {ENTRADA}. Corre antes: python3 scripts/tortel/1_unificar.py')

    with open(ENTRADA, encoding='utf-8') as f:
        coleccion = json.load(f)

    porcapa = {}
    for rasgo in coleccion.get('features', []):
        geo = rasgo.get('geometry') or {}
        if geo.get('type') in ('Point', 'MultiPoint') or not geo:
            continue
        porcapa.setdefault(rasgo['properties'].get('capa'), []).append(rasgo)

    desconocidas = sorted(set(porcapa) - set(CAPAS))
    if desconocidas:
        sys.exit('Capas de línea/área sin configurar: ' + ', '.join(map(str, desconocidas))
                 + '\nAgrégalas a CAPAS en este archivo.')

    rutas, bytes_antes, bytes_despues = [], 0, 0
    siguiente_id = 1

    for capa, rasgos in porcapa.items():
        cfg = CAPAS[capa]
        tipo = cfg['tipo']
        tol = TOLERANCIA_M[tipo]

        if cfg.get('fundir'):
            # Las 214 pasarelas se funden en un MultiLineString único.
            partes, metros = [], 0.0
            for r in rasgos:
                g = r['geometry']
                coords = g['coordinates']
                partes.extend(coords if g['type'] == 'MultiLineString' else [coords])
                metros += float((r['properties'].get('extra') or {}).get('ml') or 0)
            geometria = {'type': 'MultiLineString', 'coordinates': partes}
            nombre = {'es': cfg['es'], 'en': cfg['en']}
            largo_km = round(metros / 1000, 2)
            desc_es, desc_en = DESCRIPCIONES['pasarela']
            descripcion = {
                'es': desc_es.format(n=len(rasgos), km=largo_km),
                'en': desc_en.format(n=len(rasgos), km=largo_km),
            }
            extra_ref = {}
            rasgos_iter = [(geometria, nombre, descripcion, largo_km, extra_ref)]
        else:
            rasgos_iter = []
            for r in rasgos:
                props = r['properties']
                extra = props.get('extra') or {}

                def campo(clave):
                    return props.get(clave) if clave in props else extra.get(clave)

                nombre = {'es': campo(cfg['es']) or '', 'en': campo(cfg['en']) or ''}
                nombre['en'] = nombre['en'] or nombre['es']
                largo_km = props.get('distancia') or extra.get('Long_Km') or extra.get('SHAPE_LENG')
                largo_km = round(float(largo_km), 2) if largo_km else None
                base_es, base_en = DESCRIPCIONES[tipo]
                descripcion = {
                    'es': base_es.format(largo=largo_km,
                                         clasificacion=extra.get('Clasificac') or 'área protegida'),
                    'en': base_en.format(largo=largo_km,
                                         clasificacion=extra.get('Clasificac') or 'protected area'),
                }
                rasgos_iter.append((r['geometry'], nombre, descripcion, largo_km, extra))

        for geometria, nombre, descripcion, largo_km, extra in rasgos_iter:
            crudo = json.dumps(geometria, separators=(',', ':'))
            bytes_antes += len(crudo.encode())

            simplificada = {
                'type': geometria['type'],
                'coordinates': procesar_coords(
                    geometria['coordinates'], tol, PROFUNDIDAD[geometria['type']]),
            }
            comprimido = json.dumps(simplificada, separators=(',', ':'))
            bytes_despues += len(comprimido.encode())

            rutas.append({
                'id': siguiente_id,
                'tipo': tipo,
                'localidad': LOCALIDAD,
                'nombre': nombre,
                'descripcion': descripcion,
                'largo_km': largo_km,
                'geometria': simplificada,
                'publicado': False,
                '_origen': {
                    'fuente': 'tortel.cl/mapa-turismo-tortel-2024',
                    'fecha_extraccion': '2026-08-10',
                    'capa': capa,
                    'vertices_original': _vertices(geometria['coordinates']),
                    'vertices_final': _vertices(simplificada['coordinates']),
                    'extra': extra if isinstance(extra, dict) else {},
                },
            })
            siguiente_id += 1

    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(rutas, f, ensure_ascii=False, indent=2)

    print(f'Rutas generadas: {len(rutas)}')
    for r in rutas:
        o = r['_origen']
        print(f"  [{r['tipo']:8s}] {r['nombre']['es'][:44]:46s} "
              f"{o['vertices_original']:6d} → {o['vertices_final']:5d} vértices")
    print(f'\nPeso de las geometrías: {bytes_antes / 1024:.1f} KB → '
          f'{bytes_despues / 1024:.1f} KB '
          f'({100 - bytes_despues * 100 / bytes_antes:.0f}% menos)')
    print(f'\n→ {SALIDA}')
    print('Todas en borrador. Se revisan y publican desde /admin.')


if __name__ == '__main__':
    main()
