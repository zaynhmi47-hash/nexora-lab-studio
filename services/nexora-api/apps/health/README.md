# Health domain (Django)

This is the backend domain boundary for Nexora Health. The current implementation includes profile ownership, explicit delegation, versioned consent, append-only access-change auditing and authenticated profile APIs.

## Implemented domain primitives

- `HealthProfile`: health-data boundary linked to the canonical `identity.NexoraUser`.
- `HealthProfileMember`: explicit profile-level delegation with role, registered scopes, expiry and revocation.
- `HealthConsent`: purpose-specific, versioned consent with grant/revocation/expiry state.
- `HealthAccessAuditEvent`: append-only events for grants, revocations and sensitive profile reads, with actor, subject, grantee, policy version, scopes and correlation ID.
- `can_access_profile(...)`: fail-closed authorization. Delegated access requires active membership and matching active consent.
- `grant_profile_access(...)` / `revoke_profile_access(...)`: transactional services. Only the owner can grant; owner or grantee can revoke. Regrant supersedes earlier active consent.
- Profile API at `/api/v1/health/profiles/`: create/list profiles, read a profile, grant access and revoke access.

## API contract

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health/profiles/` | List profiles accessible to the authenticated identity |
| POST | `/api/v1/health/profiles/` | Create a profile owned by the authenticated identity |
| GET | `/api/v1/health/profiles/{profile_id}/` | Read one authorized profile |
| POST | `/api/v1/health/profiles/{profile_id}/access-grants/` | Owner grants explicit scoped access |
| DELETE | `/api/v1/health/profiles/{profile_id}/access-grants/` | Owner or grantee revokes access |

The API derives the actor from Firebase-backed Nexora authentication. It does not accept an actor/owner ID from the client. Private or inaccessible profile IDs return 404 to reduce resource enumeration. Every profile list/detail read is audited. Delegated scopes are allowlisted; arbitrary scope strings are rejected.

## Security invariants

- Profile owner is the only actor granted implicit owner access.
- Inactive identities and archived/deleted profiles are denied.
- Delegated grants are scoped, revocable and time-bounded.
- Consent must match the profile owner, grantee, purpose, scope and active time window.
- Family relationship or membership alone is insufficient.
- Consent and membership writes go through application services; direct client CRUD is prohibited.
- Audit events reject instance updates/deletes and queryset update/delete operations at the application layer. Production still requires restricted database roles and tamper-evident external retention.
- Health data is not used for AI training by default.

## Deliberate limitations before clinical data

No medical records, attachments, measurements, medication data or clinical API are included yet. The audit pipeline currently covers profile reads and access delegation changes; each future sensitive resource read/write must add equivalent audit coverage. Before production launch, complete consent UX/legal review, private attachment storage, retention/export/deletion, monitoring, rate limits and threat modeling.

## Next backend stages

1. Harden profile API validation, pagination, rate limits and operational audit monitoring.
2. Add medical-record domain models and access-scoped APIs with read/write audit.
3. Add private document storage, malware scanning, signed download flow and retention/export controls.
4. Add vital measurements with provenance, units, measurement time, received time and validation state.
