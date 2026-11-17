# Dignity — AGENT.md

## 1. Product mission

Dignity is Nexora's lifelong human-development, learning, and academic platform. Its purpose is to help people move from self-discovery to intentional learning, consistent practice, reflection, improvement, and demonstrable competence throughout life.

Dignity is not merely a course marketplace, LMS, SIAKAD, habit tracker, XP system, or certificate collector. It connects learning and real-world development while preserving the distinction between personal growth evidence and official institutional records.

The canonical product vision is documented in `docs/product/DIGNITY_PRODUCT_VISION.md`. Read it before proposing new product domains or major workflows.

## 2. Product domains

The product is organized into connected but bounded domains:

- **Dignity Learn** — structured and self-directed learning: courses, modules, lessons, exercises, assignments, quizzes, learning paths, tutoring, learning progress, and mastery.
- **Dignity Academic** — formal institutional education: programs, curriculum, classes, schedules, enrollment, KRS, attendance, grades, transcripts, academic status, and institutional reporting.
- **Dignity Grow** — personal development: self-discovery, assessments, goals, habits, reflection, wellbeing practices, skills development, values, purpose, and contribution.
- **Dignity Career** — career exploration, competency evidence, portfolio, employability, professional development, and career planning.
- **Dignity Research** — research projects, proposals, supervision, milestones, documents, references, reviews, and publication/resource records.
- **Dignity AI** — learning and development assistance, tutoring, reflection prompts, adaptive practice, and evidence-aware recommendations.

All domains connect through one **Dignity Profile** that presents a coherent view of a person's learning, capabilities, goals, growth evidence, and (when authorized) academic context. The profile is a unified view, not permission to merge every domain's source records or privacy scopes.

## 3. Human-development pillars

Personal development capabilities should support these ten pillars without reducing a person to a score:

1. Self-discovery and self-awareness.
2. Intellectual development and critical thinking.
3. Skills, competence, and practical mastery.
4. Habits, discipline, and self-management.
5. Emotional and social development.
6. Wellness and healthy living.
7. Creativity and expression.
8. Career, work, and financial capability.
9. Leadership, service, and contribution.
10. Values, meaning, purpose, and spirituality.

Pillars are navigational and developmental lenses, not clinical diagnoses, universal rankings, or mandatory linear levels.

## 4. Dignity Development Engine

Use this recurring development cycle:

**Discover → Assess → Design → Learn → Practice → Reflect → Improve → Demonstrate → repeat.**

- Discover: help a person articulate interests, context, motivations, strengths, and direction.
- Assess: collect appropriate self-assessment and observable evidence with transparent limitations.
- Design: define goals, milestones, learning plans, and practice routines.
- Learn: acquire knowledge and strategies.
- Practice: apply deliberate practice, active recall, spaced repetition, and real-world projects where appropriate.
- Reflect: review experience, obstacles, decisions, and outcomes.
- Improve: adapt goals and strategies based on evidence and reflection.
- Demonstrate: present verifiable work, skill demonstrations, portfolios, or authorized academic achievements.

Support self-regulated learning, metacognition, agency, and sustainable progress. Avoid engagement mechanics that reward empty activity over learning or meaningful outcomes.

## 5. Dignity Profile and evidence

The Dignity Profile is the person's coherent development view. It may aggregate references and summaries from Learn, Academic, Grow, Career, and Research subject to each domain's authorization and consent rules.

Keep evidence provenance explicit:
- self-reported reflection is not verified competence;
- course completion is not automatically mastery;
- practice activity is not an official grade;
- AI-generated interpretation is not objective fact;
- official academic records must retain institutional authority.

Never silently convert one evidence type into another.

## 6. Actors and contexts

Support learners, students, teachers/lecturers, academic administrators, institution administrators, researchers, librarians, tutors, workers, professionals, entrepreneurs, creators, and general users. Parents/guardians may access information only where explicitly linked and authorized.

Institution scope must be explicit and server-authorized. Personal development data must not become institution-visible merely because a user is enrolled in that institution.

## 7. Learning and pedagogy

Keep concepts distinct:

Course → Module → Lesson → Exercise/Assignment/Quiz → Attempt → Progress → Mastery.

Use evidence-informed learning approaches such as retrieval practice/active recall, spaced repetition, deliberate practice, reflection, and learner goal-setting when appropriate. Do not collapse learning into one generic progress field.

Courses, modules, lessons, assignments, quizzes, attempts, progress, certificates, learning paths, recommendations, tutoring, and mastery each have distinct semantics and lifecycle.

## 8. Academic administration and integrity

Academic is the formal institutional domain. Capabilities include academic year/term, curriculum, programs/classes, course offerings, schedules, enrollment, KRS, attendance, grades, transcripts, academic status, research records, library resources, and reporting.

Learning activity is not automatically an official academic record.

Official grades, attendance, enrollment, and academic records require strict permissions, lifecycle, history, and auditability. Draft versus official states must be explicit. Post-finalization changes use controlled amendment/correction workflows. Transcripts derive from authoritative records and preserve term/program context.

A KRS-like workflow may be Draft → Submitted → Advisor/Academic Review → Approved → Locked → Amendment/Correction. Exact policy is institution-configurable. A client must never bypass rules by sending a different status.

Attendance must distinguish session, participant, state, source/method, and correction history. Institutional policies determine present, late, excused, and absent states.

## 9. Grow and personal development safeguards

Goals, habits, reflections, self-assessments, and wellbeing practices belong to Grow unless a clear domain contract says otherwise. Do not make sensitive journals or health-related entries institution-visible by default.

Personal growth indicators are contextual aids, not a single score of human worth. Users should be able to understand, correct, export, and control appropriate personal data.

Dignity is not a clinical diagnostic product. AI and assessments must not present psychological or medical diagnoses. Interpretations must be framed as hypotheses or reflective prompts, not definitive labels.

## 10. Career and Research

Career may connect demonstrated skills, projects, portfolios, work experience, goals, and opportunities. Preserve provenance and distinguish self-reported claims from reviewed or verified evidence.

Research may include projects, proposals, supervisors, milestones, documents, references/datasets where supported, reviews, and publication/resource references. Use Core file/storage primitives while Dignity owns research workflow semantics.

## 11. AI

AI may explain lessons, generate practice questions, summarize material, adapt practice, tutor learners, support reflection, help educators draft materials, and summarize progress.

AI must not silently change grades, attendance, KRS, enrollment, or official academic records. Generated educational content and AI interpretations should be identifiable and reviewable where appropriate. Avoid unnecessary sensitive personal data in prompts, logs, and analytics. Do not represent AI suggestions as professional diagnosis or verified evidence.

## 12. Library and tutoring

Library may provide catalog/search, availability, borrowing/return state, and digital resources. Restricted resources require server-side authorization.

Tutoring/bimbingan belajar may include sessions, tutor assignment, learning goals, attendance, and progress. Tutoring progress remains separate from official institutional grades unless an explicit institutional integration defines otherwise.

## 13. UX principles

Student/learner experience should make the next meaningful action clear without reducing development to streaks or XP. A home view may combine today's learning, goals, practice, reflections, relevant academic deadlines, and recent evidence according to user context and permissions.

Academic student navigation may include Home, Courses, Schedule, Attendance, KRS, Grades, Tasks/Quizzes, Research, Library, Tutoring, and Profile. Grow should have its own intentional experience for discovery, goals, habits, reflection, skills, and progress.

Educator views prioritize schedule, classes, attendance queue, grading queue, assignments, student learning progress, and exceptions. Administrators need curriculum, enrollment, KRS approval, academic records, reporting, and institution settings. Web administration may be denser than mobile; mobile remains useful for quick attendance, grading review, learning, and reflection.

Consequential actions need clear status labels and confirmation. Do not expose private Grow data through academic dashboards.

## 14. Technology and architecture

- Frontend: Expo, React Native, TypeScript, Expo Router, responsive mobile-first design, and effective web administration.
- Backend: Django, Django REST Framework, PostgreSQL as source of truth; Redis/background processing where justified; object storage through shared Core abstractions.
- Identity: Nexora Identity UUID is the internal identity anchor; external identity providers stay behind explicit boundaries.
- Architecture: Modular Monolith → Service-Ready. Domain rules live in backend contracts/services, not client-only code.
- Core owns generic identity, organization, authorization, files, notifications, and platform primitives.
- Dignity owns learning, academic, Grow, Career, Research, and tutoring semantics. Do not move product-specific rules into Core.

## 15. Data protection and authorization

Student and institutional data require institution isolation, role/object permissions, secure file access, and audit. Personal development data requires separate privacy scopes and purpose limitation. Avoid unnecessary personal information in logs, analytics, or AI prompts.

Parent/guardian access must be explicitly linked and authorized; never infer the relationship from names or email addresses. An active organization context does not grant access to every record or every domain.

## 16. AI-agent implementation instructions

Before creating models or endpoints:
1. Read this file and the canonical product vision.
2. Inspect existing identity, organization, access, academic, learning, profile, and API modules.
3. Identify the owning domain and authoritative source of truth.
4. Define actor, scope, lifecycle, evidence type, privacy classification, and audit requirements.
5. Keep learning progress separate from official academic status and personal reflection separate from institution records.
6. Test role permissions, object-level access, institution isolation, and privacy boundaries.
7. Preserve responsive mobile learning and effective web administration.
8. Avoid duplicating Core capabilities or creating parallel canonical records.

## 17. Definition of done

A Dignity feature is complete only when its product purpose, actor, domain ownership, institution/personal scope, lifecycle, evidence provenance, official-vs-draft status (where applicable), authorization, privacy, audit, mobile/web UX, API contract, and tests are defined.
