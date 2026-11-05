# Nexora Current State

Last maintained: 2026-09-20

## Repository foundation

The repository is the Nexora monorepo and currently contains the shared structure for products, Nexora Core, workers, packages, infrastructure, tooling, and documentation.

Current root areas include:

- `apps/`
- `services/`
- `packages/`
- `infrastructure/`
- `tooling/`
- `docs/`

The repository README defines the architecture as **Modular Monolith → Service-Ready** and establishes the core principles of shared foundation, explicit domain boundaries, Nexora UUID identity, provider-neutral Firebase adapters, no committed secrets, and independent product deployment.

## Known architecture baseline

Existing documentation establishes:

- frontend/backend physical separation;
- Django/DRF Nexora Core under `services/nexora-api/`;
- workers under `services/workers/`;
- Firebase and Google Cloud configuration under `infrastructure/`;
- shared frontend/platform packages under `packages/`.

## Historical Nexora Core implementation context

The broader Nexora backend work has established the following intended baseline and should be verified against the actual repository implementation before changing it:

- core UUID/timestamp/soft-delete/auditable model foundations;
- soft-delete/restore/active/deleted behavior;
- correlation IDs and `X-Request-ID` compatibility;
- context cleanup;
- exception hierarchy and response helpers;
- bounded page pagination;
- validators and logging filters;
- DRF configuration;
- health checks and foundational tests;
- provider-neutral ports/value objects/exceptions/contract tests;
- Firebase integration behind `infrastructure/firebase/` with lazy initialization;
- identity application with provider-account linking;
- NEXORA UUID as the internal identity anchor;
- Firebase subject/UID kept as an external provider identifier;
- no password ownership in Nexora Core when Firebase Authentication is used.

These points are context, not permission to assume files or implementations exist. Codex must inspect the repository before modifying any of them.

## Next expected platform direction

The planned sequence includes strengthening authorization/RBAC, audit/security review, and subsequent platform phases. The exact phase status must be verified from code, tests, commits, and documentation before implementation.

## State maintenance rule

Whenever a task changes architecture, security foundations, identity, provider integrations, deployment boundaries, or major product structure, update this file with the new verified state.


## Local backend Control Plane

Verified on 2026-09-20:

- Added `apps.control_plane` to Nexora Core.
- Added development-only `/ops/` dashboard and `/ops/snapshot/` JSON endpoint.
- Dashboard dynamically inventories Django API routes, reports database/Firebase configuration status, lists core/domain services, and displays bounded recent request telemetry.
- Telemetry stores only method, path, status code, and duration in process memory; no request bodies or credentials are recorded.
- Control Plane is disabled when `DEBUG=False`.
- Architectural decision recorded in `docs/decisions/ADR-local-control-plane.md`.


## Security hardening — verified implementation

The backend default DRF policy is now deny-by-default:

- Firebase bearer-token authentication is the default authentication class.
- `AuthenticatedNexoraUserPermission` is the default permission class.
- Public endpoints must explicitly opt out/declare public access.
- Existing health/liveness endpoints retain explicit public behavior.
- The Control Plane remains DEBUG-only and does not inherit production API access.
- Focused tests cover the default authentication/permission policy and public health behavior.
\n## Learning gamification integration — verified on 2026-09-20\n\n- `apps.gamification` is registered in Django `INSTALLED_APPS`.\n- Gamification API is exposed under `/api/v1/gamification/`.\n- Control Center application registry includes the gamification platform service.\n- Learning quiz completion now returns the XP actually recorded by the gamification ledger.\n- Gamification migrations already exist and are now discoverable by Django migration tooling.\n
## Architecture audit — verified 2026-09-25

The repository was audited against the root AGENTS contract, .codex project rules, product AGENT files, and the current backend tree.

Verified inventory:
- 30 directories currently exist under apps/.
- 28 product AGENT files were previously documented.
- apps/nexora-muslim/ is an active Expo product and now has a dedicated AGENT contract.
- apps/nexora-business/ is an empty/reserved placeholder and is explicitly prevented from duplicating Nexora Business Suite.
- apps/nexora-health-ai/ is not present in the current repository inventory and is not treated as an active app.

Verified backend inventory includes shared/core foundations plus identity, organizations, access, capabilities, products, learning, gamification, finance and Islamic-domain applications including quran, prayer, qibla, dhikr, dua, fasting, zakat, umrah, places, reminders, ramadan and tajwid.

Verified security baseline:
- DRF defaults to Firebase bearer authentication and authenticated Nexora user permission.
- Public endpoints require explicit public permission behavior.
- NexoraUser is the internal identity model and Firebase/provider subjects are linked through provider accounts.
- UUID/timestamp/soft-delete/audit foundations are present through AuditableBaseModel.
- Firebase integration is isolated under infrastructure/firebase.
- Storage ports exist under infrastructure/storage.

Verified finance baseline:
- Finance transactions are organization-scoped.
- Transaction amounts use integer minor units.
- Initial contract currently restricts transaction currency to IDR.
- Active idempotency keys are unique per organization.
- Finance transactions reject hard deletion.

Architecture boundaries were hardened for Social vs Dating Professional, Nexora AI vs AI Agent Business, Core AI Gateway, Core/Cloud storage, Creator vs Social/Portfolio, and Business Suite vs specialized business domains.

No application runtime code was changed by this audit. Test execution was not performed through the GitHub connector, so this audit does not claim a fresh local test pass.



## Dating Social Professional — verified implementation baseline on 2026-09-26

- Product owner exists at `apps/dating-social-professional/AGENT.md`.
- Mobile foundation exists at `apps/dating-social-professional/mobile/` targeting Expo SDK 57 / React Native 0.86 / Expo Router 57.
- Backend domain exists at `services/nexora-api/apps/dating_social_professional/` and is registered in Django.
- Initial API contract exposes authenticated discovery and swipe endpoints under `/api/v1/dating/`.
- Initial persistence covers dating profiles, swipes and mutual matches.
- Swipe actor/target pairs are database-unique and the service handles repeated requests idempotently.
- Reciprocal likes create a deterministic match pair.
- Tests were added for idempotency, mutual matching and self-swipe rejection.
- ADR recorded at `docs/decisions/ADR-dating-social-professional-domain.md`.
- This branch does not claim a fresh local test/typecheck pass through the GitHub connector; execution must still be performed in the development environment.

## Dating safety lifecycle update — 2026-11-05

- Added an idempotent backend unblock operation for the authenticated account.
- Added `GET /api/v1/dating/blocks/` to return the caller's own block list with minimal profile presentation fields.
- Added `DELETE /api/v1/dating/blocks/?target_user_id=<uuid>` to remove a caller-created block.
- Unblocking deliberately does not reactivate a prior match or conversation; users must establish a new mutual like to match again.
- Added a regression test covering block creation, match deactivation, unblock idempotency, and no automatic match reactivation.
- Code is committed to `main`; tests have not been executed in this environment and must be run in Codespaces/CI before treating this slice as verified.


## Dating Moments — first backend vertical slice (2026-11-05)

- Added `DatingMoment` with text caption, optional media URL, public/private visibility, UUID/audit timestamps, and feed/author indexes.
- Added authenticated `GET/POST/DELETE /api/v1/dating/moments/`. Creation requires a dating profile with birth date and enforces age 18+; deletion is owner-only and uses the shared soft-delete base model.
- Public feed excludes inactive authors and both directions of block relationships. Private moments are visible only to their author.
- Media is represented by an optional URL in this first slice; upload moderation, reactions, comments, ranking, and media processing remain later phases.
- Added focused API coverage for create/feed/private visibility/owner-only delete. Tests and migrations have not been executed in this remote editing session.


## Dating Moments — mobile first slice (2026-11-05)

- Added `app/(app)/moments.tsx` with authenticated feed query, pull-to-refresh, text composer, public/private visibility, optional media URL field, and owner-only delete action.
- Added `DatingMoment` API client contracts and query mutations; registered Moments in the app tab navigation.
- Media upload/playback, reactions, comments, cursor pagination, and moderation UX remain follow-up work. Mobile typecheck and backend tests have not been executed in this remote editing session.


## Dating Moments — Social Interaction Engine (2026-11-05)

- Added per-account Moment reactions with an active-row uniqueness constraint; repeated like requests are idempotent and unlike uses soft deletion.
- Added top-level comments and one-level replies. Replies must reference a top-level comment on the same Moment.
- Read/write interactions require an active account, a visible Moment, no block relationship, and an adult dating profile for creating likes/comments.
- Comment deletion is owner-only and soft-deleted. Interaction endpoints are rate-limited using the existing dating action throttle.
- API routes: `POST/DELETE /api/v1/dating/moments/<moment_id>/reactions/` and `GET/POST/DELETE /api/v1/dating/moments/<moment_id>/comments/`.
- Added focused regression tests for idempotent reactions, soft unlike, comment/reply creation, and cross-Moment reply rejection. Tests/migrations remain unexecuted in the remote editing session.


## Dating Moments — mobile interaction API contract (2026-11-05)

- Added typed mobile API methods for like/unlike and comment list/create/delete, alongside the existing Moments feed/create/delete methods.
- Feed contract now includes `like_count`, `comment_count`, and `is_liked_by_me`; the backend computes these using filtered aggregates and an existence query.
- The Moments screen has not yet been updated with visible like/comment controls or thread UI. Mobile typecheck and backend tests/migrations remain unexecuted.


## Dating Moments — interaction UI (2026-11-05)

- Updated the existing Moments screen with like/unlike actions, like/comment counters, on-demand comment threads, top-level comment composer, and one-level reply composer.
- Added pending, loading, empty, retry, and error handling for interactions. Feed and thread queries are invalidated after successful writes to keep counts and thread content fresh.
- Comment deletion and reporting controls are intentionally not exposed in this UI slice; moderation/ownership mapping is a follow-up.
- Mobile typecheck and backend test/migration execution have not been performed in this remote GitHub editing session.


## Dating Moments — social notifications and reporting (2026-11-05)

- Added the `social` notification type and migration `0013_notification_social_type`.
- A newly-created like or comment now creates an in-app notification for the Moment owner; repeated idempotent likes do not create duplicate notifications, and self-interactions do not notify the author.
- Notifications include structured `momentId`, `actorId`, action, and optional `commentId` metadata. The existing notification feed can display these records.
- Added `POST /api/v1/dating/moments/<moment_id>/report/`, reusing the existing DatingSafetyService and DatingReport pipeline rather than introducing a parallel moderation store.
- Mobile now exposes a Moment report action with reason selection and routes social notification taps to the Moments feed.
- Tightened interaction visibility to exclude soft-deleted Moments, comments, replies, and inactive comment authors. Comment payloads include `is_own` for ownership-aware UI.
- Added regression coverage for social notifications and Moment reports. Migration execution, backend tests, mobile typecheck, and end-to-end behavior still need verification in Codespaces/CI. Push delivery is not implemented by this in-app notification slice.


## Dating Moments — direct media upload (2026-11-05)

- Extended `DatingMoment` with provider-neutral `storage_key` and `media_type` metadata; legacy `media_url` remains supported.
- Added migration `0014_dating_moment_media_storage`.
- `POST /api/v1/dating/moments/` now accepts either JSON with a legacy `media_url`, or multipart form data with `caption`, `visibility`, and `file`.
- Uploads are stored through the existing `ObjectStorageProvider` port and Firebase Storage adapter in the `dating/moments` namespace. Firebase SDK usage remains behind the infrastructure adapter.
- Server-side validation checks declared MIME type, file size, and file signature. Current limits: images JPEG/PNG/WebP up to 10 MB; videos MP4/MOV/WebM up to 100 MB.
- Feed serialization generates short-lived signed read URLs. Owner deletion soft-deletes the Moment and attempts to delete its stored object.
- Mobile composer now uses Expo Image Picker for photo/video selection and submits multipart uploads; feed renders image media and a video media card.
- Added backend tests for successful image storage and MIME/signature mismatch rejection.
- Not yet implemented/verified: video transcoding, thumbnail generation, playback UI, automated content moderation, background orphan cleanup, plan-based quotas, push notifications, and local test/typecheck/migration execution. These remain explicit follow-up work; do not treat this media slice as fully production-verified.


## Dating Moments — Video Experience Engine (2026-11-05)

- Added SDK 57-compatible `expo-video ~57.0.5` for native inline playback of uploaded Moment videos. Players loop, use local video caching, and start muted; native playback controls remain available.
- Added SDK 57-compatible `expo-image-manipulator ~57.0.21`; selected photos are resized to a maximum width of 1600 px and JPEG-compressed at 0.78 quality before upload.
- Mobile picker rejects videos over 60 seconds or over 100 MB before upload. Server continues enforcing the 100 MB video limit.
- Corrected backend binary signature validation to compare real JPEG/PNG/WebM byte sequences. Updated the valid JPEG upload test fixture to use actual signature bytes.
- Not yet implemented: server-side video transcoding/adaptive streaming, persistent thumbnail generation and storage, automated content moderation/quarantine, visibility-aware autoplay/pause for scrolling feeds, video metadata verification on server, and device-level runtime tests. The current player is user-initiated with native controls; it is not an autoplay Reels feed.
- Dependency versions are aligned to Expo SDK 57 per the Expo SDK 57 reference. A new native development build is required after adding native Expo modules; run `pnpm exec expo install --check` (or `npx expo install --check`) and the mobile typecheck in Codespaces before release.


## Dating Moments — media safety and human moderation pipeline (2026-11-05)

- Added `moderation_status` (`pending`, `approved`, `rejected`), reviewer identity, review timestamp, and optional reviewer reason to `DatingMoment`.
- Migration `0015_dating_moment_moderation` preserves existing content as approved; newly-created Moments through the API are explicitly queued as pending.
- Public feed results are restricted to approved public Moments. Authors can still see their own Moments, including pending/rejected states and moderation reason.
- Other users cannot react to, comment on, or report a Moment until it is approved; existing visibility, block, and active-account checks remain in place.
- Added a protected human review queue and approve/reject endpoint under `/api/v1/dating/moderation/moments/`.
- Moderator access uses the explicit `DATING_MOMENT_MODERATOR_USER_IDS` settings allowlist. It is empty by default; production operators must configure authorized Nexora user UUIDs before any reviewer can access the queue.
- This is a human moderation workflow only. Automated AI moderation, background processing, quarantine storage, thumbnail generation, video transcoding, and provider integration are not implemented or claimed.
- Added tests for pending-feed visibility, pending upload state, allowlisted review, approval metadata, and interaction blocking. Tests and migrations have not been executed in this remote GitHub editing session.

- Mobile Moments now types moderation state and displays a pending-review or rejection message to the author; successful submission explains that the post will not appear publicly until approved.
- No staff moderation screen is included yet; reviewers use the protected API until the internal moderation UI is implemented.


## Dating Moments — durable media thumbnail worker (2026-11-05)

- Added DatingMoment.thumbnail_key and durable one-to-one DatingMomentMediaJob records with queued, processing, completed, and failed states, attempt count, retry time, worker lease, and error detail.
- New uploaded media creates a queued job in the same database transaction as its Moment record. Legacy URL-only Moments do not create a processing job.
- Added DatingMomentMediaProcessor: images are EXIF-oriented, resized to a maximum 640×640, and stored as optimized JPEG thumbnails in dating/moment-thumbnails. Videos use FFmpeg to extract a representative frame at one second; the original video remains unchanged.
- Added process_pending_media_jobs() and the Django command `python manage.py run_moment_media_worker --limit 20`. The worker claims jobs with row locks, recovers stale processing leases after 15 minutes, retries failures with exponential backoff, and marks jobs failed after the configured attempt limit.
- Added Pillow to backend requirements. Video thumbnail jobs require FFmpeg installed on the worker image; missing FFmpeg is recorded as a retryable job error. No transcoding or adaptive streaming is included.
- Thumbnail URLs are generated as short-lived signed storage references by the Moment serializer when a thumbnail exists.
- Added unit tests for image thumbnail dimensions/format, invalid image rejection, and storage upload/reference persistence.
- Deployment: install backend requirements, install FFmpeg in the worker container, then schedule `python manage.py run_moment_media_worker --limit 50` periodically (for example, once per minute). Run one worker command instance per scheduler tick; database row locks coordinate concurrent workers on PostgreSQL.
- Tests and migrations have not been executed in this remote GitHub editing session. Automated AI content moderation is not active; the existing human approval gate remains authoritative.

- Mobile Moments now accepts the optional `thumbnail_url` field and renders generated video thumbnails above the video player; composer guidance explains thumbnail processing and the human review gate.


## Dating Moments — provider-neutral AI moderation integration layer (2026-11-05)

- Added `DatingMomentModerationJob` and migration `0017_dating_moment_ai_moderation`. New Moments enqueue both media processing (when uploaded media exists) and AI risk assessment in the same database transaction.
- Added provider-neutral contracts under `infrastructure/moderation/ports/`: `ContentModerationRequest`, `ContentModerationAssessment`, and `ContentModerationProvider`. The request supplies caption, media type, and private object references for the original media and optional thumbnail; provider adapters own any provider-specific fetch/upload logic.
- Added configurable adapter loading via `DATING_MOMENT_MODERATION_PROVIDER` (Django import path to a provider factory). Empty configuration means AI assessment is disabled; no vendor SDK, credentials, or AI service is falsely assumed to exist.
- Added `process_pending_moderation_jobs()` and management command `python manage.py run_moment_moderation_worker --limit 20`. Jobs use PostgreSQL row locks, stale lease recovery, bounded retries, and persisted provider/action/confidence/categories/explanation metadata.
- AI results are recommendations only (`approve`, `reject`, `review`). The worker intentionally never changes `DatingMoment.moderation_status`; only the allowlisted human moderation endpoint can approve or reject content. Provider failures leave content pending and retry or fail the assessment job without publishing it.
- The human review queue now includes the latest AI assessment details. Reviewer decision fields on the Moment remain the authoritative publication state.
- Added tests for enqueueing, provider recommendations, provider failure handling, and the invariant that AI cannot publish or reject content. Tests and migrations have not been executed in this remote GitHub editing session.
- Configure a real adapter factory and its secret references in the deployment environment before scheduling the moderation worker. Review provider retention/training terms and data-processing region before sending user-generated content to any external provider. Do not put API keys in source control.


## Dating Social — Nexora Trust & Safety Center (2026-11-05)

- Extended DatingReport with lifecycle states (open, investigating, action_taken, dismissed), priorities (low, normal, high, urgent), assignment, reviewer, review timestamp, and resolution note. Existing reports migrate to open / normal.
- Added DatingModerationAppeal (one appeal per rejected Moment) and DatingSafetyAuditEvent for report creation/triage, human Moment decisions, and appeal decisions. Report creation and its audit event are atomic.
- Added allowlisted moderator APIs:
  - GET /api/v1/dating/moderation/overview/ — report, pending Moment, failed AI assessment, and appeal counts.
  - GET /api/v1/dating/moderation/reports/ and PATCH /api/v1/dating/moderation/reports/<report_id>/ — report triage, priority, assignment, and resolution. Queue ordering is urgent, high, normal, then low.
  - GET /api/v1/dating/moderation/appeals/ and PATCH /api/v1/dating/moderation/appeals/<appeal_id>/ — second-level human appeal review.
  - GET /api/v1/dating/moderation/audit/ — moderator-only audit feed.
  - POST /api/v1/dating/moments/<moment_id>/appeal/ and GET /api/v1/dating/my-appeals/ — author appeal submission and status tracking.
- Accepting an appeal changes the Moment to approved and records the reviewing moderator; rejecting an appeal leaves the Moment rejected. Only the author of a rejected Moment can appeal, and an appeal can be submitted once.
- Moderator routes use the existing DATING_MOMENT_MODERATOR_USER_IDS allowlist and active-account permission. No public API exposes report or appeal queues.
- This phase adds casework and auditability, not automatic account sanctions. Any account restriction still requires a separately designed enforcement policy and integration with authentication/session enforcement.
- Added tests for report triage/audit, appeal submission/review, and ownership restrictions. Tests and migration have not been executed in this remote GitHub editing session.
- Apply migrations with python manage.py migrate. Configure DATING_MOMENT_MODERATOR_USER_IDS before using moderator endpoints.


## Dating Social — Account Protection & Reputation Engine foundation (2026-11-05)

- Added DatingAccountRiskProfile and DatingAccountSecurityEvent with migration 0019_dating_account_risk.py.
- Risk policy dating-risk-v1 is explainable and conservative: only moderator-resolved reports with status action_taken contribute report points (20 each, maximum 3); one urgent confirmed report adds 10; distinct user blocks contribute 2 each up to 10 blockers; final score is capped at 80.
- Risk bands: low 0-19, medium 20-39, high 40-64, critical 65-80. Signals and policy version are persisted for review.
- Added recalculate_account_risk() service, moderator endpoints GET /api/v1/dating/moderation/accounts/risk/ and POST /api/v1/dating/moderation/accounts/<user_id>/risk/recalculate/, plus GET /api/v1/dating/account/security/ for the signed-in account's limited security summary.
- Trust & Safety overview now counts high and critical risk profiles. Moderator endpoints reuse active-user permission and DATING_MOMENT_MODERATOR_USER_IDS allowlist.
- No automatic warnings, suspensions, bans, or public reputation badges are issued. Unreviewed reports are not scored; blocks are weak signals and the model is private to moderators. Account status enforcement is deliberately deferred until a separately reviewed policy and session/token revocation mechanism exist.
- Added tests for ignoring unreviewed reports, transparent scoring, caps, and idempotent profile updates. Tests and migration have not been run in this remote GitHub editing session.
- Apply with python manage.py migrate. Recalculate existing accounts only through the moderator endpoint; no bulk backfill is triggered automatically.


## Nexora Identity Security & Device Management foundation (2026-11-05)

- Added identity models IdentityDevice and IdentityLoginEvent with migration identity 0002_device_security.py.
- Device identifiers are client-generated opaque values; the API stores only a salted HMAC-SHA256 fingerprint keyed by Django SECRET_KEY. Raw identifiers are never persisted or returned. Device metadata is limited to user-provided label and platform; no raw IP, geolocation, advertising ID, or device fingerprint collection is implemented.
- Added authenticated endpoints under /api/v1/identity/:
  - GET/POST devices/ (list and register current user's devices)
  - GET login-history/ (privacy-safe recent activity, capped at 100)
  - POST devices/<device_id>/trust/ (requires Firebase auth_time within the last 10 minutes)
  - POST devices/<device_id>/revoke/
  - POST sessions/revoke-all/
- Firebase ID token verification now calls verify_id_token(check_revoked=True), so tokens issued before Firebase refresh-token revocation are rejected on subsequent authenticated requests.
- Firebase Admin adapter already supported revoke_session(); device revocation currently invokes Firebase revoke_refresh_tokens for the linked provider subject. Firebase revocation is account-wide, not per-device: all Firebase sessions for that account must sign in again. This is explicitly reflected in the API response. If provider revocation fails, local device state is not changed.
- Device registration is an authenticated client action after sign-in. Mobile/web clients still need to generate and securely persist a random opaque device ID, then call POST devices/. Device trust is not automatic and requires recent Firebase reauthentication. The trust flag is currently an audit/registry state, not an MFA bypass or access-control grant.
- Added tests for hashed identifiers, device registration, ownership-scoped listing, trusted-device reauthentication, revoked token verification, account-wide revocation, and provider failure behavior.
- Not implemented in this phase: per-device token revocation (not supported by current Firebase token model), MFA enrollment/challenge UX, suspicious-login location analysis, password reset/recovery flows, and client-side device registration UI.
- Apply migration with python manage.py migrate. Tests and migrations have not been run in the remote GitHub editing session.
