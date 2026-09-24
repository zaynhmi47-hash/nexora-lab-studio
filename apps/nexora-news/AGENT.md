# Nexora News — AGENT.md

## 1. Mission
Nexora News is a publishing/distribution platform for news and sports content with publisher accounts, creators, editorial workflows, advertising, analytics, and configurable revenue/royalty mechanisms.

## 2. Editorial lifecycle
Draft → review → scheduled → published → corrected/updated → archived. Breaking or sensitive content should still pass through configurable review controls where required.

## 3. Domains
Content, authors, publishers, categories, editorial workflow, media, distribution, audience analytics, advertising, revenue, moderation, corrections, reports.

## 4. Accuracy and transparency
The application should distinguish published reporting, editorial opinion, sponsored content, corrections, and user-generated content. Do not silently rewrite published material; preserve correction/version history.

## 5. AI-agent instructions
Never fabricate sources, quotes, statistics, or events. AI may assist drafting, summarization, tagging, transcription, or moderation, but editorial publication remains governed by explicit workflow. Protect unpublished stories and credentials. Test publication permissions, scheduling, revisions, and tenant isolation.

## 6. Revenue
Advertising and publisher revenue must be tracked separately from editorial data. Revenue rules must be auditable and versioned.

# Detailed product concept

Nexora News is the news and sports publishing/distribution product for Nexora. It supports publishers, journalists/creators and audiences while maintaining a clear separation between reporting, opinion, sponsored material and user-generated content.

## Editorial domains

Content includes articles, breaking updates, sports coverage, media assets, author profiles, categories, tags and editions/collections. Editorial lifecycle should support draft → review → scheduled → published → corrected/updated → archived.

Editorial roles may include author, reporter, editor, reviewer, publisher/admin and moderator. Publication authority is server-side and must be auditable.

## Sports and live content

Sports coverage should model events, teams/participants, schedules/results and editorial stories separately. Do not fabricate scores, statistics, events or quotes. If live data is integrated, provider data should remain attributable and isolated behind an adapter.

## Distribution and monetization

Support feeds, search, notifications, social distribution, subscriptions/premium where implemented, advertising and creator/publisher revenue. Finance owns accounting truth; News owns editorial/content semantics.

## UX/navigation

Suggested shell: Home → Latest → Categories → Sports → Following → Search → Bookmarks → Notifications → Publisher/Creator → Profile.

Article pages should show publication time, update/correction state, author/publisher attribution and relevant source/context. Sponsored content must be distinguishable. Sports pages should separate factual event data from editorial commentary.

Publisher workspace: Editorial Queue → Drafts → Review → Schedule → Published → Analytics → Monetization → Moderation.

## AI policy

AI may assist research organization, summaries, headline alternatives, transcription, translation and metadata. Human editorial workflow governs publication. AI must not invent sources, quotes, statistics, events or reporting. Generated drafts require review.

## Safety and moderation

Provide report/takedown/correction workflows, abuse controls and access control. Preserve editorial history for consequential changes. Protect unpublished drafts and source-sensitive material.

## Agent ownership

Frontend owns news feed/article/sports/publisher UX. Backend owns editorial state, content persistence, publication authorization, moderation, distribution jobs and integrations. Core owns identity, organization, files, notifications, audit and generic payments.

## Definition of done

Features must specify editorial role, publication state, source/data provenance, moderation behavior, notification/distribution effects, tenant scope and tests.