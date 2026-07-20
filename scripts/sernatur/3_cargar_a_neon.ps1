# PASO 3 (guiado) — Carga los 182 servicios a la base de datos de producción (Neon).
#
# Hace todo el flujo por ti, con un punto de control de seguridad:
#   1. Copia sernatur_places.json a backend/database/seeders/data/
#   2. Te pide la DB_URL de Neon (no se guarda; vive solo en esta ejecución)
#   3. Verifica que la conexión apunta a Neon (aborta si no)
#   4. Te pide confirmación explícita
#   5. Corre el seeder (entran como BORRADOR, no visibles al público)
#
# Uso (PowerShell, desde la carpeta scripts\sernatur):
#     .\3_cargar_a_neon.ps1
#
# Si PowerShell bloquea el script por política, ábrelo así una sola vez:
#     powershell -ExecutionPolicy Bypass -File .\3_cargar_a_neon.ps1

$ErrorActionPreference = "Stop"

# --- Rutas ------------------------------------------------------------------
$aqui    = Split-Path -Parent $MyInvocation.MyCommand.Path
$jsonSrc = Join-Path $aqui "sernatur_places.json"
$backend = Resolve-Path (Join-Path $aqui "..\..\backend")
$dataDir = Join-Path $backend "database\seeders\data"

Write-Host "=== Carga SERNATUR -> Neon (produccion) ===" -ForegroundColor Cyan

# --- 0. Comprobaciones previas ---------------------------------------------
if (-not (Test-Path $jsonSrc)) {
    Write-Host "No encuentro sernatur_places.json. Corre antes: python 2_generar_textos.py" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $backend "artisan"))) {
    Write-Host "No encuentro el backend de Laravel en $backend" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $backend "vendor"))) {
    Write-Host "Falta la carpeta vendor. Ejecuta primero en $backend :  composer install" -ForegroundColor Red
    exit 1
}

# --- 1. Copiar el JSON ------------------------------------------------------
Copy-Item $jsonSrc $dataDir -Force
Write-Host "[1/5] JSON copiado a database\seeders\data\" -ForegroundColor Green

# --- 2. Pedir la DB_URL de Neon (no se persiste) ---------------------------
Write-Host ""
Write-Host "[2/5] Pega la cadena de conexion de Neon (DB_URL)." -ForegroundColor Yellow
Write-Host "      Formato: postgresql://usuario:clave@host.neon.tech/base?sslmode=require"
$dbUrl = Read-Host "      DB_URL"
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    Write-Host "No ingresaste una DB_URL. Cancelado." -ForegroundColor Red
    exit 1
}

# Variables solo para esta sesion (los procesos hijos de php las heredan).
$env:DB_CONNECTION = "pgsql"
$env:DB_URL        = $dbUrl.Trim()

Push-Location $backend
try {
    php artisan config:clear | Out-Null

    # --- 3. Punto de control: confirmar que apunta a Neon -------------------
    Write-Host ""
    Write-Host "[3/5] Verificando a que base de datos apunta..." -ForegroundColor Yellow
    $info = (php artisan db:show 2>&1 | Out-String)
    Write-Host $info
    if ($info -notmatch "neon") {
        Write-Host "La conexion NO parece apuntar a Neon (no veo 'neon' en el host)." -ForegroundColor Red
        Write-Host "Abortado por seguridad. Revisa la DB_URL y vuelve a intentar." -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: la conexion apunta a Neon." -ForegroundColor Green

    # --- 4. Confirmacion explicita -----------------------------------------
    Write-Host ""
    Write-Host "[4/5] Vas a INSERTAR 182 servicios (en BORRADOR) en produccion." -ForegroundColor Yellow
    $ok = Read-Host "      Escribe SI (mayusculas) para continuar"
    if ($ok -cne "SI") {
        Write-Host "Cancelado. No se escribio nada." -ForegroundColor Red
        exit 1
    }

    # --- 5. Correr el seeder -----------------------------------------------
    Write-Host ""
    Write-Host "[5/5] Cargando..." -ForegroundColor Yellow
    php artisan db:seed --class=SernaturPlaceSeeder --force

    Write-Host ""
    Write-Host "Listo. Revisa en tu /admin (seccion Lugares): apareceran como NO publicados." -ForegroundColor Green
    Write-Host "Para deshacer, en 'php artisan tinker':" -ForegroundColor DarkGray
    Write-Host "  \App\Models\Place::whereBetween('id', [2000, 2181])->delete();" -ForegroundColor DarkGray
}
finally {
    Pop-Location
    # Limpia las variables sensibles de la sesion.
    Remove-Item Env:\DB_URL -ErrorAction SilentlyContinue
    Remove-Item Env:\DB_CONNECTION -ErrorAction SilentlyContinue
}
