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


### Moments UI/UX overhaul

- Migrated Moments screen surfaces and controls to the shared warm-neutral / plum / coral design direction.
- Added a compact header with refresh action and clearer content hierarchy.
- Made the composer collapsible so the feed can take priority after the user finishes composing.
- Improved feed card elevation, media presentation, interaction spacing, and comment panel styling.
- Preserved existing API behavior: upload, public/private visibility, moderation messaging, likes, comments/replies, reporting, and owner deletion.
- This is a presentation-layer improvement; no backend contract or moderation policy was changed.


### Matches and Chats UI/UX overhaul

- Matches now has a clear connection summary, richer match rows, unread indicators, relative context, and an intentional empty state that routes to Discover.
- Chats now has a dedicated inbox presentation, last-message preview/time, unread badges, a clear empty state, and a pending state while opening a conversation.
- Both screens use the shared design tokens and maintain pull-to-refresh.
- Existing API behavior is preserved: both screens currently source rows from `getMatches()`; tapping a row reuses its conversation ID when present or creates/opens a conversation through the existing API.
- A dedicated server-side conversation-list endpoint, live message updates, message search, and filters are not claimed as implemented; those require a separate API/realtime slice.


### Profile UI/UX overhaul

- Reworked the Profile tab into a guided, section-based editing experience using the shared Nexora Dating visual tokens.
- Added a profile-completion progress surface, photo gallery management, primary-photo selection, ordering/removal controls, and photo-library upload while retaining the existing profile media API.
- Grouped editable identity, bio, relationship intent, interests, education, occupation, city, and discovery preferences into clearer sections.
- Added pull-to-refresh, loading/error states, inline save feedback, basic age/distance validation, and accessible labels for photo actions.
- Kept all writes on the existing dating API methods; no new backend fields or endpoints are assumed.
