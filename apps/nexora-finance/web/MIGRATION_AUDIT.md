# Nexora Finance Web Migration Audit

## Migration source

The previous frontend under `apps/nexora-office/web` has been moved to:

`apps/nexora-finance/web`

The migration preserves the existing UI, components, tests, assets, internationalization files, and frontend capabilities as a starting point. The old Office web tree is removed on this migration branch so Finance becomes the owner of the migrated web client.

## Audit result

### Reusable and valuable

- Next.js application structure and routing foundation
- responsive UI components and Radix/MUI component set
- forms and validation patterns
- dashboard and analytics presentation patterns
- charts and Three.js capability
- internationalization foundation
- notification/activity UI patterns
- audit-log presentation components
- existing frontend tests
- security-header baseline in Next.js configuration

### Must be refactored before production use as Nexora Finance

1. **Legacy identity/authentication**
   - Current code still contains NextAuth/Laravel-oriented integration.
   - Target is Firebase Auth on the client plus Nexora Core token verification.
   - Nexora UUID remains the internal identity anchor.

2. **Legacy backend coupling**
   - Existing server helpers and API routes contain Laravel/Sanctum assumptions.
   - Finance must call Nexora Core through a provider-neutral API client and organization-scoped endpoints.
   - Do not reintroduce direct Django imports into the frontend.

3. **Legacy Trustora branding/domain data**
   - The migrated source contains Trustora-specific routes, translation keys, assets, and configuration.
   - These must be removed or replaced with Nexora Finance equivalents before release.

4. **Legacy payments/integrations**
   - Existing Stripe/PayPal/Rapyd and other integration code must not be treated as Finance payment architecture.
   - Payment state must be owned and verified by Nexora Core and provider adapters.
   - QRIS premium activation must be server-verified; never unlock premium from a client callback alone.

5. **Dependency graph**
   - The migrated frontend has a large dependency surface and should be reduced after functional parity is established.
   - Dependency upgrades must be validated independently; do not hand-edit the root lockfile.

6. **Mobile/web convergence**
   - `mobile/` remains the Expo application.
   - `web/` is the Next.js web client.
   - Shared domain contracts should move to `packages/` where they are genuinely reusable, rather than sharing UI implementation between unrelated runtimes.

## Target Finance web architecture

```text
apps/nexora-finance/
├── mobile/                 # Expo / React Native / Web-compatible mobile client
└── web/                    # Next.js desktop/web client
    ├── app/                # Finance web routes
    ├── components/        # UI and Finance web components
    ├── features/          # Finance feature modules
    ├── hooks/
    ├── lib/
    │   ├── api/            # Nexora Core HTTP client
    │   ├── auth/           # Firebase Auth integration
    │   └── tenant/         # server-verified organization context
    └── services/            # frontend orchestration only
```

## Migration rule

Do not copy the old Office backend/authentication architecture into Finance. Reuse presentation and interaction code where useful, but migrate domain and security boundaries to Nexora Core.

## Next implementation sequence

1. Validate the migrated Next.js dependency graph.
2. Replace authentication with Firebase Auth + Nexora Core verification.
3. Replace Laravel/Sanctum API paths with Nexora Core API contracts.
4. Create Finance web shell/navigation.
5. Keep only Finance-relevant routes and reusable UI primitives.
6. Introduce organization/tenant context using server-verified membership.
7. Implement dashboard, transactions, budgeting, business, cashier, QRIS and premium features against Core contracts.
8. Remove legacy Trustora assets, translations and routes.
9. Add cross-tenant negative tests and authorization tests.
10. Generate and commit the validated `pnpm-lock.yaml` only after dependency installation succeeds.
