from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from ..database import execute, fetch_one, utc_now
from ..models import MinervaIngestRequest
from .extraction_ingest import ingest_minerva_document, ingest_minerva_into_existing_run
from .state_updater import refresh_state, update_state


_INGEST_LOCK: Optional[asyncio.Lock] = None


def _get_ingest_lock() -> asyncio.Lock:
    global _INGEST_LOCK
    if _INGEST_LOCK is None:
        _INGEST_LOCK = asyncio.Lock()
    return _INGEST_LOCK


def generate_run_id(ticker: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
    return f"RUN_{stamp}_{ticker.upper()}_{uuid4().hex[:6].upper()}"


async def _next_run_id(conn, ticker: str) -> str:
    for _ in range(8):
        run_id = generate_run_id(ticker)
        existing = await fetch_one(conn, "SELECT run_id FROM analysis_runs WHERE run_id = ?", (run_id,))
        if not existing:
            return run_id
    raise ValueError(f"Unable to generate a unique run id for '{ticker.upper()}'.")


async def create_analysis_run(conn, ticker: str, extraction_id: Optional[int] = None, mode: str = "DELTA", notes: Optional[str] = None) -> Dict[str, Any]:
    run_id = await _next_run_id(conn, ticker)
    await execute(
        conn,
        """
        INSERT INTO analysis_runs (run_id, ticker, extraction_id, mode, status, run_notes, started_at, frontier_review_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (run_id, ticker.upper(), extraction_id, mode, "PENDING", notes, utc_now(), "PENDING"),
    )
    return {"run_id": run_id, "ticker": ticker.upper(), "status": "PENDING", "extraction_id": extraction_id}


async def ingest_minerva_report(conn, payload: MinervaIngestRequest) -> Dict[str, Any]:
    async with _get_ingest_lock():
        started = time.perf_counter()
        result = await ingest_minerva_document(conn, payload, create_analysis_run)
        for report in result["reports"]:
            await update_state(conn, result["extraction_id"], report["ticker"], report["run_id"])
        total_time_ms = int((time.perf_counter() - started) * 1000)
        result["tickers_processed"] = list(result["scope"])
        result["overall_status"] = result["parse_status"]
        result["total_time_ms"] = total_time_ms
        result["results"] = {report["ticker"]: dict(report) for report in result["reports"]}
        return result


async def ingest_report_for_run(conn, run_id: str, raw_text: str, source_model: str = "manual-frontier") -> Dict[str, Any]:
    async with _get_ingest_lock():
        run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
        if not run:
            raise ValueError("Run not found.")
        result = await ingest_minerva_into_existing_run(conn, run, raw_text, source_model)
        await update_state(conn, result.get("extraction_id") or run.get("extraction_id"), str(run["ticker"]), run_id)
        return result
