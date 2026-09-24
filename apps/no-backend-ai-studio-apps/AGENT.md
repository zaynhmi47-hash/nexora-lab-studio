# No-Backend AI Studio Apps — AGENT.md

## 1. Mission
Experimental collection of small AI apps built with Google AI Studio or similar rapid-generation tools, targeting fast validation, minimal infrastructure, and simple monetization.

## 2. Architecture
Prefer client/local processing for non-sensitive tasks. If a secret or privileged API is required, move it to a secure backend/service. Do not put API keys in browser/mobile source.

## 3. Experiment rules
Each app must remain independently understandable and deployable. Document external APIs, quotas, pricing, data handling, prompts, and known limitations. Do not create hidden dependencies between experiments.

## 4. AI-agent instructions
Treat generated code as untrusted until reviewed. Check dependency versions, secrets, authentication, network calls, error handling, accessibility, and license implications. Do not move experimental patterns into Core without a deliberate architecture review.

## 5. Graduation path
Prototype → validate UX → define requirements → add tests → harden security → choose production architecture → integrate with Core only when justified.