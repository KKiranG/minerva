---
name: trading-analysis
description: >
  Use when building or modifying any component that handles stock analysis,
  trading decisions, position sizing, price data, or conviction scoring.
  Triggers on: analysis, trading, position, conviction, stop loss, target,
  entry, exit, P&L, R:R ratio, ATR, support, resistance.
---

# Trading Analysis Skill

## Data Rules
- Never hardcode stock data. Always pull from SQLite via API.
- All financial figures use USD unless explicitly noted.
- Prices are REAL (float), not strings.
- Share counts are in millions (e.g., 45.2 means 45,200,000 shares).
- Percentages are stored as decimals where possible (0.05 = 5%) but
  displayed as "5%" in the UI.

## Trading Decision Fields (mandatory for every decision)
Every trading decision in the system MUST include ALL of these:
- Verdict: BULLISH | BEARISH | NEUTRAL (no other values)
- Conviction: integer 1-5
- Action: BUY | SELL | HOLD | WATCH | AVOID
- Entry zone: two prices (low and high), e.g., "$12.50 - $13.20"
- Stop loss: single price with basis stated
- Target: single price with basis stated
- Timeframe: human-readable, e.g., "1-3 weeks"
- R:R ratio: calculated from entry midpoint, stop, and target
- One-line: single sentence summary

## Conviction Scale
- 1: Low conviction — thesis is speculative, limited evidence
- 2: Moderate — some evidence supports, but significant uncertainty
- 3: Medium — balanced evidence, reasonable probability
- 4: High — strong evidence, multiple confirming signals
- 5: Very high — overwhelming evidence, high probability

## Position Sizing
- Default portfolio size: $50,000 (configurable in config.py)
- Default max risk per trade: 1.5% of portfolio ($750)
- Default max single position: 10% of portfolio ($5,000)
- Default max sector concentration: 30% of portfolio ($15,000)
- Stop must be calculated BEFORE position size

## Anti-Patterns
- Never display a trading decision without all mandatory fields
- Never calculate position size without a defined stop loss
- Never show R:R without showing the calculation
- Never use "N/A" for stop loss or target on BUY/SELL recommendations
- Never display conviction without the basis for the score
