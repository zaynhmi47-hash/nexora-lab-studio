# Nexora dependency boundaries

This repository intentionally has two dependency environments:

- **Node/pnpm**: `apps/*`, `apps/*/web`, `apps/*/mobile`, `packages/*`
- **Python/venv**: `services/nexora-api`

## Rules

1. Backend Python packages are installed only inside `services/nexora-api/.venv`.
2. Frontend/mobile/web packages are installed through the root pnpm workspace using isolated dependency linking.
3. A frontend package must declare every npm package it imports in its own `package.json`.
4. Frontend code must communicate with Nexora Core through HTTP/API contracts or shared provider-neutral TypeScript packages; it must never import Django/Python source files.
5. Backend code must not import Node packages from `apps/` or `packages/`.
6. Secrets are environment-local. Backend secrets belong in `services/nexora-api/.env`; frontend public configuration belongs in the app's `.env` files and must use Expo's public-variable convention only for values safe to expose to clients.
7. Never commit `node_modules`, pnpm store data, Python `.venv`, `.env`, service credentials, Firebase service-account JSON, or build artifacts.

## Why pnpm isolation matters

The workspace uses `nodeLinker: isolated`. This intentionally avoids classic hoisting, so a workspace package cannot silently consume a dependency that another workspace package happens to install. This makes dependency declarations explicit and reduces cross-app coupling.

## Runtime boundary

```text
apps/* (client)
    |
    | HTTPS / API contract
    v
services/nexora-api (Django)
    |
    v
infrastructure / databases / providers
```

The client boundary is a contract boundary, not a filesystem import boundary.
