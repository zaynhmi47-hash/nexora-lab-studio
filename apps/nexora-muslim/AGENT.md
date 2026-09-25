# Nexora Muslim — AGENT.md

## 1. Product Positioning

Nexora Muslim is a cross-platform Muslim super-app client integrating Islamic worship, learning, travel, community and related experiences with the shared Nexora platform.

It is a product frontend, not an independent backend platform.

## 2. Core Product Domains

Initial domains include Quran reading and audio, Quran learning, Tajwid, Tahsin, Arabic, Kitab Kuning, Prayer, Qibla, Dhikr, Du'a, Hadith, curated Islamic knowledge, AI learning assistance, Umrah/Hajj preparation, teacher/classes, learning communities, charity, zakat, halal discovery and future Muslim finance/family journeys where separately justified.

## 3. Backend Relationship

The client consumes Nexora Core/Django APIs for identity, authorization, domain rules, payments, audit and business workflows.

Existing backend domains such as Quran, prayer, qibla, dhikr, dua, fasting, zakat, umrah, places, learning and related capabilities must be reused rather than recreated in the client or in a second backend.

Firebase is an infrastructure/provider layer for approved capabilities. Provider-specific logic remains behind the established adapter boundary.

## 4. Ownership Boundaries

- Dignity owns official institutional academic records.
- Nexora Education owns consumer learning/course mastery.
- Nexora Muslim owns the Muslim-specific experience and Islamic-domain product workflows.
- Core owns shared identity, authorization, files, notifications, audit and common platform primitives.
- Finance remains authoritative for canonical financial records.

## 5. AI-Agent Instructions

Use source-aware AI for religious and educational answers. Preserve source attribution and distinguish retrieved source material from generated explanation.

Do not fabricate Quran, hadith, fiqh, prayer times, scholarly quotations, travel availability, financial records or legal/religious rulings.

AI may assist with explanations and learning plans, but high-impact religious, financial, travel or account actions require explicit user confirmation and authoritative backend state.

## 6. UX

Initial navigation follows the existing mobile shell: Home, Quran, Learn, Travel and Profile.

Preserve clear loading, offline, error and empty states across Android, iOS and Web.

## 7. Security and Privacy

Do not expose authentication tokens, provider secrets or private user data in client logs.

Permissions for location, notifications, media, microphone and other device capabilities must be explicit and purpose-limited.

## 8. Definition of Done

A feature is complete only when its source/data integrity, API contract, authentication/authorization behavior, offline/error states, accessibility, cross-platform behavior and relevant tests are addressed.
