# Contributing

## Repository rules

- Keep domain boundaries explicit.
- Prefer reusable packages over copy/paste.
- Keep provider-specific code inside `infrastructure/` or provider adapters.
- Never commit credentials, service-account keys, or production `.env` files.
- Add tests for domain behavior and security-sensitive changes.
- Keep products independently deployable.

## Branches

- `main` — stable integration branch.
- `feat/*` — feature work.
- `fix/*` — bug fixes.
- `chore/*` — maintenance.

## Commits

Use clear conventional-style messages, for example `feat(core): add organization membership domain`.
