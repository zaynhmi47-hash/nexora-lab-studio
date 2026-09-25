# ADR: Product Domain and Shared Capability Boundaries

- Status: Accepted
- Date: 2026-09-25

## Context

The Nexora monorepo contains independently deployable products sharing one Modular Monolith → Service-Ready backend. An architecture audit identified overlapping concepts around professional networking, AI agents, storage, creator identity, portfolio presentation and business administration.

The repository also contains two app directories not covered by the original 28 product AGENT files: apps/nexora-muslim and the empty apps/nexora-business placeholder.

## Decisions

### 1. Professional networking

Nexora Social is the canonical general social/professional networking layer.

Dating Social Professional owns dating context, discovery, matches and dating-specific safety. It reuses authorized professional-networking capabilities and must not create a second professional graph.

### 2. AI

Nexora Core owns the provider-neutral AI Gateway infrastructure.

Nexora AI owns the general AI workspace.

AI Agent Business owns business-agent automation, approvals, schedules and high-impact business execution.

AI Pocket Tools consumes the shared gateway for focused utilities.

### 3. Storage

Nexora Core owns provider-neutral storage primitives and contracts.

Nexora Cloud owns the user-facing cloud file workspace.

Office, Photo and Launch own product-specific document, media-processing and device-facing semantics and must not create parallel cloud storage services.

### 4. Creator and portfolio

Nexora Creator owns creator-specific identity and operations.

Nexora Social owns general social/professional networking identity.

Portfolio Website is a presentation layer and should reference canonical source records instead of becoming a competing source of professional history.

### 5. Business administration

Nexora Business Suite is the canonical organization operating/orchestration workspace.

CRM, Finance, ERP, HR and other specialized domains remain authoritative for their own records.

apps/nexora-business remains an empty/reserved placeholder until a distinct product purpose is explicitly approved.

### 6. Nexora Muslim

Nexora Muslim is a product frontend consuming existing shared/backend capabilities. Its Islamic-domain experience may orchestrate Quran, prayer, learning, travel and related backend domains but must not recreate their infrastructure or canonical records.

## Consequences

Agents have explicit ownership boundaries before implementation. Shared infrastructure remains centralized without forcing product-specific semantics into Core. Product extraction remains possible because contracts and data ownership are explicit. New overlapping capabilities require an ownership decision before implementation.
