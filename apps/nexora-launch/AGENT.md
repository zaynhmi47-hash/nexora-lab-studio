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

# Detailed product concept

Nexora Launch is the Nexora launcher/device-oriented product roadmap: a unified entry point for apps, files, utilities, security and eventually sync, AI and business/device capabilities.

## Roadmap

V1: launcher/home, app catalog, device utilities, files, security/settings and themes.
V2: sync and backup.
V3: AI assistance.
V4: stronger security capabilities.
V5: evidence/data-protection workflows.
V6: business workspace.
V7: enterprise administration.
V8: SDK/marketplace ecosystem.

These stages are a roadmap, not permission to implement every capability simultaneously. Each release must remain coherent and usable.

## V1 UX

Home should provide app discovery, search, favorites, recent activity and customizable shortcuts. App launching must preserve authentication/context without pretending each product has a separate identity system.

Files should consume Nexora Cloud/Core storage primitives rather than create another storage backend. Settings should centralize device/app preferences without taking ownership of product-specific settings.

## Device and permission model

Local/device operations require explicit platform permissions and graceful denial states. Do not assume Android/iOS permissions are identical. Provider/device adapters must isolate platform APIs.

## Sync and backup

Future sync must define source of truth, conflict resolution, offline state, encryption/privacy expectations, retry and recovery before implementation. Backup is not automatically synchronization.

## AI

Future AI features should be scoped assistants over explicitly authorized device/app context. AI cannot silently change settings, delete data or execute sensitive device actions.

## Security

Launch is a privileged surface and must avoid becoming a credential dump. Never display secrets or tokens. Destructive actions need confirmation. Device data must be minimized and protected.

## Agent ownership

Frontend owns launcher UI, navigation, device-facing interactions and local state. Backend/Core owns shared identity, sync contracts, files, security/audit primitives and server workflows. Platform-specific adapters isolate native capabilities.

## Definition of done

Every roadmap feature must define platform support, permissions, offline behavior, security implications, state recovery, UX error states and whether it belongs locally, in Core or in the backend.