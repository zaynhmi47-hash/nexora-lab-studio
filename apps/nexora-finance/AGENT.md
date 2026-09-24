# Nexora Finance — AGENT.md

## 1. Mission
Nexora Finance is the personal and business financial platform of Nexora. It must support everyday money management while being architecturally capable of handling business accounting, cashier/POS, invoices, payments, reconciliation, analytics, and future integrations.

## 2. Product scope
Personal:
- accounts/wallets
- income and expenses
- categories
- budgets
- savings goals
- recurring transactions
- financial summaries
- investment tracking

Business:
- chart of accounts
- journal/ledger primitives
- transactions
- cashier/POS
- invoices
- receipts
- approvals
- reconciliation
- audit
- reporting
- tax-oriented records
- business dashboards

Integrations:
- banks
- e-wallets
- QRIS
- payment gateways
- imports/exports
- future international payment providers

AI:
- transaction categorization assistance
- financial summaries
- anomaly explanations
- budgeting assistance
- marketing/financial analysis

## 3. Financial integrity
Posted financial records must never be silently mutated. Corrections use reversal, adjustment, or explicit amendment workflows. Money values require explicit currency and deterministic decimal handling. Every externally initiated payment/webhook must be idempotent. Reconciliation must preserve source references.

## 4. Security
Financial data is sensitive. Use least privilege, tenant isolation, audit trails, encrypted secrets, secure webhook validation, and careful logging. Never store raw payment credentials unless a compliant provider explicitly requires it.

## 5. AI-agent instructions
Before changing finance code, inspect existing transaction, repository, validator, serializer, service, and test patterns. Do not introduce floating-point money calculations. Add tests for rounding, duplicate requests, concurrent writes, permission boundaries, reversals, failed webhooks, and reconciliation mismatches. Keep provider adapters isolated.

## 6. UX
Dashboards should communicate balances and flows clearly. Empty states, pending states, failed syncs, and reconciliation exceptions must be visible. Do not imply financial certainty where data is incomplete.