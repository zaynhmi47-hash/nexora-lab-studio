# Dignity Mobile Foundation & UI Audit

## Scope

Dignity is the Expo Router / React Native mobile client for the Nexora education and academic platform. The current stage establishes the parent-app navigation and first-pass student experience; it is not the final production feature set.

## Product domains

- Learning / e-learning and guided learning paths
- Attendance
- SIAKAD: KRS, grades and academic records
- Research
- Library
- Competencies, evidence and learning portfolio
- Future tutoring / bimbel workflows

## Architecture rules

1. \`app/\` contains Expo Router routes and navigation composition only.
2. Shared visual primitives live in \`components/\`; feature logic belongs in feature modules, hooks or provider-neutral libraries.
3. Screens must not import Firebase Admin or other server-only modules.
4. External identity providers stay behind explicit boundaries; Nexora UUID remains the internal identity anchor.
5. Organization-scoped requests must use active organization context and server-side authorization.
6. \`EXPO_PUBLIC_*\` variables are public client configuration only; no secrets are committed.
7. Shared packages should be extracted only after real duplication appears across multiple apps.
8. Keep Expo SDK and React Native versions aligned with the Finance mobile reference app.

## Current mobile routes

- \`/\` -> auth-aware redirect
- \`/sign-in\` -> Nexora account sign-in / registration
- \`/(tabs)\` -> Home dashboard
- \`/(tabs)/learning\` -> guided learning and course overview
- \`/(tabs)/academic\` -> academic service hub
- \`/(tabs)/profile\` -> Nexora identity and learning workspace profile
- \`/(tabs)/lesson/[lessonKey]\` -> lesson detail and local reflection interaction
- \`/(tabs)/journey\` -> learning timeline and progress reflection
- \`/(tabs)/skills\` -> competencies and portfolio foundation

Journey, Skills and Lesson routes are nested in the tab navigator but intentionally hidden from the bottom-tab bar.

## UI implementation notes

- Shared palette, screen layout, cards, tags and progress indicators are in \`components/ui.tsx\`.
- Home, Learning, Academic, Profile, Journey, Skills and Lesson use a consistent mobile-first visual system.
- Sample course/progress content is illustrative only. It must not be presented as official academic data or persisted learning completion.
- Academic modules show an institution-not-connected state until real organization membership and academic APIs are available.
- Official grades, attendance and enrollment remain server-authoritative; learning progress does not silently become an academic record.
- The current organization provider is a foundation and returns no active institution yet.

## Remaining work

1. Run Dignity mobile typecheck, lint and Expo startup in Codespaces/CI; fix any issues before treating this stage as validated.
2. Connect learning screens to the existing Django learning API with typed contracts, loading/error/empty states and server-persisted progress.
3. Implement institution selection and membership loading from the authorized organization API.
4. Connect academic screens to authoritative attendance, KRS, schedule and grade APIs.
5. Add accessible forms, evidence upload, portfolio permissions and research/library workflows.
6. Add interaction and navigation tests plus visual QA on small Android devices.
7. Add EAS configuration only when release builds are required.
