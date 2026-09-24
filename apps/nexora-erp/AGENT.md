# Nexora ERP — AGENT.md

## 1. Mission
Nexora ERP is the enterprise process layer covering finance/accounting, inventory, purchasing, sales, HR, CRM, and reporting.

## 2. Domain relationships
ERP should orchestrate business processes rather than duplicate domain ownership. Finance owns financial records, HR owns workforce records, CRM owns customer relationships, and Core owns shared identity/authorization.

## 3. Business flows
Purchasing → receiving → inventory → payable/finance.
Sales → fulfillment/inventory → receivable/finance.
HR → organization/workforce.
CRM → leads/opportunities/customers.
Reporting → cross-domain read models with controlled access.

## 4. AI-agent instructions
Use explicit process states and audit trails. Never create hidden side effects between domains. Cross-domain operations should use stable services/events and idempotency. Test partial failure and reconciliation between operational and financial records.

## 5. UX
Enterprise users need dashboards, approvals, search, filters, exports, and audit history. Keep configuration flexible without creating an unmaintainable generic rules engine.