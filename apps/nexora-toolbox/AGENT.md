# Nexora Toolbox — AGENT.md

## 1. Mission
Nexora Toolbox is a lightweight collection of everyday utilities: calculator, unit conversion, QR/barcode, text tools, notes, to-do, and other small helpers.

## 2. Architecture
Default to local-first and offline. Each utility should be a small isolated module with clear inputs/outputs and tests. Shared navigation/settings can be reused, but utilities should not depend on one another unnecessarily.

## 3. AI-agent instructions
Do not add a backend merely because the monorepo has one. Avoid accounts for local-only features. Keep dependencies small. Validate user input and handle malformed data. Preserve local data across app updates where supported.

## 4. Monetization
Ads and premium features are optional layers. They must not compromise utility behavior or collect unnecessary data.

## 5. Quality
Optimize startup, memory, battery, accessibility, and small bundle size. Test offline operation, orientation/responsive layouts, malformed input, and persistence.