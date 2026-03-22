from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..database import execute, fetch_one, json_dumps
from ..models import ExtractionIngestRequest
from ..parsers.extraction import normalize_binding_status, parse_extraction, split_research_and_appendix


def _parse_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    cleaned = value.strip().replace("$", "").replace(",", "").replace("%", "")
    if cleaned in {"", "N/A", "NA", "None", "none", "null"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_int(value: Optional[str]) -> Optional[int]:
    number = _parse_float(value)
    return int(number) if number is not None else None


def _scope_tickers(scope: str) -> List[str]:
    return [ticker.strip().upper() for ticker in scope.split(",") if ticker.strip() and ticker.strip().upper() != "ALL"]


async def _insert_research_note(
    conn,
    ticker: Optional[str],
    extraction_id: int,
    title: str,
    note_body: str,
    note_type: str,
    source: str,
    category: Optional[str] = None,
):
    await conn.execute(
        """
        INSERT INTO research_notes (
            ticker, extraction_id, title, note_body, note_type, category, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (ticker, extraction_id, title, note_body, note_type, category, source),
    )


async def ingest_extraction(conn, payload: ExtractionIngestRequest) -> Dict[str, Any]:
    research_text, appendix_text = split_research_and_appendix(payload.raw_text)
    canonical_appendix = parse_extraction(payload.raw_text)
    counters = {
        "catalysts_extracted": len(canonical_appendix["NEW_CATALYSTS"]),
        "events_extracted": len(canonical_appendix["UPCOMING_EVENTS"]),
        "prices_extracted": len(canonical_appendix["PRICE_SNAPSHOTS"]),
        "notes_created": max(1, len(_scope_tickers(payload.scope)) or 1),
    }
    parse_status = "COMPLETE" if any(counters.values()) else "PARTIAL"
    extraction_id = await execute(
        conn,
        """
        INSERT INTO extractions (
            date, scope, mode, source_model, time_window_start, time_window_end,
            raw_text, structured_appendix, canonical_appendix, custom_focus,
            catalysts_extracted, events_extracted, prices_extracted, notes_created,
            parse_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.date,
            payload.scope,
            payload.mode,
            payload.source_model,
            payload.time_window_start,
            payload.time_window_end,
            payload.raw_text,
            appendix_text,
            json_dumps(canonical_appendix),
            payload.custom_focus,
            counters["catalysts_extracted"],
            counters["events_extracted"],
            counters["prices_extracted"],
            counters["notes_created"],
            parse_status,
        ),
    )

    for catalyst in canonical_appendix["NEW_CATALYSTS"]:
        await conn.execute(
            """
            INSERT INTO catalysts (
                ticker, extraction_id, date, category, title, amount_ceiling,
                binding_status, significance, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker, date, title) DO UPDATE SET
                category=excluded.category,
                amount_ceiling=excluded.amount_ceiling,
                binding_status=excluded.binding_status,
                significance=excluded.significance,
                source=excluded.source,
                extraction_id=excluded.extraction_id,
                updated_at=CURRENT_TIMESTAMP
            """,
            (
                catalyst.get("Ticker", "").upper(),
                extraction_id,
                catalyst.get("Date"),
                catalyst.get("Category", "OTHER"),
                catalyst.get("Title", "Untitled Catalyst"),
                _parse_float(catalyst.get("Amount_USD")),
                normalize_binding_status(catalyst.get("Binding_Status", "PROPOSED")),
                _parse_int(catalyst.get("Significance_1to5")),
                catalyst.get("Source"),
            ),
        )

    for snapshot in canonical_appendix["PRICE_SNAPSHOTS"]:
        await conn.execute(
            """
            INSERT INTO price_snapshots (
                ticker, extraction_id, date, close, change_pct, volume_vs_avg, relative_volume,
                above_50ma, above_200ma, key_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                snapshot.get("Ticker", "").upper(),
                extraction_id,
                payload.date,
                _parse_float(snapshot.get("Close")),
                _parse_float(snapshot.get("Change_Pct")),
                _parse_float(snapshot.get("Vol_vs_Avg")),
                _parse_float(snapshot.get("Vol_vs_Avg")),
                _parse_float(snapshot.get("Above_50MA")),
                _parse_float(snapshot.get("Above_200MA")),
                snapshot.get("Key_Level"),
            ),
        )

    for event in canonical_appendix["UPCOMING_EVENTS"]:
        await conn.execute(
            """
            INSERT INTO upcoming_events (
                ticker, extraction_id, date, event_type, description, impact, source, date_precision, affected_tickers
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event.get("Ticker", "").upper(),
                extraction_id,
                event.get("Date"),
                event.get("Type", "OTHER"),
                event.get("Description", ""),
                event.get("Impact"),
                event.get("Source"),
                "EXACT",
                json_dumps([event.get("Ticker", "").upper()]) if event.get("Ticker") else json_dumps([]),
            ),
        )

    note_targets = _scope_tickers(payload.scope) or [None]
    for ticker in note_targets:
        await _insert_research_note(
            conn,
            ticker,
            extraction_id,
            f"Extraction {payload.date}",
            research_text,
            "EXTRACTION",
            payload.source_model,
            category="EXTRACTION",
        )

    for row in canonical_appendix.get("SENTIMENT_SIGNALS", []):
        ticker = row.get("Ticker", "").upper()
        if not ticker:
            continue
        platform = row.get("Platform", "")
        direction = row.get("Direction", "")
        intensity = row.get("Intensity", "")
        narrative = row.get("Notable_Narrative", "")
        await _insert_research_note(
            conn,
            ticker,
            extraction_id,
            f"Sentiment: {platform} — {direction}",
            f"Platform: {platform}\nDirection: {direction}\nIntensity: {intensity}\nNarrative: {narrative}",
            "SENTIMENT",
            f"Extraction {extraction_id}",
            category="SENTIMENT",
        )
        counters["notes_created"] += 1
    await conn.commit()

    row = await fetch_one(conn, "SELECT id, parse_status, canonical_appendix FROM extractions WHERE id = ?", (extraction_id,))
    return {
        "extraction_id": extraction_id,
        "parse_status": row["parse_status"],
        "canonical_appendix": canonical_appendix,
        "counters": counters,
    }
