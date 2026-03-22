#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import connect, execute, init_db


async def main() -> None:
    fixture_path = ROOT / "backend" / "fixtures" / "seed_stocks.json"
    stocks = json.loads(fixture_path.read_text(encoding="utf-8"))
    await init_db()
    conn = await connect()
    try:
        for stock in stocks:
            await execute(
                conn,
                """
                INSERT OR REPLACE INTO stocks (
                    ticker, company_name, primary_mineral, value_chain_stage, country, exchange,
                    revenue_status, dilution_risk, competitive_position, key_risk, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (
                    stock["ticker"],
                    stock["company_name"],
                    stock.get("primary_mineral"),
                    stock.get("value_chain_stage"),
                    stock.get("country"),
                    stock.get("exchange"),
                    stock.get("revenue_status"),
                    stock.get("dilution_risk"),
                    stock.get("competitive_position"),
                    stock.get("key_risk"),
                ),
            )
        print(f"Seeded {len(stocks)} stocks")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
