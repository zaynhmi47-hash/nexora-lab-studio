# Nexora Toolbox — AGENT.md

## 1. Mission
Nexora Toolbox is a lightweight collection of everyday utilities: calculator, unit conversion, QR/barcode, text tools, notes, to-do, and other small helpers.

## 2. Architecture
Default to local-first and offline. Each utility should be a small isolated module with clear inputs/outputs and tests. Shared navigation/settings can be reused, but utilities should not depend on one another unnecessarily.

## 3. AI-agent instructions
Do not add a backend merely because the monorepo has one. Avoid accounts for local-only features. Keep dependencies small. Validate user input and handle malformed data. Preserve local data across app updates where supported.

## 4. Monetization
Ads and premium features are optional layers. They must not compromise utility behavior or collect unnecessary data.

## 5. Quality
Optimize startup, memory, battery, accessibility, and small bundle size. Test offline operation, orientation/responsive layouts, malformed input, and persistence.

# Detailed Product Concept — Nexora Toolbox

## 1. Product Positioning

Nexora Toolbox is a lightweight utility hub designed for fast, practical tasks. Its default philosophy is local-first, low-dependency, privacy-conscious, and useful without requiring an account.

It should feel like a collection of dependable tools rather than a large workflow platform.

## 2. Initial Tools

Core tools may include:
- Calculator.
- Unit converter.
- QR code generator/scanner.
- Barcode utilities.
- Text utilities.
- Notes.
- Todo/checklists.
- Date/time utilities where appropriate.
- Small file/text helpers where justified.

Each tool should remain modular and independently testable.

## 3. Tool UX Contract

Every utility should provide:
- Clear inputs.
- Deterministic processing where applicable.
- Clear output.
- Copy/share/save actions where useful.
- Reset/clear action.
- Helpful validation.
- Accessible controls.
- Loading/error states only when processing actually requires them.

Avoid adding unnecessary account requirements.

## 4. Navigation

Primary shell:

Home → All Tools / Search → Favorites → Recent → Saved → Settings

Individual tools should open quickly and avoid deep navigation.

## 5. Local-First Architecture

Core functionality should work locally whenever technically possible.

By default:
- Do not upload user text.
- Do not upload QR payloads.
- Do not require cloud storage.
- Keep temporary data local.
- Minimize analytics.

Optional cloud sync may be introduced only when it provides meaningful value and requires explicit user consent.

If synchronization is introduced, identity/storage should use Nexora Core capabilities rather than a second account system.

## 6. Backend Relationship

Most Toolbox tools do not require a custom backend.

Backend/Core involvement is justified for:
- Optional synchronization.
- Cross-device saved data.
- Authenticated preferences.
- Approved analytics.
- Monetization state.

Calculation and utility logic should remain close to the client where offline execution is appropriate.

## 7. Security and Privacy

The product must avoid hidden network activity for sensitive utility inputs.

Platform permissions must be requested only when a feature requires them, such as camera access for QR/barcode scanning.

Do not retain scans, notes, or text inputs remotely unless the user explicitly enables a feature that requires persistence.

## 8. Monetization

Potential monetization:
- Non-intrusive advertising.
- Optional premium features.
- Expanded utility limits only where technically justified.

Core utilities should remain coherent and usable; monetization must not create deceptive interaction patterns.

## 9. Agent Ownership

Frontend owns local utility logic, UI, navigation, accessibility, local persistence, and platform integration.

Core/backend own only approved shared capabilities such as authenticated sync, shared notifications, analytics, or monetization state.

Do not create a backend service merely to move deterministic local calculations to the server.

## 10. Definition of Done

A Toolbox feature is complete only when offline behavior, permissions, deterministic results where applicable, validation, accessibility, local persistence, privacy/network behavior, and platform compatibility are tested.
