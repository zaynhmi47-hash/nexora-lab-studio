# Nexora Lab Studio — Codex Project Instructions

## Mission

This repository is the durable technical source of truth for the Nexora ecosystem. Codex must treat the repository documentation, architecture decisions, current-state records, tests, and existing code as authoritative project context.

## First-read protocol

Before changing code, always read:

1. `AGENTS.md`
2. `.codex/PROJECT.md`
3. `.codex/ARCHITECTURE.md`
4. `.codex/DEVELOPMENT_RULES.md`
5. `.codex/CURRENT_STATE.md`
6. Relevant ADRs under `docs/decisions/`
7. Relevant product and architecture documentation under `docs/`
8. The actual implementation and tests related to the requested change

Never assume that ChatGPT conversation history is available inside Codex. If an important decision is not present in the repository, record it before relying on it.

## Role

Act as both:

- a senior software architect responsible for system boundaries and long-term consistency; and
- a hands-on production developer responsible for implementing, testing, reviewing, and documenting changes.

Do not behave as a concept-only assistant.

## Architecture invariants

- Primary architecture: **Modular Monolith → Service-Ready**.
- Nexora Core is the shared backend foundation; Accounting & Business Intelligence is only one domain, not the entire backend.
- Django + Django REST Framework own core backend domains and application behavior.
- Frontends remain physically separated from backend internals.
- Nexora UUID is the internal identity anchor.
- External provider IDs, including Firebase subject/UID, must never become the internal primary identity key.
- Firebase integrations must remain behind provider-neutral ports/adapters.
- Provider-specific SDK code belongs in `infrastructure/` or explicit provider adapters.
- Avoid premature microservices. Establish clear domain boundaries first.
- Products should remain independently deployable even when sharing the Nexora Core foundation.
- Do not create hidden coupling between products.

## Firebase boundary

Firebase may provide services such as Authentication, Firestore, Realtime Database, Storage, BigQuery and App Check where appropriate. Core domain logic must not depend directly on Firebase SDK types.

Use ports/interfaces in application or domain boundaries and implementations in infrastructure/provider adapters. Preserve lazy initialization and avoid unnecessary startup network calls.

## Identity rules

- NEXORA UUID is the canonical internal identity.
- Firebase UID/subject is an external provider identifier.
- Provider-account links may map external identities to Nexora identities.
- No password storage in Nexora Core when Firebase Authentication is the identity provider.
- Repeated identity claims and provider callbacks must be idempotent.

## Engineering standards

- Prefer correctness, security, maintainability, consistency, and testability over speed.
- Inspect existing code before designing replacements.
- Reuse established abstractions before introducing new ones.
- Keep dependencies minimal and justified.
- Preserve existing module boundaries unless there is a documented reason to change them.
- Do not rewrite working architecture merely for stylistic preference.
- Never commit secrets, credentials, service-account keys, production `.env` files, tokens, or private keys.
- Validate all external input at explicit boundaries.
- Treat authentication, authorization, identity, payments, audit logging, and data access as security-sensitive.
- Add or update tests for behavior changes and security-sensitive changes.
- Keep API contracts explicit and versionable.

## Required workflow

For non-trivial work, follow this sequence:

**Understand → Inspect → Plan → Implement → Test → Security Review → Documentation → Commit**

Before implementation:

- identify affected domains and dependencies;
- inspect current implementation and tests;
- identify relevant ADRs and constraints;
- state assumptions when something is genuinely unknown.

After implementation:

- run the narrowest relevant tests first;
- run broader checks when practical;
- review for security and boundary violations;
- update current-state/project documentation when architecture or behavior changed;
- create/update an ADR for a significant architectural decision.

## Git rules

- `main` is the stable integration branch.
- Feature work uses `feat/*`.
- Fixes use `fix/*`.
- Maintenance uses `chore/*`.
- Prefer small, focused commits.
- Use conventional-style commit messages such as `feat(identity): add provider account linking`.
- Do not force-push or rewrite shared history unless explicitly requested.
- Prefer PRs for substantial changes; direct commits are acceptable for small repository documentation maintenance when appropriate.

## Documentation memory protocol

The repository must retain important project context. When a significant decision is made:

1. update the relevant `.codex/*.md` document;
2. create an ADR under `docs/decisions/` when appropriate;
3. update `.codex/CURRENT_STATE.md` if implementation status changed.

Never rely on an important architectural decision existing only in a chat conversation.

## Scope discipline

Do not silently expand a task into unrelated product work. If a requested change exposes a necessary architectural issue, explain it, make the smallest safe change, and document the decision.

## Completion criteria

A task is not complete merely because code was written. It is complete when the implementation is coherent with the architecture, relevant tests/checks pass, security implications were considered, and durable documentation is updated when necessary.


## Agent hierarchy and ownership

This repository uses a layered agent contract. The layers are complementary, not competing:

1. **Root `AGENTS.md` — ecosystem supervisor**
   - Owns global architecture, cross-application boundaries, repository-wide quality, and conflict resolution.
   - It does not implement application-specific UI or domain behavior merely because a product requests it.
2. **Application `apps/<product>/AGENT.md` — product owner**
   - Owns that product's product concept, UX, feature scope, domain boundaries, and product-specific implementation rules.
3. **Backend `services/nexora-api/AGENT.md` — backend execution owner**
   - Owns Django/DRF backend implementation boundaries, API contracts, domain services, repositories, migrations, provider adapters, workers, security, and backend tests.
4. **Nested `AGENT.md` files, when introduced later — local implementation owner**
   - May narrow instructions for a specific package/module, but may not contradict higher-level architecture or ownership.

### Work ownership rule

Before editing any file, an AI agent must determine which layer owns the work.

- UI screens, navigation, components, client state, accessibility, mobile/web presentation → application/frontend scope.
- HTTP endpoints, serializers, permissions, domain services, repositories, models, migrations, background jobs, provider adapters → backend scope.
- Shared cross-product capability or canonical identity/security/integration primitive → Core scope.
- CI, monorepo tooling, global conventions, architecture documentation → repository scope.
- If a task crosses two scopes, coordinate the boundary rather than allowing one agent to silently absorb the other agent's responsibility.

### No scope stealing

A frontend agent must not implement backend business logic merely because an endpoint is missing.

A backend agent must not redesign product UI merely because an API consumer needs a different presentation.

A product agent must not create a second shared capability when Core already owns it.

If an API contract must change to support a UI feature, the frontend agent documents the required contract and the backend agent owns the backend implementation. If both changes are required, they remain separately attributable and testable.

### Ownership decision tree

Before creating a new module, service, model, API, package, or UI abstraction:

1. Is the capability already implemented?
2. If yes, reuse it.
3. If no, is it shared by multiple products?
4. If yes, evaluate Nexora Core ownership.
5. If product-specific, keep it inside the product boundary.
6. If it is infrastructure/provider-specific, keep it behind the backend infrastructure/adapter boundary.
7. If ownership is ambiguous, stop and resolve the boundary before coding.

### Cross-agent contract

Agents must communicate through durable repository artifacts rather than assumptions in chat:

- API contracts;
- types/schemas;
- ADRs;
- product AGENT.md;
- backend AGENT.md;
- tests;
- current-state documentation.

Do not duplicate implementation to work around an unclear contract.
