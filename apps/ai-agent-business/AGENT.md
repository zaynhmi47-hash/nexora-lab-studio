# AI Agent Business — AGENT.md

## 1. Mission
Experimental platform for AI agents that execute business workflows as services. Agents may research, classify, draft, automate, monitor, or interact with approved tools.

## 2. Architecture
Agent definition → policy → planning → tool authorization → execution → observation → audit/result. Never let generated plans bypass authorization.

## 3. Safety
High-impact, financial, destructive, external, or irreversible actions require explicit confirmation or an approved policy. Tool schemas must validate arguments. Secrets are scoped and never exposed to model context unnecessarily.

## 4. AI-agent coding instructions
Keep planning and execution separate. Every action gets a trace ID and audit event. Handle retries idempotently. Limit loops and budgets. Test tool failure, malformed model plans, authorization denial, timeouts, duplicate execution, and partial completion.

## 5. Product
Support reusable agent templates, task runs, permissions, usage/cost tracking, results, logs, and human review. Do not market automation as autonomous beyond its actual capabilities.

# Detailed Product Concept — AI Agent Business

## 1. Product Positioning

AI Agent Business is Nexora's business-focused AI agent environment for creating controlled agents that can assist with business operations, knowledge work, customer workflows, analysis, and automation.

It is an agent orchestration product, not a replacement for CRM, Finance, ERP, HR, or the general Nexora AI workspace.

## 2. Core Domains

Initial domains:
- Agent definitions.
- Agent instructions.
- Business knowledge sources.
- Tools/connectors.
- Permissions.
- Agent runs.
- Tasks.
- Approval requests.
- Schedules.
- Execution history.
- Usage/cost tracking.
- Results/artifacts.
- Audit logs.

An agent must have an explicit owner, scope, allowed tools, and authorization policy.

## 3. Agent Lifecycle

Baseline lifecycle:

Draft → Configured → Tested → Active → Paused → Archived

Execution lifecycle:

Request → Authorization Check → Plan → Tool Execution → Observation → Result → Audit

If an action requires human approval:

Request → Plan → Approval → Execution → Result → Audit

The system must never treat a generated plan as proof that an external action was executed.

## 4. Tools and Connectors

Agents may use approved tools such as:
- CRM.
- Finance references.
- ERP operations.
- Business Suite workflows.
- Documents/files.
- Search/research.
- Communication services.
- Analytics.

Every tool must expose an explicit schema and permission boundary.

Credentials belong to the secure integration layer, not agent prompts.

## 5. Human Approval

High-impact actions should require approval, including where applicable:
- Sending external messages.
- Financial actions.
- Contract or scope changes.
- Account/permission changes.
- Data deletion.
- Publishing.
- Irreversible operational changes.

Approval records should identify:
- Request.
- Proposed action.
- Approver.
- Decision.
- Timestamp.
- Executed action/result.

## 6. Business Knowledge

Knowledge sources may include:
- Approved documents.
- Organization policies.
- Product information.
- CRM records.
- ERP references.
- Internal knowledge bases.

The agent must distinguish retrieved/source information from generated conclusions.

Knowledge access must respect the user's and agent's authorization scope.

## 7. UX and Navigation

Primary shell:

Dashboard → Agents → Knowledge → Tasks → Runs → Approvals → Integrations → Usage → Audit → Settings

Agent builder should expose:
- Purpose.
- Instructions.
- Allowed tools.
- Knowledge sources.
- Permissions.
- Approval requirements.
- Schedule.
- Test run.

## 8. Backend Relationship

Backend owns agent definitions, policies, runs, tasks, approvals, schedules, audit records, and business-domain integration references.

Nexora Core AI Gateway owns model/provider abstraction, credentials, common AI policy, usage controls, and shared AI infrastructure.

Business systems remain authoritative:
- CRM → customer/pipeline truth.
- Finance → financial truth.
- ERP → operational/inventory truth.
- HR → workforce truth.
- Studio → project-delivery truth.

The agent orchestrates these systems; it must not create duplicate canonical records merely to simplify execution.

## 9. Security

AI agents are privileged automation components and require stronger controls:
- Least privilege.
- Explicit tool allowlists.
- Tenant isolation.
- Secret isolation.
- Execution audit.
- Prompt/tool injection defenses.
- Input/output validation.
- Rate limits.
- Kill/pause controls.
- Approval gates.
- Safe failure behavior.

Untrusted retrieved content must not automatically become trusted instructions.

## 10. AI Safety and Reliability

Agents must:
- Report uncertainty.
- Avoid fabricating tool results.
- Preserve source references where applicable.
- Fail closed for unauthorized actions.
- Never claim an external action succeeded without a confirmed tool result.
- Distinguish planned, attempted, successful, failed, and rejected actions.

## 11. Monetization and Usage

Usage may be measured by:
- Agent runs.
- Model usage.
- Tool calls.
- Storage.
- Automation schedules.

Entitlements and billing state must integrate with Nexora Finance/Core rather than duplicating financial truth.

## 12. Definition of Done

An AI Agent Business feature is complete only when agent scope, tool permissions, approval gates, tenant isolation, execution states, auditability, usage accounting, failure handling, and security tests are addressed.

## 13. Canonical AI workspace boundary

Nexora AI is the canonical general-purpose AI workspace. AI Agent Business is the canonical product for business-specific agent automation.

AI Agent Business owns:
- business agent definitions and policies;
- business knowledge/tool bindings;
- business runs, tasks and schedules;
- approvals and high-impact action gates;
- business execution audit and usage records.

Nexora AI owns general chat/project/research/knowledge experiences. Do not create a second general AI workspace inside this product.

Business agents may consume Nexora AI/Core AI capabilities, but business systems remain authoritative for their own records.
