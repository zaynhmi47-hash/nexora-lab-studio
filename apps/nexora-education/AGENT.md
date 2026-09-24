# Nexora Education — AGENT.md

## 1. Mission
Nexora Education is a broad learning super-app for language learning, STEM, programming, courses, AI tutoring, adaptive learning, quizzes, gamification, and structured learning paths.

## 2. Learning model
Represent skills, courses, modules, lessons, exercises, attempts, mastery, prerequisites, learning paths, and progress separately. This enables adaptive learning without coupling content to one presentation.

## 3. AI tutor
The tutor can explain, quiz, give hints, summarize, and recommend practice. It should adapt to demonstrated learning progress rather than simply generating answers.

## 4. Gamification
Points, streaks, levels, badges, and leaderboards are optional engagement mechanisms. They must not replace actual learning progress or create misleading mastery claims.

## 5. AI-agent instructions
Reuse Dignity/Core primitives where the domains genuinely overlap. Protect learner records. Validate generated exercises. Avoid unsafe or misleading educational claims. Test progress calculations, repeated attempts, offline interruption, and entitlement boundaries.

## 6. UX
Learning should work well on phones and web. Keep sessions short and recoverable. Provide accessible text, audio, and visual alternatives where practical.

# Detailed product concept

Nexora Education is the broad consumer learning platform for languages, STEM, programming, courses, quizzes, adaptive learning and AI tutoring. It complements Dignity: Education focuses on learning experiences and skill mastery, while Dignity owns institutional academic records.

## Learning model

Keep these concepts separate: Skill → Course → Module → Lesson → Exercise/Quiz → Attempt → Mastery → Learning Path → Progress. Prerequisites and mastery rules must be explicit rather than inferred from arbitrary completion flags.

## Learning experiences

Support structured courses, bite-sized practice, language learning, STEM/programming exercises, assessments, adaptive recommendations, study paths, streaks and gamification. Gamification should reinforce learning rather than replace mastery.

## AI tutor

AI may explain concepts, provide hints, generate practice, adapt difficulty, review answers and create study plans. It should distinguish hints from final answers where pedagogically useful and avoid presenting uncertain generated facts as authoritative.

## UX/navigation

Suggested shell: Home → Learn → Courses → Practice → Paths → Challenges → Progress → Library → AI Tutor → Profile.

Home should surface today's learning plan, continue-learning action, due practice and progress. Course pages should make prerequisites, lesson sequence, mastery and assessment state visible.

Practice should give immediate feedback while preserving attempt history. Progress should distinguish activity/completion from demonstrated mastery.

## Assessments and integrity

Attempts, scores and mastery should have clear ownership and lifecycle. High-stakes institutional grades are not owned here unless explicitly integrated with Dignity. Do not write to Dignity's official academic records directly from client code.

## Content and creators

Courses may be created by Nexora or approved creators/educators. Content versioning should preserve changes that affect learner progress. Restricted content requires authorization.

## Agent ownership

Frontend owns learning UI, exercises, progress presentation and local interaction state. Backend owns learning models, mastery calculation, assessments, recommendations and APIs. Core owns identity, organization, authorization, files and notifications. Dignity owns official institutional records.

## Definition of done

Every learning feature must define the learning object, mastery/progress semantics, assessment integrity, accessibility, offline/loading/error states and data ownership.