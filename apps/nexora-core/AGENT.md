# Nexora Core — AGENT.md

## Concept
Shared foundation for the Nexora ecosystem: identity, organizations, RBAC, finance/accounting, payments, files, notifications, analytics, audit, workflows, integrations, and AI infrastructure. Architecture target: **Modular Monolith → Service-Ready**.

## Instructions
- Treat Core as shared platform infrastructure, not a single vertical app.
- Keep domain boundaries explicit and provider integrations behind ports/adapters.
- Use internal Nexora UUIDs as identity anchors; external provider IDs are integration identifiers.
- Prefer secure, auditable, idempotent operations.
- Do not couple domains directly to Firebase, payment vendors, or one AI provider.
- Every module defines ownership, dependencies, permissions, audit events, and API contracts.
- Avoid premature microservices; preserve modularity inside the monolith.
- Changes must remain reusable by multiple Nexora applications.