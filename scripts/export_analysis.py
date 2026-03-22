#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.config import settings
from backend.database import connect, fetch_all, fetch_one, init_db


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", required=True)
    args = parser.parse_args()

    await init_db()
    conn = await connect()
    try:
        run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (args.run,))
        outputs = await fetch_all(conn, "SELECT * FROM agent_outputs WHERE run_id = ? ORDER BY agent_number ASC", (args.run,))
        export_dir = settings.exports_dir
        export_dir.mkdir(parents=True, exist_ok=True)
        path = export_dir / f"{args.run}.md"
        body = [f"# {args.run}", "", "## Run", "```json", json.dumps(run, indent=2, default=str), "```", ""]
        for output in outputs:
            body.extend([f"## Agent {output['agent_number']} — {output['agent_name']}", output["raw_markdown"], ""])
        path.write_text("\n".join(body), encoding="utf-8")
        print(str(path))
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
