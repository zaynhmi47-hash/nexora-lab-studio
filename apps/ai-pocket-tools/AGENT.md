# AI Pocket Tools / Smart Kit — AGENT.md

## 1. Mission
A collection of narrowly focused AI utilities for rewriting, summarization, extraction, document assistance, classification, and quick everyday tasks.

## 2. Architecture
Use a provider-neutral AI adapter. Keep tools independently testable. Minimize prompt/token costs and network calls. API keys must never be embedded in client bundles.

## 3. Privacy
Tell users when their content is sent to an external AI provider. Do not persist prompts or documents by default. If persistence is required, make storage and retention explicit.

## 4. AI-agent instructions
Validate structured AI output against schemas. Handle timeouts, rate limits, malformed responses, provider changes, and partial results. Do not let generated text overwrite source content without user action.

## 5. Product principles
Each tool should have one obvious job, predictable inputs, and useful output. Avoid turning this project into a second full Nexora AI workspace.

# Detailed Product Concept — AI Pocket Tools

## 1. Product Positioning

AI Pocket Tools is a compact collection of task-specific AI utilities for quick everyday work. It should provide focused tools rather than forcing users into a large general chat workflow.

Examples may include:
- Text rewriting.
- Summarization.
- Translation.
- Brainstorming.
- Email/message drafting.
- Extraction/structuring.
- Prompt assistance.
- Simple document/text analysis.
- Small coding or formatting helpers where appropriate.

## 2. Tool Design

Each tool should have:
- Clear purpose.
- Explicit input.
- Clear output.
- Provider/model indication where relevant.
- Copy/share/save action.
- Retry/regenerate control where supported.
- Usage/error feedback.
- Privacy information appropriate to the input.

Tools should not silently chain expensive AI calls.

## 3. AI Provider Architecture

AI requests must go through an approved provider abstraction/Gateway rather than embedding provider-specific business logic throughout the frontend.

Provider-specific credentials must never be shipped in client applications.

The backend/Core AI Gateway should own:
- Provider selection.
- Authentication/credentials.
- Usage policy.
- Rate limits.
- Model routing where approved.
- Safety controls.
- Usage accounting.
- Observability.

## 4. UX and Navigation

Primary shell:

Home → All Tools → Favorites → Recent → History → Saved → Usage → Settings

The interface should make the cost/usage implications of expensive operations understandable where relevant.

## 5. Privacy

Users may paste confidential material into AI tools. Requirements:
- Clear indication when data leaves the device.
- No hidden upload.
- Explicit retention policy.
- Minimize stored prompts/results.
- Avoid sensitive data in logs.
- Provide deletion controls for stored user content where supported.

Local-only utilities should remain local.

## 6. AI Safety and Quality

AI output is generated assistance, not automatically authoritative fact.

The product should:
- Encourage review before external use.
- Preserve source/input when transforming content.
- Avoid fabricated citations or claims.
- Clearly distinguish extracted/source content from generated content.
- Provide errors when model/provider calls fail instead of inventing a result.

## 7. Backend Relationship

Frontend owns tool UI, input/output presentation, local state, and client-side transformations.

Backend/Core AI Gateway owns model calls, provider credentials, quotas, policy, usage accounting, and server-side processing.

Shared identity, storage, notifications, and audit capabilities come from Nexora Core.

## 8. Monetization

Possible monetization:
- Free usage quota.
- Premium tools/models.
- Usage-based limits.
- Advertising for appropriate low-risk tools.

Any quota must be calculated consistently server-side when it affects entitlement or billing.

## 9. Domain Boundaries

Do not turn Pocket Tools into:
- The canonical Nexora AI workspace.
- The canonical document editor.
- The Finance system.
- A general social or messaging product.

Pocket Tools is the lightweight entry point for focused AI tasks and may deep-link into larger Nexora products.

## 10. Definition of Done

A tool is complete only when provider/error behavior, privacy, usage limits, input/output preservation, accessibility, loading states, security, and deterministic non-AI behavior where applicable are tested.
