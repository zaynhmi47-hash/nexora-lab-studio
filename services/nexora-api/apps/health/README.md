# Health domain (Django)

This is the backend domain boundary for Nexora Health. The Identity & Consent stage persists profile ownership, explicit delegation, purpose-specific consent and append-only access-change audit events.

## Implemented domain primitives

- `HealthProfile`: health-data boundary linked to the canonical `identity.NexoraUser`; a Nexora account is not itself a health profile.
- `HealthProfileMember`: explicit profile-level delegation with role, scopes, expiry and revocation.
- `HealthConsent`: purpose-specific, versioned consent with grant/revocation/expiry state.
- `HealthAccessAuditEvent`: append-only event record for access grants and revocations, including actor, subject, grantee, policy version, scopes and request correlation ID.
- `can_access_profile(...)`: fail-closed authorization. Delegated access requires both a valid membership and matching active consent.
- `grant_profile_access(...)`: transactional owner-authorized grant service. It validates active identities, scope shape, role, policy version and expiry, then writes membership, consent and audit event together.
- `revoke_profile_access(...)`: transactional revocation service. The owner or grantee may revoke; membership and all active consent rows for that delegation are revoked together and audited.

## Security invariants

- Profile owner is the only actor granted implicit owner access.
- Inactive identities and archived/deleted profiles are denied.
- Delegated grants are scoped, revocable and time-bounded.
- Consent must match the profile owner, grantee, purpose, scope and active time window.
- A family relationship or membership by itself is insufficient.
- Consent and membership writes must go through the application services; direct client CRUD is prohibited.
- Audit events reject instance updates/deletes and queryset update/delete operations at the application layer. Database administrators can still alter database contents; production requires restricted DB roles, backups and tamper-evident external retention.
- Health data must not be used for AI training by default.

## Deliberate limitations before API exposure

No public API or clinical-record storage is included yet. The audit event pipeline currently records access delegation changes; it does not yet record every read of a health resource. Before API exposure, add request-level access audit events for sensitive reads, an API permission layer and object-scoped querysets. Also complete retention/export workflows, private attachment storage and operational monitoring.

## Next backend stages

1. Add DRF profile endpoints that derive the actor from authentication and enforce profile-level authorization.
2. Add request-level audit for sensitive reads and profile/consent changes.
3. Add medical records only after private attachment storage, retention, export and deletion contracts are ready.
4. Preserve provenance, units, measurement time, received time and validation state for future measurements.
