# Nexora Health — Product Agent Contract

## Mission
Nexora Health is the Nexora parent application for personal and family health management, health information, medical records, vital measurements, medication support, fitness, nutrition, connected devices and carefully bounded AI assistance.

## Product boundaries
- Nexora Health owns health-domain workflows and health records.
- Nexora Core remains the authority for Nexora identity, organizations, shared authorization primitives, audit infrastructure and provider integrations.
- A Nexora account is not itself a health profile. Health profiles and their access grants are health-domain concepts linked to the canonical Nexora user UUID.
- Do not duplicate login, identity-provider linking, generic files, notifications, payment infrastructure or AI provider gateways.
- Do not let other product domains read health records by default.

## Architecture
- Target: Modular Monolith → Service-Ready.
- Backend: existing `services/nexora-api` Django/DRF service; add a product-owned `apps.health` domain.
- Database: PostgreSQL in deployed environments; preserve the repository's configured database abstraction for local/testing.
- Clients: Expo Router mobile and web client workspaces under this product directory, added in their own implementation stages.
- External providers and devices must be accessed through explicit adapters/contracts, not imported into domain models.

## Initial implementation scope
The foundation stage registers the Django app. The Identity & Consent stage adds only the health-profile ownership, explicit membership, purpose-specific consent schema and a fail-closed profile-access service. It does not expose API endpoints or store clinical records. Do not add clinical models or public APIs until grant/revoke application services, immutable access auditing, object-level authorization tests, attachment privacy and retention/export contracts are complete.

Planned domains, introduced incrementally:
1. Health profiles and access grants.
2. Consent and data-access history.
3. Medical records and attachments.
4. Vital measurements and measurement provenance.
5. Medication schedules and adherence logs.
6. Fitness, nutrition and sleep records.
7. Family health delegation.
8. Device registry and validated ingestion.
9. AI health orchestration and safety controls.
10. Provider integrations, analytics and alerts.

## Sensitive-data requirements
- Health information is sensitive personal data. Apply least privilege and deny-by-default access.
- Every read/write of sensitive records must be scoped to an authorized health profile and audited.
- Family membership never implies automatic medical-record access.
- Consent must be specific, revocable where legally/technically applicable, versioned and auditable.
- Never use health data for model training by default. Any secondary use requires a separate lawful basis, transparent purpose and explicit controls.
- Do not put medical details, tokens or secrets in logs, analytics events, crash reports or URLs.
- Encrypt transport and storage using deployment-approved controls; use private object storage for medical attachments.
- Establish retention, export, correction and deletion workflows consistent with applicable Indonesian and international law before production.
- AI is informational support, not a diagnostic authority. Escalate emergency symptoms to local emergency services/professionals and do not delay urgent care.

## Device and clinical-data integrity
- Preserve source, device identity, measured time, received time, unit, calibration/validation status and quality flags.
- Distinguish user-entered, consumer wearable, custom IoT and clinician/laboratory supplied data.
- Do not represent unvalidated consumer or DIY sensors as clinically accurate medical devices.
- Never infer diagnosis from a single measurement or present generic thresholds as individualized medical advice.

## API rules
- Use versioned contracts under `/api/v1/health/`.
- Every endpoint must define authentication, profile-level authorization, consent requirements, audit behavior, validation and error semantics.
- Never trust profile IDs, family relationships, roles or ownership claims supplied by the client without server-side verification.
- Use idempotency for ingestion and externally retried operations where duplicates would be harmful.

## Agent workflow
Before implementation, read root `AGENTS.md`, backend `services/nexora-api/AGENT.md`, and this file. Inspect existing Core patterns before introducing abstractions. Search for reusable identity, permission, audit and file capabilities.

After implementation, run targeted pytest, Django checks, migration checks and Ruff for changed paths. Include negative tests for cross-profile access and consent revocation. Do not claim production readiness without security, privacy, clinical-safety and operational review.

## Definition of done
A feature is complete only when ownership and lifecycle are explicit, authorization is server-enforced, sensitive actions are audited, migrations are safe, API contracts are documented, failure behavior is defined, and relevant tests pass.
