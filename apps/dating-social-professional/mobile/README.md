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


## Moments mobile slice

- Added the Moments tab with authenticated feed loading, pull-to-refresh, text composer, public/private selection, optional media URL, and owner-only delete action.
- TanStack Query owns feed state and invalidates after successful create/delete mutations.
- Direct media upload, video playback, reactions, comments, pagination, and moderation UI are intentionally deferred; the current API supports a media URL only.
