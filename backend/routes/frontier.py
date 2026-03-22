from __future__ import annotations

from fastapi import APIRouter

from ..database import connect
from ..models import FrontierIngestRequest
from ..pipeline.orchestrator import ingest_frontier_review

router = APIRouter(prefix="/api/frontier", tags=["frontier"])


@router.post("/ingest")
async def ingest_frontier(payload: FrontierIngestRequest):
    conn = await connect()
    try:
        parsed = await ingest_frontier_review(conn, payload.run_id, payload.ticker, payload.source_model, payload.raw_text, payload.merge_with_existing)
        return {"run_id": payload.run_id, "parsed": parsed}
    finally:
        await conn.close()
