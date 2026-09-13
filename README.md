# Nexora Monorepo

Unified monorepo for the Nexora ecosystem: products, shared packages, Nexora Core, infrastructure, documentation, and CI/CD.

## Architecture

**Modular Monolith → Service-Ready**

- `apps/` — product applications
- `services/nexora-api/` — Django Nexora Core
- `services/workers/` — asynchronous/background workloads
- `packages/` — shared frontend/platform packages
- `infrastructure/` — Firebase and Google Cloud configuration
- `tooling/` — repository-wide development tooling
- `docs/` — architecture and product documentation

## Products

Nexora Office, Nexora Business, Nexverse, Dignity, Nexora Finance, Nexora Launch, Nexora News, Nexora Education, Nexora Social, and Nexora Studio.

## Principles

1. Shared foundation, independent products.
2. Domain boundaries before microservices.
3. Nexora UUID is the internal identity anchor.
4. Firebase integrations stay behind provider-neutral ports/adapters.
5. No secrets are committed to Git.
6. Every product remains independently deployable.

## Development

See `docs/architecture/` and `CONTRIBUTING.md` for the initial conventions. Product implementations are added incrementally; this commit establishes the repository foundation only.
