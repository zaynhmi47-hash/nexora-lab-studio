# Health domain (Django)

This is the backend domain boundary for Nexora Health. The Identity & Consent stage introduces persistence for profile ownership and explicit delegated access.

## Implemented domain primitives

- `HealthProfile`: health-data boundary linked to the canonical `identity.NexoraUser`; a Nexora account is not itself a health profile.
- `HealthProfileMember`: explicit profile-level delegation with role, scopes, expiry and revocation.
- `HealthConsent`: purpose-specific, versioned consent with grant/revocation/expiry state.
- `can_access_profile(...)`: fail-closed profile authorization. Delegated access requires both a valid membership and matching active consent. A family relationship or membership by itself is insufficient.

## Security invariants

- Profile owner is the only actor granted implicit owner access.
- Inactive identities and archived/deleted profiles are denied.
- Delegated grants are scoped, revocable and time-bounded.
- Consent must match the profile owner, grantee, purpose, scope and active time window.
- Do not expose endpoints or use these models for clinical records until access auditing is integrated.
- Consent and membership writes must be performed through an authorized application service; direct client CRUD is prohibited.
- Health data must not be used for AI training by default.

## Deliberate limitations before API exposure

The current stage does not yet implement an API, grant/revoke application service, immutable access-audit event pipeline, medical-record storage, attachments, or retention/export workflows. These are required before production exposure. Do not interpret the presence of the schema as production readiness.

## Next backend stages

1. Add grant/revoke application services with transaction boundaries and immutable audit events.
2. Add API serializers/views that derive actor identity from authentication and scope every query to an authorized profile.
3. Add medical records only after private attachment storage, audit, retention and export contracts are ready.
4. Preserve provenance, units, measurement time, received time and validation state for future measurements.
