from __future__ import annotations

from typing import Any, Mapping, Optional

from ..database import decode_row


def serialize_stock(row: Optional[Mapping[str, Any]]):
    return decode_row(
        row,
        json_fields=(
            "secondary_minerals",
            "government_funding_received",
            "government_funding_pending",
            "government_contracts",
        ),
        bool_fields=("open_position_flag", "needs_attention", "alert_flag"),
    )


def serialize_catalyst(row: Optional[Mapping[str, Any]]):
    return decode_row(row, json_fields=("affected_tickers",))


def serialize_event(row: Optional[Mapping[str, Any]]):
    return decode_row(row, json_fields=("affected_tickers",))


def serialize_research_note(row: Optional[Mapping[str, Any]]):
    return decode_row(row, json_fields=("related_catalysts", "related_stocks", "tags"))


def serialize_journal_entry(row: Optional[Mapping[str, Any]]):
    return decode_row(row, json_fields=("pattern_tags",))


def serialize_price_snapshot(row: Optional[Mapping[str, Any]]):
    return decode_row(
        row,
        bool_fields=("gap_up", "gap_down", "new_high_52w", "new_low_52w"),
    )
