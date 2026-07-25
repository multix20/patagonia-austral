#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PASO 4 (opcional) — Corrige las coordenadas de los lugares geocodificando por
NOMBRE + localidad contra Google Places.

Por qué existe: muchas fichas SERNATUR traían coordenadas placeholder (repetidas,
hasta ~160 km del pueblo) y el paso 2 las reubicó al CENTRO del pueblo con una
dispersión → los pines caen "cerca del pueblo" pero no en la dirección real. Las
direcciones de SERNATUR son vagas ("Sector rincón s/n") y NO se geocodifican bien
gratis. En cambio Google conoce estos alojamientos/atractivos como POIs y, dado el
NOMBRE + la localidad, devuelve su coordenada real.

Qué hace, por cada lugar del JSON de entrada:
  1. Arma la consulta  "«nombre ES», «localidad», Chile".
  2. Consulta Google Places "Find Place From Text" → primer candidato.
  3. GUARDARRAÍL de distancia: solo acepta el resultado si cae a menos de
     --max-km del centro de la localidad (evita que Google resuelva un negocio
     homónimo en otra región). Si cae lejos o no hay resultado, CONSERVA la
     coordenada original y lo marca para revisión.
  4. Cuando acepta, sobrescribe lat/lng, agrega `google_place_id` y recalcula el
     texto de "distancia" para que quede consistente.

Salidas (no se versionan, ver .gitignore):
  - sernatur_places.geocodificado.json  → mismo formato que la entrada + campos
    `google_place_id` y `geocode_estado`. Copia este JSON sobre
    sernatur_places.json (revísalo antes) y corre el SernaturPlaceSeeder.
  - geocodificacion.csv                 → reporte de auditoría (qué se movió,
    cuánto, con qué confianza) para revisar a mano antes de sembrar.
  - geocode_cache.json                  → caché por consulta; permite reanudar
    tras un corte o límite de cuota SIN volver a pagar las llamadas ya hechas.

Requisitos:
  - Una API key de Google Maps con la **Places API** habilitada y **facturación
    activada** (tiene crédito mensual gratis; ~200 lugares entran de sobra).
      https://console.cloud.google.com/  → APIs & Services → Places API
  - Exporta la key antes de correr (NUNCA la pongas en el repo):
      Windows (PowerShell):  $env:GOOGLE_MAPS_API_KEY = "AIza..."
      Linux/macOS:           export GOOGLE_MAPS_API_KEY="AIza..."

Uso:
    python 4_geocodificar.py                 # geocodifica todo sernatur_places.json
    python 4_geocodificar.py --solo-publicados   # solo el top-10 publicado (ahorra cuota)
    python 4_geocodificar.py --limit 5 --dry-run # ver las 5 primeras consultas sin llamar
    python 4_geocodificar.py --max-km 30         # afloja el guardarraíl de distancia

Solo lee/escribe archivos locales de esta carpeta; no toca la base de datos.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parent
JSON_ENTRADA = AQUI / "sernatur_places.json"
JSON_SALIDA = AQUI / "sernatur_places.geocodificado.json"
CSV_REPORTE = AQUI / "geocodificacion.csv"
CACHE = AQUI / "geocode_cache.json"

API_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"

# Distancia máxima (km) entre el resultado de Google y el centro de la localidad
# para aceptarlo. Más allá se asume homónimo/erróneo y se conserva lo original.
MAX_KM_DEFECTO = 20.0

# Pausa (s) entre llamadas: la Places API aguanta alta QPS, pero vamos amables.
SLEEP_DEFECTO = 0.15

# Localidades (slug + coordenadas del centro) — en espejo con 2_generar_textos.py
# y LocalidadSeeder.php. Sirven de referencia para el guardarraíl de distancia.
LOCALIDADES = {
    "puerto-montt": ("Puerto Montt", -41.4693, -72.9424),
    "hornopiren": ("Hornopirén", -41.9578, -72.4372),
    "caleta-gonzalo": ("Caleta Gonzalo", -42.5633, -72.5989),
    "chaiten": ("Chaitén", -42.9169, -72.7086),
    "el-amarillo": ("El Amarillo", -42.9333, -72.5333),
    "villa-santa-lucia": ("Villa Santa Lucía", -43.4167, -72.3667),
    "futaleufu": ("Futaleufú", -43.1847, -71.8697),
    "palena": ("Palena", -43.6167, -71.8000),
    "la-junta": ("La Junta", -43.9667, -72.4000),
    "puyuhuapi": ("Puyuhuapi", -44.3256, -72.5561),
    "villa-amengual": ("Villa Amengual", -44.7333, -72.2500),
    "puerto-cisnes": ("Puerto Cisnes", -44.7419, -72.6892),
    "villa-manihuales": ("Villa Mañihuales", -45.1667, -72.1500),
    "puerto-aysen": ("Puerto Aysén", -45.4028, -72.6931),
    "puerto-chacabuco": ("Puerto Chacabuco", -45.4667, -72.8167),
    "coyhaique": ("Coyhaique", -45.5712, -72.0685),
    "villa-cerro-castillo": ("Villa Cerro Castillo", -46.1167, -72.1667),
    "puerto-rio-tranquilo": ("Puerto Río Tranquilo", -46.6236, -72.6772),
    "puerto-guadal": ("Puerto Guadal", -46.8500, -72.6944),
    "chile-chico": ("Chile Chico", -46.5417, -71.7264),
    "puerto-bertrand": ("Puerto Bertrand", -46.9833, -72.8000),
    "cochrane": ("Cochrane", -47.2539, -72.5744),
    "caleta-tortel": ("Caleta Tortel", -47.7936, -73.5328),
    "villa-ohiggins": ("Villa O'Higgins", -48.4667, -72.5667),
}


def sin_acentos(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s or "")
        if unicodedata.category(c) != "Mn"
    ).lower().strip()


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return r * 2 * math.asin(math.sqrt(a))


def localidad_mas_cercana(lat: float, lng: float) -> str:
    """Slug de la localidad cuyo centro está más cerca de (lat, lng)."""
    return min(
        LOCALIDADES,
        key=lambda s: haversine_km(lat, lng, LOCALIDADES[s][1], LOCALIDADES[s][2]),
    )


def textos_distancia(slug: str, lat: float, lng: float) -> dict:
    """Recalcula el texto de distancia ES/EN al centro de la localidad."""
    loc_nombre, clat, clng = LOCALIDADES[slug]
    d = haversine_km(lat, lng, clat, clng)
    if d < 1.0:
        return {"es": f"En el centro de {loc_nombre}",
                "en": f"In the centre of {loc_nombre}"}
    return {"es": f"A {d:.1f} km del centro de {loc_nombre}",
            "en": f"{d:.1f} km from the centre of {loc_nombre}"}


def resuelve_centro(lugar: dict) -> tuple[str | None, str, float, float] | None:
    """(slug, nombre, clat, clng) del centro de referencia, o None si no hay."""
    slug = lugar.get("localidad")
    if slug in LOCALIDADES:
        n, clat, clng = LOCALIDADES[slug]
        return slug, n, clat, clng
    # Sin slug conocido: si trae coordenadas, usar la localidad más cercana.
    lat, lng = lugar.get("lat"), lugar.get("lng")
    if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        s = localidad_mas_cercana(lat, lng)
        n, clat, clng = LOCALIDADES[s]
        return s, n, clat, clng
    return None


def consulta_de(lugar: dict, loc_nombre: str) -> str:
    nombre = (lugar.get("nombre") or {}).get("es") or ""
    partes = [p for p in (nombre, loc_nombre, "Chile") if p]
    return ", ".join(partes)


def carga_cache() -> dict:
    if CACHE.is_file():
        try:
            return json.loads(CACHE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            print(f"⚠ {CACHE.name} corrupto — se ignora y se reconstruye.")
    return {}


def guarda_cache(cache: dict) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def busca_google(consulta: str, api_key: str) -> dict:
    """Llama a Find Place From Text. Devuelve {estado, place_id, lat, lng, nombre}.

    estado ∈ OK | SIN_RESULTADO | ERROR:<status>. Lanza RuntimeError si la cuota
    se agotó (OVER_QUERY_LIMIT) para que el caller corte y guarde la caché."""
    params = {
        "input": consulta,
        "inputtype": "textquery",
        "fields": "place_id,geometry,name,formatted_address",
        "language": "es",
        "region": "cl",
        "key": api_key,
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    for intento in range(3):
        try:
            with urllib.request.urlopen(url, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            break
        except (urllib.error.URLError, TimeoutError) as e:
            if intento == 2:
                return {"estado": f"ERROR:red ({e})"}
            time.sleep(2 * (intento + 1))
    status = data.get("status")
    if status == "OVER_QUERY_LIMIT":
        raise RuntimeError("Google devolvió OVER_QUERY_LIMIT (cuota agotada).")
    if status == "ZERO_RESULTS":
        return {"estado": "SIN_RESULTADO"}
    if status != "OK" or not data.get("candidates"):
        # REQUEST_DENIED suele ser key inválida o Places API sin habilitar.
        msg = data.get("error_message", "")
        return {"estado": f"ERROR:{status}" + (f" — {msg}" if msg else "")}
    cand = data["candidates"][0]
    loc = cand.get("geometry", {}).get("location", {})
    return {
        "estado": "OK",
        "place_id": cand.get("place_id"),
        "lat": loc.get("lat"),
        "lng": loc.get("lng"),
        "nombre": cand.get("name", ""),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Geocodifica lugares por nombre (Google Places).")
    ap.add_argument("--input", type=Path, default=JSON_ENTRADA, help="JSON de entrada (forma places.json).")
    ap.add_argument("--output", type=Path, default=JSON_SALIDA, help="JSON de salida.")
    ap.add_argument("--max-km", type=float, default=MAX_KM_DEFECTO, help="Distancia máx. al centro para aceptar (km).")
    ap.add_argument("--sleep", type=float, default=SLEEP_DEFECTO, help="Pausa entre llamadas (s).")
    ap.add_argument("--solo-publicados", action="store_true", help="Geocodificar solo los publicados (ahorra cuota).")
    ap.add_argument("--limit", type=int, default=0, help="Procesar como mucho N lugares (0 = todos).")
    ap.add_argument("--dry-run", action="store_true", help="Mostrar las consultas sin llamar a Google.")
    args = ap.parse_args()

    if not args.input.is_file():
        sys.exit(f"No encuentro {args.input}. Corre antes el paso 2 (o pásame --input).")

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key and not args.dry_run:
        sys.exit(
            "Falta la variable GOOGLE_MAPS_API_KEY.\n"
            "  PowerShell:  $env:GOOGLE_MAPS_API_KEY = \"AIza...\"\n"
            "  bash/zsh:    export GOOGLE_MAPS_API_KEY=\"AIza...\"\n"
            "La key necesita la Places API habilitada y facturación activada.\n"
            "(O usa --dry-run para ver las consultas sin llamar a Google.)"
        )

    lugares = json.loads(args.input.read_text(encoding="utf-8"))
    if args.solo_publicados:
        lugares = [l for l in lugares if l.get("publicado")]
    if args.limit:
        lugares = lugares[: args.limit]

    cache = carga_cache()
    filas_reporte = []
    n_ok = n_lejos = n_sin = n_error = n_cache = n_sin_centro = 0

    try:
        for i, lugar in enumerate(lugares, 1):
            nombre = (lugar.get("nombre") or {}).get("es") or f"id {lugar.get('id')}"
            centro = resuelve_centro(lugar)
            if centro is None:
                lugar["geocode_estado"] = "SIN_LOCALIDAD"
                n_sin_centro += 1
                filas_reporte.append([lugar.get("id"), nombre, lugar.get("localidad", ""),
                                      "SIN_LOCALIDAD", "", "", "", ""])
                continue
            slug, loc_nombre, clat, clng = centro
            consulta = consulta_de(lugar, loc_nombre)
            lat0, lng0 = lugar.get("lat"), lugar.get("lng")

            if args.dry_run:
                print(f"[{i}/{len(lugares)}] {consulta}")
                continue

            # Caché: no repetir (ni pagar) consultas ya resueltas.
            if consulta in cache:
                res = cache[consulta]
                n_cache += 1
            else:
                res = busca_google(consulta, api_key)
                cache[consulta] = res
                guarda_cache(cache)
                time.sleep(args.sleep)

            estado = res.get("estado")
            if estado == "OK":
                glat, glng = res.get("lat"), res.get("lng")
                dist_centro = haversine_km(glat, glng, clat, clng)
                if dist_centro <= args.max_km:
                    movido = haversine_km(lat0, lng0, glat, glng) if (
                        isinstance(lat0, (int, float)) and isinstance(lng0, (int, float))
                    ) else None
                    lugar["lat"] = round(glat, 6)
                    lugar["lng"] = round(glng, 6)
                    lugar["google_place_id"] = res.get("place_id")
                    lugar["geocode_estado"] = "OK"
                    lugar["dist"] = textos_distancia(slug, glat, glng)
                    n_ok += 1
                    filas_reporte.append([lugar.get("id"), nombre, slug, "OK",
                                          f"{glat:.6f}", f"{glng:.6f}",
                                          f"{dist_centro:.1f}",
                                          f"{movido:.2f}" if movido is not None else ""])
                else:
                    # Encontró algo, pero lejísimos → probable homónimo. No tocar.
                    lugar["geocode_estado"] = "LEJOS"
                    n_lejos += 1
                    filas_reporte.append([lugar.get("id"), nombre, slug, "LEJOS",
                                          f"{glat:.6f}", f"{glng:.6f}",
                                          f"{dist_centro:.1f}", ""])
            elif estado == "SIN_RESULTADO":
                lugar["geocode_estado"] = "SIN_RESULTADO"
                n_sin += 1
                filas_reporte.append([lugar.get("id"), nombre, slug, "SIN_RESULTADO", "", "", "", ""])
            else:
                lugar["geocode_estado"] = estado
                n_error += 1
                filas_reporte.append([lugar.get("id"), nombre, slug, estado, "", "", "", ""])
    except RuntimeError as e:
        guarda_cache(cache)
        print(f"\n⛔ {e}\nSe guardó la caché; vuelve a correr el comando para retomar.")
        sys.exit(1)

    if args.dry_run:
        print(f"\n(dry-run) {len(lugares)} consultas mostradas, sin llamar a Google.")
        return

    guarda_cache(cache)
    args.output.write_text(json.dumps(lugares, ensure_ascii=False, indent=2), encoding="utf-8")

    with CSV_REPORTE.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id", "nombre", "localidad", "estado", "lat_google", "lng_google",
                    "km_al_centro", "km_movido"])
        w.writerows(filas_reporte)

    print(f"\n✔ {len(lugares)} lugares procesados.")
    print(f"   OK (reubicados): {n_ok}   ·   de caché: {n_cache}")
    print(f"   Conservados: LEJOS {n_lejos} · SIN_RESULTADO {n_sin} · "
          f"ERROR {n_error} · SIN_LOCALIDAD {n_sin_centro}")
    print(f"   → {args.output.name}  y  {CSV_REPORTE.name}")
    print("   Revisa el CSV antes de copiar el JSON sobre sernatur_places.json y sembrar.")


if __name__ == "__main__":
    main()
