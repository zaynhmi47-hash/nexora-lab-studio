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
# 7. Detailed product concept

Nexora Finance is the personal and business financial platform of Nexora. It should be practical for everyday money management while capable of supporting business accounting, cashier/POS, invoices, payments, reconciliation, analytics and future integrations.

Personal finance and business finance are distinct contexts even when they share technical primitives.

# 8. Personal finance

Capabilities include bank/cash/e-wallet accounts, income, expenses, categories, transfers, budgets, savings goals, recurring transactions, summaries, investment tracking and import/export.

The experience should answer where money is, where it came from, where it went and how the user is progressing toward goals.

# 9. Business finance and accounting

Capabilities include chart of accounts, journal/ledger concepts, financial transactions, receivables/payables where implemented, invoices, receipts, cashier/POS, approvals, reconciliation, reports, tax-oriented records and business dashboards.

Finance owns canonical financial truth. Business Suite and ERP may orchestrate or present Finance data but must not create another ledger.

# 10. Financial integrity

Use exact decimal arithmetic and explicit currency. Currency conversion must retain rate/source/effective context when applicable.

Posted financial records must not be silently mutated. Corrections use reversal, adjustment or controlled amendment workflows.

A transaction lifecycle may be Draft → Pending → Posted → Reconciled → Reversed/Adjusted, with states selected according to the implemented domain.

Critical invariants must be protected by database constraints and transactions, not only client or Python validation.

# 11. Accounts and transactions

Financial records should preserve amount, currency, date/time, account/source, category or account mapping, description/reference, personal or organization scope, status, external/import reference and audit metadata.

Duplicate imports, payment callbacks and provider events must be idempotent.

# 12. Goals and budgeting UX

The goals experience should clearly show target, current amount, contributions, remaining amount and progress. IDR amounts must use consistent formatting and deterministic rounding.

Budget views should show planned, actual, remaining and period. Empty states should teach the user how to create the first budget.

The established mobile direction includes the goals screen at apps/nexora-finance/mobile/app/(tabs)/goals.tsx. Future work must connect that UI to real contracts rather than creating a parallel goals implementation.

# 13. Cashier/POS

POS should optimize for fast transaction entry, product/service selection where applicable, payment state, receipt creation and session reconciliation. Payment success and failure must be unmistakable.

POS must use the canonical Finance transaction model rather than an isolated cash ledger.

# 14. Banking, e-wallet and QRIS integrations

Support can include banks, e-wallets, QRIS, payment gateways, statement imports and future international providers.

All external providers are adapters. Incoming events require verification where supported, source references and idempotency.

# 15. Reconciliation

Reconciliation compares internal records with external statements/sources and identifies matched, unmatched, duplicate and exception items. Exceptions must remain visible and actionable.

# 16. Reporting

Reports may include income/expense, cash flow, balances, budget performance, profit/loss where supported, receivables/payables where supported and reconciliation exceptions.

Tax-oriented calculations must be clearly scoped and must not be presented as official tax advice.

# 17. AI finance assistant

AI may suggest categorization, summarize finances, explain anomalies, assist budgeting and support business financial/marketing analysis.

AI must not silently post, reverse, delete, transfer or otherwise create high-impact financial effects. Suggestions should remain inspectable against underlying records.

# 18. UX/navigation

Personal shell:
Overview → Accounts → Transactions → Budgets → Goals → Recurring → Investments → Reports → Settings.

Business shell:
Overview → Accounts/Chart of Accounts → Transactions → Sales/Invoices → Expenses → POS → Reconciliation → Reports → Approvals → Integrations → Settings.

Dashboards should emphasize balances, cash flow, pending items, recent activity and exceptions before decorative charts.

# 19. Security and audit

Financial data requires least privilege, tenant isolation, strong auditability, secure provider credentials and careful logging. Never log payment secrets or tokens.

Audit important transaction posting/reversal, payment state changes, reconciliation decisions, account linking, permission changes and privileged exports.

# 20. Agent ownership

Finance frontend owns screens, charts, forms, goal/budget interactions, local UI state and API consumption. Backend owns financial models, transaction/ledger persistence, validation, reconciliation, integrations, APIs, permissions and jobs. Core owns shared identity, organization, authorization, audit, files, notifications and generic payment primitives.

Do not create duplicate User, Organization, Payment or Audit implementations. Do not move accounting rules into Core.

# 21. Definition of done

A Finance feature is complete only when monetary precision, currency, lifecycle, authorization, tenant scope, auditability, idempotency/concurrency, failure behavior and reconciliation implications are addressed and tested.
