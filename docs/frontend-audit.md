# Nexora Frontend Audit

## Scope

This audit covers the application frontend layout under `apps/` and establishes the standard for React Native mobile applications in the Nexora monorepo.

## Current state

| App | Mobile | Web | Status | Action |
|---|---|---|---|---|
| Dignity | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora Business | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora Education | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora Finance | Expo Router foundation | Existing web work is separate | Active frontend | Use as reference implementation |
| Nexora Launch | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora News | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora Office | Mobile not initialized | Existing web frontend | Web-first | Add mobile only when mobile requirements are defined |
| Nexora Social | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexora Studio | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |
| Nexverse | Not initialized | Not present in monorepo root | Placeholder | Initialize when product implementation starts |

## Standard mobile architecture

Every Nexora mobile app that is activated will use Expo + React Native + Expo Router.

```text
apps/<app>/mobile/
├── app/                 # Expo Router routes only
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
├── components/          # App-specific reusable UI
├── features/             # Feature/domain UI modules
├── hooks/                # App-specific hooks
├── lib/
│   ├── api/              # Provider-neutral API client/adapters
│   ├── auth/             # Authentication integration boundary
│   ├── config/           # Public runtime configuration
│   └── organization/     # Organization/tenant context when required
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── expo-env.d.ts
```

## Architecture rules

1. `app/` is navigation and route composition; business logic belongs outside route files.
2. Screens must not import Firebase Admin SDK or server-only modules.
3. Client code may only expose non-secret `EXPO_PUBLIC_*` configuration.
4. Authentication and external providers must remain behind application boundaries.
5. Nexora UUID remains the internal identity anchor; provider subject IDs are external identifiers.
6. Tenant/organization-scoped requests must use the active organization context.
7. Shared cross-app UI and utilities belong in `packages/`, not copied between apps.
8. Each mobile app must be independently runnable from its workspace package.
9. Expo SDK versions should be upgraded intentionally and consistently rather than independently drifting between apps.
10. Native build configuration must remain app-specific; secrets and signing credentials must never be committed.

## Reference implementation

`apps/nexora-finance/mobile` is the first Expo Router reference implementation. It establishes the baseline for routing, provider composition, API boundaries, TypeScript configuration, and public runtime configuration.

## Next implementation order

1. Validate the Finance mobile foundation with install, typecheck, lint, and Expo startup.
2. Extract genuinely reusable primitives into `packages/` only after duplication appears in a second mobile app.
3. Initialize Dignity mobile using the same Expo Router conventions because Dignity has an established React Native product direction.
4. Initialize the remaining mobile apps according to product priority instead of creating empty shells for every placeholder.
5. Add CI checks for workspace typecheck/lint and mobile package validation.
6. Add EAS build profiles after the app foundations are validated.
