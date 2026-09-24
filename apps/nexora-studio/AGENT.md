# Nexora Studio — AGENT.md

## 1. Mission
Nexora Studio is Nexora's technology and creative services workspace for development, websites, apps, marketing, data science, advertising, design, AI, clients, projects, and agency operations.

## 2. Business model
Support solo freelancer, small studio, and agency modes. Core entities include clients, organizations, projects, contracts/engagements, deliverables, tasks, assets, time/work logs, invoices, payments, communications, and reports.

## 3. Architecture
Tenant/client isolation is mandatory. Reuse Core identity, CRM, finance, files, notifications, workflow, and audit capabilities. Avoid creating Studio-specific copies of shared domains.

## 4. AI-agent instructions
Inspect existing project and client abstractions before coding. Every client-facing action must use the correct workspace context. Sensitive files require permission checks. Automations must be observable and reversible where possible. External service integrations must be adapters.

## 5. UX
Provide dashboards for work status, deadlines, deliverables, finances, and communication. Keep project details easy to navigate. Support mobile review/approval while full production workflows can be optimized for web.

## 6. Quality
Test tenant isolation, permissions, invoice/project relationships, file access, task state transitions, and notification delivery.

# Detailed Product Concept — Nexora Studio

## 1. Product Positioning

Nexora Studio is Nexora's technology and creative services workspace for operating client work across software development, websites, applications, digital marketing, data science, advertising, design, and AI services.

It is an agency/service-operation product rather than a generic social profile or accounting application.

## 2. Service Domains

Initial service categories:
- Website development.
- Mobile/web application development.
- Software engineering.
- Digital marketing.
- Data science and analytics.
- Advertising operations.
- Graphic/UI/UX design.
- AI implementation and automation.

The architecture must allow additional service types without redesigning the project core.

## 3. Core Operational Model

Primary entities:
- Client organization.
- Client contact/reference.
- Project.
- Engagement.
- Contract/SOW reference.
- Milestone.
- Task.
- Deliverable.
- Asset.
- Approval.
- Work log.
- Communication record.
- Report.
- Billing reference.

CRM remains the canonical source for broader customer relationship semantics, while Studio owns delivery/project operations. Finance remains authoritative for financial transactions, invoices, payments, and ledger records.

## 4. Project Lifecycle

A configurable project flow may follow:

Intake → Proposal → Approved → Active → Internal Review → Client Review → Delivered → Closed

The system must distinguish operational status from legal/contract status and financial status. A project cannot be marked complete merely because a payment exists, and a payment cannot be considered settled merely because a project reaches Delivered.

## 5. Roles

Potential roles:
- Owner.
- Studio administrator.
- Project manager.
- Developer.
- Designer.
- Marketer.
- Data/AI specialist.
- Client reviewer.
- Client administrator.

Permissions must be scoped to organization, project, role, and action.

## 6. Workspace UX

Primary navigation:

Dashboard → Clients → Projects → Workboard → Deliverables → Assets → Communications → Reports → Finance/Billing → Settings

Dashboard should surface:
- Active projects.
- Upcoming deadlines.
- Blocked work.
- Pending approvals.
- Client requests.
- Deliverables awaiting review.
- Billing exceptions/references.

### Client Portal

Clients may receive a restricted workspace to:
- View approved project information.
- Review deliverables.
- Submit requests.
- Comment where permitted.
- Approve/reject deliverables.
- Access authorized assets.
- View permitted billing information.

Client access must never expose internal notes or unrelated client/project data.

## 7. Deliverables and Assets

Deliverables should support:
- Versioning.
- Review state.
- Approval state.
- Revision requests.
- Acceptance history.

Files use Nexora Core storage abstractions. Originals and important versions must not be silently overwritten.

## 8. Backend Relationship

Backend owns project state, permissions, workflow transitions, deliverable records, approval records, work logs, and API contracts.

Nexora Core owns shared identity, organizations, files/storage, notifications, audit, and common workflow primitives where applicable.

Nexora Finance owns canonical monetary records. Studio may show billing references and project financial summaries without creating a competing ledger.

Nexora Office may provide document editing/conversion capabilities; Studio consumes those capabilities rather than cloning them.

## 9. AI

AI may assist with:
- Meeting summaries.
- Project/status summaries.
- Brief generation.
- Proposal drafts.
- Task decomposition.
- Report drafts.
- Risk/dependency summaries.
- Client communication drafts.

AI cannot independently change scope, approve deliverables, accept contracts, alter billing, or send external client communications without authorization.

## 10. Security

Studio may contain confidential client information and intellectual property. Requirements include:
- Tenant/client isolation.
- Project-scoped authorization.
- Secure asset access.
- Audit of approvals and sensitive changes.
- No confidential content in ordinary logs.
- Controlled client portal access.
- Explicit authorization for external actions.

## 11. Domain Boundaries

Do not duplicate:
- CRM canonical customer/contact semantics.
- Finance ledger/payment truth.
- Core identity/organization/storage/audit primitives.
- Office document-editing infrastructure.

Studio is the source of truth for service delivery operations and project execution.

## 12. Definition of Done

A Studio feature is complete only when project/client scope, role permissions, lifecycle transitions, deliverable/version behavior, audit requirements, billing relationship, error states, tests, and client-facing security have been addressed.
