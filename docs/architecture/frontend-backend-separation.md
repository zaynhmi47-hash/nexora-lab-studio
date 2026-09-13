# Frontend / Backend Separation

## Rule

Nexora keeps frontend and backend code physically separated in the repository.

### Backend

Backend code belongs under:

- `services/nexora-api/` — Django/DRF Nexora Core
- `services/workers/` — backend/background workers
- `infrastructure/` — provider and deployment configuration

Backend must not import frontend packages or UI code.

### Frontend

Frontend code belongs under:

- `apps/*/web/` — web applications
- `apps/*/mobile/` — React Native / Expo applications
- `packages/ui/` — reusable UI primitives
- `packages/design-system/` — shared design tokens/components
- frontend-oriented packages under `packages/`

Frontend must consume backend functionality through typed API contracts/clients and approved provider adapters. It must not import Django models, migrations, ORM code, or backend internals.

## Product structure

Each product may contain separate frontend targets:

```text
apps/<product>/
├── web/        # frontend web application
├── mobile/     # mobile frontend when required
└── README.md
```

The backend remains centralized in `services/nexora-api/` according to the Modular Monolith → Service-Ready architecture.

## Shared contracts

When frontend and backend need shared structures, use explicit contracts such as:

- OpenAPI-generated API types
- `packages/types/`
- `packages/api-client/`
- `packages/validation/`

Do not solve frontend/backend coupling by sharing backend source files.

## Dependency direction

```text
Frontend apps
    ↓
Shared frontend packages / API client
    ↓
HTTP API / authenticated provider boundary
    ↓
Nexora Core
    ↓
Domain + application layer
    ↓
Infrastructure adapters
```

This separation allows each frontend to evolve independently while keeping the backend deployable as its own service.
