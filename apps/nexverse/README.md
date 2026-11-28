# Nexverse

Nexverse is the reading, publishing and entertainment product in the Nexora ecosystem. The product is one modular application: reading and discovery first, followed by creator publishing, publisher operations, monetization and broader media formats.

## Mobile app

The Expo Router application is in `mobile/`.

```bash
pnpm install
pnpm --filter nexverse-mobile start
pnpm --filter nexverse-mobile typecheck
```

Current mobile surfaces include Home, Discover, Library, Profile, story detail, reader, Creator Studio and the internal Publisher Studio. Home and Discover load the public catalog from Nexora API; work detail loads published chapter metadata; the reader requests chapter content from the API and displays server-denied premium access without exposing paid bodies. Library reads authenticated reading progress and supports resume; reader preferences are stored locally.

## Backend boundaries

- Nexverse domain APIs live in `services/nexora-api/apps/nexverse/` and are mounted under `/api/v1/nexverse/`.
- Identity is anchored to the shared Nexora Core `NexoraUser`; Nexverse does not create a second account system.
- Creator endpoints provide author onboarding, draft works and chapters, ownership-scoped editing and submission for review.
- Moderation endpoints provide a protected queue, manuscript review, approve/reject decisions and an audit history.
- Only works with both published publication status and approved review status appear in public catalog and chapter delivery APIs.
- Paid chapter bodies remain withheld with `ENTITLEMENT_REQUIRED` until a verified payment has created an active server-side entitlement. Never implement paid-content authorization only in the mobile client.
- Reuse Nexora Core identity, files, notifications and generic payment primitives.

## Public catalog and reader API

- `GET /api/v1/nexverse/works/` supports `q`, `genre`, `language`, `page` and `page_size` filters.
- `GET /api/v1/nexverse/works/{work_slug}/` returns public work metadata and published chapter metadata.
- `GET /api/v1/nexverse/works/{work_slug}/chapters/{chapter_id}/` returns free-preview content or paid content for a user with an active entitlement; otherwise paid chapters respond with `ENTITLEMENT_REQUIRED` and HTTP 403.

The mobile catalog client maps the API DTOs into display models and does not fall back to sample stories when the server is unavailable. Configure `EXPO_PUBLIC_NEXORA_API_URL` in `mobile/.env.example` for the public reader as well as Publisher Studio.

## Publisher Studio API

- `GET /api/v1/nexverse/moderation/queue/`
- `GET /api/v1/nexverse/moderation/works/{work_id}/`
- `POST /api/v1/nexverse/moderation/works/{work_id}/decision/` with `{"decision":"approve","note":"..."}` or `{"decision":"reject","note":"..."}`

The backend verifies Firebase ID tokens through `FirebaseIdentityAuthentication` and enforces the active Nexverse moderator role on every request. Roles are provisioned operationally for existing Nexora identities: `reviewer` can reject, `publisher` can approve/publish, and `admin` can do both. Decisions are persisted with a review audit event. The mobile client does not grant moderator permissions.

## Firebase Auth bridge

The mobile app registers `getNexoraCoreAccessToken` as the moderation API token provider during root-layout startup. It uses Firebase Auth with React Native AsyncStorage persistence and calls `currentUser.getIdToken()` on demand; ID tokens are not copied into app storage or hardcoded. If Nexora Core has already initialized the default Firebase Auth instance in the same runtime, the adapter reuses it.

Publisher Studio now has an email/password sign-in screen for pre-provisioned moderator accounts. It does not offer public account registration. Configure Email/Password in Firebase Authentication only if this sign-in method is intended for moderator accounts. The same Firebase project and Nexora identity mapping must be used by the backend.

Configure the variables in `mobile/.env.example`: `EXPO_PUBLIC_NEXORA_API_URL` (API origin without `/api/v1`) and the `EXPO_PUBLIC_FIREBASE_*` client configuration. If the app must initialize Firebase itself, the minimum required Firebase values are API key, project ID and app ID; other Firebase client fields are optional for this Auth flow. If Nexora Core has already initialized the default Firebase app in the same runtime, the bridge reuses that app and does not require a second Firebase configuration.

This adapter uses the Firebase identity provider; it does not claim that a reusable cross-app Nexora Core auth package or full SSO lifecycle is complete. The server remains authoritative for identity mapping and moderator permissions.

Never place Firebase Admin service-account credentials in Expo environment variables. Client Firebase configuration values are public identifiers; server credentials belong only in the backend secret environment.

## Moderator provisioning

An operations administrator provisions a moderator against an existing Nexora identity from the Django shell:

```python
from apps.identity.models import NexoraUser
from apps.nexverse.models import NexverseModerator

user = NexoraUser.objects.get(email="moderator@example.com")
NexverseModerator.objects.update_or_create(
    user=user,
    defaults={"role": NexverseModerator.Role.ADMIN, "is_active": True},
)
```

## Validation notes

Run the commands above after installing workspace dependencies. A successful GitHub write is not evidence that the app type-checks or that a live Firebase/API environment is configured; those checks must be run in the repository environment with the required environment variables.


### Nexverse identity session

- Publisher Studio login uses the Nexora Firebase Authentication project with Email/Password.
- Firebase Auth persistence uses React Native AsyncStorage. The signed-in user session is observed in the Profile tab and can be signed out there.
- The mobile client requests a fresh Firebase ID token for every moderation API request; the API verifies the token and resolves the internal Nexora identity.
- Enable Email/Password in Firebase Authentication and configure the public Expo Firebase client values from `.env.example`. Never put Firebase service-account JSON or private server credentials in the mobile app.
- Provision a moderator separately through the Django admin/shell. A Firebase login alone does not grant moderation privileges.


## Reader progress, purchases and entitlements

- `GET /api/v1/nexverse/reader/progress/` and `GET|PUT /api/v1/nexverse/reader/progress/{work_id}/` store per-account reading progress for eligible free-preview chapters.
- `GET /api/v1/nexverse/reader/bookmarks/` and `POST|DELETE /api/v1/nexverse/reader/bookmarks/{work_id}/` manage private library bookmarks.
- `GET /api/v1/nexverse/reader/offers/?workId={work_id}` returns active server-managed chapter prices.
- `POST|GET /api/v1/nexverse/reader/purchases/` creates idempotent purchase intents and lists the current account's purchase history. The client supplies a chapter ID and idempotency key only; price and currency are snapshotted from the server.
- `GET /api/v1/nexverse/reader/entitlements/` lists active paid access rights for the current account.

A purchase intent starts as `pending` and does not grant access. `confirm_verified_purchase` is an internal service contract; only a future trusted payment adapter may call it after validating provider webhook authenticity and transaction details. No public payment-settlement endpoint or gateway integration is enabled.

## Creator earnings ledger

- `GET /api/v1/nexverse/creator/earnings/` returns the authenticated creator's own purchase-attribution ledger.
- Verified paid purchases create a credit entry; refunds append a reversal entry instead of rewriting the original credit.
- The ledger currently reports gross sales attribution before platform fees, tax, withholding, payout reserves or other commercial policy. It is not a withdrawable balance and does not trigger payouts.
- Payment provider verification, creator revenue-share policy, tax treatment, payout onboarding and actual transfers require separate implementation and operational approval.


## Creator chapter pricing

- `GET /api/v1/nexverse/creator/works/{work_id}/chapters/{chapter_id}/price/` reads the authenticated author's price configuration.
- `PUT` on the same endpoint sets or updates `amountMinor` and a three-letter currency code. The server validates the amount and ownership; client-supplied prices are never used to create a reader purchase.
- `DELETE` deactivates the current price so it no longer appears in public offers. Existing purchase records retain their amount and currency snapshots.
- Free-preview chapters cannot be priced. A creator cannot inspect or modify another author's chapter price.
- The current price model is a single active configuration per chapter. Full price-version history and creator revenue-share policy remain separate follow-up work.


---

# Nexverse Engineering Progress Report

**Last audited:** 28 November 2026  
**Repository:** `zaynhmi47-hash/nexora-lab-studio`  
**Branch:** `main`  
**Latest inspected Nexverse commit:** `ddc9fb7a2863888ec356812e7c73f300b121d471`

> Progress percentages are engineering estimates against the full Nexverse product scope, not commit counts. Code/documentation presence alone does not establish production readiness.

## Overall status

**Estimated product implementation: 34%**

| Workstream | Estimated completion | Audit status |
|---|---:|---|
| Backend domain, catalog and reader APIs | 60% | Core API surfaces present; runtime verification required |
| Backend creator, upload and moderation | 48% | Draft workflow, upload pipeline, import and review APIs present; production gaps remain |
| Backend monetization and creator earnings | 35% | Offers, purchase intents, entitlements and gross attribution ledger exist; settlement/payouts absent |
| Mobile reader and discovery UI | 45% | Home, Discover, Library, Profile, work detail and reader documented as API-connected |
| Mobile creator and publisher UI | 40% | Creator/Publisher Studio, upload/review and chapter editing flows documented |
| Firebase and platform integration | 30% | Auth/Storage adapters and configuration path documented; live deployment unverified |
| Quality, security and release readiness | 15% | Focused tests exist in source; full test/typecheck/CI/security/device validation unconfirmed |

The product scope includes books, PDFs, articles, video, music, creator/publisher operations, rights management, subscriptions, advertising, analytics and international-scale delivery. Several domains are not yet implemented; the overall estimate is therefore conservative.

## Completed or present in the repository

### Backend
- Nexverse API routes are mounted under `/api/v1/nexverse/`.
- Public catalog supports search and filters; work detail exposes chapter metadata.
- Reader delivery distinguishes free previews from paid chapters and checks access server-side.
- Creator profile/work/chapter APIs include ownership-scoped editing and submission.
- Moderation queue, work review and approve/reject decisions use role checks and audit history.
- Firebase identity authentication protects creator/moderator APIs and resolves the shared Nexora identity.
- Upload sessions validate ownership, MIME/extension, size and expiry; completion checks uploaded object metadata.
- Asset processing validates file signatures and bounded file structures, extracts basic metadata and reports retryable failures.
- EPUB/TXT manuscript extraction proposes chapter sections; creator confirmation imports draft chapters transactionally and prevents duplicate imports.
- Chapter ordering validates the complete unique chapter list and uses a database transaction with row locks.
- Reader progress, bookmarks, offers, purchase intents, entitlements, creator earnings attribution and chapter price configuration have API surfaces.

### Frontend
- Expo Router mobile app exists at `apps/nexverse/mobile`.
- Home, Discover, Library, Profile, work detail and reader surfaces are documented.
- Firebase Auth bridge uses the default Firebase app when available, AsyncStorage persistence and fresh ID tokens for protected API requests.
- Publisher Studio has sign-in for pre-provisioned moderator accounts; it does not provide public moderator registration.
- Creator upload center and manuscript review/import flows are documented.
- Creator Chapter Studio supports draft chapter editing, local preview and explicit save through the owner-scoped API.
- Mobile API clients for chapter editing and ordering have been added.

## Remaining work

### P0 — verify and stabilize current implementation
- Run the complete Nexverse Django test suite and migrations in the actual Codespace.
- Run mobile TypeScript typecheck, Expo dependency diagnostics and Android launch/build.
- Verify API/mobile contract parity, error states, pagination, empty states and session expiry.
- Verify Firebase Auth and Storage against the intended project, storage rules and deployment configuration.
- Add or confirm CI jobs for backend tests, mobile typecheck and workspace boundary checks.
- Perform security review of upload paths, private object access, moderator roles, paid chapter delivery and identity mapping.

### P1 — complete the core publishing lifecycle
- Finish upload retry/resume UX, progress, cancellation and failure recovery.
- Add asynchronous processing workers; current processing is synchronous and creator-triggered.
- Add PDF text extraction/OCR with resource limits and safe parsing.
- Add malware scanning and secure private preview/delivery; structural validation is not antivirus.
- Implement revision/version history, autosave and conflict handling for creator editing.
- Complete publication scheduling, correction, archive and takedown workflows.
- Add cover/asset management and rights/licensing metadata with auditable ownership claims.

### P1 — monetization completion
- Integrate a trusted payment provider and verified, idempotent webhooks.
- Implement purchase settlement; purchase intent alone must never grant paid access.
- Define refunds, entitlement expiry/revocation and subscription lifecycle.
- Define creator revenue share, platform fees, taxes, payout onboarding and payout reconciliation.
- Integrate financial audit/reporting through Nexora Finance rather than duplicating accounting.

### P2 — broaden the media product
- Video/audio upload, transcoding, streaming/playback and delivery controls.
- Follow/following, creator channels, notifications and audience engagement.
- Search ranking, recommendations, reading/watch/listening history and analytics.
- Advertising, premium plans and subscription entitlements.
- Rights reporting, copyright complaints, moderation escalation and transparency tools.
- Accessibility, localization, offline/download policy and responsive web experience.

## Parallel delivery model

Backend and mobile work must advance in the same milestone. Each feature defines its API contract, backend behavior/tests and frontend screen/client/state/error handling together. Mock/contract fixtures are temporary integration support only; failed API requests must not silently fall back to sample data.

| Parallel lane | Next deliverables |
|---|---|
| Backend | Run tests/migrations; close upload/publication gaps; worker-based processing; payment webhook contract |
| Frontend | Validate Expo/typecheck; finish upload progress/retry and chapter workflow states; connect purchase/entitlement UI |
| Integration | Contract tests, Firebase environment verification, creator-to-reader end-to-end scenario |
| Quality | CI, security checks, Android device testing and release checklist |

## Verification record

- Repository files and recent commits were inspected on `main`.
- Source includes focused API tests for public catalog/reader access and upload-session/asset-processing cases.
- Tests being present in the repository is **not** proof that they pass.
- No live command execution, complete backend test run, Expo typecheck, Android build, Firebase deployment or end-to-end test was performed during this audit. These results remain **unverified**, not passed.
- Configuration instructions identify Firebase project `nexora-73cfa`; actual credentials, bucket, rules and deployed state were not verified.

## Progress update rule

Update this report in the same milestone whenever backend or frontend work is merged into `main`. Record commit, changed capability, test command and actual result, remaining blockers, and revised percentage. Do not increase the percentage solely because documentation or scaffolding was added.


---

# Engineering Update — Upload processing concurrency

**Date:** 28 November 2026  
**Branch:** `main`

### Backend
- Replaced the read-then-save processing transition with a conditional database update.
- Only `uploaded` and retryable `failed` sessions can be atomically claimed.
- A competing or stale request receives HTTP 409 with `ASSET_PROCESSING_CONFLICT`.
- Added a focused API regression test asserting that an already-processing session is not processed again.

### Frontend
- When Firebase transfer fails after the backend has created an upload session, Upload Center now refreshes the asset library.
- This exposes the server-side session state instead of leaving the UI unaware of a partially completed attempt.

### Verification
- Source-level changes committed; automated Django tests, mobile typecheck and Android build have **not** been executed in the Codespace during this turn.
- The new regression test covers the already-processing state. A database-backed concurrency stress test remains outstanding.

### Progress
- Overall product estimate remains **34%** pending executable test results.
- Backend creator/upload/moderation workstream: estimate remains **48%** until test execution and broader upload lifecycle validation.
- Mobile creator/publisher workstream: estimate remains **40%** until typecheck and device validation.


## Engineering Update — Upload cancellation lifecycle

**Date:** 28 November 2026  
**Branch:** `main`

### Backend
- Added authenticated `POST /api/v1/nexverse/creator/uploads/{session_id}/cancel/`.
- The endpoint is owner/work scoped and atomically transitions only `created` sessions to `expired`; it is idempotent for an already expired session and rejects uploaded/processing/ready assets.
- No storage object deletion is attempted in this request path. Orphan-object cleanup requires a separate retention worker and is not claimed as implemented.

### Mobile
- Upload Center exposes a cancel action while Firebase resumable upload is active.
- Cancelling stops the Firebase upload task, then closes the backend session and refreshes the asset library.
- Existing progress display and completion flow remain in place.

### Verification
- GitHub source files were re-fetched after writes and the new endpoint, route, service call and UI callback were confirmed present.
- Django tests, mobile TypeScript typecheck, Expo diagnostics and Android build were **not executed** in this environment. Runtime correctness remains unverified.
- A transfer cancelled after an object has already completed but before completion API acknowledgement may race with the backend; the server deliberately refuses to cancel non-created sessions rather than silently changing a verified asset.

### Progress
- Overall estimate remains **34%**. No percentage increase is recorded until the backend and mobile checks run in the repository environment.
