from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter

from ..database import connect, execute, fetch_all, fetch_one, json_dumps
from ..models import ResearchNoteCreate, ResearchNoteResponse
from .serializers import serialize_research_note

router = APIRouter(prefix="/api/research", tags=["research"])


@router.get("", response_model=List[ResearchNoteResponse])
async def list_research_notes(ticker: Optional[str] = None):
    conn = await connect()
    try:
        if ticker:
            rows = await fetch_all(conn, "SELECT * FROM research_notes WHERE ticker = ? ORDER BY created_at DESC", (ticker.upper(),))
        else:
            rows = await fetch_all(conn, "SELECT * FROM research_notes ORDER BY created_at DESC")
        return [serialize_research_note(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=ResearchNoteResponse)
async def create_research_note(payload: ResearchNoteCreate):
    conn = await connect()
    try:
        row_id = await execute(
            conn,
            """
            INSERT INTO research_notes (
                ticker, extraction_id, title, note_body, note_type, category,
                key_takeaway, source_type, related_catalysts, related_stocks, tags, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.ticker,
                payload.extraction_id,
                payload.title,
                payload.note_body,
                payload.note_type,
                payload.category,
                payload.key_takeaway,
                payload.source_type,
                json_dumps(payload.related_catalysts),
                json_dumps(payload.related_stocks),
                json_dumps(payload.tags),
                payload.source,
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM research_notes WHERE id = ?", (row_id,))
        return serialize_research_note(row)
    finally:
        await conn.close()
