# Nexora API Backend — AGENT.md

## 0. Role and authority

This file governs AI agents working inside `services/nexora-api/`.

The repository root `AGENTS.md` is the global supervisor. Product-specific `apps/*/AGENT.md` files define product behavior. This file owns the **backend implementation layer**.

Backend agents are not frontend agents.

A backend agent must not move into UI implementation simply because a feature request originates from a screen. Likewise, frontend agents must not implement backend behavior inside mock data or client-only code when the feature requires server authority.

---

# 1. Backend mission

`services/nexora-api/` is the primary Django/DRF backend for the Nexora ecosystem.

It provides:

- HTTP APIs;
- authentication integration;
- authorization enforcement;
- domain services;
- repositories;
- persistence;
- migrations;
- background processing;
- provider adapters;
- audit/event handling;
- shared backend infrastructure.

Architecture target:

> **Modular Monolith → Service-Ready**

The backend should remain one coherent deployable system while preserving explicit module boundaries that can later be extracted.

---

# 2. Technology baseline

Primary stack:

- Python;
- Django;
- Django REST Framework;
- PostgreSQL;
- pytest;
- Ruff;
- structured logging;
- UUIDs;
- provider-neutral ports/adapters.

Potential supporting technologies are allowed only when justified by the existing architecture and workload.

Do not add a dependency merely because it is convenient for one endpoint.

---

# 3. Backend directory ownership

Conceptual responsibilities:

```
services/nexora-api/
│
├── api/
│   └── HTTP/API boundary
│
├── apps/
│   └── Django/domain modules
│
├── config/
│   └── Django configuration
│
├── infrastructure/
│   └── external providers/adapters
│
├── tests/
│   └── backend verification
│
├── scripts/
│   └── operational/development helpers
│
└── manage.py
```

Follow the actual repository structure. Do not create parallel architectural directories when an existing location already owns the concern.

---

# 4. Backend vs frontend boundary

## Backend agent may modify

- Django models;
- migrations;
- serializers;
- API views/viewsets;
- URL routes;
- permissions;
- authentication;
- domain/application services;
- repository implementations;
- provider adapters;
- workers;
- jobs;
- backend configuration;
- API documentation;
- backend tests.

## Backend agent must not own

- React components;
- Expo screens;
- navigation;
- visual design;
- CSS/layout;
- mobile UI;
- frontend state management.

If a frontend change is needed, document the API contract required by the frontend instead of implementing frontend code.

---

# 5. Product/domain ownership

Before implementing a backend feature, identify the owning product.

Examples:

- Identity → Core.
- Organizations/RBAC → Core.
- Personal/business financial ledger → Finance.
- KRS/grades/attendance → Dignity.
- Document editing → Office.
- Chapter entitlement → Nexverse.
- CRM pipeline → CRM.

The backend is shared infrastructure for these domains, but shared backend location does not mean every domain belongs to Core.

Product-specific domain modules should remain explicit.

---

# 6. Layering

Preferred request flow:

```
HTTP Request
   ↓
Authentication
   ↓
Authorization
   ↓
Serializer/Input Validation
   ↓
Application/Domain Service
   ↓
Repository / Model
   ↓
Infrastructure Adapter when needed
   ↓
Response
```

Avoid putting substantial business rules directly into:

- serializers;
- views;
- URL configuration;
- provider callbacks.

Controllers should orchestrate, not become the domain.

---

# 7. Models and persistence

Use relational models for durable business state.

Rules:

- UUIDs for internal identifiers;
- explicit timestamps;
- explicit status fields;
- database constraints for invariants;
- indexes based on actual queries;
- foreign keys with deliberate deletion behavior;
- soft deletion where audit/recovery requires it.

Do not create a model without determining:

- ownership;
- lifecycle;
- uniqueness;
- deletion semantics;
- authorization scope;
- audit requirements.

---

# 8. Transactions and concurrency

Use database transactions for multi-step state changes.

Consider concurrency explicitly for:

- identity creation;
- membership changes;
- financial records;
- payment webhooks;
- inventory;
- counters;
- approvals;
- idempotency records.

Do not assume:

> check → insert

is race-safe.

Where uniqueness matters, enforce it at the database layer and handle the resulting conflict deterministically.

---

# 9. API contract rules

Every API must define:

- authentication requirement;
- authorization requirement;
- input schema;
- output schema;
- error behavior;
- pagination where applicable;
- idempotency behavior where applicable.

Prefer versioned endpoints.

Example:

```
/api/v1/...
```

Do not expose internal Django model structure merely because it is convenient.

---

# 10. Authentication

Firebase Authentication may be used as an external authentication provider.

The backend must:

1. verify provider tokens;
2. resolve the provider identity;
3. map it to the internal Nexora UUID;
4. establish request identity;
5. authorize access using internal permissions.

Do not use Firebase UID as the internal canonical identity.

Do not store passwords in Core when Firebase Authentication is authoritative.

---

# 11. Authorization

Authorization must happen server-side.

Never trust:

- client-supplied role;
- client-supplied organization ID;
- hidden frontend fields;
- UI route visibility.

Every sensitive endpoint must establish:

- actor;
- organization/tenant context;
- resource;
- requested action;
- permission decision.

---

# 12. Provider adapters

External providers belong in infrastructure adapters.

Examples:

```
Firebase
Payment Gateway
Storage
Email
Push
AI Provider
Analytics Provider
```

Domain/application code should depend on a stable port/contract.

Provider-specific exceptions should be translated into backend/application-level errors.

---

# 13. Firebase rules

Firebase integration must:

- initialize lazily when appropriate;
- avoid unnecessary startup network calls;
- keep SDK types out of domain contracts;
- validate provider responses;
- handle provider failure explicitly;
- keep credentials outside source control.

Use App Check or other controls where appropriate for supported clients.

---

# 14. Background jobs

Use background workers for operations that should not block API requests, such as:

- email delivery;
- notifications;
- document processing;
- OCR;
- large file operations;
- analytics processing;
- reconciliation jobs;
- provider synchronization.

Jobs must define:

- retry behavior;
- idempotency;
- failure handling;
- observability.

Do not blindly retry non-idempotent operations.

---

# 15. Security

Backend agents must treat these as high-risk:

- identity;
- authorization;
- payments;
- financial data;
- file access;
- personal data;
- provider credentials;
- administrative actions.

Never:

- log access tokens;
- log secrets;
- return internal stack traces to clients;
- trust client authorization;
- expose private storage objects;
- bypass permission checks for convenience.

---

# 16. Testing requirements

Backend changes should include appropriate tests for:

### Unit

- domain rules;
- validators;
- services;
- adapters.

### Integration

- database behavior;
- transactions;
- permissions;
- API behavior.

### Security

- unauthorized access;
- cross-tenant access;
- role boundaries;
- object-level permissions.

### Reliability

- retries;
- duplicate requests;
- provider failures;
- malformed provider responses.

### Concurrency

Use explicit concurrent transaction tests where a race is plausible.

---

# 17. Migration discipline

Before adding/changing models:

1. inspect existing schema;
2. inspect related models;
3. determine backward compatibility;
4. create migration;
5. consider existing production data;
6. test migration path.

Never delete production data as part of a convenience refactor without explicit authorization and a migration/recovery plan.

---

# 18. API/frontend coordination protocol

When a frontend feature requires backend support:

Frontend agent should define the desired contract:

```
endpoint
method
request
response
states
errors
authorization
```

Backend agent implements the server contract.

Backend agent should return stable behavior rather than requiring frontend agents to infer database structures.

When API changes:

- update contract/documentation;
- add backend tests;
- communicate breaking changes;
- update frontend consumers separately.

---

# 19. AI-agent work protocol

Before implementation:

1. Read root `AGENTS.md`.
2. Read the owning product `apps/<product>/AGENT.md`.
3. Read this backend `AGENT.md`.
4. Inspect existing backend modules.
5. Search for existing abstractions.
6. Search for duplicate models/services.
7. Inspect tests.
8. Identify API consumers.
9. Determine ownership.
10. Plan the smallest safe change.

After implementation:

1. run targeted pytest;
2. run Django checks;
3. run Ruff;
4. inspect migration;
5. inspect API contract;
6. perform security review;
7. test tenant boundaries;
8. test failure/idempotency behavior;
9. update documentation when architecture changed.

---

# 20. No duplicate backend

Before creating any of the following, search first:

- User/Identity model;
- Organization;
- Membership;
- Role;
- Permission;
- Audit event;
- File metadata;
- Payment transaction;
- Notification;
- Provider adapter;
- AI gateway;
- repository;
- service;
- serializer pattern.

If one already exists, extend/reuse it instead of creating another implementation.

---

# 21. Definition of done

A backend task is complete when:

- correct product/domain owns it;
- API contract is explicit;
- authorization is enforced;
- persistence is correct;
- migrations are safe;
- tests pass;
- failure behavior is considered;
- concurrency is considered where relevant;
- audit is considered;
- provider boundaries are preserved;
- no frontend responsibility was accidentally absorbed;
- no duplicate shared capability was introduced.

---

# 22. Escalation rule

If a backend agent discovers that a feature requires:

- a new Core capability;
- a new cross-product contract;
- a breaking API change;
- a new external provider;
- a major schema migration;
- a new security model;

do not silently implement the architectural decision.

Document the issue and follow the repository's architecture/ADR process.

The backend agent is an implementation owner, not the sole authority for ecosystem architecture.
