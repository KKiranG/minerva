from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from ..database import connect, decode_json_field, fetch_all, fetch_one
from ..http_utils import pagination
from ..models import (
    AnalysisRunCreate,
    AnalysisRunIngestRequest,
    AnalysisRunResponse,
    MinervaIngestRequest,
    MinervaIngestResponse,
    MinervaValidationReport,
    MinervaValidationResponse,
)
from ..parsers.extraction import SECTION_NAMES, extract_sections, parse_minerva_document
from ..pipeline.orchestrator import create_analysis_run, ingest_minerva_report, ingest_report_for_run

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

REQUIRED_REPORT_SECTIONS = ["MINERVA_REPORT", "NARRATIVE", "DECISION", "CATALYSTS", "PRICE_DATA", "EVENTS", "OPTIONS", "TRIPWIRES"]


def _serialize_trail_row(row: Dict[str, Any]) -> Dict[str, Any]:
    metadata = decode_json_field(row.get("consistency_report"), {})
    sections = extract_sections(row.get("frontier_decision_raw") or "") if row.get("frontier_decision_raw") else {}
    parse_status = metadata.get("parse_status") or row.get("frontier_review_status")
    return {
        "run_id": row["run_id"],
        "ticker": row["ticker"],
        "status": row["status"],
        "started_at": row.get("started_at"),
        "completed_at": row.get("completed_at"),
        "parse_status": parse_status,
        "verdict": row.get("final_verdict"),
        "action": row.get("final_action"),
        "conviction": row.get("final_conviction"),
        "summary": row.get("one_line_summary"),
        "raw_report": row.get("frontier_decision_raw"),
        "raw_markdown": row.get("frontier_decision_raw"),
        "failed_sections": metadata.get("failed_sections", []),
        "section_names": metadata.get("section_names", []),
        "header": metadata.get("header", {}),
        "sections": sections,
        "run_notes": row.get("run_notes"),
        "changed_since_last_analysis": bool(row.get("changed_since_last_analysis")),
    }


def validate_minerva_ingest(payload: MinervaIngestRequest) -> MinervaValidationResponse:
    parsed_reports = parse_minerva_document(payload.raw_text)
    reports: List[MinervaValidationReport] = []
    for report in parsed_reports:
        header = report.get("header") or {}
        sections = report.get("sections") or {}
        section_names = [name for name in SECTION_NAMES if name in sections]
        empty_sections = [name for name in section_names if not str(sections.get(name) or "").strip()]
        missing_sections = [name for name in REQUIRED_REPORT_SECTIONS if name not in sections]
        has_decision = bool(report.get("decision"))
        report_status = "FAILED" if not has_decision else ("PARTIAL" if empty_sections or missing_sections else "COMPLETE")
        reports.append(
            MinervaValidationReport(
                ticker=header.get("ticker"),
                date=header.get("date"),
                source=header.get("source"),
                parse_status=report_status,
                section_names=section_names,
                empty_sections=empty_sections,
                missing_sections=missing_sections,
                has_decision=has_decision,
                catalysts_rows=len(report.get("catalysts") or []),
                events_rows=len(report.get("events") or []),
                options_rows=len(report.get("options") or []),
                tripwires_rows=len(report.get("tripwires") or []),
                price_metrics=len(report.get("price_data") or {}),
            )
        )

    parse_status = "FAILED"
    if reports:
        statuses = {report.parse_status for report in reports}
        if "FAILED" in statuses:
            parse_status = "FAILED"
        elif "PARTIAL" in statuses:
            parse_status = "PARTIAL"
        else:
            parse_status = "COMPLETE"
    scope = sorted({report.ticker for report in reports if report.ticker and report.ticker != "UNKNOWN"})
    valid = bool(reports) and all(report.has_decision for report in reports)
    return MinervaValidationResponse(
        valid=valid,
        parse_status=parse_status,
        report_count=len(reports),
        scope=scope,
        reports=reports,
    )


@router.get("/history")
async def list_run_history(ticker: str, limit: int = 24, offset: int = 0) -> List[Dict[str, Any]]:
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset, maximum=100)
        rows = await fetch_all(
            conn,
            """
            SELECT
                run_id,
                ticker,
                status,
                started_at,
                completed_at,
                final_verdict,
                final_action,
                final_conviction,
                entry_low,
                entry_high,
                stop_loss,
                target_price,
                timeframe,
                rr_ratio,
                one_line_summary,
                synthesis_text,
                frontier_review_status,
                changed_since_last_analysis,
                run_notes
            FROM analysis_runs
            WHERE ticker = ?
            ORDER BY started_at DESC, run_id DESC
            LIMIT ? OFFSET ?
            """,
            (ticker.upper(), limit, offset),
        )
        return rows
    finally:
        await conn.close()


@router.get("/trail")
async def list_report_trail(ticker: str, limit: int = 12, offset: int = 0) -> List[Dict[str, Any]]:
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset, maximum=100)
        rows = await fetch_all(
            conn,
            """
            SELECT *
            FROM analysis_runs
            WHERE ticker = ?
            ORDER BY started_at DESC, run_id DESC
            LIMIT ? OFFSET ?
            """,
            (ticker.upper(), limit, offset),
        )
        return [_serialize_trail_row(row) for row in rows]
    finally:
        await conn.close()


@router.post("/runs", response_model=AnalysisRunResponse)
async def create_run(payload: AnalysisRunCreate):
    conn = await connect()
    try:
        row = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (payload.ticker.upper(),))
        if not row:
            raise HTTPException(status_code=422, detail=f"Ticker '{payload.ticker.upper()}' does not exist in stocks.")
        return await create_analysis_run(conn, payload.ticker, payload.extraction_id, payload.mode, payload.notes)
    finally:
        await conn.close()


@router.post("/ingest", response_model=MinervaIngestResponse)
async def ingest_analysis(payload: MinervaIngestRequest):
    conn = await connect()
    try:
        return await ingest_minerva_report(conn, payload)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await conn.close()


@router.post("/validate", response_model=MinervaValidationResponse)
async def validate_analysis(payload: MinervaIngestRequest):
    return validate_minerva_ingest(payload)


@router.post("/runs/{run_id}/ingest")
async def ingest_existing_run(run_id: str, payload: AnalysisRunIngestRequest, source_model: str = "manual-frontier"):
    conn = await connect()
    try:
        return await ingest_report_for_run(conn, run_id, payload.raw_text, source_model)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await conn.close()
