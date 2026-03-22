from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter

from ..database import connect, decode_json_field, fetch_all, fetch_one
from ..models import AnalysisRunCreate, AnalysisRunResponse
from ..pipeline.orchestrator import create_analysis_run, run_execution, run_generation

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _serialize_agent_output(row: Dict[str, Any]) -> Dict[str, Any]:
    parsed = decode_json_field(row.get("parsed_json"), {})
    return {
        "id": row["id"],
        "run_id": row["run_id"],
        "ticker": row["ticker"],
        "agent_number": row["agent_number"],
        "agent_name": row["agent_name"],
        "agent_kind": row["agent_kind"],
        "parse_status": row["parse_status"],
        "model": row.get("model"),
        "error_message": row.get("error_message"),
        "created_at": row.get("created_at"),
        "raw_markdown": row.get("raw_markdown"),
        "parsed_json": parsed,
        "run_status": row.get("run_status"),
        "run_verdict": row.get("run_verdict"),
        "run_action": row.get("run_action"),
        "run_conviction": row.get("run_conviction"),
    }


@router.get("/history")
async def list_run_history(ticker: str) -> List[Dict[str, Any]]:
    conn = await connect()
    try:
        rows = await fetch_all(
            conn,
            """
            SELECT
                run_id,
                ticker,
                status,
                started_at,
                completed_at,
                final_verdict,
                final_action,
                final_conviction,
                entry_low,
                entry_high,
                stop_loss,
                target_price,
                timeframe,
                rr_ratio,
                one_line_summary,
                synthesis_text,
                frontier_review_status,
                changed_since_last_analysis
            FROM analysis_runs
            WHERE ticker = ?
            ORDER BY started_at DESC
            """,
            (ticker.upper(),),
        )
        return rows
    finally:
        await conn.close()


@router.get("/trail")
async def list_agent_trail(ticker: str, limit: int = 24) -> List[Dict[str, Any]]:
    conn = await connect()
    try:
        capped_limit = max(1, min(limit, 100))
        rows = await fetch_all(
            conn,
            """
            SELECT
                ao.*,
                ar.status AS run_status,
                ar.final_verdict AS run_verdict,
                ar.final_action AS run_action,
                ar.final_conviction AS run_conviction
            FROM agent_outputs ao
            JOIN analysis_runs ar ON ar.run_id = ao.run_id
            WHERE ao.ticker = ?
            ORDER BY ao.created_at DESC, ao.agent_number ASC
            LIMIT ?
            """,
            (ticker.upper(), capped_limit),
        )
        return [_serialize_agent_output(row) for row in rows]
    finally:
        await conn.close()


@router.post("/runs", response_model=AnalysisRunResponse)
async def create_run(payload: AnalysisRunCreate):
    conn = await connect()
    try:
        result = await create_analysis_run(conn, payload.ticker, payload.extraction_id, payload.mode, payload.notes)
        return result
    finally:
        await conn.close()


@router.post("/runs/{run_id}/generate-tasks")
async def generate_tasks(run_id: str):
    conn = await connect()
    try:
        created = await run_generation(conn, run_id)
        return {"run_id": run_id, "task_files": created}
    finally:
        await conn.close()


@router.post("/runs/{run_id}/execute")
async def execute_run(run_id: str):
    conn = await connect()
    try:
        result = await run_execution(conn, run_id)
        row = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
        return {"run": row, "execution": result}
    finally:
        await conn.close()
