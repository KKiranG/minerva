from __future__ import annotations

import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

from backend.database import connect, execute
from backend.models import ExtractionIngestRequest
from backend.pipeline import task_generator as task_generator_module
from backend.pipeline.extraction_ingest import ingest_extraction
from backend.pipeline.orchestrator import create_analysis_run
from backend.pipeline.task_generator import generate_tasks


async def _seed_stocks(conn, fixture_path: Path) -> None:
    stocks = json.loads(fixture_path.read_text(encoding="utf-8"))
    selected = [stock for stock in stocks if stock["ticker"] in {"MP", "UUUU", "USAR"}]

    for stock in selected:
        await execute(
            conn,
            """
            INSERT INTO stocks (ticker, company_name, primary_mineral, value_chain_stage, country)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                stock["ticker"],
                stock["company_name"],
                stock.get("primary_mineral"),
                stock.get("value_chain_stage"),
                stock.get("country"),
            ),
        )


def test_generate_tasks_writes_agent_files_with_shared_context(tmp_path, monkeypatch):
    fixture_dir = Path(__file__).resolve().parents[1] / "fixtures"
    sample_path = fixture_dir / "sample_extraction.md"
    seed_path = fixture_dir / "seed_stocks.json"
    monkeypatch.setattr(task_generator_module, "settings", SimpleNamespace(tasks_dir=tmp_path))

    async def _run():
        conn = await connect()
        try:
            await _seed_stocks(conn, seed_path)

            extraction = await ingest_extraction(
                conn,
                ExtractionIngestRequest(
                    date="2026-03-23",
                    scope="MP,UUUU,USAR",
                    mode="DELTA",
                    source_model="test-model",
                    raw_text=sample_path.read_text(encoding="utf-8"),
                ),
            )
            run = await create_analysis_run(conn, "MP", extraction["extraction_id"], "DELTA", "Task generator test")
            await execute(
                conn,
                """
                INSERT INTO trading_journal (ticker, run_id, status, direction, thesis)
                VALUES (?, ?, ?, ?, ?)
                """,
                ("MP", run["run_id"], "OPEN", "LONG", "Long-term domestic rare-earth thesis remains intact."),
            )
            await execute(
                conn,
                """
                INSERT INTO agent_outputs (
                    run_id, ticker, agent_number, agent_name, agent_kind,
                    prompt_path, task_path, output_path, raw_markdown, parsed_json, parse_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run["run_id"],
                    "MP",
                    1,
                    "Catalyst & Policy",
                    "SPECIALIST",
                    "/tmp/prompt.md",
                    "/tmp/task.md",
                    "/tmp/output.md",
                    "# prior output",
                    "{}",
                    "COMPLETE",
                ),
            )

            paths = await generate_tasks(conn, run["run_id"])
            return run["run_id"], paths
        finally:
            await conn.close()

    run_id, paths = asyncio.run(_run())

    assert set(paths) == {1, 2, 3, 4, 5, 6, 7, 8}
    assert all(Path(path).exists() for path in paths.values())

    catalyst_task = Path(paths[1]).read_text(encoding="utf-8")
    price_task = Path(paths[2]).read_text(encoding="utf-8")

    assert f"Run ID: {run_id}" in catalyst_task
    assert "Ticker: MP" in catalyst_task
    assert "### Stock Profile" in catalyst_task
    assert "### Recent Catalysts" in catalyst_task
    assert "### Open Positions" in catalyst_task
    assert "Long-term domestic rare-earth thesis remains intact." in catalyst_task
    assert "### Previous Outputs" in catalyst_task
    assert "Assess catalyst materiality, binding status, timeline, and policy environment." in catalyst_task
    assert "Assess trend, volume, key levels, momentum, and volatility." in price_task
