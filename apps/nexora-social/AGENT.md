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

# Detailed Product Concept — Nexora Social

## 1. Product Positioning

Nexora Social is Nexora's general social and professional networking product. It provides a controlled environment for personal identity, professional identity, publishing, networking, communities, messaging, and portfolio presentation.

It is not the canonical HR system, CRM, dating system, or project-management system. It may integrate with those products, but each specialized product remains authoritative for its own domain.

## 2. Core Product Areas

### Identity and Profiles
- User-facing profile with name, avatar, biography, links, interests, skills, and selected professional information.
- Professional identity can include experience, expertise, education, portfolio references, and public achievements.
- Profile visibility must be explicit and configurable.

### Publishing
Users can create:
- Text posts.
- Image/video/media posts.
- Links and references.
- Professional updates.
- Announcements and community posts.

Content lifecycle should support draft, published, edited, hidden, reported, moderated, and removed states where appropriate. Moderation actions must remain auditable.

### Feed and Discovery
- Personalized feed based on legitimate product signals such as follows, connections, communities, and user-selected interests.
- Discover/search for people, posts, communities, and professional portfolios.
- Recommendations must not rely on hidden sensitive-attribute profiling.

### Network
Support:
- Follow/unfollow.
- Connection requests and acceptance.
- Mutual connections.
- Professional networking.
- Mute/restrict/block.

### Messaging
- One-to-one conversations.
- Group conversations where implemented.
- Message requests and privacy controls.
- Abuse/report/block controls.
- Delivery/read state only where product requirements justify it.

### Communities
- Groups/communities with owners, moderators, members, rules, posts, and moderation.
- Public, private, or restricted membership models.
- Community-level content visibility must be enforced server-side.

### Portfolio
Users may present selected work, skills, publications, projects, and external links. Portfolio presentation is not a replacement for Nexora Creator or Nexora Studio's canonical operational records.

## 3. Privacy and Visibility

Every user-generated object must have an explicit visibility model where relevant:
- Public.
- Connections/followers.
- Community members.
- Organization-scoped.
- Private.

Visibility is a backend authorization rule, not merely a frontend filter.

The product must provide:
- Block.
- Mute/restrict.
- Report.
- Privacy settings.
- Profile discoverability controls.
- Messaging controls.
- Content audience controls.

No hidden shadow profiles or sensitive-attribute inference should be introduced.

## 4. UX and Navigation

Primary shell:

Home / Feed → Discover / Search → Network → Messages → Communities → Profile / Portfolio → Notifications → Settings

The UI should remain usable on mobile and web, with consistent interaction semantics.

Important states:
- Loading.
- Empty feed.
- Empty network.
- Pending connection.
- Restricted content.
- Removed/moderated content.
- Blocked user.
- Failed media upload.
- Offline/intermittent connectivity.

## 5. Backend Relationship

Frontend owns screens, components, navigation, local presentation state, API client integration, and accessibility.

The Nexora backend owns:
- Social domain models.
- Posts and media metadata.
- Feed/query APIs.
- Connections/follows.
- Messaging state.
- Communities.
- Visibility and authorization.
- Moderation/reporting.
- Notifications/events.
- Audit records for security-sensitive actions.

Nexora Core owns shared identity, authorization primitives, files/storage abstractions, notifications primitives, audit primitives, and other cross-product capabilities.

Do not duplicate Core identity or create a second canonical user system.

## 6. AI

AI may assist with:
- Drafting or rewriting posts.
- Summarizing long discussions.
- Profile/portfolio copy suggestions.
- Content organization.
- Search assistance.
- Moderation assistance.

AI must not silently publish, send messages, accept connections, alter privacy settings, or perform external social actions without explicit authorization.

AI recommendations should be explainable at an appropriate product level and should avoid manipulative engagement patterns.

## 7. Security and Moderation

Security requirements include:
- Server-side authorization for every private object.
- Rate limiting for messaging, follows, posts, and reports.
- Abuse/spam controls.
- Secure media access.
- Auditability of moderation and account-security events.
- No sensitive user data in ordinary logs.
- Safe handling of user-generated content.

## 8. Domain Boundaries

Do not make Nexora Social the source of truth for:
- Employment records → Nexora HR.
- Sales/customer pipeline → Nexora CRM.
- Creator operational publishing → Nexora Creator/Nexverse where applicable.
- Dating-specific matching → Dating Social Professional.
- Financial ledger → Nexora Finance.
- Shared identity → Nexora Core.

## 9. Definition of Done

A Social feature is complete only when its audience/visibility rules, authorization, moderation implications, loading/empty/error states, notifications where relevant, audit requirements, tests, and mobile/web behavior have been addressed.

## 10. Canonical networking boundary

Nexora Social is the canonical general social and professional networking layer.

It owns:
- general social profiles and visibility;
- professional identity presentation used for networking;
- social/professional connections and follows;
- communities and social messaging;
- social moderation and relationship controls.

The Dating Social Professional product must not create a second professional-networking system. It may consume/reuse professional identity and networking primitives from Social while owning its separate dating context, dating preferences, matches and dating-specific safety workflows.

Do not expose dating-context information through Social unless an explicit user-controlled integration permits it.
