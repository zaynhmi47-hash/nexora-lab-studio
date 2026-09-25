# Portfolio Website — AGENT.md

## 1. Mission
Personal professional website for job applications, freelance opportunities, project presentation, skills, experience, services, and personal branding.

## 2. Content
About/profile, skills, experience, selected projects, case studies, services, contact, resume/CV, links, and optional blog/content.

## 3. Design principles
Fast, accessible, responsive, professional, easy to update, and optimized for mobile. Project case studies should communicate problem, contribution, technology, implementation, and result without exposing confidential information.

## 4. AI-agent instructions
Never expose private client data, credentials, internal repository links, API keys, or confidential architecture. Optimize assets and performance. Validate contact forms and protect against spam. Keep content separated from presentation so updates are easy.

## 5. Nexora relationship
The portfolio may showcase Nexora products, but only public-safe information should be published. Internal Core architecture and private repository details remain private.

# Detailed Product Concept — Portfolio Website

## 1. Product Positioning

Portfolio Website is Nexora's professional/public presentation surface for showcasing a person, creator, freelancer, developer, studio, or selected work.

It is primarily a presentation and discovery product, not a CRM, project-management system, social network, or financial application.

## 2. Core Domains

Initial domains:
- Profile/identity presentation.
- About.
- Skills.
- Experience.
- Education.
- Services.
- Portfolio projects.
- Case studies.
- Publications/content references.
- Testimonials where applicable.
- Contact/inquiry.
- Social/external links.
- SEO metadata.
- Analytics where explicitly enabled.

The portfolio should reference canonical records from Creator, Studio, Social, Education, or other products instead of duplicating authoritative data when practical.

## 3. Portfolio Project Model

A project presentation may contain:
- Title.
- Summary.
- Problem/context.
- Role.
- Technologies/skills.
- Process.
- Results/outputs.
- Media.
- Links.
- Dates.
- Collaborators/attribution where applicable.

Claims about results should be sourced or user-provided; the system must not fabricate metrics or client endorsements.

## 4. Public and Private Content

Content visibility should support:
- Public.
- Unlisted/private.
- Authenticated/shared access where justified.

Private portfolio drafts must never be indexed or exposed as public content.

## 5. UX and Navigation

Typical public navigation:

Home → About → Work/Projects → Services → Experience → Publications → Contact

The presentation should be responsive, fast, accessible, and optimized for mobile and desktop.

A creator/freelancer version may emphasize work and services; a developer version may emphasize technical projects; a studio version may emphasize case studies and capabilities.

## 6. Publishing Workflow

For editable portfolio content:

Draft → Preview → Publish → Update → Unpublish/Archive

Publishing should be explicit.

If a portfolio references content from another Nexora product, the system must handle deleted/unpublished source records safely rather than showing stale or unauthorized content.

## 7. Backend Relationship

A portfolio can often be static or client-heavy and may not need a custom backend.

Use backend/Core when required for:
- Authenticated editing.
- Draft synchronization.
- Contact/inquiry submission.
- Private projects.
- Analytics.
- Content references.
- File metadata.

Nexora Core owns identity, storage, and shared access primitives.

Nexora Creator owns creator-specific operational records; Studio owns project execution; Social owns social relationships; CRM owns customer pipeline.

The portfolio is a presentation layer and should not create competing canonical versions of those domains.

## 8. Contact and Inquiry

Contact forms should:
- Validate input.
- Apply spam/rate controls.
- Protect recipient information.
- Provide clear success/failure states.
- Avoid exposing private email addresses where unnecessary.

If inquiries become customer pipeline records, hand them to CRM through an explicit integration rather than maintaining a second sales pipeline.

## 9. AI

AI may assist with:
- Drafting bios.
- Case-study structure.
- Project descriptions.
- SEO metadata drafts.
- Content refinement.

AI-generated claims must be reviewed before publishing. It must not invent work history, qualifications, clients, certifications, metrics, testimonials, or project outcomes.

## 10. Security and Performance

Requirements:
- Secure editing/authentication.
- Safe media handling.
- Form abuse protection.
- Minimal personal-data collection.
- No private draft leakage.
- Image optimization.
- Fast page loading.
- Accessible semantic markup.
- SEO correctness.
- Reliable social/share metadata.

## 11. Definition of Done

A portfolio feature is complete only when public/private visibility, source ownership, publishing lifecycle, responsive UX, accessibility, SEO, security, contact abuse protection, and tests are addressed.
