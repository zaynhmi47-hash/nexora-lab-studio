# @nexora/dignity-contracts

Shared, platform-neutral TypeScript contracts for Dignity Web and Dignity Mobile.

## Purpose

This package contains transport-safe types only. It must not import React, React Native, Expo, Firebase SDKs, browser APIs, or Node-only modules.

## Rules

- Keep contracts serializable over HTTP/JSON.
- Keep business rules out of this package.
- Web and Mobile may depend on these contracts.
- Backend adapters may implement these contracts without depending on UI code.
- Breaking contract changes require an explicit version/commit note.

## Initial contract groups

- API response and pagination envelopes
- User summary
- Course and lesson summaries
- Learning progress
- XP events
- Health status
