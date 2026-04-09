from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Iterable

from ..database import fetch_all, fetch_one, utc_now

logger = logging.getLogger(__name__)


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _days_since(value: str | None) -> int:
    parsed = _parse_timestamp(value)
    if parsed is None:
        return 10_000
    return (datetime.now(timezone.utc) - parsed).days


async def _update_stock_snapshot(conn, ticker: str) -> None:
    stock_ticker = ticker.upper()
    await conn.execute(
        """
        UPDATE stocks
        SET current_verdict = COALESCE((
                SELECT ar.final_verdict
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_verdict),
            current_action = COALESCE((
                SELECT ar.final_action
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_action),
            current_conviction = COALESCE((
                SELECT ar.final_conviction
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_conviction),
            current_thesis = COALESCE((
                SELECT ar.one_line_summary
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_thesis),
            current_stop = COALESCE((
                SELECT ar.stop_loss
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_stop),
            current_target = COALESCE((
                SELECT ar.target_price
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), current_target),
            current_price = COALESCE((
                SELECT ps.close
                FROM price_snapshots ps
                WHERE ps.ticker = ?
                ORDER BY ps.date DESC, ps.id DESC
                LIMIT 1
            ), current_price),
            last_analysis_date = COALESCE((
                SELECT COALESCE(ar.completed_at, ar.started_at)
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), last_analysis_date),
            last_full_analysis = COALESCE((
                SELECT COALESCE(ar.completed_at, ar.started_at)
                FROM analysis_runs ar
                WHERE ar.ticker = ? AND ar.final_verdict IS NOT NULL
                ORDER BY ar.started_at DESC, ar.run_id DESC
                LIMIT 1
            ), last_full_analysis),
            updated_at = ?
        WHERE ticker = ?
        """,
        (
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            stock_ticker,
            utc_now(),
            stock_ticker,
        ),
    )


async def _recalculate_flags(conn) -> None:
    stocks = await fetch_all(conn, "SELECT ticker, last_analysis_date FROM stocks ORDER BY ticker ASC")
    alert_rows = await fetch_all(
        conn,
        """
        SELECT DISTINCT s.ticker
        FROM stocks s
        JOIN catalysts c ON c.ticker = s.ticker
        WHERE COALESCE(c.significance, 0) >= 4
          AND (s.last_analysis_date IS NULL OR c.created_at > s.last_analysis_date)
        """,
    )
    open_rows = await fetch_all(
        conn,
        "SELECT DISTINCT ticker FROM trading_journal WHERE status = 'OPEN'",
    )
    alert_tickers = {row["ticker"] for row in alert_rows}
    open_tickers = {row["ticker"] for row in open_rows}
    stamp = utc_now()
    updates = [
        (
            int(_days_since(row.get("last_analysis_date")) > 7),
            int(row["ticker"] in alert_tickers),
            int(row["ticker"] in open_tickers),
            stamp,
            row["ticker"],
        )
        for row in stocks
    ]
    if updates:
        await conn.executemany(
            """
            UPDATE stocks
            SET needs_attention = ?,
                alert_flag = ?,
                open_position_flag = ?,
                updated_at = ?
            WHERE ticker = ?
            """,
            updates,
        )


async def update_state(conn, extraction_id: int | None, ticker: str, run_id: str) -> None:
    try:
        await conn.execute("BEGIN")
        await _update_stock_snapshot(conn, ticker)
        await _recalculate_flags(conn)
        await conn.execute(
            """
            UPDATE analysis_runs
            SET extraction_id = COALESCE(extraction_id, ?),
                status = 'COMPLETE',
                completed_at = COALESCE(completed_at, ?)
            WHERE run_id = ?
            """,
            (extraction_id, utc_now(), run_id),
        )
        await conn.commit()
    except Exception as e:
        logger.error(f"update_state transaction failed: {e}")
        await conn.rollback()
        raise


async def refresh_state(conn, tickers: Iterable[str]) -> None:
    unique = sorted({item.upper() for item in tickers if item})
    if not unique:
        return
    try:
        await conn.execute("BEGIN")
        for ticker in unique:
            await _update_stock_snapshot(conn, ticker)
        await _recalculate_flags(conn)
        await conn.commit()
    except Exception as e:
        logger.error(f"refresh_state transaction failed: {e}")
        await conn.rollback()
        raise


async def update_state_for_run(conn, run_id: str) -> None:
    run = await fetch_one(conn, "SELECT extraction_id, ticker FROM analysis_runs WHERE run_id = ?", (run_id,))
    if not run:
        return
    await update_state(conn, int(run.get("extraction_id") or 0), str(run["ticker"]), run_id)
