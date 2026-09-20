# Nexora Current State

Last maintained: 2026-09-20

## Repository foundation

The repository is the Nexora monorepo and currently contains the shared structure for products, Nexora Core, workers, packages, infrastructure, tooling, and documentation.

Current root areas include:

- `apps/`
- `services/`
- `packages/`
- `infrastructure/`
- `tooling/`
- `docs/`

The repository README defines the architecture as **Modular Monolith → Service-Ready** and establishes the core principles of shared foundation, explicit domain boundaries, Nexora UUID identity, provider-neutral Firebase adapters, no committed secrets, and independent product deployment.

## Known architecture baseline

Existing documentation establishes:

- frontend/backend physical separation;
- Django/DRF Nexora Core under `services/nexora-api/`;
- workers under `services/workers/`;
- Firebase and Google Cloud configuration under `infrastructure/`;
- shared frontend/platform packages under `packages/`.

## Historical Nexora Core implementation context

The broader Nexora backend work has established the following intended baseline and should be verified against the actual repository implementation before changing it:

- core UUID/timestamp/soft-delete/auditable model foundations;
- soft-delete/restore/active/deleted behavior;
- correlation IDs and `X-Request-ID` compatibility;
- context cleanup;
- exception hierarchy and response helpers;
- bounded page pagination;
- validators and logging filters;
- DRF configuration;
- health checks and foundational tests;
- provider-neutral ports/value objects/exceptions/contract tests;
- Firebase integration behind `infrastructure/firebase/` with lazy initialization;
- identity application with provider-account linking;
- NEXORA UUID as the internal identity anchor;
- Firebase subject/UID kept as an external provider identifier;
- no password ownership in Nexora Core when Firebase Authentication is used.

These points are context, not permission to assume files or implementations exist. Codex must inspect the repository before modifying any of them.

## Next expected platform direction

The planned sequence includes strengthening authorization/RBAC, audit/security review, and subsequent platform phases. The exact phase status must be verified from code, tests, commits, and documentation before implementation.

## State maintenance rule

Whenever a task changes architecture, security foundations, identity, provider integrations, deployment boundaries, or major product structure, update this file with the new verified state.


## Local backend Control Plane

Verified on 2026-09-20:

- Added `apps.control_plane` to Nexora Core.
- Added development-only `/ops/` dashboard and `/ops/snapshot/` JSON endpoint.
- Dashboard dynamically inventories Django API routes, reports database/Firebase configuration status, lists core/domain services, and displays bounded recent request telemetry.
- Telemetry stores only method, path, status code, and duration in process memory; no request bodies or credentials are recorded.
- Control Plane is disabled when `DEBUG=False`.
- Architectural decision recorded in `docs/decisions/ADR-local-control-plane.md`.


## Security hardening — verified implementation

The backend default DRF policy is now deny-by-default:

- Firebase bearer-token authentication is the default authentication class.
- `AuthenticatedNexoraUserPermission` is the default permission class.
- Public endpoints must explicitly opt out/declare public access.
- Existing health/liveness endpoints retain explicit public behavior.
- The Control Plane remains DEBUG-only and does not inherit production API access.
- Focused tests cover the default authentication/permission policy and public health behavior.
\n## Learning gamification integration — verified on 2026-09-20\n\n- `apps.gamification` is registered in Django `INSTALLED_APPS`.\n- Gamification API is exposed under `/api/v1/gamification/`.\n- Control Center application registry includes the gamification platform service.\n- Learning quiz completion now returns the XP actually recorded by the gamification ledger.\n- Gamification migrations already exist and are now discoverable by Django migration tooling.\n