from __future__ import annotations

from backend.parsers.section_splitter import extract_sections, parse_report_header, split_document, split_report_blocks


def test_split_document_single_stock_report():
    raw = """
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-25
### Source: combined from: claude

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
"""
    docs = split_document(raw)
    assert len(docs) == 1
    assert docs[0]["ticker"] == "MP"
    assert "DECISION" in docs[0]["sections"]


def test_split_document_multi_stock_report():
    raw = """
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-25

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |

## MINERVA_REPORT
### Ticker: UUUU
### Date: 2026-03-25

## DECISION
| Field | Value |
|-------|-------|
| Verdict | NEUTRAL |
"""
    docs = split_document(raw)
    assert [doc["ticker"] for doc in docs] == ["MP", "UUUU"]


def test_split_document_without_report_header_uses_unknown():
    raw = """
## NARRATIVE
Standalone research dump.
"""
    docs = split_document(raw)
    assert len(docs) == 1
    assert docs[0]["ticker"] == "UNKNOWN"
    assert docs[0]["sections"]["NARRATIVE"] == "Standalone research dump."


def test_extract_sections_handles_out_of_order_sections():
    raw = """
## NOTES
Later note

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
"""
    sections = extract_sections(raw)
    assert sections["NOTES"] == "Later note"
    assert "Verdict" in sections["DECISION"]


def test_extract_sections_concatenates_duplicate_markers():
    raw = """
## NOTES
First note

## NOTES
Second note
"""
    sections = extract_sections(raw)
    assert sections["NOTES"] == "First note\n\nSecond note"


def test_extract_sections_preserves_empty_section_as_empty_string():
    raw = """
## NOTES

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
"""
    sections = extract_sections(raw)
    assert sections["NOTES"] == ""


def test_split_report_blocks_returns_single_block_without_marker():
    blocks = split_report_blocks("## NARRATIVE\nOnly text")
    assert blocks == ["## NARRATIVE\nOnly text"]


def test_parse_report_header_reads_fields():
    header = parse_report_header(
        """
### Ticker: MP
### Date: 2026-03-25
### Source: combined from: claude, gemini
"""
    )
    assert header == {"ticker": "MP", "date": "2026-03-25", "source": "combined from: claude, gemini"}


def test_split_document_with_non_section_text_falls_back_to_narrative():
    docs = split_document("Plain research with no markdown markers.")
    assert docs[0]["sections"] == {"NARRATIVE": "Plain research with no markdown markers."}


def test_split_document_keeps_raw_chunk_text():
    raw = """
## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-25

## NARRATIVE
Testing raw preservation.
"""
    docs = split_document(raw)
    assert docs[0]["raw_text"].startswith("## MINERVA_REPORT")
