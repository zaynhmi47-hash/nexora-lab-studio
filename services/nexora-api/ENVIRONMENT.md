# Nexora API Environment

## Isolation model

The Django backend owns its Python environment under `services/nexora-api/.venv/`. This directory is local/Codespaces-only and is ignored by Git.

Frontend and shared JavaScript packages use the root pnpm workspace. The workspace uses `nodeLinker: isolated`, so packages must declare every dependency they import.

Do not install frontend packages into the Python environment, and do not add Python packages to the root Node workspace.

## Local development

From `services/nexora-api`:

### Windows PowerShell

```powershell
.\scripts\bootstrap.ps1
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

### macOS/Linux/Codespaces

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
source .venv/bin/activate
python manage.py runserver
```

The bootstrap script creates `.venv`, installs `requirements/development.txt`, creates a local `.env` from `.env.example` when missing, and runs `manage.py check`.

## Environment files

- `.env.example` is committed and contains placeholders/default development values.
- `.env` is local-only and must never be committed.
- Production secrets must be supplied by the deployment environment/secret manager, not stored in Git.

## Dependency sets

- `requirements/base.txt`: runtime dependencies shared by environments.
- `requirements/development.txt`: local development and test tooling.
- `requirements/testing.txt`: CI/test-only dependencies.
- `requirements/production.txt`: production server dependencies.

CI creates a fresh Python 3.12 virtual environment and installs dependencies from these requirement files independently of pnpm.
