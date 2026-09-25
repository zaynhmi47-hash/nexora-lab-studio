# Nexora Cloud — AGENT.md

## 1. Mission
Nexora Cloud is the storage, backup, synchronization, and future infrastructure layer for the ecosystem.

## 2. Domains
Object/file storage, metadata, folders, sharing, permissions, backup, restore, synchronization, lifecycle policies, quotas, and future infrastructure services.

## 3. Architecture
Separate logical storage APIs from physical providers. Provider adapters may target Firebase Storage, object storage, or future cloud providers without changing product logic.

## 4. Security
Private objects require authorization and controlled access. Signed/temporary URLs should be used where appropriate. Secrets remain server-side. Deletion, retention, backup, and restore must have explicit policies.

## 5. AI-agent instructions
Do not build a second file service inside a product. Reuse Cloud/Core. Test interrupted uploads, duplicate objects, sync conflicts, expired URLs, permission changes, deletion recovery, quota enforcement, and provider failures.

## 6. Future infrastructure
If compute/server capabilities are added, keep them separate from the storage domain and use explicit resource lifecycle, billing, access, and security models.

# Detailed Product Concept — Nexora Cloud

## 1. Product Positioning

Nexora Cloud is Nexora's user-facing cloud workspace for files, storage, synchronization, sharing, and cloud-connected resources. It should provide a coherent experience over shared infrastructure without replacing the provider infrastructure itself.

The product is a cloud workspace, not a second backend platform.

## 2. Core Domains

Initial domains:
- Cloud files.
- Folders.
- Upload/download.
- File preview.
- Sharing.
- Favorites/recent files.
- Trash/recovery.
- Cross-device synchronization.
- Storage usage.
- Connected applications.
- Access/activity history.

Where supported, it may expose structured resources from other Nexora products, but the owning product remains authoritative.

## 3. File Model

A file should have:
- Stable identity.
- Name/type metadata.
- Size.
- Version information where supported.
- Ownership.
- Parent folder.
- Visibility/access policy.
- Creation/update timestamps.
- Storage reference.

Binary storage and application metadata must remain separated. Storage providers are infrastructure adapters, not domain ownership.

## 4. Sharing and Access

Support:
- Private.
- Organization-scoped.
- Specific-user sharing.
- Link sharing where approved.
- Read/write permissions where supported.

Sharing must be server-authorized. A hidden/unlisted link must not become an authorization bypass.

Revocation should invalidate access according to the storage/access model.

## 5. UX and Navigation

Primary shell:

Home → My Files → Shared With Me → Recent → Favorites → Trash → Storage → Connected Apps → Settings

Important states:
- Uploading.
- Upload failed.
- Syncing.
- Conflict.
- Permission denied.
- Offline.
- Storage quota reached.
- File unavailable.

## 6. Synchronization

Sync must have explicit conflict semantics.

The system should distinguish:
- Local pending change.
- Server-accepted change.
- Conflict.
- Failed synchronization.
- Deleted/revoked object.

Never silently overwrite a newer user version.

## 7. Backend Relationship

Nexora Core owns shared storage abstractions, authorization primitives, file metadata foundations, audit, and integration contracts.

Nexora Cloud owns cloud-workspace behavior, user-facing file organization, sharing workflows, sync state, and cloud usage presentation.

Product-specific files owned by Office, Photo, Creator, Studio, Nexverse, or other products should be referenced through ownership-aware integrations rather than duplicated.

## 8. Security

Requirements:
- Strong access checks.
- Signed/temporary access for protected objects where applicable.
- Secure upload/download.
- Malware/content scanning integration where required.
- Audit of sharing and access-sensitive actions.
- No private file contents in ordinary logs.
- Safe deletion/recovery semantics.

## 9. AI

AI may assist with:
- File organization suggestions.
- Search.
- Summaries.
- Metadata extraction.
- Duplicate detection suggestions.

AI must not silently delete, move, share, or expose private files.

## 10. Definition of Done

A Cloud feature is complete only when storage ownership, access control, synchronization/conflict behavior, deletion/recovery, privacy, auditability, platform behavior, and failure states are addressed.

## 11. Canonical storage boundary

Nexora Cloud is the canonical user-facing cloud file workspace. It consumes Core's provider-neutral storage primitives and backend storage adapters.

Core owns storage contracts, shared file metadata primitives, authorization hooks and provider boundaries. Cloud owns folders, sharing UX, sync behavior, recovery, storage usage and connected-app file management.

Office, Photo and Launch consume these capabilities where appropriate and must not create parallel cloud storage services.
