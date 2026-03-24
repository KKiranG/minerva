from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query, Request

from ..database import connect, decode_json_field, fetch_one
from ..models import MinervaIngestRequest, MinervaIngestResponse, MinervaValidationResponse, ReportDetailResponse
from ..parsers.extraction import extract_sections
from .analysis import ingest_analysis, validate_minerva_ingest
from .extractions import build_file_ingest_request

router = APIRouter(prefix="/api", tags=["reports"])


def _select_report_blob(row: Dict[str, Any]) -> Tuple[Optional[str], Dict[str, Any], List[str], List[str]]:
    metadata = decode_json_field(row.get("consistency_report"), {})
    raw_report = row.get("frontier_decision_raw")
    sections = extract_sections(raw_report or "") if raw_report else {}
    return (
        raw_report,
        metadata.get("header", {}),
        metadata.get("section_names", []),
        metadata.get("failed_sections", []),
    )


@router.post("/ingest", response_model=MinervaIngestResponse)
async def ingest_alias(payload: MinervaIngestRequest):
    return await ingest_analysis(payload)


@router.post("/ingest/validate", response_model=MinervaValidationResponse)
async def validate_ingest_alias(payload: MinervaIngestRequest):
    return validate_minerva_ingest(payload)


@router.post("/ingest/file", response_model=MinervaIngestResponse)
async def ingest_file_alias(
    request: Request,
    filename: str = Query(...),
    mode: str = Query("DELTA"),
    source_model: str = Query("manual-frontier"),
    custom_focus: Optional[str] = Query(None),
):
    payload = await build_file_ingest_request(
        request,
        filename=filename,
        mode=mode,
        source_model=source_model,
        custom_focus=custom_focus,
    )
    return await ingest_analysis(payload)


@router.get("/reports/{run_id}", response_model=ReportDetailResponse)
async def get_report(run_id: str):
    conn = await connect()
    try:
        row = await fetch_one(
            conn,
            """
            SELECT
                ar.run_id,
                ar.ticker,
                ar.extraction_id,
                ar.status,
                ar.frontier_review_status,
                ar.consistency_report,
                ar.frontier_decision_raw,
                ar.started_at,
                ar.completed_at,
                ex.source_model,
                ex.content_hash
            FROM analysis_runs ar
            LEFT JOIN extractions ex ON ex.id = ar.extraction_id
            WHERE ar.run_id = ?
            """,
            (run_id,),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Report not found.")
        raw_report, header, section_names, failed_sections = _select_report_blob(row)
        return ReportDetailResponse(
            run_id=row["run_id"],
            ticker=row["ticker"],
            extraction_id=row.get("extraction_id"),
            status=row["status"],
            parse_status=decode_json_field(row.get("consistency_report"), {}).get("parse_status") or row.get("frontier_review_status"),
            source_model=row.get("source_model"),
            content_hash=row.get("content_hash"),
            raw_report=raw_report,
            failed_sections=failed_sections,
            section_names=section_names,
            header=header,
            sections=extract_sections(raw_report or "") if raw_report else {},
            started_at=row.get("started_at"),
            completed_at=row.get("completed_at"),
        )
    finally:
        await conn.close()
