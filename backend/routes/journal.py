from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter

from ..database import connect, execute, fetch_all, fetch_one, json_dumps
from ..models import TradingJournalCreate, TradingJournalResponse
from .serializers import serialize_journal_entry

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("", response_model=List[TradingJournalResponse])
async def list_journal_entries(ticker: Optional[str] = None):
    conn = await connect()
    try:
        if ticker:
            rows = await fetch_all(conn, "SELECT * FROM trading_journal WHERE ticker = ? ORDER BY created_at DESC", (ticker.upper(),))
        else:
            rows = await fetch_all(conn, "SELECT * FROM trading_journal ORDER BY created_at DESC")
        return [serialize_journal_entry(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=TradingJournalResponse)
async def create_journal_entry(payload: TradingJournalCreate):
    conn = await connect()
    try:
        row_id = await execute(
            conn,
            """
            INSERT INTO trading_journal (
                ticker, run_id, status, direction, entry_date, exit_date, entry_price, exit_price,
                stop_loss, target_price, quantity, capital_committed, pnl_amount, pnl_percent,
                thesis, outcome, planned_timeframe, tripwire_invalidates, tripwire_confirms,
                exit_reason, what_went_right, what_went_wrong, what_to_do_differently,
                holding_days, pattern_tags, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.ticker.upper(),
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
                json.dumps(payload.pattern_tags),
                payload.notes,
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM trading_journal WHERE id = ?", (row_id,))
        return serialize_journal_entry(row)
    finally:
        await conn.close()
