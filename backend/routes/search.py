from __future__ import annotations

from fastapi import APIRouter

from ..database import connect, fetch_all

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def global_search(q: str, limit: int = 10):
    term = q.strip()
    if not term:
        return {"query": q, "results": []}
    safe_limit = max(1, min(limit, 25))
    like = f"%{term}%"
    upper_like = f"%{term.upper()}%"
    conn = await connect()
    try:
        stocks = await fetch_all(
            conn,
            """
            SELECT ticker, company_name
            FROM stocks
            WHERE ticker LIKE ? OR company_name LIKE ?
            ORDER BY ticker ASC
            LIMIT ?
            """,
            (upper_like, like, safe_limit),
        )
        catalysts = await fetch_all(
            conn,
            """
            SELECT id, ticker, title, date
            FROM catalysts
            WHERE title LIKE ? OR COALESCE(description, '') LIKE ?
            ORDER BY date DESC, id DESC
            LIMIT ?
            """,
            (like, like, safe_limit),
        )
        notes = await fetch_all(
            conn,
            """
            SELECT id, ticker, title, created_at
            FROM research_notes
            WHERE title LIKE ? OR note_body LIKE ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (like, like, safe_limit),
        )
        results = [
            {
                "type": "stock",
                "ticker": row["ticker"],
                "title": row["ticker"],
                "subtitle": row.get("company_name"),
                "href": f"#/stocks/{row['ticker']}",
            }
            for row in stocks
        ]
        results.extend(
            {
                "type": "catalyst",
                "id": row["id"],
                "ticker": row["ticker"],
                "title": row["title"],
                "subtitle": row.get("date"),
                "href": f"#/stocks/{row['ticker']}?panel=catalysts",
            }
            for row in catalysts
        )
        results.extend(
            {
                "type": "research",
                "id": row["id"],
                "ticker": row.get("ticker"),
                "title": row["title"],
                "subtitle": row.get("created_at"),
                "href": f"#/stocks/{row['ticker']}" if row.get("ticker") else "#/research",
            }
            for row in notes
        )
        return {"query": term, "results": results[:safe_limit]}
    finally:
        await conn.close()
