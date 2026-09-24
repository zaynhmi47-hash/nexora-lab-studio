# Nexora Studio — AGENT.md

## 1. Mission
Nexora Studio is Nexora's technology and creative services workspace for development, websites, apps, marketing, data science, advertising, design, AI, clients, projects, and agency operations.

## 2. Business model
Support solo freelancer, small studio, and agency modes. Core entities include clients, organizations, projects, contracts/engagements, deliverables, tasks, assets, time/work logs, invoices, payments, communications, and reports.

## 3. Architecture
Tenant/client isolation is mandatory. Reuse Core identity, CRM, finance, files, notifications, workflow, and audit capabilities. Avoid creating Studio-specific copies of shared domains.

## 4. AI-agent instructions
Inspect existing project and client abstractions before coding. Every client-facing action must use the correct workspace context. Sensitive files require permission checks. Automations must be observable and reversible where possible. External service integrations must be adapters.

## 5. UX
Provide dashboards for work status, deadlines, deliverables, finances, and communication. Keep project details easy to navigate. Support mobile review/approval while full production workflows can be optimized for web.

## 6. Quality
Test tenant isolation, permissions, invoice/project relationships, file access, task state transitions, and notification delivery.