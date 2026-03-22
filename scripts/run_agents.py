#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import connect, init_db
from backend.pipeline.orchestrator import create_analysis_run, run_execution, run_generation


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run")
    parser.add_argument("--ticker")
    parser.add_argument("--generate-tasks", action="store_true")
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()

    await init_db()
    conn = await connect()
    try:
        run_id = args.run
        if not run_id and args.ticker:
            run = await create_analysis_run(conn, args.ticker)
            run_id = run["run_id"]
            print(f"Created run {run_id}")
        if not run_id:
            raise SystemExit("Pass --run or --ticker")
        if args.generate_tasks:
            created = await run_generation(conn, run_id)
            print(f"Generated {len(created)} task files for {run_id}")
        if args.execute:
            result = await run_execution(conn, run_id)
            print(f"Executed run {run_id} with {len(result['specialists'])} specialist outputs")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
