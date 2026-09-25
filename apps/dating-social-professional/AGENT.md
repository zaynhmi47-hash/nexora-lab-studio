# Dating / Social-Professional App — AGENT.md

## 1. Mission
Experimental social product combining personal connection and professional/social networking concepts: profiles, discovery, messaging, connections, and relationship-oriented interactions.

## 2. Product boundary
Personal connection and professional networking should have distinct contexts, visibility rules, and user expectations. Do not automatically merge sensitive personal information into professional profiles.

## 3. Safety
Privacy, consent, blocking, reporting, moderation, anti-spam, account security, and abuse response are core requirements. User-controlled visibility is mandatory.

## 4. AI-agent instructions
Do not infer sensitive attributes for matching without explicit lawful product requirements. Do not use private messages for hidden profiling. Recommendation systems must respect blocks, exclusions, privacy settings, and safety controls. Test harassment/reporting/block flows.

## 5. UX
Make identity, context, visibility, and connection intent clear. Provide simple controls to block, report, hide, disconnect, and manage notifications.

# Detailed Product Concept — Dating Social Professional

## 1. Product Positioning

Dating Social Professional is a distinct social product combining relationship-oriented social discovery with professional networking capabilities where appropriate. Its dating and professional contexts must remain clearly separated so that actions, recommendations, privacy, and profile presentation do not become ambiguous.

The product must never assume that a user's professional identity implies dating intent, or that dating activity should be exposed to professional connections.

## 2. Core Domains

Initial domains:
- Personal profile.
- Professional profile.
- Dating preferences.
- Discovery.
- Matches/connections.
- Messaging.
- Professional networking.
- Communities/events where appropriate.
- Privacy controls.
- Blocking/reporting.
- Safety/moderation.
- Notifications.

Dating identity and professional identity may share a Nexora Core account anchor, but visibility and audience are separate product concerns.

## 3. Profile and Context Separation

Users may maintain:
- Personal/dating presentation.
- Professional presentation.
- Shared basic identity information only where explicitly configured.

Dating preferences must not be exposed to professional audiences.

Professional information must not automatically become part of dating discovery unless the user chooses to display it.

## 4. Discovery and Matching

Dating discovery may use explicit preferences and permitted product signals.

Professional discovery may use:
- Skills.
- Industry.
- Role.
- Interests.
- Portfolio references.
- Communities.
- Explicit networking goals.

The system must clearly identify which context a recommendation belongs to.

Do not infer sensitive attributes or hidden romantic preferences.

## 5. Match and Connection Lifecycle

Dating:
Discovery → Like/Interest → Mutual Match → Conversation → User-controlled next step

Professional:
Discover → Connect/Follow → Accepted/Following → Collaboration/Networking

Users must be able to decline, disconnect, mute, or block without creating confusing cross-context effects.

## 6. Messaging

Messaging must enforce:
- Context-aware privacy.
- Message-request controls.
- Block/mute/restrict.
- Abuse reporting.
- Rate limits.
- Secure delivery.

A professional connection must not automatically gain access to dating conversations or private dating profile information.

## 7. Safety and Moderation

Safety is a primary product requirement:
- Block.
- Report.
- Mute/restrict.
- Spam/abuse detection.
- Moderation workflows.
- Account-security controls.
- Safe defaults for profile discovery.
- Clear reporting outcomes where policy permits.

The system should not expose private contact details merely because users matched.

## 8. UX and Navigation

Primary shell:

Home → Dating → Network → Discover → Messages → Matches/Connections → Communities → Profile → Notifications → Settings

The UI must make dating and professional contexts visually and behaviorally distinguishable.

## 9. Backend Relationship

Backend owns:
- Dating preferences and discovery state.
- Match/connection state.
- Context-specific profiles.
- Messaging authorization.
- Reports/moderation.
- Privacy rules.
- Safety events.

Nexora Core owns identity, authorization primitives, files, notifications, and audit infrastructure.

Nexora Social may provide general social primitives where explicitly shared, but dating-specific matching remains this product's domain.

HR owns employment truth, CRM owns customer relationships, and Creator owns creator-business operations.

## 10. AI

AI may assist with:
- Profile writing.
- Conversation drafting.
- Professional profile suggestions.
- Discovery explanations.
- Safety/moderation assistance.

AI must not autonomously send romantic or professional messages, manipulate users into engagement, expose private information, or infer sensitive personal attributes.

Recommendations should not be presented as objective judgments about a person's value or compatibility.

## 11. Privacy

Requirements:
- Context-specific visibility.
- Explicit discovery controls.
- Private messaging.
- Block propagation.
- Data minimization.
- No hidden cross-context profiling.
- No silent sharing between dating and professional surfaces.

## 12. Definition of Done

A feature is complete only when context separation, privacy, authorization, safety/moderation, block/report behavior, messaging controls, AI boundaries, accessibility, and tests are addressed.
