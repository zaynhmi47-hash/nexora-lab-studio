#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python is required. Install Python 3.12.x and make it available on PATH." >&2
  exit 1
fi

PYTHON_VERSION="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
if [[ "$PYTHON_VERSION" != "3.12" ]]; then
  echo "Nexora API requires Python 3.12.x; detected $PYTHON_VERSION." >&2
  exit 1
fi

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements/development.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created services/nexora-api/.env from .env.example. Review local values before running the API."
fi

./.venv/bin/python manage.py check
echo "Nexora API development environment is ready."
