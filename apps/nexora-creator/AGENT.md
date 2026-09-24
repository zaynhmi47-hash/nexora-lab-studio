# Nexora Creator — AGENT.md

## 1. Mission
Nexora Creator is the creator identity, publishing, portfolio, service, audience, and monetization layer for teachers, writers, freelancers, artists, and digital creators.

## 2. Domains
Profiles, portfolios, content, publications, services, offerings, orders, audience, analytics, earnings, payouts, collaborations, and creator settings.

## 3. Ecosystem links
Creator can connect to Nexverse for digital content, Social for audience/community, Studio for services/projects, and Finance for earnings. Avoid duplicating those domains.

## 4. Ownership
Creators must control their published content, metadata, monetization settings, and visibility. Content ownership and platform license must be distinct.

## 5. AI-agent instructions
Use existing Core/Finance/Files/Identity abstractions. Do not create ad-hoc payout ledgers. Test publication permissions, ownership transfer, deletion, revenue calculations, refunds, and account suspension. Protect private drafts and payout information.

## 6. Product principles
Make monetization understandable. Show creators why a balance or revenue figure changed. Keep analytics useful without exposing private audience information.

# Detailed Product Concept — Nexora Creator

## 1. Product Positioning

Nexora Creator is a creator operating system for people who teach, write, design, make art, publish content, freelance, or provide professional creative services.

It combines creator identity, portfolio, content orchestration, services, audience, analytics, earnings, and collaborations while integrating with other Nexora products without duplicating their canonical domains.

## 2. Creator Types

The product should support:
- Teachers and educators.
- Writers and authors.
- Designers and artists.
- Video/audio creators.
- Freelancers.
- Consultants.
- Developers.
- Independent professionals.
- Other legitimate creator/professional categories.

Creator type changes presentation and capabilities, not the underlying identity model.

## 3. Core Domains

### Creator Identity
- Creator profile.
- Bio and expertise.
- Public links.
- Professional information.
- Verification/status where implemented.

### Portfolio
- Work samples.
- Case studies.
- Publications.
- Skills.
- Featured projects.
- Privacy controls.

### Content
Creator can organize content that may be published through the appropriate Nexora product.

Creator must not duplicate canonical content storage owned by Nexverse, News, Social, Education, or another publishing domain. It should reference and orchestrate those assets when integration exists.

### Services
Creators can define:
- Service offerings.
- Packages.
- Pricing references.
- Availability.
- Requirements.
- Delivery expectations.

### Orders and Commissions

Typical lifecycle:

Inquiry → Proposal → Accepted → In Progress → Review → Delivered → Completed

Cancellation/dispute paths must be explicit and auditable.

### Audience
- Followers/audience.
- Audience activity.
- Engagement summaries.
- Communication/notifications where supported.

### Analytics
Provide useful creator analytics such as:
- Content performance.
- Audience growth.
- Portfolio visits.
- Service inquiries.
- Conversion summaries.
- Revenue summaries.

Analytics must identify their source and time period.

### Earnings
Show:
- Earnings summaries.
- Pending amounts.
- Payout status.
- Transaction references.

Finance remains the canonical monetary source of truth.

### Collaboration
Support creator collaborations, shared projects, attribution, and responsibilities without replacing Studio's full project-management model.

## 4. UX and Navigation

Primary shell:

Home / Dashboard → Profile → Portfolio → Content → Services → Orders → Audience → Analytics → Earnings → Collaborations → Settings

The creator dashboard should emphasize actionable work:
- Pending inquiries.
- Orders needing attention.
- Content awaiting publication/review.
- Audience changes.
- Analytics snapshots.
- Earnings/payout status.

## 5. Integrations

Potential integrations:
- Nexverse for books, PDFs, video, music, and other publishing.
- Nexora Social for networking and audience.
- Nexora Studio for managed service projects.
- Nexora Finance for monetary records.
- Nexora Education/Dignity for educational content where appropriate.

Integrations must use explicit contracts and ownership boundaries.

## 6. AI

AI may assist with:
- Profile copy.
- Portfolio descriptions.
- Content drafts.
- Service descriptions.
- Proposal drafts.
- Analytics summaries.
- Content planning.

AI must not silently publish content, accept orders, alter prices, initiate payouts, or make contractual commitments.

## 7. Rights and Attribution

Creator-owned work must preserve:
- Creator attribution.
- Ownership/rights metadata where applicable.
- Publication relationship.
- Version/history where required.
- Removal/takedown workflow where applicable.

Do not infer ownership merely from upload.

## 8. Backend Relationship

Backend owns creator-domain state, service offerings, order workflows, creator-specific analytics projections, collaborations, and integration references.

Nexora Core owns identity, authorization, files, notifications, and audit primitives.

Nexverse/News/Education/Social remain canonical for content or social objects they own.

Finance remains canonical for financial transactions.

## 9. Security

Requirements:
- Creator/private portfolio visibility.
- Buyer/client scoped access.
- Secure asset access.
- Order authorization.
- Audit of sensitive workflow transitions.
- No financial secrets in logs.
- Safe handling of uploaded creator assets.

## 10. Definition of Done

A Creator feature is complete only when ownership, attribution, privacy, workflow transitions, integration boundaries, financial references, permissions, auditability, tests, and responsive UI behavior are covered.
