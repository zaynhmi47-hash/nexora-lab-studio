# Nexverse

Nexverse is the reading, publishing and entertainment product in the Nexora ecosystem. The product is one modular application: reading and discovery first, followed by creator publishing, publisher operations, monetization and broader media formats.

## Mobile app

The Expo Router application is in `mobile/`.

```bash
pnpm install
pnpm --filter nexverse-mobile start
pnpm --filter nexverse-mobile typecheck
```

Current mobile surfaces include Home, Discover, Library, Profile, story detail, reader and the internal Publisher Studio. Some public-reader surfaces still use local fixtures; Publisher Studio queue and review actions use the protected API.

## Backend boundaries

- Nexverse domain APIs live in `services/nexora-api/apps/nexverse/` and are mounted under `/api/v1/nexverse/`.
- Identity is anchored to the shared Nexora Core `NexoraUser`; Nexverse does not create a second account system.
- Creator endpoints provide author onboarding, draft works and chapters, ownership-scoped editing and submission for review.
- Moderation endpoints provide a protected queue, manuscript review, approve/reject decisions and an audit history.
- Only works with both published publication status and approved review status appear in public catalog and chapter delivery APIs.
- Paid chapter bodies remain withheld with `ENTITLEMENT_REQUIRED` until server-side entitlement checks are connected. Never implement paid-content authorization only in the mobile client.
- Reuse Nexora Core identity, files, notifications and generic payment primitives.

## Publisher Studio API

- `GET /api/v1/nexverse/moderation/queue/`
- `GET /api/v1/nexverse/moderation/works/{work_id}/`
- `POST /api/v1/nexverse/moderation/works/{work_id}/decision/` with `{"decision":"approve","note":"..."}` or `{"decision":"reject","note":"..."}`

The backend verifies Firebase ID tokens through `FirebaseIdentityAuthentication` and enforces the active Nexverse moderator role on every request. Roles are provisioned operationally for existing Nexora identities: `reviewer` can reject, `publisher` can approve/publish, and `admin` can do both. Decisions are persisted with a review audit event. The mobile client does not grant moderator permissions.

## Firebase Auth bridge

The mobile app registers `getNexoraCoreAccessToken` as the moderation API token provider during root-layout startup. It uses the Firebase JS SDK with React Native AsyncStorage persistence and calls `currentUser.getIdToken()` on demand; ID tokens are not copied into app storage or hardcoded.

Configure the variables in `mobile/.env.example`: `EXPO_PUBLIC_NEXORA_API_URL` (API origin without `/api/v1`) and the `EXPO_PUBLIC_FIREBASE_*` client configuration for the same Nexora identity project used by Nexora Core.

The bridge deliberately does not create a second Nexora identity or a standalone login flow. It exposes the Firebase session available to this app. The Nexverse mobile sign-in/onboarding UI and reusable cross-app Nexora Core auth package are still separate work; until an authenticated Firebase user is present, Publisher Studio displays an authentication state. The server remains authoritative for identity mapping and moderator permissions.

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
