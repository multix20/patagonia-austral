#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PASO 1 — Extracción de teléfono / email / dirección desde las fichas de SERNATUR.

Lee `con_coordenadas.csv` (182 servicios con ID_SERNATUR, nombre, ciudad, URL),
visita la ficha individual de cada uno y extrae los datos de contacto que SERNATUR
solo publica en la ficha (no en el listado).

Estrategia en CAPAS (robusta ante cambios de maquetación y ante render JS o PHP):
  1) Enlaces directos  <a href="mailto:..."> y <a href="tel:...">   (lo más fiable)
  2) Etiquetas visibles "Teléfono", "Correo/Email", "Dirección"
  3) Regex de respaldo sobre todo el texto de la página

Características pedidas:
  - Maneja errores (páginas caídas, sin datos) sin abortar el lote.
  - Respeta un delay aleatorio entre peticiones (no saturar el servidor).
  - Guarda progreso incremental: si se corta, al reejecutar RETOMA donde quedó.
  - Exporta CSV final con los datos completos.

Uso (Windows, Python 3.11+):
    pip install -r requirements.txt
    playwright install chromium
    python 1_extraer_fichas.py

Ver README.md para el detalle.
"""

from __future__ import annotations

import csv
import random
import re
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    sys.exit(
        "Falta Playwright. Instala dependencias:\n"
        "    pip install -r requirements.txt\n"
        "    playwright install chromium"
    )

# --------------------------------------------------------------------------- #
# Configuración
# --------------------------------------------------------------------------- #
AQUI = Path(__file__).resolve().parent

ENTRADA = AQUI / "con_coordenadas.csv"          # CSV de origen (182 servicios)
SALIDA = AQUI / "fichas_completas.csv"          # CSV de salida (incremental)

DELAY_MIN, DELAY_MAX = 3.0, 6.0                 # segundos entre fichas (aleatorio)
TIMEOUT_MS = 30_000                             # timeout de carga por ficha
REINTENTOS = 3                                  # reintentos por ficha con backoff
HEADLESS = True                                 # False para ver el navegador
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)

# Nombres de columna posibles en el CSV de entrada (se auto-detectan, sin importar
# mayúsculas/espacios). Añade variantes aquí si tu CSV usa otro encabezado.
COL_ID = ["id_sernatur", "id", "id sernatur"]
COL_URL = ["url", "enlace", "link", "ficha"]
COL_NOMBRE = ["nombre", "name", "servicio"]

# Columnas del CSV de salida.
CAMPOS_SALIDA = [
    "id_sernatur", "nombre", "url",
    "telefono", "email", "direccion",
    "estado",   # OK | SIN_DATOS | ERROR
]

# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #
RE_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
# Teléfono chileno: +56 opcional, celular 9 XXXX XXXX o fijo 6X XXX XXXX,
# tolerando espacios, guiones y paréntesis.
RE_TEL = re.compile(
    r"(?:\+?56[\s\-.]?)?(?:\(?0?\d\)?[\s\-.]?)?\d{2,4}[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}"
)


def normaliza(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def detecta_columna(campos: list[str], candidatos: list[str]) -> str | None:
    """Devuelve el encabezado real que corresponde a uno de los candidatos."""
    mapa = {normaliza(c).lower(): c for c in campos}
    for cand in candidatos:
        if cand in mapa:
            return mapa[cand]
    return None


def detecta_dialecto(ruta: Path):
    """Detecta delimitador (, o ;) y codificación del CSV de entrada."""
    for enc in ("utf-8-sig", "latin-1"):
        try:
            with open(ruta, "r", encoding=enc, newline="") as f:
                muestra = f.read(4096)
            dialecto = csv.Sniffer().sniff(muestra, delimiters=",;\t")
            return enc, dialecto
        except (UnicodeDecodeError, csv.Error):
            continue
    # Respaldo razonable.
    return "utf-8-sig", csv.excel


def limpia_telefono(bruto: str) -> str:
    """Deja el teléfono en un formato legible y descarta ruido (fax largos, etc.)."""
    solo = re.sub(r"[^\d+]", "", bruto)
    if not solo:
        return ""
    # Un número chileno válido tiene 8–12 dígitos (con o sin +56).
    digitos = re.sub(r"\D", "", solo)
    if not (8 <= len(digitos) <= 12):
        return ""
    return normaliza(bruto)


# --------------------------------------------------------------------------- #
# Extracción por ficha
# --------------------------------------------------------------------------- #
def extrae_de_pagina(page) -> dict:
    """Aplica las tres capas de extracción sobre la página ya cargada."""
    telefono = email = direccion = ""

    # --- Capa 1: enlaces directos --------------------------------------- #
    for a in page.query_selector_all("a[href^='mailto:']"):
        cand = a.get_attribute("href").split("mailto:", 1)[-1].split("?")[0]
        if RE_EMAIL.fullmatch(cand.strip()):
            email = cand.strip()
            break
    for a in page.query_selector_all("a[href^='tel:']"):
        cand = limpia_telefono(a.get_attribute("href").split("tel:", 1)[-1])
        if cand:
            telefono = cand
            break

    # Texto completo para las capas 2 y 3.
    try:
        texto = page.inner_text("body")
    except Exception:
        texto = ""

    # --- Capa 2: etiquetas visibles ------------------------------------- #
    # Busca "Etiqueta: valor" o "Etiqueta\n valor" línea a línea.
    lineas = [normaliza(x) for x in texto.splitlines() if normaliza(x)]
    def valor_tras(etiquetas: list[str]) -> str:
        for i, ln in enumerate(lineas):
            bajo = ln.lower()
            for et in etiquetas:
                if bajo.startswith(et):
                    resto = normaliza(ln[len(et):].lstrip(" :·-"))
                    if resto:
                        return resto
                    if i + 1 < len(lineas):   # valor en la línea siguiente
                        return lineas[i + 1]
        return ""

    if not telefono:
        telefono = limpia_telefono(valor_tras(["teléfono", "telefono", "fono", "celular"]))
    if not email:
        cand = valor_tras(["correo", "email", "e-mail", "e mail"])
        m = RE_EMAIL.search(cand)
        email = m.group(0) if m else ""
    if not direccion:
        direccion = valor_tras(["dirección", "direccion", "domicilio", "ubicación", "ubicacion"])

    # --- Capa 3: regex de respaldo sobre todo el texto ------------------ #
    if not email:
        m = RE_EMAIL.search(texto)
        email = m.group(0) if m else ""
    if not telefono:
        for m in RE_TEL.finditer(texto):
            cand = limpia_telefono(m.group(0))
            if cand:
                telefono = cand
                break

    return {
        "telefono": telefono,
        "email": email,
        "direccion": normaliza(direccion),
    }


def procesa_ficha(page, url: str) -> dict:
    """Carga la ficha con reintentos y devuelve datos + estado."""
    ultimo_error = None
    for intento in range(1, REINTENTOS + 1):
        try:
            page.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
            # Da margen a que el JS (si lo hay) pinte los datos de contacto.
            try:
                page.wait_for_selector(
                    "a[href^='mailto:'], a[href^='tel:']", timeout=4_000
                )
            except PWTimeout:
                page.wait_for_timeout(1_500)   # sin enlaces: espera breve y sigue

            datos = extrae_de_pagina(page)
            datos["estado"] = "OK" if (datos["telefono"] or datos["email"]) else "SIN_DATOS"
            return datos
        except Exception as e:                 # noqa: BLE001 (queremos capturar todo)
            ultimo_error = e
            espera = 2 ** intento               # backoff 2, 4, 8 s
            print(f"    ⚠ intento {intento}/{REINTENTOS} falló: {e} — reintento en {espera}s")
            time.sleep(espera)

    return {"telefono": "", "email": "", "direccion": "",
            "estado": f"ERROR: {ultimo_error}"}


# --------------------------------------------------------------------------- #
# Progreso incremental
# --------------------------------------------------------------------------- #
def carga_ya_hechos() -> set[str]:
    """IDs ya extraídos con éxito (para retomar sin repetir)."""
    hechos: set[str] = set()
    if SALIDA.exists():
        with open(SALIDA, "r", encoding="utf-8-sig", newline="") as f:
            for fila in csv.DictReader(f):
                # Reintenta los que quedaron en ERROR; conserva OK y SIN_DATOS.
                if fila.get("estado", "").startswith("ERROR"):
                    continue
                hechos.add(fila["id_sernatur"])
    return hechos


def abre_salida():
    """Abre el CSV de salida en modo append, escribiendo cabecera si es nuevo."""
    nuevo = not SALIDA.exists()
    f = open(SALIDA, "a", encoding="utf-8-sig", newline="")
    escritor = csv.DictWriter(f, fieldnames=CAMPOS_SALIDA)
    if nuevo:
        escritor.writeheader()
        f.flush()
    return f, escritor


# --------------------------------------------------------------------------- #
# Principal
# --------------------------------------------------------------------------- #
def main() -> None:
    if not ENTRADA.exists():
        sys.exit(f"No encuentro el CSV de entrada: {ENTRADA}\n"
                 f"Copia tu 'con_coordenadas.csv' junto a este script.")

    enc, dialecto = detecta_dialecto(ENTRADA)
    with open(ENTRADA, "r", encoding=enc, newline="") as f:
        lector = csv.DictReader(f, dialect=dialecto)
        filas = list(lector)
        campos = lector.fieldnames or []

    col_id = detecta_columna(campos, COL_ID)
    col_url = detecta_columna(campos, COL_URL)
    col_nombre = detecta_columna(campos, COL_NOMBRE)
    if not col_id or not col_url:
        sys.exit(f"No pude detectar columnas ID/URL en {campos}.\n"
                 f"Edita COL_ID / COL_URL al inicio del script.")

    ya = carga_ya_hechos()
    pendientes = [r for r in filas if normaliza(r.get(col_id, "")) not in ya]
    print(f"Total: {len(filas)} · ya hechos: {len(ya)} · pendientes: {len(pendientes)}\n")
    if not pendientes:
        print("✔ Nada pendiente. CSV completo en", SALIDA)
        return

    f_out, escritor = abre_salida()
    ok = sin = err = 0
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch(headless=HEADLESS)
            contexto = navegador.new_context(user_agent=USER_AGENT, locale="es-CL")
            page = contexto.new_page()

            for i, fila in enumerate(pendientes, 1):
                idv = normaliza(fila.get(col_id, ""))
                url = normaliza(fila.get(col_url, ""))
                nombre = normaliza(fila.get(col_nombre, "")) if col_nombre else ""
                if not url:
                    print(f"[{i}/{len(pendientes)}] {idv} sin URL — omitido")
                    continue
                if not url.startswith("http"):
                    url = "https://" + url.lstrip("/")

                print(f"[{i}/{len(pendientes)}] {idv} · {nombre[:45]}")
                datos = procesa_ficha(page, url)

                escritor.writerow({
                    "id_sernatur": idv, "nombre": nombre, "url": url,
                    "telefono": datos["telefono"], "email": datos["email"],
                    "direccion": datos["direccion"], "estado": datos["estado"],
                })
                f_out.flush()   # <- progreso incremental en disco tras cada ficha

                estado = datos["estado"]
                if estado == "OK":
                    ok += 1
                    print(f"    ✔ tel={datos['telefono'] or '—'} · mail={datos['email'] or '—'}")
                elif estado == "SIN_DATOS":
                    sin += 1
                    print("    · sin datos de contacto en la ficha")
                else:
                    err += 1
                    print(f"    ✗ {estado}")

                if i < len(pendientes):
                    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

            navegador.close()
    finally:
        f_out.close()

    print(f"\nListo. OK={ok} · sin datos={sin} · errores={err}")
    print(f"Salida: {SALIDA}")
    if err:
        print("Los ERROR se reintentan solos si vuelves a ejecutar el script.")


if __name__ == "__main__":
    main()
