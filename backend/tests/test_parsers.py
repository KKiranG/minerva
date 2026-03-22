from __future__ import annotations

from pathlib import Path

from backend.parsers.agent_output import parse_agent_output
from backend.parsers.extraction import normalize_binding_status, parse_extraction, split_research_and_appendix


def test_parse_extraction_with_aliases():
    fixture_path = Path(__file__).resolve().parents[1] / "fixtures" / "sample_extraction.md"
    raw_text = fixture_path.read_text(encoding="utf-8")
    research, appendix = split_research_and_appendix(raw_text)
    parsed = parse_extraction(raw_text)

    assert "MP Materials research update." in research
    assert "NEW_CATALYSTS" in appendix
    assert parsed["NEW_CATALYSTS"][0]["Ticker"] == "MP"
    assert parsed["PRICE_SNAPSHOTS"][0]["Close"] == "24.50"
    assert parsed["UPCOMING_EVENTS"][0]["Type"] == "FUNDING_DECISION"
    assert parsed["OPTIONS_NOTABLE"][0]["Call_or_Put"] == "CALL"
    assert parsed["SENTIMENT_SIGNALS"][0]["Platform"] == "X"


def test_normalize_binding_status():
    assert normalize_binding_status("FINAL") == "OBLIGATED"
    assert normalize_binding_status("LOI") == "LOI_SIGNED"
    assert normalize_binding_status("CONDITIONAL") == "CONDITIONAL"


def test_parse_agent_output_tables():
    raw = """## PRICE_ACTION_ANALYSIS
### Stock: MP
### Date: 2026-03-23

### Price Context
| Metric | Value |
|--------|-------|
| Current Price | $24.50 |
| 50-day MA | $21.87 |
| 200-day MA | $16.90 |
"""
    parsed = parse_agent_output(2, raw)
    assert parsed["parse_status"] == "COMPLETE"
    assert parsed["header"] == "## PRICE_ACTION_ANALYSIS"
    assert parsed["tables"]["Price Context"][0][0]["Metric"] == "Current Price"
