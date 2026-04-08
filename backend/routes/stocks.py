from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, json_dumps, utc_now
from ..http_utils import handle_integrity_error, pagination, validate_stock_patch_fields
from ..models import StockCreate, StockPatch, StockResponse
from .serializers import serialize_stock

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

STOCK_COLUMNS = [
    "ticker",
    "company_name",
    "primary_mineral",
    "secondary_minerals",
    "value_chain_stage",
    "country",
    "exchange",
    "market_cap",
    "enterprise_value",
    "shares_outstanding",
    "china_dependency_exposure",
    "revenue_status",
    "cash_position_approx",
    "debt_position_approx",
    "dilution_risk",
    "dilution_notes",
    "short_interest_approx",
    "government_funding_received",
    "government_funding_pending",
    "government_contracts",
    "regulatory_status",
    "competitive_position",
    "key_risk",
    "sector_sensitivity",
    "current_price",
    "current_verdict",
    "current_action",
    "current_conviction",
    "current_thesis",
    "current_stop",
    "current_target",
    "last_analysis_date",
    "last_full_analysis",
    "open_position_flag",
    "needs_attention",
    "alert_flag",
]

JSON_FIELDS = {
    "secondary_minerals",
    "government_funding_received",
    "government_funding_pending",
    "government_contracts",
}

BOOL_FIELDS = {"open_position_flag", "needs_attention", "alert_flag"}


def _normalize_stock_payload(data):
    normalized = {}
    for key, value in data.items():
        if key in JSON_FIELDS:
            normalized[key] = json_dumps(value or ([] if key == "secondary_minerals" else {}))
        elif key in BOOL_FIELDS:
            normalized[key] = int(bool(value))
        else:
            normalized[key] = value
    return normalized


@router.get("", response_model=List[StockResponse])
async def list_stocks(limit: int = 100, offset: int = 0, q: Optional[str] = None):
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset)
        params = []
        query = "SELECT * FROM stocks"
        if q:
            params.extend([f"%{q.strip().upper()}%", f"%{q.strip()}%"])
            query += " WHERE ticker LIKE ? OR company_name LIKE ?"
        query += " ORDER BY ticker ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
        return [serialize_stock(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=StockResponse)
async def create_stock(payload: StockCreate):
    conn = await connect()
    try:
        data = _normalize_stock_payload(payload.model_dump())
        data["ticker"] = payload.ticker.upper()
        columns = ", ".join((*STOCK_COLUMNS, "created_at", "updated_at"))
        placeholders = ", ".join(["?"] * (len(STOCK_COLUMNS) + 2))
        now = utc_now()
        try:
            await execute(
                conn,
                f"INSERT INTO stocks ({columns}) VALUES ({placeholders})",
                tuple(data.get(column) for column in STOCK_COLUMNS) + (now, now),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (data["ticker"],))
        return serialize_stock(row)
    finally:
        await conn.close()


@router.patch("/{ticker}", response_model=StockResponse)
async def update_stock(ticker: str, payload: StockPatch):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (ticker.upper(),))
        if not existing:
            raise HTTPException(status_code=404, detail="Stock not found")
        data = payload.model_dump(exclude_unset=True)
        validate_stock_patch_fields(data)
        if not data:
            return serialize_stock(existing)
        normalized = _normalize_stock_payload(data)
        set_clause = ", ".join(f"{column} = ?" for column in normalized.keys())
        values = list(normalized.values()) + [utc_now(), ticker.upper()]
        try:
            await execute(conn, f"UPDATE stocks SET {set_clause}, updated_at = ? WHERE ticker = ?", values)
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (ticker.upper(),))
        return serialize_stock(row)
    finally:
        await conn.close()


@router.get("/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str):
    conn = await connect()
    try:
        row = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (ticker.upper(),))
        if not row:
            raise HTTPException(status_code=404, detail="Stock not found")
        return serialize_stock(row)
    finally:
        await conn.close()


@router.get("/{ticker}/thesis-history")
async def get_thesis_history(ticker: str):
    conn = await connect()
    try:
        stock = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (ticker.upper(),))
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        rows = await fetch_all(
            conn,
            """
            SELECT tl.*, ar.final_verdict AS verdict, ar.final_conviction AS conviction
            FROM thesis_log tl
            LEFT JOIN analysis_runs ar ON ar.run_id = tl.run_id
            WHERE tl.ticker = ?
            ORDER BY tl.as_of_date DESC, tl.id DESC
            """,
            (ticker.upper(),),
        )
        return rows
    finally:
        await conn.close()
