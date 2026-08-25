#!/usr/bin/env python3
"""Copia un JSON del pipeline dejando fuera los correos.

Por qué existe. El extractor corre en un runner de GitHub para poder dispararlo
desde el teléfono, y deja su resultado como **artefacto**. Pero el repo es
público, así que ese artefacto lo descarga cualquiera — y los JSON traen los
correos personales de los dueños de los negocios, que es justo el dato por el
que estos archivos no se versionan.

Así que al artefacto sube una copia sin correos. Lo demás viaja igual: nombre,
teléfono, WhatsApp, web, dirección, horario y coordenada, que es lo que se
necesita para curar las fichas desde el teléfono.

En vez de borrar la clave se deja `emails_n` con cuántos había. La dirección no
se publica, pero saber que ESE negocio tenía correo sigue sirviendo para decidir
a quién se le escribe, y se recupera corriendo el pipeline en local.

Uso:
    python sin_correos.py ca-fichas.json ca-fichas.sin-correos.json
"""
import json
import sys


def limpiar(nodo):
    """Recorre el JSON y reemplaza cada `emails` por su conteo.

    Es recursivo y no asume la forma del archivo a propósito: `ca-fichas.json`
    es {metadata, fichas:[…]} y `ca_places.json` es una lista pelada, y mañana
    puede aparecer un tercero. Lo que no puede pasar es que un archivo nuevo
    arrastre correos porque el filtro solo miraba dos niveles.
    """
    if isinstance(nodo, dict):
        salida = {}
        for clave, valor in nodo.items():
            if clave == 'emails':
                salida['emails_n'] = len(valor) if isinstance(valor, (list, tuple)) else int(bool(valor))
            elif clave == 'email':
                salida['emails_n'] = int(bool(valor))
            else:
                salida[clave] = limpiar(valor)
        return salida
    if isinstance(nodo, list):
        return [limpiar(x) for x in nodo]
    return nodo


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2

    origen, destino = sys.argv[1], sys.argv[2]

    with open(origen, encoding='utf-8') as f:
        datos = json.load(f)

    limpio = limpiar(datos)

    with open(destino, 'w', encoding='utf-8') as f:
        json.dump(limpio, f, ensure_ascii=False, indent=2)

    # La comprobación que importa: que no quede NINGUNA arroba en la salida.
    # Es tosca a propósito — vale más un falso positivo (una web con arroba) que
    # publicar un correo por confiar en que el recorrido cubrió todo.
    crudo = json.dumps(limpio, ensure_ascii=False)
    arrobas = crudo.count('@')
    print(f'{origen} → {destino}')
    if arrobas:
        print(f'  OJO: quedan {arrobas} arrobas en la salida. Revisar antes de subir el artefacto.')
        return 1

    print('  Sin correos: ninguna arroba en la salida.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
