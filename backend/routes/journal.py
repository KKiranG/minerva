from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, json_dumps, utc_now
from ..http_utils import ensure_stock_exists, handle_integrity_error, pagination, validate_journal_fields
from ..models import TradingJournalCreate, TradingJournalResponse
from .serializers import serialize_journal_entry

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("", response_model=List[TradingJournalResponse])
async def list_journal_entries(
    ticker: Optional[str] = None,
    status: Optional[str] = None,
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
        if status:
            clauses.append("status = ?")
            params.append(status.upper())
        query = "SELECT * FROM trading_journal"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
        return [serialize_journal_entry(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=TradingJournalResponse)
async def create_journal_entry(payload: TradingJournalCreate):
    conn = await connect()
    try:
        ticker = await ensure_stock_exists(conn, payload.ticker)
        validate_journal_fields(payload.model_dump())
        try:
            row_id = await execute(
                conn,
                """
                INSERT INTO trading_journal (
                    ticker, run_id, status, direction, entry_date, exit_date, entry_price,
                    exit_price, stop_loss, target_price, quantity, capital_committed,
                    pnl_amount, pnl_percent, thesis, outcome, planned_timeframe,
                    tripwire_invalidates, tripwire_confirms, exit_reason,
                    what_went_right, what_went_wrong, what_to_do_differently,
                    holding_days, pattern_tags, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    payload.run_id,
                    payload.status,
                    payload.direction,
                    payload.entry_date,
                    payload.exit_date,
                    payload.entry_price,
                    payload.exit_price,
                    payload.stop_loss,
                    payload.target_price,
                    payload.quantity,
                    payload.capital_committed,
                    payload.pnl_amount,
                    payload.pnl_percent,
                    payload.thesis,
                    payload.outcome,
                    payload.planned_timeframe,
                    payload.tripwire_invalidates,
                    payload.tripwire_confirms,
                    payload.exit_reason,
                    payload.what_went_right,
                    payload.what_went_wrong,
                    payload.what_to_do_differently,
                    payload.holding_days,
                    json_dumps(payload.pattern_tags),
                    payload.notes,
                    utc_now(),
                ),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM trading_journal WHERE id = ?", (row_id,))
        return serialize_journal_entry(row)
    finally:
        await conn.close()


@router.delete("/{entry_id}")
async def delete_journal_entry(entry_id: int):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT id FROM trading_journal WHERE id = ?", (entry_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        await execute(conn, "DELETE FROM trading_journal WHERE id = ?", (entry_id,))
        return {"message": "Journal entry deleted", "id": entry_id}
    finally:
        await conn.close()
