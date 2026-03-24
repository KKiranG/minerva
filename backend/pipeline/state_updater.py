from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from ..database import execute, fetch_all, fetch_one, utc_now


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


async def update_stock_state(conn, ticker: str) -> None:
    stock_ticker = ticker.upper()
    latest_run = await fetch_one(
        conn,
        """
        SELECT *
        FROM analysis_runs
        WHERE ticker = ? AND final_verdict IS NOT NULL
        ORDER BY started_at DESC, run_id DESC
        LIMIT 1
        """,
        (stock_ticker,),
    )
    latest_price = await fetch_one(
        conn,
        """
        SELECT *
        FROM price_snapshots
        WHERE ticker = ?
        ORDER BY date DESC, id DESC
        LIMIT 1
        """,
        (stock_ticker,),
    )

    if latest_run is None and latest_price is None:
        return

    now = utc_now()
    if latest_run is not None:
        await execute(
            conn,
            """
            UPDATE stocks
            SET current_verdict = ?,
                current_action = ?,
                current_conviction = ?,
                current_thesis = ?,
                current_stop = ?,
                current_target = ?,
                current_price = COALESCE(?, current_price),
                last_analysis_date = ?,
                last_full_analysis = ?,
                updated_at = ?
            WHERE ticker = ?
            """,
            (
                latest_run.get("final_verdict"),
                latest_run.get("final_action"),
                latest_run.get("final_conviction"),
                latest_run.get("one_line_summary"),
                latest_run.get("stop_loss"),
                latest_run.get("target_price"),
                latest_price.get("close") if latest_price else None,
                now,
                now,
                now,
                stock_ticker,
            ),
        )
        return

    await execute(
        conn,
        "UPDATE stocks SET current_price = ?, updated_at = ? WHERE ticker = ?",
        (latest_price.get("close"), now, stock_ticker),
    )


async def recalculate_flags(conn) -> None:
    rows = await fetch_all(conn, "SELECT ticker, last_analysis_date FROM stocks ORDER BY ticker ASC")
    now = utc_now()
    for row in rows:
        ticker = row["ticker"]
        last_analysis = row.get("last_analysis_date")
        alert_count = await fetch_one(
            conn,
            """
            SELECT COUNT(*) AS count
            FROM catalysts
            WHERE ticker = ?
              AND COALESCE(significance, 0) >= 4
              AND (? IS NULL OR created_at > ?)
            """,
            (ticker, last_analysis, last_analysis),
        )
        open_positions = await fetch_one(
            conn,
            "SELECT COUNT(*) AS count FROM trading_journal WHERE ticker = ? AND status = 'OPEN'",
            (ticker,),
        )
        await execute(
            conn,
            """
            UPDATE stocks
            SET needs_attention = ?,
                alert_flag = ?,
                open_position_flag = ?,
                updated_at = ?
            WHERE ticker = ?
            """,
            (
                int(_days_since(last_analysis) > 7),
                int(bool(alert_count and alert_count["count"])),
                int(bool(open_positions and open_positions["count"])),
                now,
                ticker,
            ),
        )


async def refresh_state(conn, tickers: Iterable[str]) -> None:
    for ticker in sorted({item.upper() for item in tickers if item}):
        await update_stock_state(conn, ticker)
    await recalculate_flags(conn)
