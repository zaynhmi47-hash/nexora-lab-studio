# Dignity — AGENT.md

## 1. Mission
Dignity is Nexora's education and academic platform. It combines learning management with institutional academic operations: courses, lessons, attendance, SIAKAD, KRS, grades, research, library, academic administration, and future tutoring/bimbingan belajar.

## 2. Actors
- students
- teachers/lecturers
- academic administrators
- institution administrators
- researchers
- librarians
- parents/guardians where explicitly supported
- tutors

## 3. Learning features
Courses, modules, lessons, assignments, quizzes, attempts, progress, attendance, certificates, learning paths, recommendations, and tutoring. Academic features include curriculum, enrollment, KRS, classes, schedules, grades, transcripts, research records, and library resources.

## 4. Academic integrity
Official grades, attendance, enrollment, and academic records require strict permissions, history, and auditability. Student-facing edits must not bypass institutional workflows. Draft versus official states must be explicit.

## 5. AI
AI can explain lessons, generate practice questions, summarize material, provide tutoring, and assist educators. AI must not silently change official grades or academic records. Clearly label generated content and provide source/context where appropriate.

## 6. AI-agent instructions
Inspect existing identity, organization, academic, learning, and API modules before creating new models. Avoid mixing learning progress with official academic status. Test role permissions and institutional isolation. Protect student data. Use responsive mobile-first learning interfaces while preserving effective web administration. When implementing attendance/grades/KRS, model state transitions explicitly and audit important changes.
# 7. Detailed product concept

Dignity is Nexora's learning and academic administration platform. It combines everyday learning with institutional academic systems while keeping learning progress separate from official academic records.

Core principle:
Learning activity is not automatically an official academic record.

# 8. Actors and contexts

Actors include students, teachers/lecturers, academic administrators, institution administrators, researchers, librarians, tutors/bimbel staff and parents/guardians where explicitly enabled.

Institution scope must be explicit and server-authorized.

# 9. Learning platform

Keep concepts distinct:
Course → Module → Lesson → Exercise/Assignment/Quiz → Attempt → Progress → Mastery.

Additional concepts may include learning paths, prerequisites, recommendations, certificates, tutoring sessions and resources.

Do not collapse learning into one generic progress field.

# 10. SIAKAD and academic administration

Capabilities include academic year/term, curriculum, programs/classes, course offerings, schedules, enrollment, KRS, attendance, grades, transcripts, academic status and reports.

Official records need explicit lifecycle. Draft, submitted, reviewed, approved/final and corrected states should be modeled where applicable.

# 11. KRS workflow

A KRS-like workflow can be Draft → Submitted → Advisor/Academic Review → Approved → Locked → Amendment/Correction.

The exact policy is institution-configurable. Important transitions require server authorization and audit.

A client must never be able to bypass rules by sending a different status.

# 12. Attendance

Attendance should distinguish session, participant, attendance state, source/method and correction history where needed. Policies such as present, late, excused or absent belong to Dignity/institution configuration.

Corrections to official attendance should preserve history and identify the actor and reason where required.

# 13. Grades and transcripts

Dignity must distinguish draft/calculation state from official grade publication. Post-finalization changes use controlled amendment/correction workflows.

Transcripts must derive from authoritative records and preserve term/program context.

# 14. Research

Research may include projects, proposals, supervisors, milestones, documents, references/datasets where supported, reviews and publication/resource references.

Use Core file/storage primitives while Dignity owns the research workflow.

# 15. Library

Library may provide catalog/search, availability, borrowing/return state and digital resources. Restricted resources require server-side authorization.

# 16. Tutoring/bimbingan belajar

Tutoring may include sessions, tutor assignment, learning goals, attendance and progress. Tutoring progress remains separate from official institutional grades unless an explicit institutional integration defines otherwise.

# 17. Student UX

Suggested navigation:
Home → Courses → Schedule → Attendance → KRS → Grades → Tasks/Quizzes → Research → Library → Tutoring → Profile.

Home should show today's schedule, pending learning tasks, academic deadlines and recent progress without overwhelming the student.

Course pages should distinguish modules, lessons, assignments, quizzes and progress. Completion must not imply an official grade unless the activity is authoritative.

KRS, grades and attendance need clear status labels and confirmation for consequential actions.

# 18. Educator/admin UX

Educator views prioritize today's schedule, classes, attendance queue, grading queue, assignments, student progress and exceptions.

Administrators need curriculum, enrollment, KRS approval, academic records, reporting and institution settings workflows.

Web administration may be denser than mobile. Mobile remains useful for quick attendance, grading review and notifications.

# 19. AI tutor and academic AI

AI may explain lessons, generate practice questions, summarize material, adapt practice, tutor learners, assist educator drafts and summarize progress.

AI must never silently change grades, attendance, KRS, enrollment or official academic records. Generated educational content should be identifiable and reviewable where appropriate.

# 20. Data protection

Student and institutional data require institution isolation, role/object permissions and secure file access. Avoid unnecessary student information in logs, analytics or AI prompts.

Parent/guardian access must be explicitly linked and authorized; never infer the relationship merely from names or email addresses.

# 21. Technology direction

Frontend: Expo, React Native, TypeScript, Expo Router, responsive mobile-first design and effective web administration.

Backend: Django, Django REST Framework, PostgreSQL, Redis/background processing where justified and object storage through shared Core abstractions.

Academic rules belong in backend contracts/domain services, not client-only code.

# 22. Agent ownership

Dignity frontend owns student/educator/admin screens, navigation, learning interactions, local UI state and API consumption. Backend owns learning/academic persistence, workflows, permissions, APIs, jobs and audit. Core owns identity, organization, authorization, files, notifications and generic platform primitives.

Dignity owns KRS, grades, attendance, enrollment, learning progress, research and tutoring semantics. Do not move those rules into Core.

# 23. Definition of done

A Dignity feature is complete only when actor, institution scope, lifecycle, official-vs-draft status, authorization, audit, data protection, mobile/web UX and tests are defined.
