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