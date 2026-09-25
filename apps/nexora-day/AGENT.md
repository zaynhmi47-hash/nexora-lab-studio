# Nexora Day — AGENT.md

## 1. Mission
Nexora Day is a simple daily-life companion for routines, tasks, reminders, habits, lightweight planning, and personal organization.

## 2. Architecture
Local-first by default. Optional cloud sync should be a separate layer. Notifications require explicit permission. Avoid dependence on the broader backend for basic daily functions.

## 3. Features
Daily agenda, tasks, recurring routines, reminders, notes, lightweight habit tracking, and future optional synchronization.

## 4. AI-agent instructions
Keep scope intentionally small. Do not add enterprise workflows, complex collaboration, or unnecessary authentication to simple personal features. Handle timezone/date boundaries carefully. Test recurring schedules, missed reminders, edits, deletion, and offline behavior.

## 5. UX
Opening the app should immediately show what matters today. Minimize taps. Provide clear completion and rescheduling behavior.

# Detailed Product Concept — Nexora Day

## 1. Product Positioning

Nexora Day is a personal daily-life and productivity companion. It brings everyday planning into one lightweight experience without attempting to replace specialized Nexora products.

Its core objective is helping users understand and manage what needs attention today.

## 2. Core Domains

Potential domains:
- Today dashboard.
- Tasks.
- Schedule.
- Calendar.
- Reminders.
- Habits/routines.
- Personal notes.
- Daily goals.
- Quick capture.
- Activity/history.
- Notifications.

The product should remain intentionally lightweight.

## 3. Daily Model

The central experience is the day:

Today → priorities → scheduled items → tasks → routines → notes → completion/review

Users should be able to capture an item quickly and later classify it as a task, reminder, note, event, or routine.

The system must distinguish scheduled events from tasks and reminders rather than treating them as interchangeable.

## 4. UX and Navigation

Primary shell:

Today → Tasks → Calendar → Routines → Notes → History → Settings

Today should show:
- Current date.
- Priority tasks.
- Upcoming schedule.
- Reminders.
- Routine progress.
- Quick capture.

Empty days should remain useful and not pressure users into artificial activity.

## 5. Notifications

Notifications must be:
- User-controlled.
- Time-aware.
- Deduplicated where possible.
- Cancelable.
- Respectful of quiet periods and platform settings.

Do not send notifications solely to increase engagement.

## 6. Local-First and Sync

Basic daily planning should work offline.

Local data may include:
- Tasks.
- Notes.
- Preferences.
- Routine state.

Optional sync should use Nexora Core identity/storage/sync capabilities and provide clear conflict handling.

## 7. Backend Relationship

Backend owns synchronized tasks/reminders/routines and server-authoritative notifications where required.

Nexora Core owns identity, notifications primitives, storage, and audit capabilities.

Do not duplicate calendar infrastructure if a shared Core capability is already available.

## 8. AI

AI may assist with:
- Turning natural-language capture into structured tasks.
- Daily plan suggestions.
- Summarizing completed work.
- Breaking large tasks into smaller steps.

AI suggestions remain suggestions. It must not silently schedule, delete, notify, or reprioritize user data without authorization.

## 9. Privacy

Personal schedules and notes may reveal sensitive patterns. Requirements:
- Private-by-default.
- Explicit sharing only.
- Minimal analytics.
- No hidden behavioral profiling.
- Secure synchronization.

## 10. Definition of Done

A Day feature is complete only when local/offline behavior, synchronization/conflicts, notification semantics, timezone handling, privacy, accessibility, and tests are covered.
