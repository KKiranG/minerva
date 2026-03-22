from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one
from ..models import PriceSnapshotCreate, PriceSnapshotPatch, PriceSnapshotResponse
from .serializers import serialize_price_snapshot

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("", response_model=List[PriceSnapshotResponse])
async def list_price_snapshots(ticker: Optional[str] = None):
    conn = await connect()
    try:
        if ticker:
            rows = await fetch_all(conn, "SELECT * FROM price_snapshots WHERE ticker = ? ORDER BY date DESC, id DESC", (ticker.upper(),))
        else:
            rows = await fetch_all(conn, "SELECT * FROM price_snapshots ORDER BY date DESC, id DESC")
        return [serialize_price_snapshot(row) for row in rows]
    finally:
        await conn.close()


@router.get("/latest", response_model=PriceSnapshotResponse)
async def get_latest_price_snapshot(ticker: str):
    conn = await connect()
    try:
        row = await fetch_one(
            conn,
            "SELECT * FROM price_snapshots WHERE ticker = ? ORDER BY date DESC, id DESC LIMIT 1",
            (ticker.upper(),),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Price snapshot not found")
        return serialize_price_snapshot(row)
    finally:
        await conn.close()


@router.post("", response_model=PriceSnapshotResponse)
async def create_price_snapshot(payload: PriceSnapshotCreate):
    conn = await connect()
    try:
        row_id = await execute(
            conn,
            """
            INSERT INTO price_snapshots (
                ticker, extraction_id, date, open, high, low, close, vwap, change_pct,
                five_day_change_pct, twenty_day_change_pct, volume, volume_vs_avg, relative_volume,
                above_50ma, above_200ma, gap_up, gap_down, new_high_52w, new_low_52w,
                key_level, ma50, ma200, support1, support2, resistance1, resistance2, atr14, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.ticker.upper(),
                payload.extraction_id,
                payload.date,
                payload.open,
                payload.high,
                payload.low,
                payload.close,
                payload.vwap,
                payload.change_pct,
                payload.five_day_change_pct,
                payload.twenty_day_change_pct,
                payload.volume,
                payload.volume_vs_avg,
                payload.relative_volume,
                payload.above_50ma,
                payload.above_200ma,
                int(payload.gap_up),
                int(payload.gap_down),
                int(payload.new_high_52w),
                int(payload.new_low_52w),
                payload.key_level,
                payload.ma50,
                payload.ma200,
                payload.support1,
                payload.support2,
                payload.resistance1,
                payload.resistance2,
                payload.atr14,
                payload.notes,
            ),
        )
        row = await fetch_one(conn, "SELECT * FROM price_snapshots WHERE id = ?", (row_id,))
        return serialize_price_snapshot(row)
    finally:
        await conn.close()


@router.patch("/{snapshot_id}", response_model=PriceSnapshotResponse)
async def update_price_snapshot(snapshot_id: int, payload: PriceSnapshotPatch):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT * FROM price_snapshots WHERE id = ?", (snapshot_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Price snapshot not found")
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return serialize_price_snapshot(existing)
        normalized = {}
        for key, value in data.items():
            if key in {"gap_up", "gap_down", "new_high_52w", "new_low_52w"} and value is not None:
                normalized[key] = int(bool(value))
            else:
                normalized[key] = value
        set_clause = ", ".join(f"{column} = ?" for column in normalized.keys())
        values = list(normalized.values()) + [snapshot_id]
        await execute(conn, f"UPDATE price_snapshots SET {set_clause} WHERE id = ?", values)
        row = await fetch_one(conn, "SELECT * FROM price_snapshots WHERE id = ?", (snapshot_id,))
        return serialize_price_snapshot(row)
    finally:
        await conn.close()
