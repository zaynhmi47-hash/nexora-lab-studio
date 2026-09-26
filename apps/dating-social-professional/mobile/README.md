# Nexora Dating — Mobile

Expo SDK 57 / React Native 0.86 / Expo Router 57 client for the Dating Social Professional product.

## Architecture

- `app/` contains routes only.
- `src/api/` owns API contracts/client boundaries.
- `src/auth/` owns client session state.
- TanStack Query owns server state.
- Zustand and local state may own UI/client state as the feature grows.
- Backend authority remains in `services/nexora-api/`.

The current discover screen is intentionally a thin vertical slice. It establishes routing and API contracts without inventing a client-side matching engine or fake production data.
