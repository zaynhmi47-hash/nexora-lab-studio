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
