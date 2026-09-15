# Nexora Architecture Rules

## 1. Architecture model

Nexora follows **Modular Monolith → Service-Ready**.

The current goal is strong modular boundaries inside a coherent platform, not a distributed system for its own sake.

## 2. Backend layers

The preferred backend dependency direction is:

```text
API / Presentation
        ↓
Application / Use Cases
        ↓
Domain
        ↓
Ports / Contracts
        ↓
Infrastructure Adapters
```

Domain code must remain independent from infrastructure SDKs and transport concerns.

## 3. Nexora Core

`services/nexora-api/` is the central Django/DRF backend foundation.

Core responsibilities may include:

- internal identity and provider-account linking;
- authentication boundary/token verification;
- authorization and RBAC;
- organization and membership foundations;
- audit/security foundations;
- shared domain primitives;
- cross-product platform capabilities that genuinely belong in the shared core.

Do not turn Nexora Core into a dumping ground for product-specific features.

## 4. Provider neutrality

External services must be isolated behind ports/adapters whenever they participate in core behavior.

Examples:

- Firebase Authentication → token verification adapter.
- Firebase Storage → storage port/adapter.
- Firestore → explicit persistence/integration boundary where used.
- Google Cloud services → infrastructure adapters.

Domain/application code should not import provider SDK classes directly.

## 5. Firebase

Firebase is an infrastructure/provider layer, not the domain model.

Use Firebase for appropriate managed capabilities, but preserve the ability to replace or add providers later without rewriting domain logic.

Avoid startup-time network calls. Prefer explicit lazy initialization for provider SDKs.

## 6. Frontend/backend separation

Frontend applications must not import Django models, migrations, ORM internals, or backend source files.

Use:

- OpenAPI-generated types;
- `packages/types/`;
- `packages/api-client/`;
- `packages/validation/`;
- explicit HTTP/API contracts.

See `docs/architecture/frontend-backend-separation.md` for the repository rule.

## 7. Identity model

Internal identity:

```text
Nexora UUID
   ↑
Provider account link
   ↑
Firebase UID / external subject
```

The external provider subject is not the internal primary key.

## 8. Service extraction readiness

A module is service-ready when it has:

- clear ownership;
- explicit domain boundaries;
- stable application interfaces;
- provider-neutral contracts;
- explicit data ownership;
- tests around its public behavior;
- minimal accidental imports from neighboring domains.

Do not split it into a network service merely because it is service-ready.

## 9. Data boundaries

A product or domain should access another domain through an explicit application/API contract rather than reaching into internal implementation details.

Avoid shared mutable state and undocumented cross-module database assumptions.

## 10. Architectural change

Significant changes require an ADR under `docs/decisions/` and an update to the relevant `.codex/` state/context file.
