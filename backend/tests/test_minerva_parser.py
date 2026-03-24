from __future__ import annotations

from pathlib import Path

from backend.parsers.extraction import extract_sections, parse_key_value_table, parse_markdown_table_block, parse_minerva_document


FIXTURE = (Path(__file__).resolve().parents[1] / "fixtures" / "sample_minerva_report.md").read_text(encoding="utf-8")


def test_parse_minerva_document_single_report():
    reports = parse_minerva_document(FIXTURE)
    assert len(reports) == 1
    report = reports[0]
    assert report["header"]["ticker"] == "MP"
    assert report["header"]["date"] == "2026-03-24"
    assert "DECISION" in report["sections"]
    assert parse_key_value_table(report["sections"]["DECISION"])["Verdict"] == "BULLISH"
    catalysts = parse_markdown_table_block(report["sections"]["CATALYSTS"])
    assert catalysts[0]["Ticker"] == "MP"
    assert catalysts[0]["Binding_Status"] == "OBLIGATED"


def test_parse_minerva_document_multiple_reports():
    multi = f"{FIXTURE}\n\n{FIXTURE.replace('### Ticker: MP', '### Ticker: UUUU').replace('| MP |', '| UUUU |')}"
    reports = parse_minerva_document(multi)
    assert [report["header"]["ticker"] for report in reports] == ["MP", "UUUU"]


def test_extract_sections_handles_missing_optional_blocks():
    raw = """
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-24
### Source: test

## DECISION
| Field | Value |
|-------|-------|
| Verdict | NEUTRAL |
"""
    sections = extract_sections(raw)
    assert sorted(sections) == ["DECISION", "MINERVA_REPORT"]
