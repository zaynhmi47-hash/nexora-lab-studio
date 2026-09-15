# Nexora Durable Memory

This file records stable project knowledge that Codex should retain across sessions.

## Product philosophy

Nexora is intended to become an ecosystem rather than a single application. Shared capabilities should be built once in the core where they are genuinely cross-product, while product-specific behavior remains in the owning product.

## Architecture philosophy

The preferred long-term pattern is:

**Modular Monolith → Service-Ready**

This means modular boundaries, explicit contracts, provider-neutral ports, and service-ready ownership without prematurely introducing distributed-system complexity.

## Development philosophy

The user expects production-oriented implementation, not only conceptual proposals. Priorities are:

1. correctness;
2. security;
3. maintainability;
4. architectural consistency;
5. testability;
6. controlled delivery speed.

## Cloud-first workflow

GitHub is the durable source of truth for technical project context. Codex should work from the connected repository and its committed documentation. Local storage should not be assumed to be the primary development environment.

## ChatGPT ↔ Codex context rule

Do not assume that ordinary ChatGPT conversation history automatically becomes Codex project memory. Important decisions from planning conversations must be written into repository documentation, ADRs, code comments where appropriate, or current-state records.

Preferred flow:

```text
ChatGPT planning/reasoning
        ↓
Durable project decision
        ↓
GitHub repository documentation
        ↓
Codex reads repository context
        ↓
Implement / test / review
        ↓
Commit / PR
```

## Important identity decision

Nexora UUID is the canonical internal identity. Firebase UID/subject is an external provider identifier and must remain behind the provider-account boundary.

## Important Firebase decision

Firebase is an infrastructure/provider integration, not the domain model. Keep Firebase-specific code in infrastructure/adapters and expose provider-neutral interfaces to application/domain code.

## Important monorepo decision

The repository is organized as a monorepo so multiple Nexora products can share the platform while remaining independently deployable.

## Memory hygiene

Only durable, verified project knowledge belongs here. Do not turn temporary task details, guesses, secrets, personal credentials, or unverified assumptions into project memory.
