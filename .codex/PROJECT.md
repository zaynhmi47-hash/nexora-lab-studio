# Nexora Project Context

## Project

Nexora Lab Studio is the central monorepo for the Nexora ecosystem: a shared platform foundation plus independently deployable products.

## Ecosystem direction

The ecosystem may include:

- Nexora Office — administration, security, traffic, and operations for connected Nexora products.
- Nexora Business — business/creator administration and publisher/campus workflows.
- Dignity — learning and academic platform.
- Nexverse — digital library and creator/media platform.
- Nexora Finance — personal/business finance and commerce capabilities.
- Nexora Launch — launch/OS-style product experience.
- Nexora News — publisher/news platform.
- Nexora Education — education super-app and learning models.
- Nexora Social — social/professional product.
- Nexora Studio — development, digital marketing, data science, design, and related services.

These are product directions, not permission to implement all products in one task.

## Core architecture

**Modular Monolith → Service-Ready**

The central backend is Nexora Core. It provides shared identity, security, organization, authorization, audit, common platform capabilities, and reusable domain/application infrastructure.

The monorepo currently separates:

```text
apps/                    Product frontends and product-level applications
services/nexora-api/     Django/DRF Nexora Core
services/workers/        Background/asynchronous workloads
packages/                Shared frontend/platform packages
infrastructure/          Firebase, Google Cloud, deployment/provider adapters
tooling/                 Repository tooling
docs/                    Durable architecture and product documentation
```

## Technology direction

- Backend: Python, Django, Django REST Framework.
- Frontend: web and React Native/Expo where appropriate.
- Firebase: authentication and selected managed services through explicit adapters.
- Google Cloud: selected infrastructure/data services where justified.
- TypeScript packages are used for shared frontend/platform contracts and tooling.
- Package/workspace management follows the existing repository configuration; do not replace it without a reason.

## Identity

Nexora UUID is the canonical internal identity anchor. External provider identities are linked to it and are never the primary internal identity key.

## Product independence

Each product should be independently deployable. Shared code belongs in well-defined packages or Nexora Core capabilities, not in accidental cross-product imports.

## Current development philosophy

Nexora is being built incrementally. Establish strong shared foundations before adding product-specific complexity. Prefer explicit contracts and boundaries over shortcuts that make future extraction or independent deployment difficult.

## Source of truth

For implementation work, use this priority:

1. actual repository code and tests;
2. `AGENTS.md` and `.codex/` project rules;
3. accepted ADRs and architecture documentation;
4. current product documentation;
5. task-specific instructions from the user.

ChatGPT conversation history is planning context, not a substitute for durable repository documentation.
