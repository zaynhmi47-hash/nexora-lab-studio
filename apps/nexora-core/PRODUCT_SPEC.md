# Nexora Core — Product Specification

> Status: Architectural product specification
> Scope: `apps/nexora-core/`
> Architecture target: **Modular Monolith → Service-Ready**

This document defines **what Nexora Core is**, what users/operators should experience, which capabilities belong to Core, how the product should be structured, and how an implementation agent must translate the concept into production software.

It complements `AGENT.md`. The root `AGENTS.md` remains the ecosystem-level authority, while `services/nexora-api/AGENT.md` owns backend implementation execution.

---

## 1. Product concept

### 1.1 What Nexora Core is

Nexora Core is the **shared operating foundation of the Nexora ecosystem**.

It is not another consumer app and it is not a generic collection of utilities. It is the platform layer that gives every Nexora product a consistent foundation for:

- identity;
- organizations and membership;
- authorization and RBAC;
- auditability;
- files and storage abstraction;
- notifications;
- payment primitives;
- integrations;
- workflows;
- events and analytics primitives;
- AI provider access and governance.

The purpose is to make products behave as members of one ecosystem instead of becoming unrelated applications that happen to share a brand.

### 1.2 Core's central design principle

Core separates **platform capability** from **product meaning**.

Example:

- Core owns a payment intent.
- Finance owns financial categorization.
- Nexverse owns chapter unlocking.
- Dignity owns course enrollment payment rules.

Core provides the mechanism. The product owns the business meaning.

### 1.3 What Core must prevent

Core exists partly to prevent architectural fragmentation.

Agents must not create independent implementations of:

- authentication identity mapping;
- organization membership;
- authorization;
- audit events;
- file access;
- notification delivery;
- payment-provider integration;
- AI-provider integration;
- shared event envelopes.

If a product needs one of these, it should consume the Core capability or explicitly document why a separate product-owned capability is necessary.

---

# 2. Target users

Nexora Core has two primary audiences.

## 2.1 Nexora developers and AI agents

They use Core through:

- contracts;
- SDK/client abstractions;
- APIs;
- shared modules;
- provider adapters;
- domain services;
- events.

Developer experience must emphasize predictable interfaces and clear ownership.

## 2.2 Authorized Nexora operators

Operators use the Core administration/control surface to understand:

- system health;
- identities;
- organizations;
- authorization;
- integrations;
- audit activity;
- files;
- notifications;
- payments;
- workflows;
- events;
- AI usage;
- system configuration.

The UI is an **operations console**, not a marketing dashboard.

---

# 3. Product information architecture

The Core control surface should use the following navigation:

1. Overview
2. Identity
3. Organizations
4. Authorization
5. Audit
6. Integrations
7. Files
8. Notifications
9. Payments
10. Workflows
11. Events
12. AI Gateway
13. System

Navigation must be permission-aware. A user should never see administrative controls they cannot use unless there is a clear reason to expose read-only status.

---

# 4. UI/UX specification

## 4.1 Overall visual direction

Core UI should feel like a professional infrastructure/control system:

- dense enough for operational work;
- clear hierarchy;
- restrained visual decoration;
- strong status indicators;
- consistent tables and filters;
- obvious destructive-action warnings;
- responsive layouts;
- keyboard-friendly where practical;
- accessible contrast and focus states;
- predictable loading/error/empty states.

The interface should optimize for **finding, understanding, verifying, and acting**, not for visual novelty.

## 4.2 Global application shell

Every Core screen should share:

### Top bar

- Nexora Core identity;
- current operator identity;
- environment indicator;
- global search;
- notifications;
- account/session controls.

### Sidebar

- primary navigation;
- collapsible groups when necessary;
- active location indicator;
- permission-aware items.

### Main content

- page title;
- concise description;
- primary action;
- filters/search when relevant;
- content;
- contextual status;
- audit or metadata where useful.

### Feedback layer

Use standardized:

- success feedback;
- inline validation;
- non-blocking warnings;
- recoverable error messages;
- blocking confirmation dialogs for destructive actions.

Never use vague errors such as "Something went wrong" when a useful safe explanation is available.

---

# 5. Core screens

## 5.1 Overview

Purpose: give operators a fast operational picture.

Sections:

### System health

- API status;
- database status;
- worker status;
- cache status;
- storage status.

### Provider health

- Firebase Authentication;
- Firebase Storage where used;
- payment providers;
- AI providers;
- other configured integrations.

### Security activity

- recent authentication events;
- failed authentication attempts;
- permission changes;
- privileged actions.

### Processing

- queued jobs;
- failed jobs;
- retrying jobs;
- event processing status.

### Usage

- active identities;
- organization count;
- storage usage;
- notification delivery;
- AI usage;
- payment integration activity.

The overview must not imply that every metric is a real-time metric unless the backend actually provides real-time freshness.

---

## 5.2 Identity Explorer

Purpose: inspect the platform identity layer safely.

List columns:

- Nexora UUID;
- display identity;
- account state;
- linked provider;
- organization count;
- created time;
- last activity.

Detail view:

- identity metadata;
- provider links;
- organizations;
- roles;
- recent security events;
- audit history.

Never display:

- passwords;
- access tokens;
- refresh tokens;
- raw provider credentials;
- private keys.

Actions must be permission-protected and audited.

---

## 5.3 Organizations

Purpose: manage organization and tenant primitives.

List:

- organization name;
- status;
- owner/admin information;
- member count;
- created date;
- configuration state.

Detail:

- members;
- teams;
- roles;
- settings;
- integrations;
- audit events.

Organization context must be explicit. A UI-selected organization does not itself grant authorization.

---

## 5.4 Authorization

Purpose: make permissions inspectable.

Views:

- roles;
- permissions;
- role assignments;
- effective permissions;
- policy context.

The UX should help an operator answer:

> Why does this identity have access to this resource?

Avoid presenting authorization as only a giant checkbox matrix. Where possible, show the source of an effective permission:

- direct assignment;
- organization role;
- team role;
- policy;
- ownership.

---

## 5.5 Audit Explorer

Purpose: provide trustworthy operational history.

Filters:

- actor;
- organization;
- action;
- resource type;
- resource ID;
- severity;
- outcome;
- date/time;
- correlation ID;
- request ID.

Each event should expose:

- who;
- what;
- target;
- when;
- organization context;
- request/correlation context;
- outcome.

Sensitive payloads must be redacted.

Audit records are evidence, not editable application content.

---

## 5.6 Integrations

Purpose: inspect provider connections without exposing secrets.

Each integration should show:

- provider;
- capability;
- enabled/disabled;
- health;
- last successful operation;
- last failure;
- configuration status.

Secret fields must be masked and should never be returned to the browser after initial secure configuration.

---

## 5.7 Files

Purpose: inspect Core storage metadata and access state.

Features:

- search;
- folder/navigation metadata where supported;
- owner;
- organization;
- size;
- type;
- version;
- lifecycle state;
- sharing/access policy;
- storage provider status.

The UI should distinguish:

- metadata;
- actual file content;
- access permission.

Temporary download access should be generated server-side and expire.

---

## 5.8 Notifications

Purpose: inspect delivery intent and status.

Features:

- notification history;
- channel;
- recipient;
- delivery state;
- retry state;
- failure reason;
- template reference;
- preference state.

Operators should be able to diagnose delivery without exposing unnecessary message secrets or personal content.

---

## 5.9 Payments

Purpose: inspect provider-neutral payment primitives.

Views:

- payment intents;
- transactions;
- refunds;
- webhook events;
- reconciliation references;
- provider health.

Core does not decide whether a product's business transaction is "revenue", "subscription", "course fee", or "chapter purchase". It only provides payment infrastructure primitives.

---

## 5.10 Workflows

Purpose: inspect reusable workflow infrastructure.

Features:

- workflow definitions;
- current executions;
- state;
- approval state;
- retries;
- scheduled actions;
- failures.

Product-specific workflows remain owned by the product.

---

## 5.11 Events

Purpose: inspect the shared event infrastructure.

Features:

- event type;
- event ID;
- source;
- organization;
- timestamp;
- correlation ID;
- processing status;
- retry state.

Do not turn Core into the owner of every product's analytics definition.

---

## 5.12 AI Gateway

Purpose: govern AI provider access.

Views:

- configured providers;
- models;
- health;
- quotas;
- usage;
- estimated cost metadata;
- request failures;
- tool permissions.

The UI must clearly distinguish:

- provider availability;
- model availability;
- application authorization;
- user authorization;
- usage limits.

Core must never allow an AI operator or model to bypass ordinary authorization.

---

# 6. Core feature specification

## 6.1 Identity

Features:

- internal Nexora UUID;
- provider identity linking;
- claims mapping;
- account lifecycle;
- conflict detection;
- idempotent first-login;
- secure account linking;
- audit trail.

Primary invariant:

**One logical Nexora identity must not be accidentally duplicated because the same provider account is processed concurrently.**

---

## 6.2 Organizations and membership

Features:

- organization creation;
- membership;
- invitation;
- membership states;
- teams;
- organization settings;
- tenant context.

Required states should be explicit rather than represented by ambiguous booleans.

---

## 6.3 Authorization/RBAC

Features:

- roles;
- permissions;
- assignments;
- resource ownership;
- policy evaluation;
- effective-permission inspection.

Authorization is always enforced server-side.

---

## 6.4 Audit

Features:

- immutable event records;
- actor/resource/action context;
- request/correlation identifiers;
- outcome;
- severity;
- organization context;
- security-event classification.

Audit must be queryable but not casually mutable.

---

## 6.5 Files and storage abstraction

Features:

- file metadata;
- ownership;
- organization scope;
- access policies;
- versions;
- lifecycle;
- signed temporary access;
- provider adapter.

The Core domain must not assume a particular storage vendor.

---

## 6.6 Notifications

Features:

- notification intent;
- channel abstraction;
- delivery status;
- retries;
- preferences;
- templates;
- provider adapters.

Delivery must be asynchronous when the operation does not need to block the user's request.

---

## 6.7 Payments

Features:

- payment intent;
- transaction reference;
- provider mapping;
- refund;
- webhook ingestion;
- idempotency;
- reconciliation reference.

Financial accounting truth remains in Nexora Finance or another owning domain.

---

## 6.8 Workflow primitives

Features:

- state transition definitions;
- approvals;
- scheduled execution;
- retries;
- execution history.

Core supplies infrastructure. Product agents own business state machines.

---

## 6.9 Events and analytics primitives

Features:

- canonical event envelope;
- event ID;
- source;
- timestamp;
- actor;
- organization;
- correlation context;
- processing state.

Core does not invent product metrics.

---

## 6.10 Integration framework

Features:

- provider ports;
- adapter registration;
- capability discovery;
- health checks;
- configuration status;
- failure normalization.

Provider-specific SDK objects must remain behind adapters.

---

## 6.11 AI Gateway

Features:

- provider-neutral model requests;
- provider routing;
- model configuration;
- quotas;
- usage tracking;
- cost metadata;
- tool authorization;
- structured-output validation;
- failure normalization.

AI output is always treated as untrusted data.

---

# 7. Technology architecture

## Backend

Primary direction:

- Python;
- Django;
- Django REST Framework;
- PostgreSQL;
- Redis where justified;
- background workers where justified;
- pytest;
- structured logging;
- provider-neutral ports/adapters.

## Frontend/admin

Use the repository-approved TypeScript/React stack for administrative interfaces. UI code consumes APIs; it does not become a second source of domain truth.

## External services

Potential adapters include:

- Firebase Authentication;
- Firebase Storage;
- Firebase services where explicitly required;
- payment providers;
- AI providers;
- notification providers;
- future external integrations.

No external provider should become a hard-coded domain dependency.

---

# 8. Data architecture

Core data should be modeled around stable platform entities.

Conceptual entities:

- Identity;
- ExternalIdentityLink;
- Organization;
- Membership;
- Team;
- Role;
- Permission;
- RoleAssignment;
- AuditEvent;
- FileObject;
- FileVersion;
- Notification;
- NotificationDelivery;
- PaymentIntent;
- PaymentTransaction;
- Refund;
- WebhookEvent;
- WorkflowDefinition;
- WorkflowExecution;
- EventEnvelope;
- Integration;
- AIProvider;
- AIModel;
- AIUsageRecord.

Actual schema names may differ when existing code or conventions require it.

All important relationships require database-level constraints where practical.

---

# 9. API behavior

Core API behavior must be:

- authenticated where required;
- authorization-aware;
- tenant-aware;
- paginated for collections;
- schema-validated;
- idempotent for retryable operations;
- explicit about errors;
- versionable.

Example conceptual endpoints:

- `/api/v1/identity/me`
- `/api/v1/organizations/`
- `/api/v1/organizations/{id}/members/`
- `/api/v1/authorization/roles/`
- `/api/v1/audit/events/`
- `/api/v1/files/`
- `/api/v1/notifications/`
- `/api/v1/payments/intents/`
- `/api/v1/workflows/`
- `/api/v1/events/`
- `/api/v1/integrations/`
- `/api/v1/ai/models/`

These are conceptual contracts, not permission to create duplicate or premature endpoints. Inspect the existing backend before adding anything.

---

# 10. Security model

Security is part of the product, not an implementation afterthought.

Required principles:

- server-side authorization;
- least privilege;
- explicit organization context;
- secure provider credentials;
- secret redaction;
- audit for privileged actions;
- short-lived signed access where appropriate;
- idempotent external event handling;
- safe retries;
- rate limiting where appropriate;
- validation of external/AI data;
- no trust in client-supplied authorization claims.

Never use a frontend-hidden button as a security control.

---

# 11. Error and state UX

Every Core feature must define:

### Loading state
Tell the operator what is being loaded.

### Empty state
Explain whether there is no data, no permission, or an error.

### Error state
Explain what happened and what safe next action is possible.

### Partial failure
For integrations and batch operations, show which items succeeded and which failed.

### Destructive action
Require confirmation and explain consequences.

### Retry
Only offer retry where retry is safe or idempotent.

---

# 12. Accessibility and responsive behavior

Core administration UI must support:

- keyboard navigation;
- visible focus;
- semantic labels;
- readable contrast;
- accessible tables/forms;
- screen-reader-friendly status messaging;
- responsive layouts.

Desktop is the primary operational environment, but mobile/tablet layouts must remain usable for monitoring and lightweight administration.

---

# 13. Product boundaries

Core must not absorb these product-specific responsibilities:

| Product | Owns | Core may provide |
|---|---|---|
| Nexora Finance | budgeting, accounting meaning, financial categorization | payment primitives, identity, audit |
| Dignity | courses, KRS, grades, attendance rules | identity, organizations, notifications |
| Nexora Office | document editor, spreadsheet logic, presentation UX | files, identity, sharing primitives |
| Nexverse | content catalog, chapter entitlement | files, payments, identity |
| Nexora CRM | pipeline, lead/opportunity semantics | identity, organization, notifications |
| Nexora HR | leave/attendance policy | identity, RBAC, audit |
| Nexora AI | AI workspace and user-facing AI workflows | AI Gateway, usage, provider adapters |
| Nexora Cloud | storage product UX and sync semantics | storage primitives |

When the boundary is unclear, stop and document the ownership decision before implementing.

---

# 14. Agent ownership map

## Core product agent

Owns:

- Core product behavior;
- shared capability design;
- domain contracts;
- Core UI specification;
- Core module boundaries;
- architectural decisions within Core.

## Backend agent

Owns:

- Django implementation;
- models;
- migrations;
- serializers;
- views;
- routes;
- repositories;
- services;
- permissions;
- adapters;
- workers;
- backend tests.

## Frontend agent

Owns:

- Core admin screens;
- components;
- navigation;
- client state;
- API client;
- accessibility;
- loading/error/empty states;
- responsive behavior.

## Infrastructure/DevOps agent

Owns:

- deployment;
- runtime;
- CI/CD;
- environment configuration;
- observability infrastructure;
- secrets delivery.

No agent may silently take over another agent's ownership area.

---

# 15. Implementation roadmap

## Phase 1 — Foundation

- identity;
- authentication adapter;
- UUID anchor;
- organizations;
- membership;
- RBAC;
- audit;
- request/correlation IDs;
- health checks.

## Phase 2 — Platform capabilities

- files/storage abstraction;
- notifications;
- integration framework;
- workflow primitives;
- event envelope.

## Phase 3 — Financial/integration primitives

- payment intent;
- webhook idempotency;
- refund primitives;
- reconciliation references;
- provider health.

## Phase 4 — AI Gateway

- provider abstraction;
- model registry;
- routing;
- usage;
- quotas;
- cost metadata;
- tool authorization.

## Phase 5 — Operations console

- Overview;
- Identity;
- Organizations;
- Authorization;
- Audit;
- Integrations;
- Files;
- Notifications;
- Payments;
- Workflows;
- Events;
- AI Gateway;
- System.

## Phase 6 — Hardening

- concurrency tests;
- security tests;
- tenant-isolation tests;
- failure/retry tests;
- API compatibility tests;
- performance checks;
- operational documentation.

Do not implement later phases simply because they are listed. Respect the current repository state and existing roadmap.

---

# 16. Definition of a successful Core implementation

A successful Core implementation means:

1. Products can reuse shared capabilities without copying them.
2. Product-specific business rules remain in their owning products.
3. Identity is stable and provider-neutral.
4. Authorization is enforced server-side.
5. Tenant boundaries are explicit.
6. Important mutations are auditable.
7. External providers are isolated behind adapters.
8. Retryable operations are idempotent.
9. AI cannot bypass platform security.
10. Operators can diagnose the platform through the control surface.
11. Frontend and backend agents can work independently through explicit contracts.
12. The architecture can later extract services without rewriting the entire domain.

The most important Core outcome is not the number of modules. It is **consistency, trust, reuse, and clear ownership across the Nexora ecosystem**.
