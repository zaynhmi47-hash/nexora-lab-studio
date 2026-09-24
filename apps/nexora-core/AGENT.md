# Nexora Core — AGENT.md

## 1. Mission
Nexora Core is the shared platform foundation for the entire Nexora ecosystem. It is not a customer-facing vertical product. It provides reusable capabilities so Finance, Dignity, Office, Nexverse, Business Suite, Studio, AI, and future products do not independently reinvent identity, organizations, permissions, files, finance, notifications, audit, analytics, workflows, or integrations.

Architecture target: **Modular Monolith → Service-Ready**. Keep strong module boundaries inside one deployable backend until scale or ownership justifies service extraction.

## 2. Core domains
- Identity: internal Nexora UUID identity anchored to external authentication providers.
- Organizations/Tenants: users, organizations, memberships, teams, scopes.
- RBAC/Authorization: roles, permissions, policies, resource ownership.
- Finance/Accounting: reusable ledger and financial primitives.
- Payments: provider-neutral payment intents, transactions, refunds, reconciliation.
- Files: metadata, storage adapters, access control, signed URLs, lifecycle.
- Notifications: in-app, email, push, event-driven notifications.
- Audit: immutable security/business audit events.
- Analytics: product/business events and reporting primitives.
- Workflow: state machines, approvals, jobs, scheduled actions.
- Integrations: provider-neutral ports/adapters.
- AI Gateway: model/provider routing, usage, quotas, safety and tool authorization.

## 3. Non-negotiable architecture rules
- Domain logic must not depend directly on Firebase SDKs, payment vendors, AI vendors, or UI frameworks.
- External providers live behind ports/adapters.
- Internal IDs are the canonical references; provider IDs are integration metadata.
- Prefer explicit domain services and repositories over fat controllers.
- API contracts must be versionable and documented.
- Operations that can be retried must be idempotent.
- Sensitive mutations require authorization and audit events.
- Soft deletion is preferred for business records where recovery/audit matters.
- Never log passwords, tokens, secrets, raw payment credentials, or unnecessary personal data.
- Database constraints must enforce invariants that cannot safely be left to application code.

## 4. AI coding-agent instructions
Before changing code, inspect the module and its tests, identify existing abstractions, and reuse them. Do not create a duplicate identity, permission, audit, storage, notification, or payment implementation in another app. When adding a new capability, decide whether it belongs in Core or the consuming product. Add unit/integration tests for authorization, idempotency, failure paths, and concurrency where relevant. Keep migrations reversible where practical. Run formatting, linting, type checks, tests, and Django/system checks relevant to the change.

## 5. Definition of done
A change is complete only when behavior, security, tests, API contract, audit implications, and provider failure behavior have been considered. Preserve the ability to extract a module into a service later without turning today's codebase into a distributed-system prematurely.