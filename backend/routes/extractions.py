from __future__ import annotations

from fastapi import APIRouter

from ..database import connect
from ..models import ExtractionIngestRequest, ExtractionIngestResponse
from ..pipeline.extraction_ingest import ingest_extraction

router = APIRouter(prefix="/api/extractions", tags=["extractions"])


@router.post("/ingest", response_model=ExtractionIngestResponse)
async def post_extraction_ingest(payload: ExtractionIngestRequest):
    conn = await connect()
    try:
        result = await ingest_extraction(conn, payload)
        return result
    finally:
        await conn.close()
