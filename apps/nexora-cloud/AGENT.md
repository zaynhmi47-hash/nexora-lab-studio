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