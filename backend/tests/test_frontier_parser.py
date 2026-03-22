from __future__ import annotations

from backend.parsers.frontier_output import parse_frontier_output


def test_parse_frontier_output_extracts_decision_and_risks():
    raw_text = """## SENIOR_REVIEW
### Stock: MP
### Date: 2026-03-23
### Quality Assessment
- Calculation Accuracy: PASS
- Logical Consistency: PASS
### Net Judgment: BULLISH
### Conviction: 4
### Action: WATCH
### If Actionable:
- Entry Zone: [$22.00 - $23.00]
- Stop Loss: [$20.80] - basis: below 2 ATR stop
- Target: [$30.00] - basis: next resistance extension
- Timeframe: [1-3 weeks]
### One Line: Attractive theme, but patience on entry improves the setup.
### Agreements
- Policy and price action line up.
- Risk remains contained.
### Blind Spots
- Conditional funding timing.
- Thin options tape.
### Postscript
Ignored content.
"""

    parsed = parse_frontier_output(raw_text)

    assert parsed["final_verdict"] == "BULLISH"
    assert parsed["final_conviction"] == "4"
    assert parsed["final_action"] == "WATCH"
    assert parsed["entry_low"] == 22.0
    assert parsed["entry_high"] == 23.0
    assert parsed["stop_loss"] == 20.8
    assert parsed["target_price"] == 30.0
    assert parsed["timeframe"] == "1-3 weeks"
    assert parsed["one_line_summary"] == "Attractive theme, but patience on entry improves the setup."
    assert parsed["agreements"] == ["Policy and price action line up.", "Risk remains contained."]
    assert parsed["blind_spots"] == ["Conditional funding timing.", "Thin options tape."]
