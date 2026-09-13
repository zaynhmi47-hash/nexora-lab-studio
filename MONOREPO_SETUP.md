# Nexora Monorepo Setup

This repository is now the canonical Nexora monorepo workspace.

## Architecture

- `apps/` — product applications
- `services/` — backend APIs and workers
- `packages/` — reusable frontend/shared packages
- `infrastructure/` — Firebase, GCP, environments, deployment configuration
- `tooling/` — shared development and quality tooling
- `docs/` — architecture, security, API, database, deployment, and product documentation
- `.github/workflows/` — path-scoped CI/CD workflows

## Product applications

- Nexora Office
- Nexora Business Suite
- Nexverse
- Dignity
- Nexora Finance
- Nexora Launch OS
- Nexora News
- Nexora Education
- Nexora Social
- Nexora Studio

## Backend direction

Nexora Core follows **Modular Monolith → Service-Ready**. Django/DRF owns core business domains while external providers such as Firebase are accessed through infrastructure adapters and provider-neutral ports.

## Repository policy

This repository is the active implementation workspace. Existing scaffolding will be audited and expanded incrementally rather than blindly overwritten.
