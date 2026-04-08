from __future__ import annotations

import logging
from fastapi import APIRouter

from ..database import connect, fetch_all

router = APIRouter(prefix="/api/search", tags=["search"])
logger = logging.getLogger(__name__)


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
        # Try FTS5 first for research notes; fall back to LIKE
        notes = []
        try:
            # Escape double quotes and format as prefix matching phrase for FTS5
            safe_term = term.replace('"', '""')
            fts_query = f'"{safe_term}"*'
            notes = await fetch_all(
                conn,
                """
                SELECT rn.id, rn.ticker, rn.title, rn.created_at
                FROM research_notes_fts fts
                JOIN research_notes rn ON rn.id = fts.rowid
                WHERE fts.research_notes_fts MATCH ?
                ORDER BY rn.created_at DESC
                LIMIT ?
                """,
                (fts_query, safe_limit),
            )
        except Exception:  # noqa: BLE001 — FTS table may not exist yet
            logger.debug("FTS5 table not ready, falling back to LIKE search for research notes")
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

@router.get("/rag")
async def rag_context(q: str, limit: int = 5):
    """
    RAG Context Builder lookup. Returns raw text chunks optimized for dropping into LLM contexts.
    """
    term = q.strip()
    if not term:
        return {"query": q, "contexts": []}
    
    safe_limit = max(1, min(limit, 15))
    like = f"%{term}%"
    conn = await connect()
    try:
        safe_term = term.replace('"', '""')
        fts_query = f'"{safe_term}"*'
        try:
            notes = await fetch_all(
                conn,
                """
                SELECT rn.ticker, rn.title, rn.note_body, rn.created_at
                FROM research_notes_fts fts
                JOIN research_notes rn ON rn.id = fts.rowid
                WHERE fts.research_notes_fts MATCH ?
                ORDER BY rn.created_at DESC
                LIMIT ?
                """,
                (fts_query, safe_limit),
            )
        except Exception:
            notes = await fetch_all(
                conn,
                """
                SELECT ticker, title, note_body, created_at
                FROM research_notes
                WHERE title LIKE ? OR note_body LIKE ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (like, like, safe_limit),
            )
        return {"query": term, "contexts": [dict(n) for n in notes]}
    finally:
        await conn.close()

