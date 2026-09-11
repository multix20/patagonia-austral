#!/usr/bin/env python3
"""Convierte los correos de `ola1-por-comuna.md` a TEXTO PLANO, listo para pegar
en el webmail.

Existe por un error que no se ve hasta que sale el correo: los archivos de la
campaña están en Markdown y llevan `**negritas**`, pero el README §3 manda el
correo en texto plano. Copiar y pegar desde el `.md` manda los asteriscos
dentro del correo — a una encargada de turismo municipal, en el primer contacto.

Dos detalles del formato, que son de entregabilidad y no de estilo:

- **Un párrafo es UNA línea.** El `.md` viene cortado a 76 columnas para leerse
  en el editor; si esos cortes viajan al correo, el teléfono de quien lo recibe
  los vuelve a cortar y queda en escalera. Sin saltos, envuelve el cliente.
- **El enlace va solo en su línea.** Es el único enlace visible del correo
  (README §3) y pegado a la frase siguiente se lee como texto, no como algo que
  hay que tocar.

Uso:
    python scripts/campana/a_texto_plano.py                 # las 14 comunas
    python scripts/campana/a_texto_plano.py Tortel Cochrane # solo esas
"""

import re
import sys
from pathlib import Path

FUENTE = Path(__file__).resolve().parents[2] / "docs" / "campana" / "ola1-por-comuna.md"


def a_texto_plano(texto):
    """Markdown → texto plano de correo."""
    texto = re.sub(r"\*\*([\s\S]+?)\*\*", r"\1", texto)  # negritas, incluso multilínea
    parrafos = []
    for parrafo in re.split(r"\n\s*\n", texto):
        lineas = [l.strip() for l in parrafo.split("\n") if l.strip()]
        # La firma conserva sus saltos: son tres renglones, no un párrafo.
        if any("rutaaustral.cl ·" in l for l in lineas):
            parrafos.append("\n".join(lineas))
            continue
        buffer, trozos = [], []
        for linea in lineas:
            buffer.append(linea)
            if re.search(r"https?://\S+$", linea):
                trozos.append(" ".join(buffer))
                buffer = []
        if buffer:
            trozos.append(" ".join(buffer))
        parrafos.append("\n".join(trozos))
    return "\n\n".join(parrafos)


def correos(md):
    """Devuelve [(comuna, asunto, cuerpo, qr)] en el orden del archivo."""
    for trozo in re.finditer(
        r"^### (.+?)\s*$(.*?)^\*\*Sus? QR:\*\*\s*(.+?)$", md, re.M | re.S
    ):
        comuna, bloque, qr = trozo.group(1).strip(), trozo.group(2), trozo.group(3)
        asunto = re.sub(r"\*\*", "", re.search(r"\*\*Asunto:\*\*\s*(.+)", bloque).group(1)).strip()
        cuerpo = []
        for linea in bloque.split("**Asunto:**")[1].split("\n")[1:]:
            if linea.startswith(">"):
                cuerpo.append(re.sub(r"^> ?", "", linea))
            elif cuerpo and not linea.strip():
                cuerpo.append("")
        while cuerpo and not cuerpo[-1].strip():
            cuerpo.pop()
        while cuerpo and not cuerpo[0].strip():
            cuerpo.pop(0)
        yield comuna, asunto, a_texto_plano("\n".join(cuerpo)), re.sub(r"[`]", "", qr)


def main():
    pedidas = [a.lower() for a in sys.argv[1:]]
    md = FUENTE.read_text(encoding="utf-8")
    encontradas = 0
    for comuna, asunto, cuerpo, qr in correos(md):
        if pedidas and comuna.lower() not in pedidas:
            continue
        encontradas += 1
        print("=" * 70)
        print(f"COMUNA DE {comuna.upper()}")
        print(f"Su QR: {qr}")
        print("-" * 70)
        print(f"Asunto: {asunto}")
        print()
        print(cuerpo)
        print()
    if pedidas and not encontradas:
        sys.exit(f"No hay correo para: {', '.join(sys.argv[1:])}")


if __name__ == "__main__":
    main()
