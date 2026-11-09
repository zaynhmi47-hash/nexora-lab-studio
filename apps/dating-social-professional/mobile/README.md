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


### Date Planner & Relationship Journey UI

- Added a dedicated Date Planner route reachable from the Matches screen; it is registered as a hidden route so the six primary tabs remain unchanged.
- Date Planner supports choosing an activity, entering date/time/place/notes, validating required fields, and reviewing a local plan preview.
- Added a five-stage relationship journey guide: First hello, Getting to know, First date, Building trust, and Defining the relationship.
- Added first-date safety guidance and copy that reinforces mutual consent, personal boundaries, and each relationship's own pace.
- **Persistence boundary:** the backend persistence layer and authenticated endpoints are now implemented (see below), but this mobile screen has not yet been wired to the API. Until that client integration is complete, the current preview and journey state remain local and are not saved, synced, or shared.

### Date Planner backend — first persistence slice

- Added PostgreSQL-backed `DatingDatePlan` and `DatingRelationshipMilestone` models with migration `0020_date_planner_relationship_journey`.
- Date plans are attached to an existing active mutual match. The organizer proposes a plan; only the matched partner can accept or decline. The API rejects self-invitations, inactive matches, blocked pairs, and past start times.
- Each participant acknowledges relationship milestones independently. The API exposes whether the current user, their partner, or both have acknowledged each stage; it does not infer a relationship status or automatically advance a couple.
- In-app notification records are created for invitations, responses, and milestone acknowledgements.
- Endpoints:
  - `GET/POST /api/v1/dating/date-plans/`
  - `POST /api/v1/dating/date-plans/<plan_id>/response/` with `decision: accept|decline`
  - `GET/POST /api/v1/dating/matches/<match_id>/relationship-milestones/`
- The current slice does not yet include editing/cancelling plans, reminders, calendar integration, partner-visible UI, or automated milestone progression. Backend tests and migration execution still need to be run in the Codespaces environment.

### Date Planner mobile API integration

- The Date Planner screen now uses the authenticated dating API provider and TanStack Query for matches, date plans, and per-match relationship milestones.
- Users can select an active match, submit a future-dated invitation with device-local time and IANA timezone, and see sent/received plans synchronized from the server.
- Invited participants can accept or decline proposed plans; the API response includes a viewer-scoped `can_respond` flag so organizers do not see response controls.
- Each participant can acknowledge each relationship stage once. The screen shows separate acknowledgement states and highlights only mutual agreement.
- Query caches are refreshed after successful creation, response, and milestone acknowledgement. The screen includes loading, empty, error, and pending states.
- The mobile integration is committed, but Expo typecheck, device testing, and backend migration/API tests have not yet been run in Codespaces. The current API has no plan edit/cancel controls or reminder scheduling.


### Date Planner lifecycle and mutual rescheduling — backend/API slice

- Added cancellation and completion lifecycle actions. Either participant can cancel a proposed or accepted plan; a plan can only be marked completed after its scheduled start time.
- Added a reschedule proposal flow for accepted plans. Either participant can propose a future date/time, timezone, location, and notes; the other participant must explicitly accept or decline before the stored plan changes.
- A plan can have only one pending reschedule proposal. Cancellation clears any pending proposal. Lifecycle and reschedule writes are serialized with row locks and return conflict responses for invalid state transitions.
- Added migration `0021_date_plan_lifecycle_reschedule` and API routes:
  - `POST /api/v1/dating/date-plans/<plan_id>/lifecycle/` with `action: cancel|complete`
  - `POST /api/v1/dating/date-plans/<plan_id>/reschedule/` to propose a change
  - `PUT /api/v1/dating/date-plans/<plan_id>/reschedule/` with `decision: accept|decline`
- Mobile API provider methods and response types are available; the Date Planner screen now exposes cancellation, completion, proposal editing, and partner accept/decline controls.
- Scheduled reminders are intentionally not claimed: they need a durable background scheduler/worker and delivery policy, not a client-side timer. Migration, Django tests, and Expo typecheck/device QA still need to run in Codespaces.


### Date Planner lifecycle UI integration

- Connected the Date Planner screen to the lifecycle and reschedule API methods.
- Accepted plans can show a pending reschedule proposal; only the other participant sees accept/decline controls. The proposer sees a waiting-for-partner state.
- Either participant can propose a future date/time, timezone, location, and optional notes; the proposal form validates a future local time before sending.
- Participants can cancel proposed or accepted plans after a confirmation prompt. Accepted plans whose scheduled time has passed can be marked completed.
- Query state refreshes after lifecycle and reschedule mutations. This UI is wired to the backend contracts but has not yet been typechecked or tested on a device.
- Durable scheduled reminders are not part of this slice. They require a configured production scheduler/worker and a reliable push-delivery policy; a mobile timer alone would not be dependable.
