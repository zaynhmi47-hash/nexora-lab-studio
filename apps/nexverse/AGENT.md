# Nexverse — AGENT.md

## 1. Mission
Nexverse is Nexora's digital content ecosystem for books, PDFs, novels, articles, video, music, educational media, and creator publishing.

## 2. Core concepts
- creator/author identity
- works and editions
- chapters/episodes/tracks
- drafts and publication states
- metadata and categories
- rights/ownership
- access entitlements
- premium/subscription
- chapter-level monetization
- advertising
- consumption analytics
- creator revenue and royalties
- reporting/moderation/takedown

## 3. Rights and access
Separate ownership from permission to consume content. Never infer that uploading content grants unlimited platform rights. Protected media should use controlled/signed delivery. Entitlements must be checked server-side.

## 4. Monetization
Premium access, ads, chapter unlocks, subscriptions, and creator royalties must be represented as auditable business events. Royalty calculations must be deterministic and versioned so historical payouts remain reproducible.

## 5. AI-agent instructions
Reuse Nexora Creator, Finance, Files, Identity, and Core where appropriate. Do not duplicate creator profiles or payment ledgers. Add moderation and copyright/reporting hooks to content workflows. Test entitlement expiration, refunds, partial access, unpublished content, and creator ownership boundaries.

## 6. UX
Make discovery, reading/watching/listening, library, downloads where legally permitted, and creator publishing distinct but connected experiences. Do not expose private drafts or restricted media through client-side-only checks.

# Detailed product concept

Nexverse is the media and publishing platform for books, PDFs, novels, articles, video, music and educational media. It connects creators, publishers and audiences while separating content ownership, rights, publication state, monetization and consumption entitlements.

## Product domains

- Catalog/content: works, editions, chapters, assets, metadata, categories and search.
- Publishing: draft → review → scheduled → published → corrected/updated → archived.
- Creator/publisher operations: profiles, works, collaborators, submissions, approvals and analytics.
- Consumption: library, bookmarks, reading/watching/listening progress, recommendations and history.
- Monetization: free/premium access, chapter-level purchase/entitlement, subscriptions where implemented, ads and revenue/royalty records.
- Rights and safety: ownership claims, licensing metadata, takedown/correction workflow and moderation.

## UX/navigation

Suggested shell: Home → Discover → Library → Books → Video → Music → Following → Creator/Publisher → Premium/Wallet → Notifications → Profile.

Content detail must clearly show access state, price where applicable, creator/publisher attribution, edition/version and availability. Reader/player UX should preserve progress and work across supported devices.

Creator workspace should prioritize drafts, review status, scheduled releases, audience analytics, earnings/royalties and rights issues.

## Content integrity

Never fabricate sources, authorship, licensing or publication metadata. UGC, editorial, sponsored and generated content must have distinguishable workflows where relevant. Corrections should preserve publication history. AI-generated material must be handled according to product policy and never falsely represented as human-authored.

## Payments and entitlements

Nexverse owns content-access semantics, not generic payment infrastructure. Payment completion does not automatically mean unrestricted access: entitlement rules determine the purchased scope, expiry and revocation behavior. Webhooks must be verified and idempotent. Financial accounting remains Finance-owned.

## AI

AI may assist discovery, summaries, translation, metadata drafts, creator assistance and study/media interactions. AI cannot silently publish, alter rights, delete works or execute financial actions.

## Security and ownership

Private drafts, paid content and creator financial information require server-side authorization. Signed/temporary access should protect restricted assets. Audit publication, rights, moderation, entitlement and payout-sensitive actions.

## Agent ownership

Frontend owns catalog/readers/players/creator UI and client state. Backend owns content metadata, publication workflows, entitlement checks, moderation workflows, APIs and jobs. Core owns identity, organizations, authorization, files, notifications and generic payment primitives. Do not duplicate those foundations.

## Definition of done

Every feature must define content scope, publication state, rights/access rules, monetization implications, moderation behavior, responsive UX, errors/loading/empty states, audit needs and tests.