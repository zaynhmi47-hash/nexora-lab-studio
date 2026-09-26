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
## Architecture audit — verified 2026-09-25

The repository was audited against the root AGENTS contract, .codex project rules, product AGENT files, and the current backend tree.

Verified inventory:
- 30 directories currently exist under apps/.
- 28 product AGENT files were previously documented.
- apps/nexora-muslim/ is an active Expo product and now has a dedicated AGENT contract.
- apps/nexora-business/ is an empty/reserved placeholder and is explicitly prevented from duplicating Nexora Business Suite.
- apps/nexora-health-ai/ is not present in the current repository inventory and is not treated as an active app.

Verified backend inventory includes shared/core foundations plus identity, organizations, access, capabilities, products, learning, gamification, finance and Islamic-domain applications including quran, prayer, qibla, dhikr, dua, fasting, zakat, umrah, places, reminders, ramadan and tajwid.

Verified security baseline:
- DRF defaults to Firebase bearer authentication and authenticated Nexora user permission.
- Public endpoints require explicit public permission behavior.
- NexoraUser is the internal identity model and Firebase/provider subjects are linked through provider accounts.
- UUID/timestamp/soft-delete/audit foundations are present through AuditableBaseModel.
- Firebase integration is isolated under infrastructure/firebase.
- Storage ports exist under infrastructure/storage.

Verified finance baseline:
- Finance transactions are organization-scoped.
- Transaction amounts use integer minor units.
- Initial contract currently restricts transaction currency to IDR.
- Active idempotency keys are unique per organization.
- Finance transactions reject hard deletion.

Architecture boundaries were hardened for Social vs Dating Professional, Nexora AI vs AI Agent Business, Core AI Gateway, Core/Cloud storage, Creator vs Social/Portfolio, and Business Suite vs specialized business domains.

No application runtime code was changed by this audit. Test execution was not performed through the GitHub connector, so this audit does not claim a fresh local test pass.



## Dating Social Professional — verified implementation baseline on 2026-09-26

- Product owner exists at `apps/dating-social-professional/AGENT.md`.
- Mobile foundation exists at `apps/dating-social-professional/mobile/` targeting Expo SDK 57 / React Native 0.86 / Expo Router 57.
- Backend domain exists at `services/nexora-api/apps/dating_social_professional/` and is registered in Django.
- Initial API contract exposes authenticated discovery and swipe endpoints under `/api/v1/dating/`.
- Initial persistence covers dating profiles, swipes and mutual matches.
- Swipe actor/target pairs are database-unique and the service handles repeated requests idempotently.
- Reciprocal likes create a deterministic match pair.
- Tests were added for idempotency, mutual matching and self-swipe rejection.
- ADR recorded at `docs/decisions/ADR-dating-social-professional-domain.md`.
- This branch does not claim a fresh local test/typecheck pass through the GitHub connector; execution must still be performed in the development environment.
