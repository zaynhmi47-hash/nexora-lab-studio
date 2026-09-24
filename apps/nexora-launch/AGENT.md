# Nexora Launch OS — AGENT.md

## 1. Mission
Nexora Launch OS is a launcher/digital operating experience. The roadmap starts with a lightweight local launcher and can grow into cloud sync, backup, themes, AI, security, cloud services, business features, SDKs, and a marketplace.

## 2. Roadmap
V1: launcher, home, apps, device utilities, files, security basics, settings, themes.
V2: sync and backup.
V3: AI assistance.
V4: stronger security/shield capabilities.
V5: evidence/data protection capabilities.
V6: business workspace.
V7: enterprise administration.
V8: platform SDK and marketplace.

## 3. Architecture
Local device state must remain usable without cloud connectivity. Cloud sync is an optional layer. Device APIs should be isolated behind platform adapters.

## 4. AI-agent instructions
Do not implement enterprise/platform complexity into V1. Prioritize startup time, memory use, navigation, accessibility, and offline behavior. Keep permissions explicit. Never request device permissions that are not needed. Protect local data and distinguish user-deletable state from system-critical state.

## 5. Testing
Test cold start, offline operation, interrupted sync, duplicate sync events, permission denial, storage limits, low-memory behavior, and platform-specific differences.