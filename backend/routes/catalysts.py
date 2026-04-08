from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, json_dumps, utc_now
from ..http_utils import ensure_stock_exists, handle_integrity_error, pagination, validate_catalyst_patch_fields
from ..models import CatalystCreate, CatalystPatch, CatalystResponse
from .serializers import serialize_catalyst

router = APIRouter(prefix="/api/catalysts", tags=["catalysts"])


@router.get("", response_model=List[CatalystResponse])
async def list_catalysts(
    ticker: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    binding_status: Optional[str] = None,
    min_significance: Optional[int] = None,
    sort: str = "date_desc",
):
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset)
        clauses = []
        params: List[object] = []
        if ticker:
            clauses.append("ticker = ?")
            params.append(ticker.upper())
        if binding_status:
            clauses.append("binding_status = ?")
            params.append(binding_status.upper())
        if min_significance is not None:
            clauses.append("COALESCE(significance, 0) >= ?")
            params.append(min_significance)
        order_map = {
            "date_desc": "date DESC, id DESC",
            "date_asc": "date ASC, id ASC",
            "significance_desc": "COALESCE(significance, 0) DESC, date DESC",
            "binding": "binding_status ASC, date DESC",
        }
        query = "SELECT * FROM catalysts"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += f" ORDER BY {order_map.get(sort, order_map['date_desc'])} LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
        return [serialize_catalyst(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=CatalystResponse)
async def create_catalyst(payload: CatalystCreate):
    conn = await connect()
    try:
        ticker = await ensure_stock_exists(conn, payload.ticker)
        now = utc_now()
        try:
            row_id = await execute(
                conn,
                """
                INSERT INTO catalysts (
                    ticker, extraction_id, analysis_run_id, date, category, title, description,
                    amount_ceiling, amount_obligated, amount_disbursed, binding_status,
                    verification_grade, significance, priced_in, priced_in_evidence,
                    timeline_to_next_effect, next_decision_point, reversal_risk, affected_tickers,
                    probability_materialising, source, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    payload.extraction_id,
                    payload.analysis_run_id,
                    payload.date,
                    payload.category,
                    payload.title,
                    payload.description,
                    payload.amount_ceiling,
                    payload.amount_obligated,
                    payload.amount_disbursed,
                    payload.binding_status,
                    payload.verification_grade,
                    payload.significance,
                    payload.priced_in,
                    payload.priced_in_evidence,
                    payload.timeline_to_next_effect,
                    payload.next_decision_point,
                    payload.reversal_risk,
                    json_dumps(payload.affected_tickers),
                    payload.probability_materialising,
                    payload.source,
                    payload.notes,
                    now,
                    now,
                ),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM catalysts WHERE id = ?", (row_id,))
        return serialize_catalyst(row)
    finally:
        await conn.close()


@router.patch("/{catalyst_id}", response_model=CatalystResponse)
async def patch_catalyst(catalyst_id: int, payload: CatalystPatch):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT * FROM catalysts WHERE id = ?", (catalyst_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Catalyst not found")
        data = payload.model_dump(exclude_unset=True)
        validate_catalyst_patch_fields(data)
        if not data:
            return serialize_catalyst(existing)
        normalized = {}
        for key, value in data.items():
            normalized[key] = json_dumps(value) if key == "affected_tickers" and value is not None else value
        set_clause = ", ".join(f"{column} = ?" for column in normalized.keys())
        values = list(normalized.values()) + [utc_now(), catalyst_id]
        try:
            await execute(conn, f"UPDATE catalysts SET {set_clause}, updated_at = ? WHERE id = ?", values)
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM catalysts WHERE id = ?", (catalyst_id,))
        return serialize_catalyst(row)
    finally:
        await conn.close()


@router.delete("/{catalyst_id}")
async def delete_catalyst(catalyst_id: int):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT id FROM catalysts WHERE id = ?", (catalyst_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Catalyst not found")
        await execute(conn, "DELETE FROM catalysts WHERE id = ?", (catalyst_id,))
        return {"message": "Catalyst deleted", "id": catalyst_id}
    finally:
        await conn.close()
