from __future__ import annotations

from pathlib import Path

from backend.parsers.extraction import normalize_binding_status, parse_extraction, split_research_and_appendix


def test_parse_extraction_uses_multi_ticker_appendix():
    fixture_path = Path(__file__).resolve().parents[1] / "fixtures" / "sample_extraction.md"
    raw_text = fixture_path.read_text(encoding="utf-8")

    research, appendix = split_research_and_appendix(raw_text)
    parsed = parse_extraction(raw_text)

    assert "MP Materials research update." in research
    assert appendix.startswith("STRUCTURED APPENDIX")

    assert {row["Ticker"] for row in parsed["NEW_CATALYSTS"]} >= {"MP", "UUUU", "USAR"}
    assert {row["Ticker"] for row in parsed["PRICE_SNAPSHOTS"]} == {"MP", "UUUU", "USAR"}
    assert {row["Ticker"] for row in parsed["UPCOMING_EVENTS"]} == {"MP", "UUUU", "USAR"}
    assert {row["Ticker"] for row in parsed["OPTIONS_NOTABLE"]} == {"MP", "UUUU", "USAR"}
    assert len(parsed["SENTIMENT_SIGNALS"]) == 3
    assert parsed["NEW_CATALYSTS"][0]["Title"] == "DOE separation award update"
    assert parsed["PRICE_SNAPSHOTS"][0]["Close"] == "24.50"
    assert parsed["UPCOMING_EVENTS"][1]["Type"] == "EARNINGS"
    assert parsed["OPTIONS_NOTABLE"][2]["Call_or_Put"] == "CALL"
    assert parsed["SENTIMENT_SIGNALS"][2]["Platform"] == "Reddit"


def test_normalize_binding_status():
    assert normalize_binding_status("FINAL") == "OBLIGATED"
    assert normalize_binding_status("LOI") == "LOI_SIGNED"
    assert normalize_binding_status("CONDITIONAL") == "CONDITIONAL"
