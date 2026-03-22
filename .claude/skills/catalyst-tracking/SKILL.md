---
name: catalyst-tracking
description: >
  Use when building or modifying catalyst entry, display, timeline,
  government funding tracking, or event calendar features. Triggers on:
  catalyst, funding, grant, loan, LOI, DoD, DOE, EXIM, DFC, CHIPS,
  permit, policy, export control, strategic reserve, procurement.
---

# Catalyst Tracking Skill

## Catalyst Categories (exact values, no others)
GOV_FUNDING, GOV_EQUITY, GOV_OFFTAKE, GOV_PRICE_FLOOR, GOV_LOI,
GOV_PERMIT, GOV_PROCUREMENT, EXPORT_CONTROL, POLICY_STATEMENT,
STRATEGIC_RESERVE, EARNINGS, GUIDANCE, CAPITAL_RAISE, DILUTION_EVENT,
PARTNERSHIP, MANAGEMENT, OPERATIONAL, COMMODITY_PRICE, TECHNICAL_BREAK,
SECTOR_EVENT, LEGAL, OTHER

## Funding Status Hierarchy (ordered by certainty)
PROPOSED -> ANNOUNCED -> LOI_SIGNED -> CONDITIONAL -> OBLIGATED -> DISBURSING -> COMPLETED
Also: CANCELLED

## Significance Scale (1-5)
- 1: Background noise — minor policy statement, no financial impact
- 2: Minor — small funding (<1% of market cap), routine regulatory
- 3: Moderate — meaningful funding (1-5% of market cap), important permit step
- 4: Significant — large funding (>5% of market cap), major contract, key permit
- 5: Stock-moving — transformational event (DoD partnership, CHIPS LOI, China ban)

## Verification Grades
- A: Official USAspending/agency transaction page with identifiers
- B: Official press release + recipient confirmation
- C: Single official source without cross-verification
- UNVERIFIED: Reported but not confirmed by official source

## Display Rules
- Government funding always shows: ceiling, obligated, and disbursed amounts
  (use "N/A" for unknown, never leave blank)
- Binding status is always prominently displayed — LOIs look very different from
  final obligations and must be visually distinguished
- Timeline view colour-codes by category (use the colour constants in colors.js)
- Significance drives visual prominence (size of dot on timeline, sort priority)

## Probability-Weighted Value Calculation
For aggregating government support:
- FINAL/OBLIGATED: 100% weight
- CONDITIONAL: 60% weight
- LOI_SIGNED: 30% weight
- PROPOSED/ANNOUNCED: 10% weight
Formula: Σ (amount × weight) = probability-weighted total

## Anti-Patterns
- Never treat an LOI the same as an obligation
- Never display a catalyst without its binding status
- Never aggregate funding without separating confirmed vs conditional vs LOI
- Never omit the verification grade
