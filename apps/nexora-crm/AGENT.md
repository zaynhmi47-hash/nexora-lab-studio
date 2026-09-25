# Nexora CRM — AGENT.md

## 1. Mission
Nexora CRM manages contacts, organizations, leads, opportunities, activities, pipelines, communications, and customer relationships.

## 2. Data model
Separate person/contact records from organization accounts, leads, opportunities, activities, pipeline stages, and communication events. Support duplicate detection without destructive automatic merging.

## 3. Integrations
Connect to Studio, Business Suite, Finance, Social, and Creator through stable APIs/events. Finance owns billing/financial truth; CRM owns relationship and sales-process state.

## 4. AI-agent instructions
Always enforce tenant and role boundaries. Avoid exposing customer data through broad search. Automation must be auditable and reversible where practical. Validate lead conversion, opportunity transitions, assignment, deletion, and duplicate handling.

## 5. UX
Provide pipeline views, customer timelines, tasks, reminders, search, filters, and clear ownership. Keep important relationship history easy to understand.

# Detailed Product Concept — Nexora CRM

## 1. Product Positioning

Nexora CRM is the canonical customer and relationship-management system for organizations using Nexora. It manages prospects, customers, contacts, accounts, sales pipelines, activities, communications, and relationship history.

It should not become a general social network, HR system, or project-management system.

## 2. Core Domains

Initial domains:
- Leads/prospects.
- Organizations/accounts.
- Contacts.
- Opportunities.
- Sales pipelines.
- Activities.
- Follow-ups.
- Notes.
- Communication references.
- Customer segmentation.
- Sales tasks.
- Reports and analytics.

Contact identity must distinguish a business relationship from a Nexora user account.

## 3. Pipeline Model

A configurable pipeline may use:

Lead → Qualified → Opportunity → Proposal → Negotiation → Won/Lost

Organizations must be able to configure stages, required fields, ownership, and transitions.

Pipeline state must be auditable.

## 4. Relationship History

A customer timeline may contain:
- Calls.
- Meetings.
- Emails/references.
- Notes.
- Opportunities.
- Tasks.
- Service/project references.
- Support/reference events where integrated.

The timeline should distinguish source systems and avoid copying entire external records unnecessarily.

## 5. UX and Navigation

Primary shell:

Dashboard → Leads → Accounts → Contacts → Pipeline → Activities → Tasks → Reports → Settings

Managers may have team dashboards; individual users should see only records allowed by organization policy.

## 6. Backend Relationship

CRM owns canonical customer relationship records and sales pipeline state.

Nexora Core owns:
- Identity.
- Organization/membership.
- Authorization.
- Notifications.
- Files.
- Audit.

Nexora Studio references CRM clients but owns project delivery state.

Nexora Finance owns invoices, payments, ledger, and financial transactions.

Nexora Social owns social profiles and social relationships.

Business Suite may provide higher-level business views but should not create a second canonical CRM database.

## 7. Privacy and Access

Requirements:
- Organization/tenant isolation.
- Record-level authorization where necessary.
- Team ownership.
- Sensitive notes protection.
- Controlled export.
- Audit of important changes.
- No customer data in ordinary logs.

## 8. AI

AI may assist with:
- Lead summaries.
- Meeting-note extraction.
- Follow-up drafts.
- Opportunity summaries.
- Suggested next actions.
- Sales reporting.

AI must not autonomously send customer communications, change opportunity stages, promise pricing, or create contractual commitments without explicit authorization.

## 9. Integrations

Potential integrations:
- Studio project references.
- Finance billing/payment references.
- Business Suite organization views.
- Social professional references.
- Notifications.
- Email/calendar connectors where explicitly authorized.

Integrations must preserve system ownership.

## 10. Definition of Done

A CRM feature is complete only when customer ownership, pipeline transitions, organization scope, authorization, auditability, integration references, privacy, tests, and responsive UI states are covered.
