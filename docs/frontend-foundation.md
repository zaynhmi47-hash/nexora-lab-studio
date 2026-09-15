# Nexora Frontend Foundation

## Mobile standard

- Expo + React Native + Expo Router.
- `app/` contains navigation and route composition only.
- Application features live under `features/`.
- Provider and infrastructure boundaries live under `lib/`.
- Only non-secret `EXPO_PUBLIC_*` values may be shipped to the client.
- Server credentials and private provider keys never belong in mobile apps.
- Nexora UUID remains the internal identity anchor; external provider subjects are integration identifiers.
- Organization-scoped API access must use the active organization context.
- Shared UI moves to `packages/` only after multiple apps demonstrate the same stable requirement.

## Validation

The Finance mobile app is the reference implementation. Frontend CI currently typechecks that app on pull requests and pushes to `main`. Device builds remain a development-environment concern and are not simulated by CI.
