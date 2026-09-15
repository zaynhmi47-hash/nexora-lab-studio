# Nexora Finance — Stage 1 Source Audit

Source audited: `nexora-books.zip` (Google AI Studio / Expo source supplied for Nexora Finance).

## Objective

Establish the migration boundary before moving the generated UI into the monorepo's canonical Expo app at `apps/nexora-finance/mobile`.

## Source inventory

- 375 `.ts` files
- 287 `.tsx` files
- 664 TypeScript/TSX source files total
- Expo Router route files are already present under `app/`
- Major feature areas include Finance, POS, Inventory, Growth, Accounting, AI, Business, Billing, Workspace, Auth, and automation modules.

## Route surface found

- `app/_layout.tsx`
- `app/+html.tsx`
- `app/+not-found.tsx`
- `app/modal.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/finance.tsx`
- `app/(tabs)/pos.tsx`
- `app/(tabs)/inventory.tsx`
- `app/(tabs)/growth.tsx`

The source therefore already has an Expo Router shell, but the large feature implementation remains primarily in `src/` and is not yet wired into a clean universal Expo architecture.

## Dependency audit

The source `package.json` contains 24 dependencies/devDependencies, including:

- Expo/React Native runtime pieces are incomplete as a clean Expo application dependency set.
- Web/desktop build stack: Vite, Express, Electron, `@vitejs/plugin-react`, esbuild, Tailwind Vite integration.
- Web-only UI: `lucide-react`.
- Browser React runtime: `react-dom`.
- Charts: `recharts`.
- 3D: `three`.
- Firebase Web SDK, including Auth, Firestore, Storage, Messaging, Analytics, Remote Config, Performance, and App Check.
- `jspdf` and `motion`.

These dependencies cannot simply be copied into the canonical React Native app. They need platform-aware adapters or React Native-compatible replacements.

## High-risk compatibility findings

### 1. Web-only icon system

`lucide-react` is imported approximately 240 times. It must be replaced with a React Native-compatible icon layer (or a controlled platform adapter) rather than retaining the web package in the universal app.

### 2. Browser APIs are embedded in shared contexts/services

The source directly uses `window`, `document`, `localStorage`, and related browser APIs in contexts such as theme, notifications, accounting, workspace, and personal finance state.

These must be abstracted behind a universal storage/platform layer. Native should use an appropriate persistent store (for example SecureStore only for secrets and AsyncStorage for non-sensitive app state), while Web may use web storage where appropriate.

### 3. React DOM dependency

`react-dom/client` is referenced. This is incompatible with native runtime and must be isolated to Web-only entry behavior or removed in favor of Expo Router.

### 4. Three.js is extensive

The source contains multiple Three.js scenes/adapters. These should not be blindly imported into every native screen. The migration should introduce platform-aware 3D components and graceful 2D fallbacks for devices/platforms where WebGL is unavailable or undesirable.

### 5. Charts

`recharts` is a browser-oriented charting dependency. Finance analytics must use a universal chart abstraction rather than importing Recharts into native bundles.

### 6. Motion

`motion/react` is web-oriented in the current source. Animations should be migrated to React Native/Reanimated or isolated behind a platform adapter.

### 7. PDF generation

`jspdf` is browser-oriented. Receipt/report PDF generation needs a universal service boundary with platform-specific implementations.

### 8. Firebase architecture

The source contains many Firebase repositories and Firebase services. These are useful for prototyping, but the production architecture requires:

`Expo -> Firebase Auth -> Nexora Core API (Django)`

Finance/business domain ownership should remain in Nexora Core. Firebase repositories must therefore be classified as either authentication/provider adapters, offline/cache helpers, or legacy prototype persistence before they are retained.

### 9. Firebase configuration/secrets

The source contains Firebase configuration files and an Android `googleServicesFile` reference. Credentials/configuration must be reviewed before committing to the public repository. Public Firebase client configuration is not itself a server secret, but service-account credentials, private keys, or sensitive build files must never be committed.

### 10. Application identity/configuration

The source currently identifies itself as `Nexora ERP & Financial OS`, slug `nexora-erp-os`, scheme `nexorabooks`, and Android package `Com.nexora.app`. These values are inconsistent with the canonical Finance identity and need normalization before EAS builds.

## Migration decision

Do **not** copy the source into `apps/nexora-finance/mobile` as-is.

The correct strategy is:

1. Preserve the generated UI/components as the design source of truth.
2. Create a clean Expo Router universal runtime boundary.
3. Port the feature components incrementally into React Native-compatible components.
4. Introduce platform adapters for storage, icons, charts, 3D, PDF, and browser-only functionality.
5. Keep Firebase primarily at the provider/integration boundary.
6. Connect core finance/business operations to Nexora Core Django REST APIs.
7. Add authentication and authorization before exposing protected domain operations.
8. Validate Android, iOS, and Web independently before merging.

## Stage 1 exit criteria

- [x] Correct Finance source identified.
- [x] Route surface inventoried.
- [x] Web/desktop dependencies identified.
- [x] Browser-global usage identified.
- [x] Firebase integration surface identified.
- [x] 3D/chart/PDF compatibility risks identified.
- [x] Canonical Finance runtime boundary defined.

Stage 2 should begin with the actual source import/normalization and platform adapter layer, not a UI rewrite.
