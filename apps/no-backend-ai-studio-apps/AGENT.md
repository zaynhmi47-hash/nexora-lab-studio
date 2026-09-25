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

# Detailed Product Concept — No-Backend AI Studio Apps

## 1. Product Positioning

No-Backend AI Studio Apps is a collection of small AI-powered applications designed to run primarily on the client without requiring a dedicated Nexora backend for every individual utility.

The objective is rapid, low-cost, privacy-conscious AI experiences while preserving a clear boundary between genuinely client-local applications and features that require secure server infrastructure.

## 2. Suitable App Categories

Examples:
- Prompt helpers.
- Text transformers.
- Local document helpers.
- Creative generators where provider access is safely mediated.
- Study helpers.
- Small productivity assistants.
- Image/text utilities.
- Personal brainstorming tools.

Each mini-app should have a narrow purpose and independent lifecycle.

## 3. Architecture Principle

“No backend” does not mean “put secrets in the frontend.”

If an AI provider requires a secret API key, the key must not be shipped in a public mobile/web bundle.

Possible architecture levels:

### Level A — Fully Local
Use local algorithms/models/APIs with no server dependency.

### Level B — Public/Anonymous Provider Capability
Only use a provider mechanism explicitly designed to be safely called from the client.

### Level C — Nexora AI Gateway
If authenticated/private/provider-secret functionality is required, route through the shared Nexora AI Gateway/backend rather than creating a bespoke backend for each mini-app.

## 4. UX Model

Each mini-app should provide:
- Simple entry screen.
- Clear input.
- Processing state.
- Result.
- Copy/share/save.
- Retry where relevant.
- Privacy explanation.
- Settings only where needed.

Avoid unnecessary navigation and account requirements.

## 5. Local-First Data

If an app can operate without an account:
- Do not require login.
- Keep history locally.
- Do not upload inputs unnecessarily.
- Provide clear reset/delete behavior.
- Minimize analytics.

If cloud sync is later introduced, the product must explicitly document the new data flow.

## 6. AI Quality and Failure Handling

AI outputs are generated assistance.

The application must:
- Handle provider failures.
- Handle timeouts.
- Avoid displaying fabricated tool success.
- Preserve user input.
- Distinguish generated output from source content.
- Avoid silently replacing user data.

For deterministic utilities, use deterministic local processing instead of an AI call when practical.

## 7. Backend Relationship

These apps should not create independent Django services merely because a feature could be implemented server-side.

Use:
- Local/client logic for local capabilities.
- Nexora Core for shared identity/storage where required.
- Nexora AI Gateway for protected AI provider access.
- Existing product APIs when consuming canonical domain data.

A dedicated backend domain is justified only when the app has durable server state, privileged operations, multi-user workflows, or other requirements that cannot safely remain client-side.

## 8. Security

Requirements:
- No provider secrets in source/bundles.
- Secure local storage for sensitive temporary state.
- Explicit network behavior.
- Least-privilege permissions.
- No raw user content in logs.
- Dependency review.
- Safe rendering of generated text/HTML.

## 9. Monetization

Possible models:
- Free usage.
- Ads for low-risk utilities.
- Premium local features.
- Paid AI usage where provider cost requires it.

Quota/entitlement state that affects billing must be server-authoritative.

## 10. Definition of Done

A mini-app is complete only when its backend necessity has been justified, provider security is correct, privacy/network behavior is documented, failure handling works, local data can be cleared, and the app remains independently usable.
