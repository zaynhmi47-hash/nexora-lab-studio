# Nexora Core — AGENT.md

## 0. Role in the Nexora agent hierarchy

Nexora Core is the **shared platform foundation and architectural authority for reusable platform capabilities**. The repository root `AGENTS.md` remains the final ecosystem-level supervisor. This file is the detailed product/domain contract for Core.

An AI agent working inside `apps/nexora-core/` must treat this file as mandatory instructions before modifying Core code.

Core does not own every backend feature. Core owns **shared primitives and cross-product capabilities**. Product-specific business behavior remains with the product that owns it.

Architecture target:

> **Modular Monolith → Service-Ready**

The objective is strong module boundaries today and controlled extraction into services later, without prematurely introducing distributed-system complexity.

---

# 1. Product mission

Nexora Core is the shared platform foundation for the entire Nexora ecosystem.

It exists so that products such as:

- Nexora Office
- Nexora Business Suite
- Nexora Finance
- Dignity
- Nexverse
- Nexora AI
- Nexora Studio
- Nexora Creator
- Nexora CRM
- Nexora HR
- Nexora Cloud
- Nexora ERP
- and future Nexora products

can reuse the same trusted platform capabilities.

Core must prevent every product from independently implementing:

- user identity;
- organization membership;
- authorization;
- RBAC;
- audit;
- files;
- notifications;
- payment primitives;
- integrations;
- workflows;
- AI provider access;
- shared analytics/event infrastructure.

Core is a **platform**, not a dumping ground.

---

# 2. Ownership boundary

## Core owns

Core may own a capability when it is:

1. required by multiple Nexora products;
2. foundational to security or identity;
3. infrastructure-neutral and reusable;
4. important enough that duplicated implementations would create inconsistent behavior.

Examples:

- internal Nexora identity;
- external identity linking;
- organization and membership primitives;
- reusable RBAC;
- authorization policies;
- audit events;
- storage abstraction;
- notification abstraction;
- payment abstraction;
- integration ports;
- workflow primitives;
- event/analytics primitives;
- AI gateway/provider abstraction.

## Core does NOT automatically own

Do not move product-specific behavior into Core simply because it is technically reusable.

Examples:

- Finance-specific budgeting rules → Nexora Finance.
- Dignity-specific KRS rules → Dignity.
- Office document editor behavior → Nexora Office.
- Nexverse chapter entitlement rules → Nexverse.
- CRM sales pipeline behavior → Nexora CRM.
- HR leave policy → Nexora HR.

If a product needs a capability that appears reusable, first document the ownership decision. Do not silently promote it into Core.

---

# 3. Technology direction

Primary backend direction:

- Python
- Django
- Django REST Framework
- PostgreSQL
- Redis where justified
- background workers where justified
- provider-neutral ports/adapters
- structured logging
- UUID-based internal identity
- explicit API contracts
- automated tests

Frontend/admin tooling may use the repository's approved TypeScript/React stack, but Core domain logic must remain independent of UI frameworks.

Firebase is an external provider, not Core's domain model.

Potential Firebase services include:

- Authentication
- Firestore
- Realtime Database
- Storage
- BigQuery
- App Check

Provider SDK types must not leak into domain/application contracts.

---

# 4. High-level architecture

Conceptual dependency direction:

```
Product
  ↓
Product Application Layer
  ↓
Nexora Core Contracts / Shared Capabilities
  ↓
Domain + Application Services
  ↓
Ports / Interfaces
  ↓
Infrastructure Adapters
  ↓
Firebase / PostgreSQL / Storage / Payment / AI / External Providers
```

The dependency direction must not be reversed.

Bad:

```
Domain → Firebase SDK
Domain → Stripe SDK
Domain → Gemini SDK
Domain → React
```

Preferred:

```
Domain → Port
Infrastructure → Port implementation
```

---

# 5. Core domain map

Core is composed conceptually of these modules:

## Identity

Responsibilities:

- internal Nexora UUID identity;
- external identity provider links;
- authentication claims mapping;
- identity lifecycle;
- identity conflict handling.

Identity must not store passwords when Firebase Authentication is the selected identity provider.

External Firebase UID/subject is provider metadata, never the canonical Nexora identity.

## Organizations

Responsibilities:

- organizations;
- membership;
- teams;
- organization settings;
- membership status;
- tenant boundaries.

## Authorization

Responsibilities:

- roles;
- permissions;
- policies;
- resource ownership;
- permission evaluation;
- authorization context.

Authorization must be enforceable server-side.

## Audit

Responsibilities:

- immutable security/business events;
- actor;
- action;
- resource;
- organization;
- timestamp;
- correlation context;
- outcome.

Audit records must not be casually edited or deleted.

## Files

Responsibilities:

- file metadata;
- storage abstraction;
- ownership;
- access policy;
- signed/temporary access;
- lifecycle;
- versions.

Core should not embed a single storage vendor into its domain model.

## Notifications

Responsibilities:

- notification intent;
- channels;
- delivery state;
- retry policy;
- templates/preferences where shared.

## Payments

Responsibilities:

- provider-neutral payment concepts;
- payment intent;
- transaction;
- refund;
- webhook/idempotency primitives;
- reconciliation references.

Provider-specific payment behavior belongs in adapters.

## Workflow

Responsibilities:

- state transitions;
- approvals;
- scheduled actions;
- workflow metadata;
- reusable workflow primitives.

Product-specific state machines remain in the owning product.

## Analytics / Events

Responsibilities:

- common event envelope;
- event identity;
- correlation;
- product event ingestion primitives.

Core should not own every product metric definition.

## Integrations

Responsibilities:

- provider ports;
- credentials/configuration boundaries;
- adapter contracts;
- health/status metadata.

## AI Gateway

Responsibilities:

- provider-neutral model interface;
- model routing;
- usage;
- quotas;
- cost metadata;
- provider adapters;
- tool authorization boundary.

Core does not own product-specific prompts or business workflows.

---

# 6. UI/UX for Core administration

Core is not a consumer application. If an administration UI exists, it is a technical control surface for authorized operators.

Primary navigation:

```
Overview
Identity
Organizations
Authorization
Audit
Integrations
Files
Notifications
Payments
Workflows
Events
AI Gateway
System
```

## Overview

Show:

- service health;
- database health;
- provider health;
- background jobs;
- error rate;
- authentication activity;
- event processing;
- storage status;
- AI usage;
- payment integration status.

Do not turn the dashboard into a decorative analytics screen. Operational clarity is more important than visual effects.

## Identity explorer

Show safe metadata:

- Nexora UUID;
- provider linkage;
- account state;
- organizations;
- roles;
- recent security events.

Never expose:

- access tokens;
- refresh tokens;
- provider secrets;
- private credentials.

## Audit explorer

Filtering should support:

- actor;
- organization;
- action;
- resource type;
- resource ID;
- time range;
- severity;
- correlation/request ID;
- outcome.

## UX rules

Core administration UI must prioritize:

1. correctness;
2. traceability;
3. permission clarity;
4. safe destructive actions;
5. useful error messages;
6. searchable data;
7. responsive but operationally efficient layouts.

---

# 7. Identity rules

Canonical identity:

```
Nexora UUID
```

Provider identity:

```
Firebase UID / subject / future provider identifier
```

Relationship:

```
Provider Account
      ↓
Identity Link
      ↓
Nexora Identity UUID
```

Requirements:

- identity creation must be idempotent;
- repeated claims must not create duplicate identities;
- concurrent first-login attempts must be safe;
- provider account linking must be audited;
- identity conflicts must be explicit;
- no password storage when Firebase Auth is authoritative.

---

# 8. Tenant and organization isolation

Every organization-scoped operation must establish an explicit authorization context.

An agent must never write code equivalent to:

```
objects.all()
```

when the operation is supposed to be tenant-scoped.

Prefer explicit organization context and repository/service filtering.

Cross-organization access requires an explicit privileged capability.

Never use frontend-selected organization IDs as proof of authorization.

---

# 9. API contract ownership

Backend API implementation belongs to `services/nexora-api/`.

Core application agents may define or evolve domain contracts, but must coordinate with the backend owner before changing HTTP behavior.

API rules:

- version contracts;
- validate inputs;
- return stable error structures;
- use pagination for collections;
- use idempotency where retries can duplicate effects;
- document authorization expectations;
- never expose provider credentials;
- preserve backward compatibility where practical.

---

# 10. Database rules

Use PostgreSQL as the primary relational system for Core backend behavior.

Database constraints must enforce critical invariants where possible.

Use:

- UUID primary keys;
- timestamps;
- unique constraints;
- foreign keys;
- indexes based on access patterns;
- explicit status fields;
- soft-delete patterns where recovery/audit requires them.

Do not rely exclusively on Python validation for invariants that can be violated by concurrent writes.

---

# 11. Concurrency and idempotency

Any operation that may be retried must define idempotency behavior.

Important cases:

- first-login identity creation;
- provider webhooks;
- payment events;
- notification delivery;
- background jobs;
- file operations;
- organization invitations.

Where race conditions are possible, test concurrent transactions explicitly.

Expected outcome should be deterministic.

---

# 12. Audit requirements

Audit security-sensitive and business-significant mutations such as:

- identity linking;
- role changes;
- permission changes;
- organization membership changes;
- payment state changes;
- file sharing changes;
- privileged administrative actions.

Audit events must contain enough context to answer:

> Who did what, to which resource, when, from which request/context, and with what result?

Do not log secrets merely because an audit event is required.

---

# 13. Provider adapter rules

External providers must be isolated.

Example:

```
Core Contract
     ↑
Adapter
     ↑
Firebase SDK
```

Provider adapters may translate:

- authentication claims;
- storage operations;
- notification delivery;
- payment responses;
- AI model responses.

Provider SDK objects must not become domain entities.

---

# 14. AI Gateway rules

AI output is untrusted external data.

Before using model output:

- validate schemas;
- enforce tool permissions;
- apply limits;
- handle provider failures;
- handle malformed output;
- record usage where required.

Never allow a model to bypass:

- authorization;
- payment controls;
- audit;
- tenant isolation;
- confirmation requirements.

High-impact actions require explicit authorization and, where appropriate, confirmation.

---

# 15. Backend/frontend separation

This is a hard ownership rule.

## Frontend agent owns

- screens;
- components;
- navigation;
- client state;
- local persistence;
- presentation;
- accessibility;
- loading/error/empty states;
- API client consumption.

## Backend agent owns

- Django models;
- migrations;
- serializers;
- views/viewsets;
- URL routing;
- domain services;
- repositories;
- permissions;
- authentication adapters;
- provider adapters;
- background jobs;
- database behavior;
- backend tests.

## Core domain agent owns

- shared domain contracts;
- reusable Core capability;
- architectural boundary;
- domain-level rules.

A frontend agent must not create a fake backend implementation merely to make a screen appear functional.

A backend agent must not modify UI architecture to compensate for a backend design issue.

---

# 16. AI-agent execution protocol

Before coding:

1. Read repository root `AGENTS.md`.
2. Read this Core `AGENT.md`.
3. Read `services/nexora-api/AGENT.md` for backend work.
4. Inspect existing implementation.
5. Search for duplicate capability.
6. Identify ownership.
7. Inspect tests.
8. Check relevant ADRs.
9. Plan the smallest coherent change.

During coding:

- preserve boundaries;
- reuse existing abstractions;
- avoid speculative frameworks;
- avoid duplicate models;
- avoid duplicate providers;
- avoid hidden cross-app dependencies.

After coding:

1. Run targeted tests.
2. Run type/lint checks relevant to the change.
3. Run Django checks for backend changes.
4. Review migration impact.
5. Review security.
6. Review tenant isolation.
7. Review idempotency/concurrency.
8. Review API compatibility.
9. Review whether another agent would now own part of the work.
10. Update documentation if the architecture changed.

---

# 17. Definition of done

A Core change is complete only when:

- ownership is clear;
- implementation respects module boundaries;
- security is considered;
- tests cover changed behavior;
- concurrency is considered where relevant;
- API contract is coherent;
- audit implications are considered;
- provider failures are handled;
- migrations are safe;
- documentation is updated when necessary.

Never declare success merely because the code compiles.

---

# 18. What Core agents must refuse to do

Do not:

- create product-specific domain logic inside Core without an ownership decision;
- duplicate an existing capability;
- expose Firebase SDK types in domain contracts;
- put provider credentials in application code;
- bypass authorization;
- let UI state determine server authorization;
- silently mutate immutable/audited records;
- introduce microservices merely for architectural fashion;
- rewrite stable modules without a documented reason;
- change another product's UI while working on Core unless explicitly assigned and coordinated.

---

# 19. Core architectural test

When uncertain, ask:

> If three or more independent Nexora products need exactly this capability, is it a shared platform primitive?

If yes, evaluate Core ownership.

If the behavior contains product-specific business meaning, keep the reusable primitive in Core and the business policy in the product.

Example:

```
Core:
Payment Intent
Payment Transaction
Webhook Idempotency

Finance:
Financial Transaction Categorization

Nexverse:
Chapter Unlock

Dignity:
Course Enrollment Payment
```

Core provides the platform capability; products own their business meaning.
