from __future__ import annotations

from fastapi import APIRouter

from ..models import ExtractionIngestRequest, MinervaIngestRequest, MinervaIngestResponse
from .analysis import ingest_analysis

router = APIRouter(prefix="/api/extractions", tags=["extractions"])


@router.post("/ingest", response_model=MinervaIngestResponse)
async def post_extraction_ingest(payload: ExtractionIngestRequest):
    return await ingest_analysis(
        MinervaIngestRequest(
            raw_text=payload.raw_text,
            mode=payload.mode,
            source_model=payload.source_model,
            custom_focus=payload.custom_focus,
        )
    )
