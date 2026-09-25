# Nexora Business Suite — AGENT.md

## 1. Mission
Nexora Business Suite is the operational workspace for businesses, creators, publishers, organizations, and institutional operators. It brings administration, CRM, finance, marketing, publishing, workflows, registration, and analytics together around an organization.

## 2. Concept
The product is organization-first rather than person-first. A user can belong to multiple organizations with different roles. Modules can be enabled per organization. Business Suite consumes shared Nexora Core capabilities instead of owning parallel versions of them.

## 3. Functional domains
- Organization setup and profile.
- Memberships, teams, roles, invitations.
- CRM and customer relationships.
- Sales and business workflows.
- Finance, invoices, receipts and reporting.
- Marketing and campaign management.
- Publisher/creator administration.
- Campus/institution registration workflows.
- Documents and approvals.
- Analytics and operational dashboards.
- Notifications and scheduled workflows.

## 4. Regional/legal design
Regional requirements must be configuration-driven or implemented through adapters. Do not hard-code one country's tax, legal, identity, or payment rules into generic business logic. Mark jurisdiction-sensitive behavior clearly and isolate it.

## 5. AI-agent instructions
Always identify the organization/tenant context before accessing business data. Enforce membership and role permissions server-side. Reuse Core entities and services. When adding a module, document its dependencies and events. Avoid cross-tenant queries without an explicit administrative capability. All sensitive changes need audit records.

## 6. Quality rules
Use explicit state machines for approval/publishing/registration workflows. Make business operations idempotent. Provide clear activity history. Never make UI-only authorization assumptions. Test role combinations, tenant isolation, invitation lifecycle, and failure recovery.
# 7. Detailed product concept

Nexora Business Suite is the organization-first operating workspace for businesses, creators, publishers, institutions/campuses and organized operations. It combines administration, CRM/sales workflows, finance views, marketing, publishing operations, registration, documents/approvals and analytics while preserving specialized product ownership.

A person may belong to multiple organizations with different roles. Organization context must therefore be explicit throughout the UI and backend.

# 8. Actors

Primary actors include owner/founder, organization administrator, operations staff, finance staff, sales staff, marketing staff, creator/publisher, institution administrator, team member and approver/reviewer.

Permissions are always evaluated server-side.

# 9. Functional domains

## Organization control center
Organization profile, organization switcher, teams, memberships, invitations, roles, enabled modules, settings and activity. The active organization must be obvious and switching organizations must prevent stale tenant data from remaining on screen.

## CRM and sales
Business Suite may surface CRM/customer workflows, but canonical contacts, leads, opportunities and pipeline semantics belong to Nexora CRM. Do not create parallel CRM models.

Support quotations, orders, follow-ups, approvals and operational sales states where Business Suite owns the workflow. Accounting truth remains Finance.

## Finance operations
Business Suite may display invoices, receipts, payment status and business summaries through Finance contracts. It must not become a second ledger.

## Marketing
Campaigns, content planning, scheduling, task workflows and performance summaries may be provided. Do not infer sensitive personal attributes merely for segmentation.

## Publisher/creator administration
Support organization-level content operations, approvals, scheduling and analytics. Canonical creator identity and media publishing remain with the appropriate Creator/Nexverse domains.

## Campus/institution registration
Support applicant intake, review, approval, payment/reference state and registration outcomes. Official KRS, grades, attendance and academic records remain Dignity-owned.

## Documents and approvals
Use Office/Core file capabilities. Business Suite owns the surrounding business workflow: requestor, reviewer, reason, state, decision and history.

## Analytics
Dashboards should surface pending approvals, overdue tasks, sales workflow activity, registration queues, payment exceptions, campaign activity, organization activity and integration failures. Every metric should make scope, period and data freshness understandable.

# 10. UI/UX

Suggested shell:
Organization Switcher → Dashboard → Work → CRM/Sales → Finance → Marketing → Publishing → Registration → Documents/Approvals → Analytics → Notifications → Settings.

The dashboard is a work queue, not only a chart wall. Prioritize actions, exceptions and recent activity, with drill-down to owning modules.

Workflow pages should use tables/lists for queues, detail pages for context and explicit state transition actions. Consequential irreversible actions require clear confirmation.

Approval center should show requestor, organization, resource, reason, current state, history and available decisions. Approval actions must be audited.

# 11. Regional/legal architecture

Tax, registration, legal documents, identity requirements and payment methods may differ by jurisdiction. Represent these through configuration, policy modules or adapters. Do not hard-code one country's assumptions into global shared models. Jurisdiction-sensitive rules should identify the applicable jurisdiction and effective period when necessary.

# 12. AI capabilities

AI may create operational summaries, marketing drafts, sales follow-up suggestions, exception explanations, natural-language dashboard queries and document extraction.

AI recommendations are not authorization. High-impact financial, legal, membership, publishing or destructive actions require normal authorization and any required confirmation or approved policy gate.

# 13. Security and tenant isolation

Every business operation must establish organization context. Never trust a client-provided organization ID as proof of membership. Cross-organization administration requires explicit privilege and audit.

Sensitive operations include membership/role changes, financial actions, approvals, publishing actions, exports and integration credential changes.

# 14. Agent ownership

Frontend owns organization shell, dashboards, workflow presentation, forms, client state and API consumption. Backend owns APIs, persistence, authorization, workflow transitions and integrations. Core owns shared identity, membership, authorization, audit, files, notifications and payment primitives.

Finance, CRM, HR, Dignity, Nexverse and Office retain canonical domain ownership. Business Suite may orchestrate them through explicit contracts but must not duplicate their domain models.

# 15. Definition of done

A feature is complete only when organization scope, roles, state transitions, audit behavior, API contract, failure states, data ownership and cross-product dependencies are explicit and tested.

## 16. Orchestration boundary

Business Suite is an organization operating workspace and orchestration surface, not a replacement for specialized domain systems.

Canonical ownership remains with:
- CRM → customer relationships and sales pipeline;
- Finance → financial records and ledger;
- ERP → operational procurement/inventory/enterprise workflows;
- HR → workforce/employment records;
- Dignity → official academic records;
- Nexverse/News/Creator → their respective content/creator domains;
- Office → document semantics.

Business Suite may aggregate, configure, initiate or approve workflows through explicit contracts, but must not create duplicate canonical records merely for dashboard convenience.

## 17. Workflow boundary

Nexora Core may provide generic workflow, approval, event and audit primitives. Business Suite and specialized products own the meaning, states and business rules of their workflows.
