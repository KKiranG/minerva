from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter

from ..database import connect, execute, fetch_all, fetch_one, json_dumps
from ..models import EventCreate, EventResponse
from .serializers import serialize_event

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
async def list_events(ticker: Optional[str] = None):
    conn = await connect()
    try:
        if ticker:
            rows = await fetch_all(conn, "SELECT * FROM upcoming_events WHERE ticker = ? ORDER BY date ASC", (ticker.upper(),))
        else:
            rows = await fetch_all(conn, "SELECT * FROM upcoming_events ORDER BY date ASC")
        return [serialize_event(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=EventResponse)
async def create_event(payload: EventCreate):
    conn = await connect()
    try:
        row_id = await execute(
            conn,
            """
            INSERT INTO upcoming_events (
                ticker, extraction_id, date, date_precision, event_type, description, impact,
                source, affected_tickers, bull_case, bear_case, outcome, outcome_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.ticker.upper(),
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
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM upcoming_events WHERE id = ?", (row_id,))
        return serialize_event(row)
    finally:
        await conn.close()
