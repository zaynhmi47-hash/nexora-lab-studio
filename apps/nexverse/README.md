# Nexverse

Nexverse is the public-facing reading and entertainment product in the Nexora ecosystem.

## Current implementation

The first mobile foundation is in `mobile/` using Expo Router and React Native:

- Home discovery surface with featured story
- Genre and text search
- Story detail and chapter preview
- Reading experience with adjustable typography
- Personal library and profile shells
- Local fixture catalog clearly marked as demo content

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter nexverse-mobile start
```

Type-check:

```bash
pnpm --filter nexverse-mobile typecheck
```

## Important boundaries

- Catalog fixtures are demonstration data, not production content.
- Authentication, saved library, reading progress, publishing workflows, rights, paid access and creator royalties are not yet connected.
- All paid-content entitlement checks must be server-side.
- Nexverse domain APIs belong in `services/nexora-api/apps/nexverse/` and are mounted under `/api/v1/nexverse/`.
- The first Django API slice includes public catalog search/filtering, work details, chapter metadata and free-preview chapter content.
- Paid chapter bodies are deliberately withheld with `ENTITLEMENT_REQUIRED` until the server-side entitlement service is connected.
- Reuse Nexora Core identity, files, notifications and generic payment primitives.
