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