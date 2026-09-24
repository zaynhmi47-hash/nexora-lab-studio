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