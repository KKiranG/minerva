from __future__ import annotations

import sqlite3
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..database import connect, execute, fetch_all, fetch_one, utc_now
from ..http import ensure_stock_exists, handle_integrity_error, pagination
from ..models import PriceSnapshotCreate, PriceSnapshotPatch, PriceSnapshotResponse
from .serializers import serialize_price_snapshot

router = APIRouter(prefix="/api/prices", tags=["prices"])

BOOL_FIELDS = {"gap_up", "gap_down", "new_high_52w", "new_low_52w"}


def _normalize_payload(data):
    normalized = {}
    for key, value in data.items():
        normalized[key] = int(bool(value)) if key in BOOL_FIELDS and value is not None else value
    return normalized


@router.get("", response_model=List[PriceSnapshotResponse])
async def list_price_snapshots(ticker: Optional[str] = None, limit: int = 100, offset: int = 0):
    conn = await connect()
    try:
        limit, offset = pagination(limit, offset)
        params: List[object] = []
        query = "SELECT * FROM price_snapshots"
        if ticker:
            query += " WHERE ticker = ?"
            params.append(ticker.upper())
        query += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = await fetch_all(conn, query, params)
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
        ticker = await ensure_stock_exists(conn, payload.ticker)
        now = utc_now()
        data = _normalize_payload(payload.model_dump())
        try:
            await execute(
                conn,
                """
                INSERT INTO price_snapshots (
                    ticker, extraction_id, date, open, high, low, close, vwap, change_pct,
                    five_day_change_pct, twenty_day_change_pct, volume, volume_vs_avg,
                    relative_volume, above_50ma, above_200ma, gap_up, gap_down,
                    new_high_52w, new_low_52w, key_level, ma50, ma200, support1,
                    support2, resistance1, resistance2, atr14, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ticker, date) DO UPDATE SET
                    extraction_id = excluded.extraction_id,
                    open = COALESCE(excluded.open, price_snapshots.open),
                    high = COALESCE(excluded.high, price_snapshots.high),
                    low = COALESCE(excluded.low, price_snapshots.low),
                    close = COALESCE(excluded.close, price_snapshots.close),
                    vwap = COALESCE(excluded.vwap, price_snapshots.vwap),
                    change_pct = COALESCE(excluded.change_pct, price_snapshots.change_pct),
                    five_day_change_pct = COALESCE(excluded.five_day_change_pct, price_snapshots.five_day_change_pct),
                    twenty_day_change_pct = COALESCE(excluded.twenty_day_change_pct, price_snapshots.twenty_day_change_pct),
                    volume = COALESCE(excluded.volume, price_snapshots.volume),
                    volume_vs_avg = COALESCE(excluded.volume_vs_avg, price_snapshots.volume_vs_avg),
                    relative_volume = COALESCE(excluded.relative_volume, price_snapshots.relative_volume),
                    above_50ma = COALESCE(excluded.above_50ma, price_snapshots.above_50ma),
                    above_200ma = COALESCE(excluded.above_200ma, price_snapshots.above_200ma),
                    gap_up = COALESCE(excluded.gap_up, price_snapshots.gap_up),
                    gap_down = COALESCE(excluded.gap_down, price_snapshots.gap_down),
                    new_high_52w = COALESCE(excluded.new_high_52w, price_snapshots.new_high_52w),
                    new_low_52w = COALESCE(excluded.new_low_52w, price_snapshots.new_low_52w),
                    key_level = COALESCE(excluded.key_level, price_snapshots.key_level),
                    ma50 = COALESCE(excluded.ma50, price_snapshots.ma50),
                    ma200 = COALESCE(excluded.ma200, price_snapshots.ma200),
                    support1 = COALESCE(excluded.support1, price_snapshots.support1),
                    support2 = COALESCE(excluded.support2, price_snapshots.support2),
                    resistance1 = COALESCE(excluded.resistance1, price_snapshots.resistance1),
                    resistance2 = COALESCE(excluded.resistance2, price_snapshots.resistance2),
                    atr14 = COALESCE(excluded.atr14, price_snapshots.atr14),
                    notes = COALESCE(excluded.notes, price_snapshots.notes)
                """,
                (
                    ticker,
                    data.get("extraction_id"),
                    data.get("date"),
                    data.get("open"),
                    data.get("high"),
                    data.get("low"),
                    data.get("close"),
                    data.get("vwap"),
                    data.get("change_pct"),
                    data.get("five_day_change_pct"),
                    data.get("twenty_day_change_pct"),
                    data.get("volume"),
                    data.get("volume_vs_avg"),
                    data.get("relative_volume"),
                    data.get("above_50ma"),
                    data.get("above_200ma"),
                    data.get("gap_up", 0),
                    data.get("gap_down", 0),
                    data.get("new_high_52w", 0),
                    data.get("new_low_52w", 0),
                    data.get("key_level"),
                    data.get("ma50"),
                    data.get("ma200"),
                    data.get("support1"),
                    data.get("support2"),
                    data.get("resistance1"),
                    data.get("resistance2"),
                    data.get("atr14"),
                    data.get("notes"),
                    now,
                ),
            )
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM price_snapshots WHERE ticker = ? AND date = ?", (ticker, payload.date))
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
        data = _normalize_payload(payload.model_dump(exclude_unset=True))
        if not data:
            return serialize_price_snapshot(existing)
        set_clause = ", ".join(f"{column} = ?" for column in data.keys())
        try:
            await execute(conn, f"UPDATE price_snapshots SET {set_clause} WHERE id = ?", list(data.values()) + [snapshot_id])
        except sqlite3.IntegrityError as error:
            raise handle_integrity_error(error) from error
        row = await fetch_one(conn, "SELECT * FROM price_snapshots WHERE id = ?", (snapshot_id,))
        return serialize_price_snapshot(row)
    finally:
        await conn.close()


@router.delete("/{snapshot_id}")
async def delete_price_snapshot(snapshot_id: int):
    conn = await connect()
    try:
        existing = await fetch_one(conn, "SELECT id FROM price_snapshots WHERE id = ?", (snapshot_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Price snapshot not found")
        await execute(conn, "DELETE FROM price_snapshots WHERE id = ?", (snapshot_id,))
        return {"message": "Price snapshot deleted", "id": snapshot_id}
    finally:
        await conn.close()
