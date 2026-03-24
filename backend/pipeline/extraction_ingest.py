from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Mapping, Optional

from ..database import execute, fetch_one, json_dumps, utc_now
from ..models import MinervaIngestRequest
from ..parsers.extraction import normalize_binding_status, parse_key_value_table, parse_markdown_table_block, parse_minerva_document
from .ollama_fallback import OllamaFallbackClient


NULL_TOKENS = {"", "N/A", "NA", "None", "none", "null", "—", "-", "n/a"}

PRICE_METRIC_MAP = {
    "close": "close",
    "change": "change_pct",
    "change_pct": "change_pct",
    "change_percent": "change_pct",
    "volume_vs_avg": "volume_vs_avg",
    "50_day_ma": "ma50",
    "200_day_ma": "ma200",
    "support_1": "support1",
    "support_2": "support2",
    "resistance_1": "resistance1",
    "resistance_2": "resistance2",
    "atr_14": "atr14",
    "key_level_note": "key_level",
}


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")


def _normalize_mapping(values: Mapping[str, Any]) -> Dict[str, Any]:
    return {_normalize_key(key): value for key, value in values.items()}


def _clean_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip()
    return None if cleaned in NULL_TOKENS else cleaned


def _parse_float(value: Any) -> Optional[float]:
    cleaned = _clean_value(value)
    if cleaned is None:
        return None
    normalized = cleaned.replace("$", "").replace(",", "").replace("%", "").replace("x", "")
    match = re.search(r"-?\d+(?:\.\d+)?", normalized)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _parse_int(value: Any) -> Optional[int]:
    parsed = _parse_float(value)
    return int(parsed) if parsed is not None else None


def _parse_ratio(value: Any) -> Optional[float]:
    cleaned = _clean_value(value)
    if cleaned is None:
        return None
    if ":" in cleaned:
        left, _, _ = cleaned.partition(":")
        return _parse_float(left)
    return _parse_float(cleaned)


def _report_date(value: Optional[str]) -> str:
    return value or datetime.now(timezone.utc).date().isoformat()


def _report_source(reports: Iterable[Mapping[str, Any]], fallback: str) -> str:
    sources: List[str] = []
    for report in reports:
        header = report.get("header") or {}
        source = _clean_value(header.get("source"))
        if source and source not in sources:
            sources.append(source)
    return " | ".join(sources) if sources else fallback


def _decision_changed(stock: Mapping[str, Any], decision: Mapping[str, Any]) -> int:
    comparisons = (
        (stock.get("current_verdict"), decision.get("verdict")),
        (stock.get("current_action"), decision.get("action")),
        (stock.get("current_conviction"), _parse_int(decision.get("conviction"))),
        (stock.get("current_thesis"), _clean_value(decision.get("summary"))),
        (stock.get("current_stop"), _parse_float(decision.get("stop_loss"))),
        (stock.get("current_target"), _parse_float(decision.get("target"))),
    )
    return int(any(left != right for left, right in comparisons))


def _tripwire_lines(rows: Iterable[Mapping[str, Any]]) -> List[str]:
    lines: List[str] = []
    for row in rows:
        normalized = _normalize_mapping(row)
        trip_type = str(normalized.get("type") or "").upper()
        description = _clean_value(normalized.get("description"))
        if trip_type and description:
            lines.append(f"{trip_type}: {description}")
    return lines


async def _insert_research_note(
    conn,
    *,
    ticker: Optional[str],
    extraction_id: int,
    title: str,
    note_body: str,
    note_type: str,
    source: str,
    category: Optional[str] = None,
) -> None:
    await execute(
        conn,
        """
        INSERT INTO research_notes (
            ticker, extraction_id, title, note_body, note_type, category, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (ticker, extraction_id, title, note_body, note_type, category, source, utc_now()),
    )


async def _fallback_json(section_name: str, content: str, client: Optional[OllamaFallbackClient] = None) -> Optional[Any]:
    if not content.strip():
        return None
    parser = client or OllamaFallbackClient()
    return await parser.extract_json(section_name, content)


async def _upsert_catalysts(
    conn,
    *,
    extraction_id: int,
    run_id: str,
    rows: List[Mapping[str, Any]],
    source: str,
) -> int:
    stored = 0
    for row in rows:
        normalized = _normalize_mapping(row)
        ticker = str(normalized.get("ticker") or "").upper().strip()
        date = _clean_value(normalized.get("date"))
        title = _clean_value(normalized.get("title"))
        if not ticker or not date or not title:
            continue
        stock = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (ticker,))
        if not stock:
            continue
        now = utc_now()
        await execute(
            conn,
            """
            INSERT INTO catalysts (
                ticker, extraction_id, analysis_run_id, date, category, title, description,
                amount_ceiling, binding_status, significance, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker, date, title) DO UPDATE SET
                extraction_id = excluded.extraction_id,
                analysis_run_id = excluded.analysis_run_id,
                category = excluded.category,
                description = COALESCE(excluded.description, catalysts.description),
                amount_ceiling = COALESCE(excluded.amount_ceiling, catalysts.amount_ceiling),
                binding_status = excluded.binding_status,
                significance = COALESCE(excluded.significance, catalysts.significance),
                source = COALESCE(excluded.source, catalysts.source),
                updated_at = excluded.updated_at
            """,
            (
                ticker,
                extraction_id,
                run_id,
                date,
                normalized.get("category") or "OTHER",
                title,
                _clean_value(normalized.get("description")),
                _parse_float(normalized.get("amount_usd")),
                normalize_binding_status(str(normalized.get("binding_status") or "PROPOSED")),
                _parse_int(normalized.get("significance") or normalized.get("significance_1to5")),
                _clean_value(normalized.get("source")) or source,
                now,
                now,
            ),
        )
        stored += 1
    return stored


def _price_payload(data: Mapping[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any]]:
    normalized = _normalize_mapping(data)
    mapped: Dict[str, Any] = {}
    extras: Dict[str, Any] = {}
    for key, value in normalized.items():
        target = PRICE_METRIC_MAP.get(key)
        if target:
            mapped[target] = value
        else:
            extras[key] = value
    return mapped, extras


async def _upsert_price_snapshot(
    conn,
    *,
    extraction_id: int,
    ticker: str,
    date: str,
    data: Mapping[str, Any],
) -> bool:
    mapped, extras = _price_payload(data)
    if not mapped and not extras:
        return False
    await execute(
        conn,
        """
        INSERT INTO price_snapshots (
            ticker, extraction_id, date, close, change_pct, volume_vs_avg,
            ma50, ma200, support1, support2, resistance1, resistance2,
            atr14, key_level, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ticker, date) DO UPDATE SET
            extraction_id = excluded.extraction_id,
            close = COALESCE(excluded.close, price_snapshots.close),
            change_pct = COALESCE(excluded.change_pct, price_snapshots.change_pct),
            volume_vs_avg = COALESCE(excluded.volume_vs_avg, price_snapshots.volume_vs_avg),
            ma50 = COALESCE(excluded.ma50, price_snapshots.ma50),
            ma200 = COALESCE(excluded.ma200, price_snapshots.ma200),
            support1 = COALESCE(excluded.support1, price_snapshots.support1),
            support2 = COALESCE(excluded.support2, price_snapshots.support2),
            resistance1 = COALESCE(excluded.resistance1, price_snapshots.resistance1),
            resistance2 = COALESCE(excluded.resistance2, price_snapshots.resistance2),
            atr14 = COALESCE(excluded.atr14, price_snapshots.atr14),
            key_level = COALESCE(excluded.key_level, price_snapshots.key_level),
            notes = COALESCE(excluded.notes, price_snapshots.notes)
        """,
        (
            ticker,
            extraction_id,
            date,
            _parse_float(mapped.get("close")),
            _parse_float(mapped.get("change_pct")),
            _parse_float(mapped.get("volume_vs_avg")),
            _parse_float(mapped.get("ma50")),
            _parse_float(mapped.get("ma200")),
            _parse_float(mapped.get("support1")),
            _parse_float(mapped.get("support2")),
            _parse_float(mapped.get("resistance1")),
            _parse_float(mapped.get("resistance2")),
            _parse_float(mapped.get("atr14")),
            _clean_value(mapped.get("key_level")),
            json_dumps(extras) if extras else None,
            utc_now(),
        ),
    )
    return True


async def _upsert_events(
    conn,
    *,
    extraction_id: int,
    rows: List[Mapping[str, Any]],
    source: str,
) -> int:
    stored = 0
    for row in rows:
        normalized = _normalize_mapping(row)
        ticker = str(normalized.get("ticker") or "").upper().strip()
        date = _clean_value(normalized.get("date"))
        event_type = _clean_value(normalized.get("type")) or "OTHER"
        description = _clean_value(normalized.get("description"))
        if not ticker or not date or not description:
            continue
        stock = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (ticker,))
        if not stock:
            continue
        existing = await fetch_one(
            conn,
            """
            SELECT id
            FROM upcoming_events
            WHERE ticker = ? AND date = ? AND event_type = ? AND description = ?
            """,
            (ticker, date, event_type, description),
        )
        if existing:
            await execute(
                conn,
                """
                UPDATE upcoming_events
                SET extraction_id = ?, impact = ?, source = ?, bull_case = ?, bear_case = ?, status = ?
                WHERE id = ?
                """,
                (
                    extraction_id,
                    _clean_value(normalized.get("impact")),
                    _clean_value(normalized.get("source")) or source,
                    _clean_value(normalized.get("bull_case")),
                    _clean_value(normalized.get("bear_case")),
                    "UPCOMING",
                    existing["id"],
                ),
            )
        else:
            await execute(
                conn,
                """
                INSERT INTO upcoming_events (
                    ticker, extraction_id, date, date_precision, event_type, description,
                    impact, source, bull_case, bear_case, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    extraction_id,
                    date,
                    "EXACT",
                    event_type,
                    description,
                    _clean_value(normalized.get("impact")),
                    _clean_value(normalized.get("source")) or source,
                    _clean_value(normalized.get("bull_case")),
                    _clean_value(normalized.get("bear_case")),
                    "UPCOMING",
                    utc_now(),
                ),
            )
        stored += 1
    return stored


async def _update_run(
    conn,
    *,
    run_id: str,
    extraction_id: int,
    parse_status: str,
    header: Mapping[str, Any],
    sections: Mapping[str, str],
    decision: Mapping[str, Any],
    failed_sections: List[str],
    tripwire_lines: List[str],
    changed_since_last_analysis: int,
    raw_report: str,
) -> None:
    normalized_decision = _normalize_mapping(decision)
    await execute(
        conn,
        """
        UPDATE analysis_runs
        SET extraction_id = ?,
            status = ?,
            completed_at = ?,
            final_verdict = ?,
            final_action = ?,
            final_conviction = ?,
            entry_low = ?,
            entry_high = ?,
            stop_loss = ?,
            target_price = ?,
            timeframe = ?,
            rr_ratio = ?,
            one_line_summary = ?,
            synthesis_text = ?,
            consistency_report = ?,
            frontier_review_status = ?,
            frontier_decision_raw = ?,
            changed_since_last_analysis = ?,
            run_notes = ?
        WHERE run_id = ?
        """,
        (
            extraction_id,
            "COMPLETE",
            utc_now(),
            _clean_value(normalized_decision.get("verdict")),
            _clean_value(normalized_decision.get("action")),
            _parse_int(normalized_decision.get("conviction")),
            _parse_float(normalized_decision.get("entry_low")),
            _parse_float(normalized_decision.get("entry_high")),
            _parse_float(normalized_decision.get("stop_loss")),
            _parse_float(normalized_decision.get("target")),
            _clean_value(normalized_decision.get("timeframe")),
            _parse_ratio(normalized_decision.get("r_r_ratio") or normalized_decision.get("r_ratio") or normalized_decision.get("rr_ratio")),
            _clean_value(normalized_decision.get("summary")),
            _clean_value(sections.get("NARRATIVE")),
            json_dumps(
                {
                    "header": dict(header),
                    "parse_status": parse_status,
                    "section_names": sorted(sections.keys()),
                    "failed_sections": failed_sections,
                }
            ),
            "COMPLETE",
            raw_report,
            changed_since_last_analysis,
            "\n".join(tripwire_lines) or None,
            run_id,
        ),
    )


async def _process_report(
    conn,
    *,
    extraction_id: int,
    report: Mapping[str, Any],
    create_run_fn: Callable[..., Any],
    source_model: str,
    mode: str,
    fallback_client: Optional[OllamaFallbackClient] = None,
) -> Dict[str, Any]:
    header = report["header"]
    sections = report["sections"]
    ticker = str(header.get("ticker") or "").upper()
    report_date = _report_date(header.get("date"))
    source = _clean_value(header.get("source")) or source_model
    stock = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (ticker,))
    run = await create_run_fn(conn, ticker, extraction_id, mode, None)
    run_id = run["run_id"]

    failed_sections: List[str] = []

    decision = parse_key_value_table(sections.get("DECISION", ""))
    if sections.get("DECISION") and not decision:
        fallback = await _fallback_json("DECISION", sections["DECISION"], fallback_client)
        if isinstance(fallback, dict):
            decision = fallback
        if not decision:
            failed_sections.append("DECISION")
    elif not decision:
        failed_sections.append("DECISION")

    catalysts_rows = parse_markdown_table_block(sections.get("CATALYSTS", ""))
    if sections.get("CATALYSTS") and not catalysts_rows:
        fallback = await _fallback_json("CATALYSTS", sections["CATALYSTS"], fallback_client)
        if isinstance(fallback, dict):
            catalysts_rows = list(fallback.get("rows") or fallback.get("items") or [])
        elif isinstance(fallback, list):
            catalysts_rows = fallback
        if not catalysts_rows:
            failed_sections.append("CATALYSTS")

    price_data = parse_key_value_table(sections.get("PRICE_DATA", ""))
    if sections.get("PRICE_DATA") and not price_data:
        fallback = await _fallback_json("PRICE_DATA", sections["PRICE_DATA"], fallback_client)
        if isinstance(fallback, dict):
            price_data = fallback
        if not price_data:
            failed_sections.append("PRICE_DATA")

    event_rows = parse_markdown_table_block(sections.get("EVENTS", ""))
    if sections.get("EVENTS") and not event_rows:
        fallback = await _fallback_json("EVENTS", sections["EVENTS"], fallback_client)
        if isinstance(fallback, dict):
            event_rows = list(fallback.get("rows") or fallback.get("items") or [])
        elif isinstance(fallback, list):
            event_rows = fallback
        if not event_rows:
            failed_sections.append("EVENTS")

    tripwire_rows = parse_markdown_table_block(sections.get("TRIPWIRES", ""))
    if sections.get("TRIPWIRES") and not tripwire_rows:
        fallback = await _fallback_json("TRIPWIRES", sections["TRIPWIRES"], fallback_client)
        if isinstance(fallback, dict):
            tripwire_rows = list(fallback.get("rows") or fallback.get("items") or [])
        elif isinstance(fallback, list):
            tripwire_rows = fallback
        if not tripwire_rows:
            failed_sections.append("TRIPWIRES")

    options_rows = parse_markdown_table_block(sections.get("OPTIONS", ""))
    if sections.get("OPTIONS") and not options_rows and "no options data available" not in sections["OPTIONS"].lower():
        fallback = await _fallback_json("OPTIONS", sections["OPTIONS"], fallback_client)
        if isinstance(fallback, dict):
            options_rows = list(fallback.get("rows") or fallback.get("items") or [])
        elif isinstance(fallback, list):
            options_rows = fallback
        if not options_rows:
            failed_sections.append("OPTIONS")

    catalysts_stored = await _upsert_catalysts(
        conn,
        extraction_id=extraction_id,
        run_id=run_id,
        rows=list(catalysts_rows),
        source=source,
    )
    price_snapshot_stored = await _upsert_price_snapshot(
        conn,
        extraction_id=extraction_id,
        ticker=ticker,
        date=report_date,
        data=price_data,
    )
    events_stored = await _upsert_events(conn, extraction_id=extraction_id, rows=list(event_rows), source=source)

    notes_stored = 0
    narrative = _clean_value(sections.get("NARRATIVE"))
    if narrative:
        await _insert_research_note(
            conn,
            ticker=ticker,
            extraction_id=extraction_id,
            title=f"MINERVA Report - {ticker} - {report_date}",
            note_body=narrative,
            note_type="ANALYSIS",
            source=source,
            category="FRONTIER_ANALYSIS",
        )
        notes_stored += 1

    notes_body = _clean_value(sections.get("NOTES"))
    if notes_body:
        await _insert_research_note(
            conn,
            ticker=ticker,
            extraction_id=extraction_id,
            title=f"Additional Notes - {ticker} - {report_date}",
            note_body=notes_body,
            note_type="OBSERVATION",
            source=source,
            category="ADDITIONAL_NOTES",
        )
        notes_stored += 1

    tripwire_lines = _tripwire_lines(tripwire_rows)
    if tripwire_lines:
        await _insert_research_note(
            conn,
            ticker=ticker,
            extraction_id=extraction_id,
            title=f"Tripwires - {ticker} - {report_date}",
            note_body="\n".join(tripwire_lines),
            note_type="TRIPWIRES",
            source=source,
            category="TRIPWIRES",
        )
        notes_stored += 1

    if options_rows:
        for index, row in enumerate(options_rows, start=1):
            await _insert_research_note(
                conn,
                ticker=ticker,
                extraction_id=extraction_id,
                title=f"Options Activity {index} - {ticker} - {report_date}",
                note_body=json_dumps(row),
                note_type="OPTIONS",
                source=source,
                category="OPTIONS_ANALYSIS",
            )
            notes_stored += 1

    for section_name in failed_sections:
        content = _clean_value(sections.get(section_name))
        if not content:
            continue
        await _insert_research_note(
            conn,
            ticker=ticker,
            extraction_id=extraction_id,
            title=f"Parse Failed - {section_name} - {ticker} - {report_date}",
            note_body=content,
            note_type="PARSE_FAILED",
            source=source,
            category="PARSE_FAILED",
        )
        notes_stored += 1

    parse_status = "FAILED" if not decision and failed_sections else ("PARTIAL" if failed_sections else "COMPLETE")
    changed_since_last_analysis = _decision_changed(stock or {}, decision)
    await _update_run(
        conn,
        run_id=run_id,
        extraction_id=extraction_id,
        parse_status=parse_status,
        header=header,
        sections=sections,
        decision=decision,
        failed_sections=failed_sections,
        tripwire_lines=tripwire_lines,
        changed_since_last_analysis=changed_since_last_analysis,
        raw_report=str(report.get("raw_text") or ""),
    )

    return {
        "run_id": run_id,
        "ticker": ticker,
        "parse_status": parse_status,
        "catalysts_stored": catalysts_stored,
        "events_stored": events_stored,
        "price_snapshot_stored": price_snapshot_stored,
        "decision_stored": bool(decision),
        "notes_stored": notes_stored,
        "failed_sections": failed_sections,
    }


async def ingest_minerva_document(conn, payload: MinervaIngestRequest, create_run_fn) -> Dict[str, Any]:
    reports = parse_minerva_document(payload.raw_text)
    if not reports:
        raise ValueError("No MINERVA_REPORT blocks were found.")

    scope = [str(report["header"].get("ticker") or "").upper() for report in reports if report["header"].get("ticker")]
    if not scope:
        raise ValueError("No ticker headers were found in the MINERVA report.")

    for ticker in sorted(set(scope)):
        row = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (ticker,))
        if not row:
            raise ValueError(f"Ticker '{ticker}' does not exist in stocks.")

    extraction_date = _report_date(reports[0]["header"].get("date"))
    extraction_id = await execute(
        conn,
        """
        INSERT INTO extractions (
            date, scope, mode, source_model, raw_text, canonical_appendix, custom_focus,
            catalysts_extracted, events_extracted, prices_extracted, notes_created, parse_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            extraction_date,
            ",".join(scope),
            payload.mode,
            _report_source(reports, payload.source_model),
            payload.raw_text,
            json_dumps(reports),
            payload.custom_focus,
            0,
            0,
            0,
            0,
            "PENDING",
            utc_now(),
        ),
    )

    fallback_client = OllamaFallbackClient()
    results = [
        await _process_report(
            conn,
            extraction_id=extraction_id,
            report=report,
            create_run_fn=create_run_fn,
            source_model=payload.source_model,
            mode=payload.mode,
            fallback_client=fallback_client,
        )
        for report in reports
    ]

    parse_status = "COMPLETE"
    if all(item["parse_status"] == "FAILED" for item in results):
        parse_status = "FAILED"
    elif any(item["parse_status"] != "COMPLETE" for item in results):
        parse_status = "PARTIAL"

    await execute(
        conn,
        """
        UPDATE extractions
        SET catalysts_extracted = ?,
            events_extracted = ?,
            prices_extracted = ?,
            notes_created = ?,
            parse_status = ?
        WHERE id = ?
        """,
        (
            sum(item["catalysts_stored"] for item in results),
            sum(item["events_stored"] for item in results),
            sum(1 for item in results if item["price_snapshot_stored"]),
            sum(item["notes_stored"] for item in results),
            parse_status,
            extraction_id,
        ),
    )

    return {
        "extraction_id": extraction_id,
        "parse_status": parse_status,
        "scope": scope,
        "reports": results,
    }


async def ingest_minerva_into_existing_run(conn, run: Mapping[str, Any], document: str, source_model: str) -> Dict[str, Any]:
    reports = parse_minerva_document(document)
    if not reports:
        raise ValueError("No MINERVA_REPORT blocks were found.")

    ticker = str(run["ticker"]).upper()
    selected = next((report for report in reports if str(report["header"].get("ticker") or "").upper() == ticker), reports[0])
    extraction_id = run.get("extraction_id")
    if extraction_id is None:
        extraction_id = await execute(
            conn,
            """
            INSERT INTO extractions (
                date, scope, mode, source_model, raw_text, canonical_appendix,
                catalysts_extracted, events_extracted, prices_extracted, notes_created, parse_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _report_date(selected["header"].get("date")),
                ticker,
                run.get("mode") or "DELTA",
                _clean_value((selected.get("header") or {}).get("source")) or source_model,
                document,
                json_dumps([selected]),
                0,
                0,
                0,
                0,
                "PENDING",
                utc_now(),
            ),
        )
        await execute(conn, "UPDATE analysis_runs SET extraction_id = ? WHERE run_id = ?", (extraction_id, run["run_id"]))

    async def _reuse_run(_conn, _ticker, _extraction_id, _mode, _notes):
        return {"run_id": run["run_id"], "ticker": ticker}

    return await _process_report(
        conn,
        extraction_id=extraction_id,
        report=selected,
        create_run_fn=_reuse_run,
        source_model=source_model,
        mode=run.get("mode") or "DELTA",
        fallback_client=OllamaFallbackClient(),
    )
