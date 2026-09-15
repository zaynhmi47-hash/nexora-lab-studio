# Nexora Finance Web — Phase B Legacy Decoupling

## Goal

Move the migrated web frontend away from the previous Trustora/Laravel runtime contract without weakening the Nexora Core tenant/security architecture.

## Completed in this phase

- Removed Trustora domains and legacy checkout endpoints from `next.config.js` security/image configuration.
- Replaced the old environment template with Nexora Core + Firebase public configuration only.
- Replaced the Laravel Sanctum CSRF bootstrap with an explicit no-op migration boundary. Nexora Finance will use bearer-token authentication against Nexora Core instead of Laravel session cookies.
- Kept the existing UI tree intact so the migration remains incremental rather than rewriting the frontend.

## Intentionally deferred

The existing web frontend still contains a compatibility layer around the previous authentication/API implementation. It must not be extended with new Finance features.

The next phase will replace that compatibility layer with:

1. Firebase Web Auth client initialization.
2. Firebase ID-token acquisition and refresh.
3. Nexora Core API client with `Authorization: Bearer <token>`.
4. Server-verified Nexora UUID identity.
5. Server-verified active organization/membership context.
6. Tenant-scoped Finance API paths.
7. RBAC/permission checks backed by Nexora Core.
8. Removal of NextAuth, Laravel session helpers, Sanctum retry logic, and provider-specific realtime/payment dependencies once their consumers have been migrated.

## Security rule

Client-provided organization IDs are never an authorization boundary. The web client may select an organization, but Nexora Core must verify the authenticated principal's membership and permissions before returning or mutating tenant-owned Finance data.

## Validation status

This phase was modified through the GitHub branch `feat/nexora-finance-web-migration`. Runtime install/build validation has not been claimed here; it must be performed in the Codespace/CI environment after the dependency graph and authentication migration are complete.
