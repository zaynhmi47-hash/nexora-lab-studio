# Nexora Study / Student — AGENT.md

## 1. Mission
Nexora Study is a lightweight student productivity utility: GPA/IPK calculator, study timer, timetable, task planning, and student tools.

## 2. Scope boundary
This is not the official academic system. Institutional records belong to Dignity. Local planning data should remain user-controlled.

## 3. Features
- configurable grading scales
- GPA/IPK calculations
- subjects/courses
- study sessions
- timers
- schedules
- tasks
- reminders
- export/import

## 4. AI-agent instructions
Prefer local-first storage. Do not require a backend for simple utilities. Make academic formulas configurable because institutions differ. Test rounding and credit-weight calculations. Never present local calculations as official institutional grades.

## 5. UX
Optimize for quick daily use. Preserve data across sessions. Make timer interruptions and notification permissions predictable. Provide accessible controls and responsive layouts.

# Detailed Product Concept — Nexora Study

## 1. Product Positioning

Nexora Study is a focused study and productivity environment for learners who need planning, note-taking, revision, practice, focus, and progress tracking.

It complements Nexora Education and Dignity rather than replacing them:
- Nexora Education is the broad learning/content platform.
- Dignity is institutional academic administration and formal learning records.
- Nexora Study is the learner's personal study workspace.

## 2. Core Domains

Initial domains:
- Study dashboard.
- Subjects/topics.
- Study plans.
- Notes.
- Flashcards.
- Practice/revision sessions.
- Tasks and assignments.
- Focus sessions.
- Study calendar.
- Personal progress.
- Saved resources.
- Goals and streaks where useful.

Personal study data must remain separate from official institutional grades and transcripts.

## 3. Study Model

A flexible structure may be:

Subject → Topic → Resource → Note/Flashcard → Practice Session → Progress

Plans may contain:
- Goal.
- Subject/topic.
- Target date.
- Planned sessions.
- Tasks.
- Review schedule.

The model must not assume every learner follows the same academic structure.

## 4. UX and Navigation

Primary shell:

Home → Subjects → Planner → Notes → Flashcards → Practice → Focus → Calendar → Progress → Settings

The home dashboard should surface:
- Today's plan.
- Overdue tasks.
- Upcoming assessments.
- Suggested review.
- Current focus session.
- Progress toward personal goals.

## 5. Notes and Resources

Notes should support:
- Text.
- Structured sections.
- Attachments/references where supported.
- Tags.
- Search.
- Pin/archive.
- Optional linking to subjects/topics.

The product should preserve user content and avoid destructive transformations.

## 6. Flashcards and Revision

Revision should support:
- Card creation/editing.
- Decks.
- Review sessions.
- Difficulty/self-rating.
- Scheduling logic where implemented.
- Progress statistics.

If spaced repetition is implemented, the scheduling algorithm must be deterministic, tested, and versioned so behavior changes do not silently invalidate historical data.

## 7. Focus and Productivity

Focus mode may include:
- Timed sessions.
- Breaks.
- Session history.
- Distraction-reduction UI.
- Optional task linkage.

The feature should encourage healthy study routines without making unsupported health claims.

## 8. Backend Relationship

Personal study state may be stored locally first for simple/offline workflows.

Backend owns authenticated synchronization, shared study resources, cross-device data, and server-authoritative data where required.

Nexora Core owns identity, storage abstractions, notifications, and common audit primitives.

Nexora Education owns canonical course/learning-content data. Dignity owns official academic records.

## 9. AI

AI may help:
- Explain concepts.
- Generate practice questions.
- Summarize user-provided notes.
- Build study plans.
- Generate flashcard drafts.
- Identify gaps in study coverage.

AI-generated material must be presented as generated assistance, not automatically treated as authoritative educational content.

Do not silently alter grades, official academic records, or assessment submissions.

## 10. Privacy and Security

Study notes can contain personal or academic information. Requirements:
- Private-by-default personal notes.
- Explicit sharing controls.
- Secure attachments.
- No sensitive content in ordinary logs.
- Server-side authorization for synchronized data.

## 11. Definition of Done

A Study feature is complete only when offline behavior, synchronization semantics, privacy, content preservation, scheduling correctness, accessibility, notifications where relevant, and tests are covered.
