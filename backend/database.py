from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Iterable, List, Mapping, Optional, Sequence

import aiosqlite

from .config import settings


SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS stocks (
        ticker TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        primary_mineral TEXT,
        secondary_minerals TEXT,
        value_chain_stage TEXT,
        country TEXT,
        exchange TEXT,
        market_cap REAL,
        enterprise_value REAL,
        shares_outstanding REAL,
        china_dependency_exposure TEXT,
        revenue_status TEXT CHECK(revenue_status IN ('GENERATING', 'PRE_REVENUE', 'EARLY_REVENUE', 'DECLINING')),
        cash_position_approx TEXT,
        debt_position_approx TEXT,
        dilution_risk TEXT CHECK(dilution_risk IN ('HIGH', 'MEDIUM', 'LOW', 'MINIMAL')),
        dilution_notes TEXT,
        short_interest_approx TEXT,
        government_funding_received TEXT,
        government_funding_pending TEXT,
        government_contracts TEXT,
        regulatory_status TEXT,
        competitive_position TEXT,
        key_risk TEXT,
        sector_sensitivity TEXT,
        current_price REAL,
        current_verdict TEXT CHECK(current_verdict IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
        current_action TEXT CHECK(current_action IN ('BUY', 'SELL', 'HOLD', 'WATCH', 'AVOID')),
        current_conviction INTEGER,
        current_thesis TEXT,
        current_stop REAL,
        current_target REAL,
        last_analysis_date TEXT,
        last_full_analysis TEXT,
        open_position_flag INTEGER DEFAULT 0,
        needs_attention INTEGER DEFAULT 0,
        alert_flag INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS extractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        scope TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('FULL_SCAN', 'DELTA')),
        source_model TEXT NOT NULL,
        time_window_start TEXT,
        time_window_end TEXT,
        raw_text TEXT NOT NULL,
        structured_appendix TEXT,
        canonical_appendix TEXT,
        custom_focus TEXT,
        catalysts_extracted INTEGER DEFAULT 0,
        events_extracted INTEGER DEFAULT 0,
        prices_extracted INTEGER DEFAULT 0,
        notes_created INTEGER DEFAULT 0,
        parse_status TEXT CHECK(parse_status IN ('PENDING', 'COMPLETE', 'PARTIAL', 'FAILED')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS catalysts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        extraction_id INTEGER,
        analysis_run_id TEXT,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        amount_ceiling REAL,
        amount_obligated REAL,
        amount_disbursed REAL,
        binding_status TEXT NOT NULL,
        verification_grade TEXT,
        significance INTEGER,
        priced_in TEXT,
        priced_in_evidence TEXT,
        timeline_to_next_effect TEXT,
        next_decision_point TEXT,
        reversal_risk TEXT,
        affected_tickers TEXT,
        probability_materialising TEXT,
        source TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ticker, date, title),
        FOREIGN KEY(extraction_id) REFERENCES extractions(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS price_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        extraction_id INTEGER,
        date TEXT NOT NULL,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        vwap REAL,
        change_pct REAL,
        five_day_change_pct REAL,
        twenty_day_change_pct REAL,
        volume REAL,
        volume_vs_avg REAL,
        relative_volume REAL,
        above_50ma REAL,
        above_200ma REAL,
        gap_up INTEGER DEFAULT 0,
        gap_down INTEGER DEFAULT 0,
        new_high_52w INTEGER DEFAULT 0,
        new_low_52w INTEGER DEFAULT 0,
        key_level TEXT,
        ma50 REAL,
        ma200 REAL,
        support1 REAL,
        support2 REAL,
        resistance1 REAL,
        resistance2 REAL,
        atr14 REAL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ticker, date),
        FOREIGN KEY(extraction_id) REFERENCES extractions(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS upcoming_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        extraction_id INTEGER,
        date TEXT NOT NULL,
        date_precision TEXT CHECK(date_precision IN ('EXACT', 'WEEK', 'MONTH', 'QUARTER', 'UNKNOWN')),
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        impact TEXT,
        source TEXT,
        affected_tickers TEXT,
        bull_case TEXT,
        bear_case TEXT,
        outcome TEXT,
        outcome_date TEXT,
        status TEXT DEFAULT 'UPCOMING',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(extraction_id) REFERENCES extractions(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS research_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT,
        extraction_id INTEGER,
        title TEXT NOT NULL,
        note_body TEXT NOT NULL,
        note_type TEXT DEFAULT 'EXTRACTION',
        category TEXT,
        key_takeaway TEXT,
        source_type TEXT,
        related_catalysts TEXT,
        related_stocks TEXT,
        tags TEXT,
        source TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(extraction_id) REFERENCES extractions(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS analysis_runs (
        run_id TEXT PRIMARY KEY,
        ticker TEXT NOT NULL,
        extraction_id INTEGER,
        mode TEXT DEFAULT 'DELTA',
        status TEXT NOT NULL,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        final_verdict TEXT CHECK(final_verdict IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
        final_action TEXT CHECK(final_action IN ('BUY', 'SELL', 'HOLD', 'WATCH', 'AVOID')),
        final_conviction INTEGER,
        entry_low REAL,
        entry_high REAL,
        stop_loss REAL,
        target_price REAL,
        timeframe TEXT,
        rr_ratio REAL,
        one_line_summary TEXT,
        synthesis_text TEXT,
        consistency_report TEXT,
        frontier_review_status TEXT DEFAULT 'PENDING',
        frontier_decision_raw TEXT,
        changed_since_last_analysis INTEGER DEFAULT 0,
        run_notes TEXT,
        FOREIGN KEY(extraction_id) REFERENCES extractions(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS agent_outputs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        agent_number INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        agent_kind TEXT NOT NULL,
        prompt_path TEXT NOT NULL,
        task_path TEXT,
        output_path TEXT,
        raw_markdown TEXT NOT NULL,
        parsed_json TEXT,
        parse_status TEXT CHECK(parse_status IN ('PENDING', 'COMPLETE', 'FAILED')) NOT NULL,
        retry_count INTEGER DEFAULT 0,
        duration_seconds REAL,
        model TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS intelligence_merges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        date TEXT NOT NULL,
        source_models TEXT NOT NULL,
        source_outputs TEXT NOT NULL,
        agreements TEXT,
        disagreements TEXT,
        new_information TEXT,
        merged_assessment TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS trading_journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        run_id TEXT,
        status TEXT NOT NULL,
        direction TEXT DEFAULT 'LONG',
        entry_date TEXT,
        exit_date TEXT,
        entry_price REAL,
        exit_price REAL,
        stop_loss REAL,
        target_price REAL,
        quantity REAL,
        capital_committed REAL,
        pnl_amount REAL,
        pnl_percent REAL,
        thesis TEXT,
        outcome TEXT,
        planned_timeframe TEXT,
        tripwire_invalidates TEXT,
        tripwire_confirms TEXT,
        exit_reason TEXT CHECK(exit_reason IN (
            'TARGET_HIT', 'STOP_HIT', 'THESIS_INVALIDATED', 'TIME_EXPIRED',
            'PARTIAL_TAKE', 'UPGRADED', 'DOWNGRADED', 'FORCED'
        )),
        what_went_right TEXT,
        what_went_wrong TEXT,
        what_to_do_differently TEXT,
        holding_days INTEGER,
        pattern_tags TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
    )
    """,
]

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_catalysts_ticker_date ON catalysts(ticker, date)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_prices_unique_ticker_date ON price_snapshots(ticker, date)",
    "CREATE INDEX IF NOT EXISTS idx_prices_ticker_date ON price_snapshots(ticker, date)",
    "CREATE INDEX IF NOT EXISTS idx_events_ticker_date ON upcoming_events(ticker, date)",
    "CREATE INDEX IF NOT EXISTS idx_research_ticker_created ON research_notes(ticker, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_outputs_run_agent ON agent_outputs(run_id, agent_number)",
    "CREATE INDEX IF NOT EXISTS idx_runs_ticker_status ON analysis_runs(ticker, status)",
    "CREATE INDEX IF NOT EXISTS idx_journal_ticker_status ON trading_journal(ticker, status)",
]

ADDITIONAL_COLUMNS = {
    "stocks": [
        "secondary_minerals TEXT",
        "exchange TEXT",
        "china_dependency_exposure TEXT",
        "revenue_status TEXT",
        "cash_position_approx TEXT",
        "debt_position_approx TEXT",
        "dilution_risk TEXT",
        "dilution_notes TEXT",
        "short_interest_approx TEXT",
        "government_funding_received TEXT",
        "government_funding_pending TEXT",
        "government_contracts TEXT",
        "regulatory_status TEXT",
        "competitive_position TEXT",
        "key_risk TEXT",
        "sector_sensitivity TEXT",
    ],
    "price_snapshots": [
        "open REAL",
        "high REAL",
        "low REAL",
        "vwap REAL",
        "five_day_change_pct REAL",
        "twenty_day_change_pct REAL",
        "relative_volume REAL",
        "gap_up INTEGER DEFAULT 0",
        "gap_down INTEGER DEFAULT 0",
        "new_high_52w INTEGER DEFAULT 0",
        "new_low_52w INTEGER DEFAULT 0",
    ],
    "research_notes": [
        "category TEXT",
        "key_takeaway TEXT",
        "source_type TEXT",
        "related_catalysts TEXT",
        "related_stocks TEXT",
        "tags TEXT",
    ],
    "trading_journal": [
        "planned_timeframe TEXT",
        "tripwire_invalidates TEXT",
        "tripwire_confirms TEXT",
        "exit_reason TEXT",
        "what_went_right TEXT",
        "what_went_wrong TEXT",
        "what_to_do_differently TEXT",
        "holding_days INTEGER",
    ],
    "upcoming_events": [
        "date_precision TEXT",
        "affected_tickers TEXT",
        "outcome TEXT",
        "outcome_date TEXT",
    ],
}

BOOL_LIST_DEFAULTS = {"secondary_minerals", "affected_tickers", "pattern_tags", "related_catalysts", "related_stocks", "tags"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def utc_now_iso() -> str:
    return utc_now()


async def connect(db_path: Optional[Path] = None) -> aiosqlite.Connection:
    path = db_path or Path(os.getenv("MINERVA_DB_PATH", str(settings.database_path)))
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = await aiosqlite.connect(path)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON")
    return conn


async def init_db(db_path: Optional[Path] = None) -> None:
    conn = await connect(db_path)
    try:
        for statement in SCHEMA_STATEMENTS:
            await conn.execute(statement)
        await _apply_column_migrations(conn)
        await _dedupe_price_snapshots(conn)
        for statement in INDEX_STATEMENTS:
            await conn.execute(statement)
        await conn.commit()
    finally:
        await conn.close()


async def _apply_column_migrations(conn: aiosqlite.Connection) -> None:
    for table_name, columns in ADDITIONAL_COLUMNS.items():
        cursor = await conn.execute(f"PRAGMA table_info({table_name})")
        existing = {row["name"] for row in await cursor.fetchall()}
        await cursor.close()
        for column_definition in columns:
            column_name = column_definition.split()[0]
            if column_name in existing:
                continue
            await conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}")


async def _dedupe_price_snapshots(conn: aiosqlite.Connection) -> None:
    await conn.execute(
        """
        DELETE FROM price_snapshots
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM price_snapshots
            GROUP BY ticker, date
        )
        """
    )


async def fetch_all(conn: aiosqlite.Connection, query: str, params: Iterable[Any] = ()) -> List[Mapping[str, Any]]:
    cursor = await conn.execute(query, tuple(params))
    rows = await cursor.fetchall()
    await cursor.close()
    return [dict(row) for row in rows]


async def fetch_one(conn: aiosqlite.Connection, query: str, params: Iterable[Any] = ()) -> Optional[Mapping[str, Any]]:
    cursor = await conn.execute(query, tuple(params))
    row = await cursor.fetchone()
    await cursor.close()
    return dict(row) if row else None


async def execute(conn: aiosqlite.Connection, query: str, params: Iterable[Any] = ()) -> int:
    cursor = await conn.execute(query, tuple(params))
    await conn.commit()
    lastrowid = cursor.lastrowid
    await cursor.close()
    return lastrowid


async def executemany(conn: aiosqlite.Connection, query: str, params: Iterable[Iterable[Any]]) -> None:
    await conn.executemany(query, [tuple(item) for item in params])
    await conn.commit()


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True)


def decode_json_field(value: Any, default: Any) -> Any:
    if value in (None, ""):
        return default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


def decode_row(
    row: Optional[Mapping[str, Any]],
    json_fields: Sequence[str] = (),
    bool_fields: Sequence[str] = (),
) -> Optional[Mapping[str, Any]]:
    if not row:
        return row
    decoded = dict(row)
    for field in json_fields:
        default = [] if field in BOOL_LIST_DEFAULTS else {}
        decoded[field] = decode_json_field(decoded.get(field), default)
    for field in bool_fields:
        decoded[field] = bool(decoded.get(field))
    return decoded


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    conn = await connect()
    try:
        yield conn
    finally:
        await conn.close()
