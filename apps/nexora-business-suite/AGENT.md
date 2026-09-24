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