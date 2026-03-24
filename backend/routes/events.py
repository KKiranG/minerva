from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, json_dumps, utc_now
from ..http import ensure_stock_exists, handle_integrity_error, pagination
from ..models import EventCreate, EventResponse
from .serializers import serialize_event

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
async def list_events(
    ticker: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset)
        clauses = []
        params: List[object] = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        if status:
            clauses.append("status = ?")
            params.append(status.upper())
        if date_from:
            clauses.append("date >= ?")
            params.append(date_from)
        if date_to:
            clauses.append("date <= ?")
            params.append(date_to)
        query = "SELECT * FROM upcoming_events"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY date ASC, id ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
        return [serialize_event(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=EventResponse)
async def create_event(payload: EventCreate):
    conn = await connect()
    try:
        ticker = await ensure_stock_exists(conn, payload.ticker)
        try:
            row_id = await execute(
                conn,
                """
                INSERT INTO upcoming_events (
                    ticker, extraction_id, date, date_precision, event_type, description,
                    impact, source, affected_tickers, bull_case, bear_case, outcome,
                    outcome_date, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    payload.extraction_id,
                    payload.date,
                    payload.date_precision,
                    payload.event_type,
                    payload.description,
                    payload.impact,
                    payload.source,
                    json_dumps(payload.affected_tickers),
                    payload.bull_case,
                    payload.bear_case,
                    payload.outcome,
                    payload.outcome_date,
                    payload.status,
                    utc_now(),
                ),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM upcoming_events WHERE id = ?", (row_id,))
        return serialize_event(row)
    finally:
        await conn.close()


@router.delete("/{event_id}")
async def delete_event(event_id: int):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT id FROM upcoming_events WHERE id = ?", (event_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Event not found")
        await execute(conn, "DELETE FROM upcoming_events WHERE id = ?", (event_id,))
        return {"message": "Event deleted", "id": event_id}
    finally:
        await conn.close()
