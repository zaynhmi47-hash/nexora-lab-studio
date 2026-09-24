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