from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from ..agents.registry import SPECIALIST_AGENTS
from ..config import settings
from ..database import execute, fetch_all, fetch_one
from ..parsers.agent_output import parse_synthesis_decision
from ..parsers.frontier_output import parse_frontier_output
from .agent_executor import OllamaClient, execute_agent
from .local_review import run_local_review
from .task_generator import generate_tasks


def generate_run_id(ticker: str) -> str:
    return f"RUN_{datetime.utcnow().strftime('%Y-%m-%d_%H%M%S')}_{ticker.upper()}"


async def create_analysis_run(conn, ticker: str, extraction_id: Optional[int] = None, mode: str = "DELTA", notes: Optional[str] = None) -> Dict[str, Any]:
    run_id = generate_run_id(ticker)
    await execute(
        conn,
        """
        INSERT INTO analysis_runs (run_id, ticker, extraction_id, mode, status, run_notes)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (run_id, ticker.upper(), extraction_id, mode, "PENDING", notes),
    )
    return {"run_id": run_id, "ticker": ticker.upper(), "status": "PENDING", "extraction_id": extraction_id}


async def run_generation(conn, run_id: str) -> Dict[int, str]:
    paths = await generate_tasks(conn, run_id)
    await execute(conn, "UPDATE analysis_runs SET status = ? WHERE run_id = ?", ("TASKS_READY", run_id))
    return paths


async def run_execution(conn, run_id: str, client: Optional[OllamaClient] = None) -> Dict[str, Any]:
    run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
    if not run:
        raise ValueError(f"Unknown run: {run_id}")
    ticker = run["ticker"]
    client = client or OllamaClient()
    await execute(conn, "UPDATE analysis_runs SET status = ? WHERE run_id = ?", ("RUNNING", run_id))
    task_dir = settings.tasks_dir / run_id
    if not task_dir.exists():
        await run_generation(conn, run_id)
    results = []
    for spec in SPECIALIST_AGENTS:
        task_path = task_dir / f"{spec.number:02d}_{spec.slug}.md"
        content = task_path.read_text(encoding="utf-8")
        results.append(await execute_agent(conn, spec, run_id, ticker, content, str(task_path), client=client))
    review_results = await run_local_review(conn, run_id, ticker, client=client)
    await execute(
        conn,
        "UPDATE analysis_runs SET status = ?, completed_at = CURRENT_TIMESTAMP, consistency_report = ?, synthesis_text = ? WHERE run_id = ?",
        ("LOCAL_REVIEW_COMPLETE", review_results["consistency"], review_results["synthesis"], run_id),
    )
    return {"specialists": results, "review": review_results}


async def ingest_frontier_review(conn, run_id: str, ticker: str, source_model: str, raw_text: str, merge_with_existing: bool = False) -> Dict[str, Any]:
    parsed = parse_frontier_output(raw_text)
    await execute(
        conn,
        """
        UPDATE analysis_runs
        SET final_verdict = ?, final_action = ?, final_conviction = ?,
            entry_low = ?, entry_high = ?, stop_loss = ?, target_price = ?,
            timeframe = ?, one_line_summary = COALESCE(?, one_line_summary),
            frontier_review_status = ?, frontier_decision_raw = ?, status = ?
        WHERE run_id = ?
        """,
        (
            parsed.get("final_verdict"),
            parsed.get("final_action"),
            int(parsed["final_conviction"]) if parsed.get("final_conviction") else None,
            parsed.get("entry_low"),
            parsed.get("entry_high"),
            parsed.get("stop_loss"),
            parsed.get("target_price"),
            parsed.get("timeframe"),
            parsed.get("one_line_summary"),
            "COMPLETE",
            raw_text,
            "COMPLETE",
            run_id,
        ),
    )
    await execute(
        conn,
        """
        UPDATE stocks
        SET current_verdict = ?, current_action = ?, current_conviction = ?, current_thesis = ?,
            current_stop = ?, current_target = ?, last_analysis_date = CURRENT_TIMESTAMP,
            last_full_analysis = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE ticker = ?
        """,
        (
            parsed.get("final_verdict"),
            parsed.get("final_action"),
            int(parsed["final_conviction"]) if parsed.get("final_conviction") else None,
            parsed.get("one_line_summary"),
            parsed.get("stop_loss"),
            parsed.get("target_price"),
            ticker.upper(),
        ),
    )
    if merge_with_existing:
        outputs = await fetch_all(conn, "SELECT id FROM agent_outputs WHERE run_id = ?", (run_id,))
        await execute(
            conn,
            """
            INSERT INTO intelligence_merges (
                run_id, ticker, date, source_models, source_outputs, agreements,
                disagreements, new_information, merged_assessment
            ) VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                ticker.upper(),
                json.dumps([source_model]),
                json.dumps([row["id"] for row in outputs]),
                json.dumps(parsed.get("agreements", [])),
                json.dumps([]),
                json.dumps(parsed.get("blind_spots", [])),
                raw_text,
            ),
        )
    return parsed
