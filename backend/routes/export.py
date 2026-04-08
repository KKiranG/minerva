"""CSV export endpoints for catalysts, research notes, and price snapshots."""
from __future__ import annotations

import csv
import io
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..database import connect, fetch_all
from ..http_utils import pagination

router = APIRouter(prefix="/api/export", tags=["export"])


def _to_csv_stream(rows: list, filename: str) -> StreamingResponse:
    if not rows:
        buf = io.StringIO()
        buf.write("No data\n")
        buf.seek(0)
    else:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: (str(v) if v is not None else "") for k, v in row.items()})
        buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/catalysts.csv")
async def export_catalysts(
    ticker: Optional[str] = None,
    binding_status: Optional[str] = None,
    min_significance: Optional[int] = None,
    limit: int = 2000,
    offset: int = 0,
):
    """Export catalysts as CSV. Supports the same filters as the catalysts list API."""
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset, maximum=5000)
        clauses = ["1=1"]
        params: list = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        if binding_status:
            clauses.append("binding_status = ?")
            params.append(binding_status.upper())
        if min_significance is not None:
            clauses.append("COALESCE(significance, 0) >= ?")
            params.append(min_significance)
        query = (
            "SELECT id, ticker, date, category, title, description, amount_ceiling, "
            "amount_obligated, amount_disbursed, binding_status, significance, "
            "priced_in, source, notes, created_at "
            f"FROM catalysts WHERE {' AND '.join(clauses)} "
            "ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
        )
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
    finally:
        await conn.close()

    fname = f"catalysts_{ticker.upper() if ticker else 'all'}.csv"
    return _to_csv_stream(rows, fname)


@router.get("/research.csv")
async def export_research(
    ticker: Optional[str] = None,
    limit: int = 2000,
    offset: int = 0,
):
    """Export research notes as CSV."""
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset, maximum=5000)
        clauses = ["1=1"]
        params: list = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        query = (
            "SELECT id, ticker, title, note_type, category, key_takeaway, source, created_at "
            f"FROM research_notes WHERE {' AND '.join(clauses)} "
            "ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
        )
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
    finally:
        await conn.close()

    fname = f"research_{ticker.upper() if ticker else 'all'}.csv"
    return _to_csv_stream(rows, fname)


@router.get("/prices.csv")
async def export_prices(
    ticker: Optional[str] = None,
    limit: int = 2000,
    offset: int = 0,
):
    """Export price snapshots as CSV."""
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset, maximum=5000)
        clauses = ["1=1"]
        params: list = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        query = (
            "SELECT id, ticker, date, open, high, low, close, vwap, change_pct, "
            "volume, volume_vs_avg, ma50, ma200, atr14, created_at "
            f"FROM price_snapshots WHERE {' AND '.join(clauses)} "
            "ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
        )
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
    finally:
        await conn.close()

    fname = f"prices_{ticker.upper() if ticker else 'all'}.csv"
    return _to_csv_stream(rows, fname)
