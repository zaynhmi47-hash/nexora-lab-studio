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

# Detailed Product Concept — Nexora ERP

## 1. Product Positioning

Nexora ERP is the integrated enterprise operations domain for organizations that need coordinated business processes across purchasing, inventory, operations, accounting references, assets, and organizational workflows.

It must integrate with Nexora Finance and Business Suite rather than recreate their canonical capabilities.

## 2. Core Domains

Potential domains:
- Organization operations.
- Products/items.
- Suppliers/vendors.
- Procurement.
- Purchase requests/orders.
- Inventory.
- Warehouses/locations.
- Stock movements.
- Assets.
- Operational workflows.
- Sales/order references.
- Production/work orders where applicable.
- Business reporting.

The initial implementation should be modular so organizations can enable only the domains they need.

## 3. Procurement Lifecycle

A configurable baseline:

Request → Review → Approval → Purchase Order → Receipt → Verification → Finance Reference

Procurement status must remain distinct from payment status.

## 4. Inventory

Inventory should support:
- Item master references.
- Locations/warehouses.
- Stock balances.
- Stock movements.
- Transfers.
- Receiving.
- Adjustments.
- Reservation where required.
- Inventory history.

Stock quantities must be derived from auditable movements or an equivalent authoritative mechanism. Silent quantity mutation is prohibited.

## 5. Assets

Asset management may include:
- Asset identity.
- Category.
- Location.
- Custodian.
- Lifecycle state.
- Assignment.
- Maintenance references.
- Disposal/retirement.

Financial depreciation remains a Finance/accounting concern when applicable.

## 6. UX and Navigation

Primary shell:

Dashboard → Procurement → Inventory → Orders → Assets → Operations → Reports → Approvals → Settings

Organization-specific modules may add navigation without changing shared identity/navigation conventions.

## 7. Backend Relationship

ERP backend owns operational entities and workflows.

Nexora Core owns:
- Identity.
- Organizations/membership.
- RBAC.
- Files.
- Notifications.
- Audit.
- Shared workflows.

Nexora Finance remains canonical for:
- Accounting ledger.
- Transactions.
- Payments.
- Reconciliation.
- Financial reporting.

Business Suite may provide higher-level business administration and organization views; ERP owns detailed operational execution.

## 8. Tenant Isolation

Every ERP record must have a clear organization/tenant scope.

Cross-organization queries require explicit authorized relationships. No global fallback query may accidentally expose another organization's inventory, suppliers, orders, or assets.

## 9. AI

AI may assist with:
- Procurement summaries.
- Inventory anomaly suggestions.
- Operational reporting.
- Document extraction.
- Forecasting support where validated.

AI output is advisory. It must not silently approve purchases, change stock, execute payments, or alter operational records.

## 10. Definition of Done

An ERP feature is complete only when tenant scope, workflow state transitions, inventory integrity, approval rules, Finance integration boundaries, auditability, permissions, tests, and failure/recovery behavior are addressed.
