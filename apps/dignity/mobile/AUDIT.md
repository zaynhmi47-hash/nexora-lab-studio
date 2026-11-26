# Dignity Mobile Foundation & UI Audit

## Scope

Dignity is the Expo Router / React Native mobile client for the Nexora education and academic platform. The current stage establishes the parent-app navigation and student learning experience; it is not the final production feature set.

## Product domains

- Learning / e-learning and guided learning paths
- Attendance
- SIAKAD: KRS, grades and academic records
- Research
- Library
- Competencies, evidence and learning portfolio
- Future tutoring / bimbel workflows

## Architecture rules

1. `app/` contains Expo Router routes and navigation composition only.
2. Shared visual primitives live in `components/`; feature logic belongs in feature modules, hooks or provider-neutral libraries.
3. Screens must not import Firebase Admin or other server-only modules.
4. External identity providers stay behind explicit boundaries; Nexora UUID remains the internal identity anchor.
5. Organization-scoped requests must use active organization context and server-side authorization.
6. `EXPO_PUBLIC_*` variables are public client configuration only; no secrets are committed.
7. Shared packages should be extracted only after real duplication appears across multiple apps.
8. Keep Expo SDK and React Native versions aligned with the Finance mobile reference app.

## Current mobile routes

- `/` -> auth-aware redirect
- `/sign-in` -> Nexora account sign-in / registration
- `/(tabs)` -> Home dashboard
- `/(tabs)/learning` -> authenticated course catalog, progress and lesson status
- `/(tabs)/academic` -> academic service hub
- `/(tabs)/profile` -> Nexora identity and learning workspace profile
- `/(tabs)/lesson/[lessonKey]` -> server-backed lesson detail, quiz and completion
- `/(tabs)/journey` -> learning timeline and progress reflection
- `/(tabs)/skills` -> competencies and portfolio foundation

Journey, Skills and Lesson routes are nested in the tab navigator but intentionally hidden from the bottom-tab bar.

## Learning API integration

The mobile client uses the existing authenticated Django endpoints under `/api/v1/learning/`:

- `GET courses/` -> published courses, ordered lessons and locked/completed state
- `GET progress/` -> XP, level, streak and completed lesson keys
- `GET lessons/{lesson_key}/quiz/` -> quiz questions without answer keys
- `POST lessons/{lesson_key}/quiz/complete/` -> server-scored quiz attempt
- `POST lessons/{lesson_key}/complete/` -> idempotent lesson completion and progress update

The API client sends the Firebase ID token through the existing Nexora token port. Learning API responses are plain DRF payloads; the learning adapter also tolerates the shared `{ data }` envelope if one is introduced later.

## Modular lesson content and upload workflow

Learning content is authored as ordered `LearningContentBlock` records attached to a lesson. A lesson can combine any number of blocks without changing mobile screens or database schema:

- `text` -> plain-text explanation or reading section
- `image` -> PNG, JPG, JPEG or WEBP
- `video` -> MP4 resource opened by the device's supported player
- `audio` -> MP3 resource opened by the device's supported player
- `document` -> PDF, PPTX, DOCX, XLSX or TXT
- `link` -> external HTTPS/HTTP learning resource

### Instructor / content-admin upload area

The first upload workspace is the Django Admin, protected by Django staff login and model permissions:

1. Open `/admin/` and sign in with an authorized staff account.
2. Open **Learning lessons** and select the target lesson.
3. Add one or more **Lesson content blocks** in the inline editor.
4. Choose the block type, add its title/body, upload a file or supply an external URL, then set its order.
5. Keep `is_published` disabled while preparing drafts; enable it only when the material is ready for learners.

The dedicated **Learning content blocks** admin list also supports searching, filtering and editing blocks. Uploaded file extensions are allow-listed and the maximum file size is 100 MB. Student API reads only published blocks attached to published lessons and courses.

The mobile lesson screen renders text and images in place. Video, audio, documents and external links open through the device's supported handler. Quiz questions remain a separate lesson kind and retain server-side scoring.

Development uses Django's local `MEDIA_ROOT` and `/media/` route. Before production, configure a durable object-storage backend and private/signed delivery for institutional materials; do not rely on the development media route or ephemeral container storage. Current admin uploads are staff-only; organization-scoped instructor permissions and an in-app/web Content Studio are follow-up work.

## UI implementation notes

- Shared palette, screen layout, cards, tags and progress indicators are in `components/ui.tsx`.
- Home, Learning, Academic, Profile, Journey, Skills and Lesson use a consistent mobile-first visual system.
- Learning catalog, progress, quiz scoring and completion are server-backed. Empty catalogs and API failures have explicit states.
- Quiz answer keys and explanations are not exposed to the client before submission; score and pass status are returned by the server.
- A passed quiz triggers the lesson completion endpoint so the course catalog and progress remain consistent.
- Learning progress is separate from official academic records. Grades, attendance and enrollment remain institution/server-authoritative.
- Academic modules show an institution-not-connected state until real organization membership and academic APIs are available.
- The current organization provider is a foundation and returns no active institution yet.

## Remaining work

1. Validate typecheck, lint and Expo startup in CI/Codespaces; fix any issues before treating this stage as fully validated.
2. Add secure object-storage delivery, organization-scoped instructor permissions, a dedicated Content Studio and persisted written reflections.
3. Implement institution selection and membership loading from the authorized organization API.
4. Connect academic screens to authoritative attendance, KRS, schedule and grade APIs.
5. Add accessible forms, evidence upload, portfolio permissions and research/library workflows.
6. Add interaction and navigation tests plus visual QA on small Android devices.
7. Add EAS configuration only when release builds are required.
