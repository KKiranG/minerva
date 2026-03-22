from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException

from ..config import PROMPTS_DIR
from ..database import connect, fetch_all, fetch_one

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


def _replace(template: str, mapping):
    for key, value in mapping.items():
        template = template.replace(key, value)
    return template


def _scope_list(scope: str) -> List[str]:
    if scope.upper() == "ALL":
        return []
    return [ticker.strip().upper() for ticker in scope.split(",") if ticker.strip()]


@router.get("/extraction")
async def generate_extraction_prompt(mode: str = "DELTA", scope: str = "ALL"):
    conn = await connect()
    try:
        tickers = _scope_list(scope)
        if not tickers:
            rows = await fetch_all(conn, "SELECT ticker FROM stocks ORDER BY ticker ASC")
            tickers = [row["ticker"] for row in rows]
        ticker_list = ",".join(tickers)
        if mode.upper() == "FULL_SCAN":
            template = (PROMPTS_DIR / "extraction_master.md").read_text(encoding="utf-8")
            start = (date.today() - timedelta(days=90)).isoformat()
            filled = _replace(
                template,
                {
                    "[TICKER_LIST]": ticker_list,
                    "[START_DATE]": start,
                    "[END_DATE]": date.today().isoformat(),
                    "[OPTIONAL — any specific areas to emphasise]": "Focus on material catalysts, price structure, and upcoming events.",
                },
            )
            return {"prompt_type": "FULL_EXTRACTION", "scope": ticker_list, "text": filled}

        template = (PROMPTS_DIR / "delta.md").read_text(encoding="utf-8")
        latest_extraction = await fetch_one(conn, "SELECT date FROM extractions ORDER BY date DESC, id DESC LIMIT 1")
        last_extraction_date = latest_extraction["date"] if latest_extraction else (date.today() - timedelta(days=7)).isoformat()
        stock_rows = []
        if tickers:
            stock_rows = await fetch_all(conn, f"SELECT * FROM stocks WHERE ticker IN ({','.join(['?'] * len(tickers))}) ORDER BY ticker ASC", tickers)
        context_chunks = []
        for stock in stock_rows:
            catalysts = await fetch_all(conn, "SELECT date, title, binding_status, significance FROM catalysts WHERE ticker = ? ORDER BY date DESC LIMIT 5", (stock["ticker"],))
            events = await fetch_all(conn, "SELECT date, event_type, description FROM upcoming_events WHERE ticker = ? ORDER BY date ASC LIMIT 3", (stock["ticker"],))
            price = await fetch_one(conn, "SELECT date, close, change_pct, key_level FROM price_snapshots WHERE ticker = ? ORDER BY date DESC, id DESC LIMIT 1", (stock["ticker"],))
            context_chunks.append(
                f"Ticker: {stock['ticker']}\n"
                f"Company: {stock['company_name']}\n"
                f"Current thesis: {stock.get('current_thesis') or 'N/A'}\n"
                f"Latest price snapshot: {price or 'N/A'}\n"
                f"Recent catalysts: {catalysts}\n"
                f"Upcoming events: {events}"
            )
        filled = _replace(
            template,
            {
                "[TICKER_LIST]": ticker_list,
                "[LAST_EXTRACTION_DATE]": last_extraction_date,
                "[TODAY]": date.today().isoformat(),
                "[DASHBOARD GENERATES THIS — current catalyst list, last price, last analysis summary]": "\n\n".join(context_chunks) or "No current state available.",
            },
        )
        return {"prompt_type": "DELTA_EXTRACTION", "scope": ticker_list, "text": filled}
    finally:
        await conn.close()


@router.get("/senior-review")
async def generate_senior_review_prompt(run_id: str):
    conn = await connect()
    try:
        run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        stock = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (run["ticker"],))
        open_positions = await fetch_all(conn, "SELECT * FROM trading_journal WHERE ticker = ? AND status = 'OPEN'", (run["ticker"],))
        template = (PROMPTS_DIR / "senior_review.md").read_text(encoding="utf-8")
        filled = _replace(
            template,
            {
                "[TICKER]": run["ticker"],
                "[PRICE]": str(stock.get("current_price") or "N/A") if stock else "N/A",
                "[YES/NO — details if yes]": "YES" if open_positions else "NO",
                "[PASTE FROM PHASE D]": run.get("synthesis_text") or "No synthesis output stored yet.",
                "[DATE]": date.today().isoformat(),
            },
        )
        return {"prompt_type": "SENIOR_REVIEW", "scope": run["ticker"], "text": filled}
    finally:
        await conn.close()


@router.get("/final-oversight")
async def generate_final_oversight_prompt(run_id: str):
    conn = await connect()
    try:
        run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        stock = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (run["ticker"],))
        template = (PROMPTS_DIR / "final_oversight.md").read_text(encoding="utf-8")
        source_text = run.get("frontier_decision_raw") or run.get("synthesis_text") or "No senior review stored yet."
        filled = _replace(
            template,
            {
                "[TICKER]": run["ticker"],
                "[PRICE]": str(stock.get("current_price") or "N/A") if stock else "N/A",
                "[PASTE SENIOR REVIEW]": source_text,
                "[DATE]": date.today().isoformat(),
            },
        )
        return {"prompt_type": "FINAL_OVERSIGHT", "scope": run["ticker"], "text": filled}
    finally:
        await conn.close()
