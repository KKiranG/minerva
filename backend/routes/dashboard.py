from __future__ import annotations

from fastapi import APIRouter

from ..database import connect, fetch_all, utc_now

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
                    SELECT ps.close
                    FROM price_snapshots ps
                    WHERE ps.ticker = s.ticker
                    ORDER BY ps.date DESC, ps.id DESC
                    LIMIT 1
                )) AS current_price,
                (
                    SELECT COALESCE(ps.change_pct, ps.five_day_change_pct, ps.twenty_day_change_pct)
                    FROM price_snapshots ps
                    WHERE ps.ticker = s.ticker
                    ORDER BY ps.date DESC, ps.id DESC
                    LIMIT 1
                ) AS daily_change_pct,
                s.current_verdict,
                s.current_conviction,
                s.current_action,
                s.current_thesis AS one_line_summary,
                s.last_analysis_date,
                s.open_position_flag,
                s.needs_attention,
                s.alert_flag,
                COALESCE((
                    SELECT COUNT(*)
                    FROM catalysts c
                    WHERE c.ticker = s.ticker AND COALESCE(c.significance, 0) >= 4
                ), 0) AS active_catalyst_count,
                (
                    SELECT e.date
                    FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC, e.id ASC
                    LIMIT 1
                ) AS next_event_date,
                (
                    SELECT e.event_type
                    FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC, e.id ASC
                    LIMIT 1
                ) AS next_event_type,
                (
                    SELECT e.description
                    FROM upcoming_events e
                    WHERE e.ticker = s.ticker AND e.status = 'UPCOMING'
                    ORDER BY e.date ASC, e.id ASC
                    LIMIT 1
                ) AS next_event_description,
                COALESCE((
                    SELECT ar.changed_since_last_analysis
                    FROM analysis_runs ar
                    WHERE ar.ticker = s.ticker
                    ORDER BY ar.started_at DESC, ar.run_id DESC
                    LIMIT 1
                ), 0) AS changed_since_last_analysis
            FROM stocks s
            ORDER BY s.alert_flag DESC, s.needs_attention DESC, s.ticker ASC
            """,
        )
        for row in rows:
            row["open_position_flag"] = bool(row.get("open_position_flag"))
            row["needs_attention"] = bool(row.get("needs_attention"))
            row["alert_flag"] = bool(row.get("alert_flag"))
            row["changed_since_last_analysis"] = bool(row.get("changed_since_last_analysis"))
        return {"generated_at": utc_now(), "stocks": rows}
    finally:
        await conn.close()
