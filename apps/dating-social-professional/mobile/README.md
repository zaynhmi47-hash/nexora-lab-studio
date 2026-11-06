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


## Moments interaction API client

- Mobile API provider now exposes feed creation/deletion, like/unlike, comment listing/creation/deletion, and the feed interaction counters/liked-by-me state.
- The current Moments screen still needs the interaction controls and comment thread UI; this commit adds the typed API boundary only.


## Moments interaction UI

- Moment cards now expose like/unlike actions and live interaction counters.
- Comment threads load on demand, support top-level comments and one-level replies, and refresh feed counters after successful mutations.
- Comment and reaction requests use the authenticated dating API provider; loading, retry, pending, and error states are surfaced in the UI.
- The current mobile thread UI does not yet expose comment deletion or reporting controls; these require ownership/session mapping and the next moderation slice.


## UI/UX foundation — November 2026

The mobile client now has a shared visual token foundation in `src/ui/tokens.ts`:
- Warm neutral surfaces, deep plum primary, coral accent, semantic status colors.
- Shared spacing, radius, typography, and card shadow scales.
- Primary tab navigation uses consistent Ionicons, active/inactive states, notification badge styling, and keyboard-aware tab behavior.
- Discovery now uses a compact editorial heading, a collapsible filter panel (instead of permanently consuming vertical space), and a clearer profile-card surface hierarchy.

### Product design direction

- **Discover:** profile-first discovery, strong photo hierarchy, concise compatibility/context, progressive filters, accessible swipe alternatives.
- **Moments:** immersive social feed with clear creator identity, media-first cards, visible engagement and safety actions.
- **Matches / Chats:** separate relationship discovery from active conversations; do not remove either route until the product flow is consolidated deliberately.
- **Profile:** guided profile completion, gallery management, intent and interests, privacy and safety controls.
- **System:** consistent loading, empty, error, disabled, pressed, and accessibility states; support compact Android screens and safe areas.

The tokens are a foundation, not a claim that every screen has been migrated. Remaining UI work includes Moments, Matches, Chats, Profile, Notifications, settings/Security Center, responsive QA, and visual regression checks.
