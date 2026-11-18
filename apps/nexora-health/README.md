# Nexora Health

**Product status:** Officially approved in the Nexora ecosystem.  
**Implementation status:** Foundation scaffold in progress; not production-ready.

Nexora Health is the integrated personal and family health platform within Nexora. It brings health profiles, medical records, vital monitoring, medication support, fitness, nutrition, connected devices and carefully bounded AI assistance into one parent application.

## Product principles
- One parent application with domain modules, not a collection of disconnected health apps.
- Reuse Nexora Core identity and shared infrastructure; keep health-domain ownership in the Health domain.
- Treat health data as sensitive personal data with explicit consent, least-privilege access, object-level authorization and auditability.
- Separate user-entered observations, consumer-device readings and clinician/laboratory records.
- AI supports understanding and preparation; it does not diagnose or replace healthcare professionals.

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

## Current foundation scope
This stage registers the Django domain `apps.health` in the existing Nexora API and establishes this product contract. It intentionally does not create clinical data models or public endpoints yet. Those require a reviewed ownership, consent, authorization, audit and retention design.

## Repository layout
- `AGENT.md`: product ownership, security and implementation rules.
- `mobile/`: planned Expo Router client workspace.
- `web/`: planned web client workspace.
- Backend domain: `services/nexora-api/apps/health/`.

## Next milestones
1. Health foundation and domain registration.
2. Health profile, consent and profile-level access controls.
3. Medical records and attachment access.
4. Vital measurement capture and history.
5. Medication and lifestyle modules.
6. Mobile/web workflows and real API integration.
7. Device ingestion and AI Health with explicit safety controls.
8. Security, privacy, reliability and production-readiness review.
