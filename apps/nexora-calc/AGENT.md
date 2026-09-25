# Nexora Calc / Life Finance — AGENT.md

## 1. Mission
Nexora Calc is a lightweight financial calculation utility, separate from Nexora Finance's transaction/accounting platform.

## 2. Calculators
Support installments, simple/compound interest, savings growth, investment projections, profit/margin, percentages, and configurable tax-oriented calculations where legally appropriate.

## 3. Accuracy
Use deterministic decimal arithmetic. Document formulas and assumptions. Handle rounding explicitly. Inputs must define currency, rate period, date basis, and compounding frequency where applicable.

## 4. AI-agent instructions
Do not copy Finance's ledger or account system. Do not present estimates as official financial/tax results. Add formula-level unit tests with known examples and boundary cases. Keep calculations usable offline.

## 5. UX
Show inputs, formula/assumptions, result, and optional breakdown. Make units and percentages obvious. Avoid unnecessary sign-in or network requirements.

# Detailed Product Concept — Nexora Calc

## 1. Product Positioning

Nexora Calc is a focused calculation product for everyday, educational, scientific, engineering, financial, and productivity calculations. It should prioritize correctness, transparency, speed, and reproducibility rather than becoming a general-purpose workflow system.

## 2. Core Capabilities

Initial capability groups:
- Basic arithmetic.
- Scientific calculator.
- Percentages, ratios, fractions, powers, roots, logarithms, and trigonometry.
- Unit-aware calculations.
- Statistics.
- Date/time calculations.
- Equation/formula assistance where implemented.
- Financial calculators as presentation utilities, without becoming the canonical Finance ledger.
- Calculation history.
- Saved calculations and reusable formulas.

Results should clearly distinguish input, formula, intermediate assumptions where relevant, and final result.

## 3. Calculation Integrity

Deterministic calculations should be executed locally whenever practical.

Requirements:
- Explicit numeric precision rules.
- No silent rounding.
- Clear handling of invalid expressions.
- Correct unit conversion.
- Consistent locale handling for decimal separators.
- Tests for edge cases and representative formulas.

Financial calculations shown by Calc are informational unless explicitly integrated with Nexora Finance. Calc must not silently create or mutate financial transactions, balances, budgets, or accounting records.

## 4. UX and Navigation

Primary shell:

Home → Calculator → Tools → History → Saved → Formula/Reference → Settings

The calculator should support fast entry, keyboard input where available, copy/share results, clear/reset, and accessible controls.

Important states:
- Invalid expression.
- Division by zero.
- Unsupported function.
- Overflow/underflow.
- Missing unit.
- Conversion incompatibility.
- Empty history.
- Offline operation.

## 5. Local-First Architecture

The basic calculator should work without an account or network connection.

Local persistence may store:
- Recent calculations.
- Saved formulas.
- User preferences.

Cloud synchronization is optional and must be explicit. If enabled, identity/storage should use Nexora Core rather than a second account system.

## 6. Backend Relationship

A custom backend is not required for deterministic calculator functionality.

Backend/Core may support:
- Optional authenticated synchronization.
- Saved cloud formulas.
- Approved usage analytics.
- Shared formula/reference content where justified.

Do not move simple calculations to the server merely for architectural consistency.

## 7. AI

AI may assist with:
- Explaining formulas.
- Converting natural-language questions into calculator expressions.
- Explaining calculation steps.
- Generating practice examples.

AI-generated results must remain distinguishable from deterministic calculator output. The deterministic engine remains authoritative for supported mathematical operations.

## 8. Domain Boundaries

Do not duplicate:
- Nexora Finance's canonical financial records.
- Nexora Study/Education's canonical learning records.
- Nexora Toolbox's general-purpose utility ownership when a capability belongs there.

If a capability becomes a reusable general utility, document the ownership decision before moving it to Core/Toolbox.

## 9. Definition of Done

A Calc feature is complete only when mathematical correctness, precision/rounding behavior, invalid-input handling, accessibility, local/offline behavior, tests, and cross-platform input behavior are addressed.
