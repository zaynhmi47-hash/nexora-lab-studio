# Dignity Mobile Foundation Audit

## Scope

Dignity is the second concrete Expo Router mobile implementation in the Nexora monorepo. This app is intentionally a foundation, not the final product UI.

## Product domains

- Learning / e-learning
- Duolingo-inspired guided learning
- Attendance
- SIAKAD: KRS and grades
- Research
- Library
- Future tutoring / bimbel workflows

## Architecture rules

1. `app/` contains Expo Router routes and navigation composition only.
2. Business logic belongs in `features/`, hooks, or provider-neutral libraries.
3. Screens must not import Firebase Admin or other server-only modules.
4. External identity providers stay behind explicit boundaries; Nexora UUID remains the internal identity anchor.
5. Organization-scoped requests must use the active organization context.
6. `EXPO_PUBLIC_*` variables are public client configuration only; no secrets are committed.
7. Shared packages should be extracted only after real duplication appears across multiple apps.
8. Keep Expo SDK and React Native versions aligned with the Finance mobile reference app.

## Initial route map

- `/` -> redirect to tabs
- `/(tabs)` -> Home
- `/(tabs)/learning` -> Learning
- `/(tabs)/academic` -> Academic
- `/(tabs)/profile` -> Profile

## Next steps

1. Validate dependency installation, typecheck, lint, and Expo startup in CI/Codespaces.
2. Add authentication boundary and real identity session state.
3. Add feature modules for learning, attendance, SIAKAD, research, and library.
4. Add shared UI only when Finance and Dignity demonstrate concrete duplication.
5. Add CI coverage for every independently runnable mobile app.
6. Add EAS configuration only when release builds are required.
