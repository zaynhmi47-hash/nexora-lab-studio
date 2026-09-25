# Nexora HR — AGENT.md

## 1. Mission
Nexora HR is the workforce administration domain for employee records, roles, onboarding, leave, HR workflows, organizational structure, and employee lifecycle.

## 2. Domains
Employees, employment records, teams, positions, organization hierarchy, onboarding/offboarding, leave, attendance integrations, documents, approvals, and HR reporting.

## 3. Security
Employee information is sensitive. Separate authentication identity from employment records. Enforce organization and HR-role permissions. Audit changes to compensation, employment status, documents, and other sensitive records.

## 4. AI-agent instructions
Reuse Core Identity, Organization, RBAC, Files, Workflow, and Audit. Do not expose HR data through generic search APIs without authorization. Test tenant isolation and role combinations. Keep country-specific employment rules configurable and reviewed.

## 5. UX
Provide employee self-service where appropriate and restricted HR administration views. Clearly distinguish pending, approved, rejected, and historical records.

# Detailed Product Concept — Nexora HR

## 1. Product Positioning

Nexora HR is the human-resources and workforce administration domain for organizations using Nexora. It manages workforce records, organizational employment processes, attendance, leave, onboarding, performance workflows, and employee-facing HR services.

It is organization-first and must support strict tenant isolation.

## 2. Core Domains

Initial domains:
- Employee/workforce profiles.
- Organization structure.
- Employment records.
- Positions/roles.
- Onboarding/offboarding.
- Attendance.
- Leave and absence.
- Work schedules.
- Employee documents.
- Performance workflows.
- HR requests/approvals.
- HR announcements.
- Workforce reports.
- HR audit/history.

Sensitive employment information must be access-controlled and separated from ordinary social/profile data.

## 3. Organization and Employment Model

A simplified model:

Organization → Department/Unit → Position → Employment → Employee

An employee may have:
- Employment status.
- Position.
- Department.
- Manager.
- Start/end dates.
- Work arrangement.
- Approved HR attributes.
- Employment documents.

Historical employment states must be preserved where legally/operationally required rather than silently overwritten.

## 4. Attendance and Leave

Attendance should support the organization's configured policy, such as:
- Work schedules.
- Check-in/check-out references.
- Attendance status.
- Exceptions.
- Approval workflows.

Leave should support configurable:
- Leave types.
- Entitlements.
- Requests.
- Approvals.
- Rejections.
- Cancellations.
- Balances.

Do not hard-code one country's labor policy into the universal domain model. Regional/legal policy should be configurable and reviewed before implementation.

## 5. Onboarding and Offboarding

Onboarding may include:
- Employee information completion.
- Document collection.
- Account/access requests.
- Department assignment.
- Required acknowledgements.
- Task checklist.

Offboarding may include:
- End-date confirmation.
- Handover.
- Asset/access revocation references.
- Final HR tasks.
- Document retention/deletion workflow.

Security-sensitive access revocation must integrate with the appropriate identity/security systems rather than being represented only as a checkbox.

## 6. Performance

Performance features may include:
- Goals.
- Review cycles.
- Manager feedback.
- Self-assessment.
- Development plans.
- Review history.

The product must avoid turning subjective evaluations into unsupported automated judgments. AI may assist with drafting or summarization but should not make employment decisions autonomously.

## 7. Employee Self-Service

Employee workspace may include:

Home → My Profile → Attendance → Leave → Tasks/Requests → Documents → Performance → Announcements → Settings

Managers/admins may have:

Dashboard → Employees → Organization → Attendance → Leave → Requests → Performance → Documents → Reports → Settings

## 8. Backend Relationship

Backend owns HR domain models, policy configuration, approval workflows, access control, audit/history, and reporting APIs.

Nexora Core owns:
- Identity.
- Organization/membership primitives.
- RBAC primitives.
- Files/storage.
- Notifications.
- Audit infrastructure.

Nexora Finance owns payroll/financial ledger semantics if payroll is introduced. HR may provide employee compensation references but must not create a competing financial ledger.

Nexora CRM/Business Suite may reference organizational contacts or business relationships, but HR remains authoritative for employment relationships.

## 9. Security and Privacy

HR contains highly sensitive organizational data.

Requirements:
- Strict tenant isolation.
- Role-based and attribute/context-aware authorization where needed.
- Least privilege.
- Audit of sensitive access and changes.
- Secure document access.
- No sensitive HR data in ordinary logs.
- Controlled exports.
- Explicit retention/deletion policies.
- Protection against cross-employee data leakage.

## 10. AI

AI may assist with:
- HR document summaries.
- Policy explanations from approved organizational policies.
- Drafting announcements.
- Drafting job descriptions.
- Administrative workflow summaries.

AI must not autonomously decide hiring, firing, promotion, compensation, disciplinary action, or employee eligibility.

## 11. Domain Boundaries

Do not duplicate:
- Core identity/organization/RBAC/audit primitives.
- Finance's financial ledger.
- Social's public professional profile.
- CRM's customer pipeline.
- Business Suite's broader business operations.

HR is authoritative for employment and workforce administration.

## 12. Definition of Done

An HR feature is complete only when organization scope, role authorization, sensitive-data handling, auditability, policy configuration, workflow transitions, retention implications, tests, and employee/manager UI states are addressed.
