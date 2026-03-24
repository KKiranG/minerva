from __future__ import annotations

import pytest

from backend.parsers.extraction import parse_currency, parse_iso_date, parse_rr_ratio
from backend.parsers.markdown_tables import parse_key_value_table, parse_multi_column_table


def test_parse_key_value_table_standard():
    table = """
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
| Conviction | 4 |
"""
    assert parse_key_value_table(table) == {"Verdict": "BULLISH", "Conviction": "4"}


def test_parse_key_value_table_without_separator_row():
    table = """
| Field | Value |
| Verdict | BULLISH |
| Conviction | 4 |
"""
    assert parse_key_value_table(table)["Verdict"] == "BULLISH"


def test_parse_key_value_table_accepts_alignment_separator():
    table = """
| Field | Value |
|:------|------:|
| Verdict | BULLISH |
"""
    assert parse_key_value_table(table)["Verdict"] == "BULLISH"


def test_parse_key_value_table_strips_numeric_formatting():
    table = """
| Metric | Value |
|--------|-------|
| Close | $24,500.50 |
| Change % | +5.2% |
| Volume vs Avg | 1.8x |
"""
    parsed = parse_key_value_table(table)
    assert parsed["Close"] == "24500.50"
    assert parsed["Change %"] == "+5.2"
    assert parsed["Volume vs Avg"] == "1.8"


def test_parse_key_value_table_handles_extra_whitespace():
    table = """
|  Field   |  Value  |
|---------|---------|
|  Verdict  |  BULLISH  |
"""
    assert parse_key_value_table(table) == {"Verdict": "BULLISH"}


def test_parse_multi_column_table_normalizes_headers():
    table = """
| Date | Ticker | Binding Status |
|------|--------|----------------|
| 2026-03-25 | MP | OBLIGATED |
"""
    rows = parse_multi_column_table(table)
    assert rows == [{"date": "2026-03-25", "ticker": "MP", "binding_status": "OBLIGATED"}]


def test_parse_multi_column_table_pads_missing_cells():
    table = """
| Date | Ticker | Title |
|------|--------|-------|
| 2026-03-25 | MP |
"""
    rows = parse_multi_column_table(table)
    assert rows[0]["title"] is None


def test_parse_multi_column_table_joins_extra_cells_into_last_column():
    table = """
| Type | Description |
|------|-------------|
| WATCH | DOE timing | plus permit timing | and options expiry |
"""
    rows = parse_multi_column_table(table)
    assert rows[0]["description"] == "DOE timing | plus permit timing | and options expiry"


def test_parse_multi_column_table_skips_empty_rows():
    table = """
| Date | Ticker |
|------|--------|
|      |        |
| 2026-03-25 | MP |
"""
    rows = parse_multi_column_table(table)
    assert len(rows) == 1


def test_parse_multi_column_table_handles_missing_trailing_pipe():
    table = """
| Date | Ticker | Title
|------|--------|------
| 2026-03-25 | MP | Loan tranche
"""
    rows = parse_multi_column_table(table)
    assert rows[0]["title"] == "Loan tranche"


def test_parse_multi_column_table_handles_continuation_lines():
    table = """
| Type | Description |
|------|-------------|
| INVALIDATES | Stop below $20.80 - thesis dead.
  Volume must hold above the 50-day average. |
"""
    rows = parse_multi_column_table(table)
    assert "Volume must hold above the 50-day average." in rows[0]["description"]


def test_parse_multi_column_table_normalizes_unicode_characters():
    table = """
| Type | Description |
|———|———|
| WATCH | “Policy timing” remains critical… |
"""
    rows = parse_multi_column_table(table)
    assert rows[0]["description"] == '"Policy timing" remains critical...'


def test_parse_multi_column_table_treats_empty_cells_as_none():
    table = """
| Date | Ticker | Source |
|------|--------|--------|
| 2026-03-25 | MP | |
"""
    rows = parse_multi_column_table(table)
    assert rows[0]["source"] is None


def test_parse_multi_column_table_returns_empty_for_non_table_text():
    assert parse_multi_column_table("not a markdown table") == []


@pytest.mark.parametrize(
    "value",
    [
        "No options data available",
        "no options data available",
        "N/A",
    ],
)
def test_parse_multi_column_table_skips_empty_token_rows(value: str):
    table = f"""
| Ticker | Notes |
|--------|-------|
| MP | {value} |
"""
    assert parse_multi_column_table(table) == []


def test_extraction_numeric_and_date_helpers_cover_currency_rr_and_dates():
    assert parse_currency("$150M") == 150_000_000
    assert parse_iso_date("Mar 24, 2026") == "2026-03-24"
    assert parse_rr_ratio("1.8:1") == 1.8
