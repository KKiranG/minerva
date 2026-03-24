from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from ..database import connect, decode_json_field, fetch_all, fetch_one
from ..http import pagination
from ..models import (
    AnalysisRunCreate,
    AnalysisRunIngestRequest,
    AnalysisRunResponse,
    MinervaIngestRequest,
    MinervaIngestResponse,
)
from ..parsers.extraction import extract_sections
from ..pipeline.orchestrator import create_analysis_run, ingest_minerva_report, ingest_report_for_run

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


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


@router.post("/runs/{run_id}/ingest")
async def ingest_existing_run(run_id: str, payload: AnalysisRunIngestRequest, source_model: str = "manual-frontier"):
    conn = await connect()
    try:
        return await ingest_report_for_run(conn, run_id, payload.raw_text, source_model)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await conn.close()
