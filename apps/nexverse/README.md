# Nexverse

Nexverse is the public-facing reading and entertainment product in the Nexora ecosystem.

## Current implementation

The first mobile foundation is in `mobile/` using Expo Router and React Native:

- Home discovery surface with featured story
- Genre and text search
- Story detail and chapter preview
- Reading experience with adjustable typography
- Personal library and profile shells
- Local fixture catalog clearly marked as demo content

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter nexverse-mobile start
```

Type-check:

```bash
pnpm --filter nexverse-mobile typecheck
```

## Important boundaries

- Catalog fixtures are demonstration data, not production content.
- Authentication, saved library, reading progress, publishing workflows, rights, paid access and creator royalties are not yet connected.
- All paid-content entitlement checks must be server-side.
- Nexverse domain APIs belong in `services/nexora-api/apps/nexverse/` and are mounted under `/api/v1/nexverse/`.
- The Django API includes public catalog search/filtering, work details, chapter metadata and free-preview chapter content.
- Creator endpoints support author onboarding, draft works and chapters, ownership-scoped editing and submission for review.
- Moderation endpoints provide a protected queue, full manuscript review, approve/reject decisions and review history.
- Only works with both a published publication status and an approved review status appear in the public catalog or chapter delivery APIs.
- Paid chapter bodies are deliberately withheld with `ENTITLEMENT_REQUIRED` until the server-side entitlement service is connected.
- Reuse Nexora Core identity, files, notifications and generic payment primitives.

## Moderation API

- `GET /api/v1/nexverse/moderation/queue/`
- `GET /api/v1/nexverse/moderation/works/{work_id}/` (includes manuscript chapter bodies and review history)
- `POST /api/v1/nexverse/moderation/works/{work_id}/decision/` with `{"decision":"approve","note":"..."}` or `{"decision":"reject","note":"..." }`

Moderation access is not self-service. An operations administrator must provision a `NexverseModerator` record for an existing Nexora identity. Roles are `reviewer` (reject/review), `publisher` (approve and publish), and `admin` (both). Example provisioning from Django shell:

```python
from apps.identity.models import NexoraUser
from apps.nexverse.models import NexverseModerator

user = NexoraUser.objects.get(email="moderator@example.com")
NexverseModerator.objects.update_or_create(
    user=user,
    defaults={"role": NexverseModerator.Role.ADMIN, "is_active": True},
)
```

Approvals publish the work and its chapters atomically and create an audit event. Rejections require a note and keep the work unpublished. The mobile client still uses demo fixtures; API integration and a dedicated publisher dashboard UI remain separate implementation work.
