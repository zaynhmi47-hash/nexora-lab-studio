# Nexora Health

**Product status:** Officially approved in the Nexora ecosystem.  
**Implementation status:** Backend foundation and Health Identity & Consent services implemented; API and clinical records are not yet exposed.

Nexora Health is the integrated personal and family health platform within Nexora. It brings health profiles, medical records, vital monitoring, medication support, fitness, nutrition, connected devices and carefully bounded AI assistance into one parent application.

## Product principles
- One parent application with domain modules, not a collection of disconnected health apps.
- Reuse Nexora Core identity and shared infrastructure; keep health-domain ownership in the Health domain.
- Treat health data as sensitive personal data with explicit consent, least-privilege access, object-level authorization and auditability.
- Separate user-entered observations, consumer-device readings and clinician/laboratory records.
- AI supports understanding and preparation; it does not diagnose or replace healthcare professionals.
- Health data is not made available for AI training by default.

## Planned modules
| Module | Scope |
|---|---|
| Health Profiles | Personal health profile and reported conditions |
| Consent & Access | Purpose-bound consent and delegated profile access |
| Medical Records | Encounters, documents and laboratory results |
| Vital Monitoring | Measurements, history, provenance and quality flags |
| Medication | Medication lists, schedules and adherence logs |
| Fitness & Activity | Activity history and fitness goals |
| Nutrition & Sleep | Food, hydration and sleep records |
| Family Health | Explicitly delegated family access |
| Devices & IoT | Device registry and validated measurement ingestion |
| AI Health | Consent-aware, safety-bounded assistant |
| Analytics & Alerts | Trends, reminders and carefully scoped alerts |
| Healthcare Network | Provider-facing integrations when approved |

## Implemented backend foundation
- Django domain registration at `services/nexora-api/apps/health`.
- `HealthProfile`, `HealthProfileMember` and `HealthConsent` persistence.
- Fail-closed profile access check with active membership and matching consent requirements.
- Transactional `grant_profile_access` and `revoke_profile_access` application services.
- Append-only `HealthAccessAuditEvent` for delegation grants and revocations.
- Automated tests for ownership isolation, consent, expiry, grant/revoke authorization and audit immutability.
- CI migration, lint and test commands now include the Health domain.

## Not yet production-ready
No public API or clinical-record storage is included yet. Read-access audit, DRF endpoints, object-scoped querysets, private attachment storage, retention/export, operational monitoring and full privacy review remain prerequisites.

## Repository layout
- `AGENT.md`: product ownership, security and implementation rules.
- `mobile/`: planned Expo Router client workspace.
- `web/`: planned web client workspace.
- Backend domain: `services/nexora-api/apps/health/`.

## Next milestones
1. Complete CI and review grant/revoke + audit implementation.
2. Build Health Profile API with authentication-derived actor and object-level authorization.
3. Add request-level audit for sensitive reads and profile/consent changes.
4. Add medical records with private attachments and retention/export contracts.
5. Add vital measurement capture with provenance, units, measurement time and validation state.
6. Build mobile workflows and real API integration.
7. Add medication, lifestyle, device ingestion and AI Health under explicit safety controls.
