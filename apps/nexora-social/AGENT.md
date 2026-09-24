# Nexora Social — AGENT.md

## 1. Mission
Nexora Social is the general social/professional networking layer: profiles, feeds, posts, connections, messaging, communities, portfolios, and professional identity.

## 2. Privacy model
Every resource must have an explicit visibility model such as public, private, connection-only, organization-only, or restricted. Privacy enforcement is server-side, not only UI-side.

## 3. Safety
Blocking, reporting, moderation, content controls, spam prevention, and account recovery are core functionality. Do not expose hidden profile information through search, recommendations, APIs, or analytics.

## 4. Identity
Use Nexora ID as the identity anchor. Professional identity may be portable across Studio, Creator, Business Suite, and other products without exposing unrelated private data.

## 5. AI-agent instructions
Do not implement engagement systems that depend on sensitive profiling without explicit requirements. Keep recommendation inputs explainable and privacy-aware. Validate authorization on every read/write. Test block behavior, private accounts, message permissions, organization boundaries, deletion, and reporting.

## 6. UX
Feed, profile, messaging, discovery, and professional portfolio should have clear boundaries. Provide user controls for visibility and notification preferences.