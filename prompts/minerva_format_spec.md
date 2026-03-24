# MINERVA Output Format Specification

This document defines the exact format that frontier model output must follow
for the MINERVA dashboard to parse and store it correctly.

## Document Structure

A MINERVA report is a markdown document with these sections, each marked
by a level-2 heading (`## SECTION_NAME`). Sections can appear in any order.
Missing sections are handled gracefully — include only what you have data for.

### Required
- `## MINERVA_REPORT`
- `## DECISION`

### Recommended
- `## NARRATIVE`
- `## CATALYSTS`
- `## PRICE_DATA`
- `## EVENTS`

### Optional
- `## OPTIONS`
- `## TRIPWIRES`
- `## NOTES`

## Section Specifications

### `## MINERVA_REPORT`

```md
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-25
### Source: combined from: claude, chatgpt, gemini
```

### `## DECISION`

Use a key-value table with these exact field names:

| Field | Value |
|-------|-------|
| Verdict | BULLISH |
| Conviction | 4 |
| Action | BUY |
| Entry Low | $23.50 |
| Entry High | $24.80 |
| Stop Loss | $20.80 |
| Stop Basis | 2 ATR below entry |
| Target | $30.00 |
| Target Basis | Next resistance |
| Timeframe | 1-3 weeks |
| R:R Ratio | 1.8:1 |
| Position Size | Standard |
| Summary | Policy tailwinds and volume confirm breakout thesis. |

Valid verdict values: `BULLISH`, `BEARISH`, `NEUTRAL`
Valid action values: `BUY`, `SELL`, `HOLD`, `WATCH`, `AVOID`
Conviction must be an integer `1-5`.

### `## CATALYSTS`

| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance | Source |
|------|--------|----------|-------|------------|----------------|-------------|--------|
| 2026-03-20 | MP | GOV_FUNDING | DoD OSC loan tranche | 150000000 | OBLIGATED | 5 | DoD press release |

Valid categories:
`GOV_FUNDING`, `GOV_EQUITY`, `GOV_OFFTAKE`, `GOV_PRICE_FLOOR`,
`GOV_LOI`, `GOV_PERMIT`, `GOV_PROCUREMENT`, `EXPORT_CONTROL`,
`POLICY_STATEMENT`, `STRATEGIC_RESERVE`, `EARNINGS`, `GUIDANCE`,
`CAPITAL_RAISE`, `DILUTION_EVENT`, `PARTNERSHIP`, `MANAGEMENT`,
`OPERATIONAL`, `COMMODITY_PRICE`, `TECHNICAL_BREAK`, `SECTOR_EVENT`,
`LEGAL`, `OTHER`

Valid binding statuses:
`PROPOSED`, `ANNOUNCED`, `LOI_SIGNED`, `CONDITIONAL`,
`OBLIGATED`, `DISBURSING`, `COMPLETED`, `CANCELLED`

Parser aliases accepted:
- `FINAL -> OBLIGATED`
- `LOI -> LOI_SIGNED`

### `## PRICE_DATA`

| Metric | Value |
|--------|-------|
| Close | $24.50 |
| Change % | +5.2% |
| Volume vs Avg | 1.8x |
| 50-day MA | $21.87 |
| 200-day MA | $16.90 |
| Support 1 | $22.10 |
| Support 2 | $20.80 |
| Resistance 1 | $26.80 |
| Resistance 2 | $28.00 |
| ATR(14) | $1.85 |
| Weinstein Stage | 2 |
| Momentum | ACCELERATING |
| Relative Strength | LEADING |
| Key Level Note | Testing resistance at $26.80 |

Include whatever metrics are available. Omit rows for missing data.

### `## EVENTS`

| Date | Ticker | Type | Description | Impact | Bull_Case | Bear_Case | Source |
|------|--------|------|-------------|--------|-----------|-----------|--------|
| 2026-04-15 | MP | FUNDING_DECISION | DOE follow-up window | HIGH | Award confirms | Delay undermines | DOE calendar |

### `## OPTIONS`

| Ticker | Type | Strike | Expiry | Volume | OI | Notes |
|--------|------|--------|--------|--------|----|-------|
| MP | CALL | 25 | 2026-04-17 | 320 | 1200 | Call buyers active |

If no data exists, omit the section or use `No options data available`.

### `## TRIPWIRES`

| Type | Description |
|------|-------------|
| INVALIDATES | Stop below $20.80 — thesis dead |
| CONFIRMS | Volume expansion above $26.80 |
| WATCH | DOE announcement expected April 15 |

### `## NARRATIVE`

Free-form markdown. Any length, any sub-headings, any formatting.
This is where the depth of analysis lives.

### `## NOTES`

Free-form markdown. Additional observations that do not fit elsewhere.

## Format Rules

1. Section markers must be exact: `## SECTION_NAME`
2. Tables use standard markdown
3. The `DECISION` table must use the exact field names in the left column
4. Missing optional sections are allowed
5. Multiple stocks in one document are allowed by repeating the full structure
6. Include `Ticker` in table rows even when it appears in the report header

## Multi-Stock Reports

To cover multiple stocks in one document, repeat the full structure:

```md
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-25
### Source: combined from: claude, chatgpt, gemini

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
| Conviction | 4 |
| Action | BUY |

## MINERVA_REPORT
### Ticker: UUUU
### Date: 2026-03-25
### Source: combined from: claude, chatgpt, gemini

## DECISION
| Field | Value |
|-------|-------|
| Verdict | NEUTRAL |
| Conviction | 3 |
| Action | WATCH |
```
