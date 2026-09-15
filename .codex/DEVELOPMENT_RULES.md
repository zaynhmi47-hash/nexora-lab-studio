# Nexora Development Rules

## Before coding

1. Read the root `AGENTS.md`.
2. Read the relevant `.codex/` documents.
3. Inspect the existing implementation.
4. Inspect tests and configuration around the affected area.
5. Check relevant ADRs.
6. Identify the smallest coherent change.

## During coding

- Follow existing naming and structure unless there is a documented reason to change them.
- Prefer explicit types and contracts.
- Keep domain logic framework/provider independent where practical.
- Do not introduce Firebase/provider SDK imports into domain modules.
- Do not bypass existing abstractions merely to make a task shorter.
- Do not duplicate shared behavior when an established reusable abstraction exists.
- Keep error handling explicit and safe.
- Never log secrets, credentials, tokens, or sensitive payloads.
- Preserve backwards compatibility unless the task explicitly changes a contract.

## Testing

Use a progressive test strategy:

1. focused unit tests;
2. affected integration/contract tests;
3. broader project checks when practical.

For security-sensitive changes, include negative-path tests.

Never claim tests passed unless they were actually executed or the result is otherwise directly verified.

## Security checklist

For changes involving authentication, identity, authorization, APIs, storage, payments, or external providers, verify:

- input validation;
- authorization at the correct boundary;
- tenant/organization isolation where applicable;
- safe error messages;
- no credential leakage;
- idempotency for callbacks/claims where required;
- auditability where required;
- provider failures handled safely;
- no trust placed in client-controlled identity fields.

## API rules

- Keep request/response contracts explicit.
- Validate external input at the API boundary.
- Do not expose internal ORM models as an accidental public contract.
- Preserve correlation/request IDs where the platform supports them.
- Keep pagination bounded and predictable.

## Documentation rules

Update documentation when behavior, architecture, commands, configuration, or important assumptions change.

Use ADRs for decisions with meaningful long-term architectural consequences.

## Git rules

Use focused commits with conventional-style messages:

- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

Avoid mixing unrelated changes in one commit.
