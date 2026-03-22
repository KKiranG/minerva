from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from ..database import connect, fetch_all

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
async def dashboard_overview():
    conn = await connect()
    try:
        rows = await fetch_all(
            conn,
            """
            SELECT
                s.ticker,
                s.company_name,
                COALESCE(s.current_price, (
                    SELECT ps.close FROM price_snapshots ps
                    WHERE ps.ticker = s.ticker
                    ORDER BY ps.date DESC, ps.id DESC LIMIT 1
                )) AS current_price,
                (
                    SELECT COALESCE(ps.change_pct, ps.five_day_change_pct, ps.twenty_day_change_pct)
                    FROM price_snapshots ps
                    WHERE ps.ticker = s.ticker
                    ORDER BY ps.date DESC, ps.id DESC LIMIT 1
                ) AS daily_change_pct,
                s.current_verdict,
                s.current_conviction,
                s.current_action,
                s.current_thesis AS one_line_summary,
                s.last_analysis_date,
                COALESCE((
                    SELECT COUNT(*)
                    FROM trading_journal tj
                    WHERE tj.ticker = s.ticker AND tj.status = 'OPEN'
                ), 0) > 0 AS open_position_flag,
                s.alert_flag,
                COALESCE((
                    SELECT COUNT(*)
                    FROM catalysts c
                    WHERE c.ticker = s.ticker AND COALESCE(c.significance, 0) >= 4
                ), 0) AS active_catalyst_count,
                (
                    SELECT date FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC LIMIT 1
                ) AS next_event_date,
                (
                    SELECT event_type FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC LIMIT 1
                ) AS next_event_type,
                (
                    SELECT description FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC LIMIT 1
                ) AS next_event_description,
                s.needs_attention,
                COALESCE((
                    SELECT changed_since_last_analysis
                    FROM analysis_runs ar
                    WHERE ar.ticker = s.ticker
                    ORDER BY ar.started_at DESC LIMIT 1
                ), 0) AS changed_since_last_analysis
            FROM stocks s
            ORDER BY s.alert_flag DESC, s.needs_attention DESC, s.ticker ASC
            """,
        )
        return {"generated_at": datetime.utcnow().isoformat(), "stocks": rows}
    finally:
        await conn.close()
