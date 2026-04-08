from __future__ import annotations

import os

import httpx
from fastapi import APIRouter

from ..config import settings
from ..database import connect, fetch_one, utc_now
from ..models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])
APP_VERSION = os.getenv("MINERVA_VERSION", "3.0.0")


async def _ollama_available() -> bool:
    base_url = settings.ollama_url.rsplit("/", 1)[0]
    tags_url = f"{base_url}/tags"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(tags_url)
            response.raise_for_status()
        return True
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Ollama health check failed: {e}")
        return False


@router.get("/health", response_model=HealthResponse)
async def health_check():
    conn = await connect()
    try:
        await fetch_one(conn, "SELECT 1 AS ok")
        table_row = await fetch_one(
            conn,
            "SELECT COUNT(*) AS table_count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
        )
        stocks_row = await fetch_one(conn, "SELECT COUNT(*) AS stocks_tracked FROM stocks")
        ingest_row = await fetch_one(conn, "SELECT created_at AS last_ingest FROM extractions ORDER BY created_at DESC, id DESC LIMIT 1")
        return HealthResponse(
            status="ok",
            database_status="connected",
            database_path=str(settings.database_path),
            table_count=int((table_row or {}).get("table_count") or 0),
            stocks_tracked=int((stocks_row or {}).get("stocks_tracked") or 0),
            last_ingest=(ingest_row or {}).get("last_ingest"),
            ollama_available=await _ollama_available(),
            version=APP_VERSION,
            utc_time=utc_now(),
        )
    finally:
        await conn.close()
