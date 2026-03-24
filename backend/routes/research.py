from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, json_dumps, utc_now
from ..http import ensure_stock_exists, handle_integrity_error, pagination
from ..models import ResearchNoteCreate, ResearchNoteResponse
from .serializers import serialize_research_note

router = APIRouter(prefix="/api/research", tags=["research"])


@router.get("", response_model=List[ResearchNoteResponse])
async def list_research_notes(
    ticker: Optional[str] = None,
    category: Optional[str] = None,
    note_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset)
        clauses = []
        params: List[object] = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        if category:
            clauses.append("category = ?")
            params.append(category)
        if note_type:
            clauses.append("note_type = ?")
            params.append(note_type)
        if date_from:
            clauses.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            clauses.append("created_at <= ?")
            params.append(date_to)
        query = "SELECT * FROM research_notes"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
        return [serialize_research_note(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=ResearchNoteResponse)
async def create_research_note(payload: ResearchNoteCreate):
    conn = await connect()
    try:
        ticker = None
        if payload.ticker:
            ticker = await ensure_stock_exists(conn, payload.ticker)
        try:
            row_id = await execute(
                conn,
                """
                INSERT INTO research_notes (
                    ticker, extraction_id, title, note_body, note_type, category,
                    key_takeaway, source_type, related_catalysts, related_stocks,
                    tags, source, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
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
                    utc_now(),
                ),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM research_notes WHERE id = ?", (row_id,))
        return serialize_research_note(row)
    finally:
        await conn.close()


@router.delete("/{note_id}")
async def delete_research_note(note_id: int):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT id FROM research_notes WHERE id = ?", (note_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Research note not found")
        await execute(conn, "DELETE FROM research_notes WHERE id = ?", (note_id,))
        return {"message": "Research note deleted", "id": note_id}
    finally:
        await conn.close()
