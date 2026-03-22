from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one
from ..models import CatalystCreate, CatalystPatch, CatalystResponse

router = APIRouter(prefix="/api/catalysts", tags=["catalysts"])


@router.get("", response_model=List[CatalystResponse])
async def list_catalysts(ticker: Optional[str] = None):
    conn = await connect()
    try:
        if ticker:
            rows = await fetch_all(conn, "SELECT * FROM catalysts WHERE ticker = ? ORDER BY date DESC", (ticker.upper(),))
        else:
            rows = await fetch_all(conn, "SELECT * FROM catalysts ORDER BY date DESC")
        return [_deserialize_catalyst(row) for row in rows]
    finally:
        await conn.close()


@router.post("", response_model=CatalystResponse)
async def create_catalyst(payload: CatalystCreate):
    conn = await connect()
    try:
        row_id = await execute(
            conn,
            """
            INSERT INTO catalysts (
                ticker, extraction_id, analysis_run_id, date, category, title, description,
                amount_ceiling, amount_obligated, amount_disbursed, binding_status,
                verification_grade, significance, priced_in, priced_in_evidence,
                timeline_to_next_effect, next_decision_point, reversal_risk,
                affected_tickers, probability_materialising, source, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.ticker.upper(),
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
                json.dumps(payload.affected_tickers),
                payload.probability_materialising,
                payload.source,
                payload.notes,
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM catalysts WHERE id = ?", (row_id,))
        return _deserialize_catalyst(row)
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
        merged = {**existing, **data}
        await execute(
            conn,
            """
            UPDATE catalysts
            SET description = ?, amount_ceiling = ?, amount_obligated = ?, amount_disbursed = ?,
                binding_status = ?, verification_grade = ?, significance = ?, priced_in = ?,
                priced_in_evidence = ?, timeline_to_next_effect = ?, next_decision_point = ?,
                reversal_risk = ?, affected_tickers = ?, probability_materialising = ?,
                source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                merged.get("description"),
                merged.get("amount_ceiling"),
                merged.get("amount_obligated"),
                merged.get("amount_disbursed"),
                merged.get("binding_status"),
                merged.get("verification_grade"),
                merged.get("significance"),
                merged.get("priced_in"),
                merged.get("priced_in_evidence"),
                merged.get("timeline_to_next_effect"),
                merged.get("next_decision_point"),
                merged.get("reversal_risk"),
                json.dumps(merged.get("affected_tickers") or []),
                merged.get("probability_materialising"),
                merged.get("source"),
                merged.get("notes"),
                catalyst_id,
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM catalysts WHERE id = ?", (catalyst_id,))
        return _deserialize_catalyst(row)
    finally:
        await conn.close()


def _deserialize_catalyst(row):
    if row and row.get("affected_tickers"):
        row["affected_tickers"] = json.loads(row["affected_tickers"])
    elif row:
        row["affected_tickers"] = []
    return row
