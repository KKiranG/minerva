from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request

from ..database import connect, decode_json_field, fetch_one
from ..models import (
    ExtractionDetailResponse,
    ExtractionIngestRequest,
    MinervaIngestRequest,
    MinervaIngestResponse,
)
from .analysis import ingest_analysis

router = APIRouter(prefix="/api/extractions", tags=["extractions"])

ALLOWED_INGEST_SUFFIXES = {".md", ".txt"}
MAX_INGEST_FILE_BYTES = 1_048_576


def legacy_ingest_to_minerva(payload: ExtractionIngestRequest) -> MinervaIngestRequest:
    return MinervaIngestRequest(
        raw_text=payload.raw_text,
        mode=payload.mode,
        source_model=payload.source_model,
        custom_focus=payload.custom_focus,
    )


async def build_file_ingest_request(
    request: Request,
    *,
    filename: str,
    mode: str,
    source_model: str,
    custom_focus: Optional[str],
) -> MinervaIngestRequest:
    if not filename:
        raise HTTPException(status_code=422, detail="filename is required.")
    lowered = filename.lower()
    if not any(lowered.endswith(suffix) for suffix in ALLOWED_INGEST_SUFFIXES):
        raise HTTPException(status_code=422, detail="Only .md and .txt files are supported.")
    content = await request.body()
    if not content:
        raise HTTPException(status_code=422, detail="Uploaded file must not be empty.")
    if len(content) > MAX_INGEST_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the 1MB limit.")
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=422, detail="Uploaded file must be UTF-8 text.") from error
    return MinervaIngestRequest(raw_text=text, mode=mode, source_model=source_model, custom_focus=custom_focus)


def _split_scope(scope: str) -> List[str]:
    return [item.strip().upper() for item in (scope or "").split(",") if item.strip()]


def _serialize_extraction(row: Dict[str, Any]) -> ExtractionDetailResponse:
    reports = decode_json_field(row.get("canonical_appendix"), [])
    return ExtractionDetailResponse(
        id=row["id"],
        date=row["date"],
        scope=_split_scope(row.get("scope") or ""),
        mode=row["mode"],
        source_model=row["source_model"],
        content_hash=row.get("content_hash"),
        raw_text=row["raw_text"],
        custom_focus=row.get("custom_focus"),
        catalysts_extracted=row.get("catalysts_extracted") or 0,
        events_extracted=row.get("events_extracted") or 0,
        prices_extracted=row.get("prices_extracted") or 0,
        notes_created=row.get("notes_created") or 0,
        parse_status=row["parse_status"],
        created_at=row.get("created_at"),
        reports=reports if isinstance(reports, list) else [],
    )


@router.post("/ingest", response_model=MinervaIngestResponse)
async def post_extraction_ingest(payload: ExtractionIngestRequest):
    return await ingest_analysis(legacy_ingest_to_minerva(payload))


@router.post("/ingest/file", response_model=MinervaIngestResponse)
async def post_extraction_file_ingest(
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


@router.get("/{extraction_id}", response_model=ExtractionDetailResponse)
async def get_extraction(extraction_id: int):
    conn = await connect()
    try:
        row = await fetch_one(conn, "SELECT * FROM extractions WHERE id = ?", (extraction_id,))
        if not row:
            raise HTTPException(status_code=404, detail="Extraction not found.")
        return _serialize_extraction(row)
    finally:
        await conn.close()
