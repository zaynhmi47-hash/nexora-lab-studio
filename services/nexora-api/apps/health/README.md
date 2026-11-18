# Health domain (Django)

This is the backend domain boundary for Nexora Health.

The foundation stage registers the app but intentionally contains no clinical models or API routes. Before adding persistence, define and test:
- canonical Nexora user UUID relationship;
- health-profile ownership and delegated access;
- consent purpose, scope, revocation and history;
- object-level authorization and deny-by-default behavior;
- audit events for sensitive reads and writes;
- attachment privacy, retention, export and deletion rules;
- data provenance, units, timestamps and validation.

Do not add a second user model, authentication backend, generic file service, notification system or AI provider integration here. Reuse approved Nexora Core contracts.
