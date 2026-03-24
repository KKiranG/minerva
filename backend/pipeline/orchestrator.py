from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..database import execute, fetch_one, utc_now
from ..models import MinervaIngestRequest
from .extraction_ingest import ingest_minerva_document, ingest_minerva_into_existing_run
from .state_updater import refresh_state


def generate_run_id(ticker: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    return f"RUN_{stamp}_{ticker.upper()}"


async def create_analysis_run(conn, ticker: str, extraction_id: Optional[int] = None, mode: str = "DELTA", notes: Optional[str] = None) -> Dict[str, Any]:
    run_id = generate_run_id(ticker)
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
    result = await ingest_minerva_document(conn, payload, create_analysis_run)
    await refresh_state(conn, result["scope"])
    return result


async def ingest_report_for_run(conn, run_id: str, raw_text: str, source_model: str = "manual-frontier") -> Dict[str, Any]:
    run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
    if not run:
        raise ValueError("Run not found.")
    result = await ingest_minerva_into_existing_run(conn, run, raw_text, source_model)
    await refresh_state(conn, [run["ticker"]])
    return result
