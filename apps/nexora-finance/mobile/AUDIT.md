# Frontend / Mobile Audit

## Repository audit

- Monorepo: `zaynhmi47-hash/nexora-lab-studio`
- Package manager: pnpm 10.15.0.
- Workspace already includes `apps/*/mobile`.
- Existing mobile code was present under `apps/nexora-finance/mobile`, but it only contained a partial `lib/api/tenant.ts` implementation and no Expo application shell.
- Existing web frontends include `apps/nexora-office/web`; `apps/nexora-finance/web` currently contains migration audit documentation rather than an application shell.
- Most other app directories under `apps/` are placeholders with `.gitkeep` files.

## Expo Router baseline

`apps/nexora-finance/mobile` is now a real Expo Router application with:

- Expo SDK 57 baseline.
- Expo Router 57 with file-based routing.
- React Native 0.86 / React 19.2.
- TypeScript strict mode.
- Typed Expo Router routes enabled.
- Metro web support enabled.
- Root API and organization provider boundaries.
- Initial Home / Transactions / Profile tab routes.

## Architecture rules

1. `app/` owns navigation and screens only.
2. `lib/` owns provider-neutral API, auth, organization, and infrastructure adapters.
3. Screens must not contain Firebase/Admin SDK logic directly.
4. Nexora UUIDs remain the internal identity anchor; provider subjects are external identifiers.
5. Tenant-owned API calls must use the active organization context.
6. Mobile configuration must use `EXPO_PUBLIC_*` variables only for non-secret client configuration.
7. Secrets must never be committed to the repository.

## Next audit targets

- Add Expo mobile shells for Dignity, Nexora Education, Nexora News, Nexora Launch, Nexverse, Nexora Social, Nexora Business, and Nexora Studio when each product enters implementation.
- Standardize shared UI/theme primitives under `packages/` before duplicating design systems across apps.
- Add CI jobs for mobile typecheck/lint once the workspace scripts are finalized.
- Add EAS configuration only when a build profile and application identifiers are finalized.
