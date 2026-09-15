$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    throw "Python is required. Install Python 3.12.x and make it available on PATH."
}

$version = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ($version -ne "3.12") {
    throw "Nexora API requires Python 3.12.x; detected $version."
}

if (-not (Test-Path ".venv")) {
    & python -m venv .venv
}

$venvPython = Join-Path $PWD ".venv\Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r requirements\development.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created services/nexora-api/.env from .env.example. Review local values before running the API."
}

& $venvPython manage.py check
Write-Host "Nexora API development environment is ready."
