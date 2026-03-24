from __future__ import annotations

import asyncio
import json
from pathlib import Path

from backend.database import connect, fetch_all, fetch_one


REPORT = (Path(__file__).resolve().parents[1] / "fixtures" / "sample_minerva_report.md").read_text(encoding="utf-8")
STOCKS = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "seed_stocks.json").read_text(encoding="utf-8"))


def _stock_payload(ticker: str):
    return next(item for item in STOCKS if item["ticker"] == ticker)


def _fetch_one(query: str, params=()):
    async def _run():
        conn = await connect()
        try:
            return await fetch_one(conn, query, params)
        finally:
            await conn.close()

    return asyncio.run(_run())


def _fetch_all(query: str, params=()):
    async def _run():
        conn = await connect()
        try:
            return await fetch_all(conn, query, params)
        finally:
            await conn.close()

    return asyncio.run(_run())


def test_analysis_ingest_creates_extraction_and_run(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200

    response = client.post(
        "/api/analysis/ingest",
        json={"raw_text": REPORT, "source_model": "combined frontier research", "mode": "DELTA"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["parse_status"] == "COMPLETE"
    assert payload["scope"] == ["MP"]
    assert len(payload["reports"]) == 1
    report = payload["reports"][0]
    assert report["ticker"] == "MP"
    assert report["decision_stored"] is True
    assert report["price_snapshot_stored"] is True
    assert report["catalysts_stored"] == 1
    assert report["events_stored"] == 1
    assert report["parse_status"] == "COMPLETE"

    extraction = _fetch_one("SELECT source_model FROM extractions WHERE id = ?", (payload["extraction_id"],))
    assert extraction["source_model"] == "combined from: claude, chatgpt"

    history = client.get("/api/analysis/history?ticker=MP")
    assert history.status_code == 200
    history_payload = history.json()
    assert history_payload[0]["status"] == "COMPLETE"
    assert history_payload[0]["final_verdict"] == "BULLISH"
    assert history_payload[0]["final_action"] == "BUY"

    stock = client.get("/api/stocks/MP")
    assert stock.status_code == 200
    assert stock.json()["current_verdict"] == "BULLISH"
    assert stock.json()["current_action"] == "BUY"
    assert stock.json()["current_target"] == 30.0


def test_analysis_run_ingest_reuses_existing_run(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    run = client.post("/api/analysis/runs", json={"ticker": "MP"}).json()

    response = client.post(f"/api/analysis/runs/{run['run_id']}/ingest", json={"raw_text": REPORT})
    assert response.status_code == 200
    payload = response.json()
    assert payload["run_id"] == run["run_id"]
    assert payload["ticker"] == "MP"
    assert payload["decision_stored"] is True

    trail = client.get("/api/analysis/trail?ticker=MP")
    assert trail.status_code == 200
    assert trail.json()[0]["parse_status"] == "COMPLETE"
    assert trail.json()[0]["raw_report"].startswith("## MINERVA_REPORT")


def test_extraction_alias_handles_multi_report_document(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    assert client.post("/api/stocks", json=_stock_payload("UUUU")).status_code == 200

    multi_report = "\n\n".join(
        [
            REPORT,
            REPORT.replace("### Ticker: MP", "### Ticker: UUUU")
            .replace("MINERVA Report - MP", "MINERVA Report - UUUU")
            .replace("Additional Notes - MP", "Additional Notes - UUUU")
            .replace("Tripwires - MP", "Tripwires - UUUU")
            .replace("| MP |", "| UUUU |"),
        ]
    )

    response = client.post(
        "/api/extractions/ingest",
        json={"raw_text": multi_report, "source_model": "combined frontier research", "mode": "FULL_SCAN"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["parse_status"] == "COMPLETE"
    assert payload["scope"] == ["MP", "UUUU"]
    assert len(payload["reports"]) == 2
    assert {item["ticker"] for item in payload["reports"]} == {"MP", "UUUU"}


def test_malformed_section_is_preserved_as_parse_failed_note(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    malformed = REPORT.replace(
        """## CATALYSTS
| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance | Source |
|------|--------|----------|-------|------------|----------------|-------------|--------|
| 2026-03-20 | MP | GOV_FUNDING | DoD OSC loan tranche | 150000000 | OBLIGATED | 5 | DoD press release |
""",
        """## CATALYSTS
The catalyst section was pasted as prose instead of a markdown table.
Preserve this text rather than dropping it.
""",
    )

    response = client.post("/api/analysis/ingest", json={"raw_text": malformed, "source_model": "claude"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["parse_status"] == "PARTIAL"
    assert payload["reports"][0]["failed_sections"] == ["CATALYSTS"]

    notes = _fetch_all(
        "SELECT note_type, title FROM research_notes WHERE ticker = ? ORDER BY id ASC",
        ("MP",),
    )
    assert any(note["note_type"] == "PARSE_FAILED" and "CATALYSTS" in note["title"] for note in notes)


def test_partial_ingest_keeps_raw_report_visible_in_trail(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    malformed = REPORT.replace(
        """## CATALYSTS
| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance | Source |
|------|--------|----------|-------|------------|----------------|-------------|--------|
| 2026-03-20 | MP | GOV_FUNDING | DoD OSC loan tranche | 150000000 | OBLIGATED | 5 | DoD press release |
""",
        """## CATALYSTS
This block is malformed and should remain visible in the stored raw report.
""",
    )

    response = client.post("/api/analysis/ingest", json={"raw_text": malformed, "source_model": "claude"})
    assert response.status_code == 200
    trail = client.get("/api/analysis/trail?ticker=MP")
    assert trail.status_code == 200
    payload = trail.json()[0]
    assert payload["parse_status"] == "PARTIAL"
    assert "CATALYSTS" in payload["failed_sections"]
    assert "This block is malformed" in payload["raw_report"]


def test_ingest_refreshes_attention_flags_for_other_stocks(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    assert client.post("/api/stocks", json=_stock_payload("UUUU")).status_code == 200
    assert client.patch("/api/stocks/UUUU", json={"last_analysis_date": "2026-03-01T00:00:00Z"}).status_code == 200
    assert client.post("/api/journal", json={"ticker": "UUUU", "status": "OPEN", "direction": "LONG"}).status_code == 200
    assert (
        client.post(
            "/api/catalysts",
            json={
                "ticker": "UUUU",
                "date": "2026-03-23",
                "category": "GOV_FUNDING",
                "title": "High-significance update",
                "binding_status": "ANNOUNCED",
                "significance": 5,
            },
        ).status_code
        == 200
    )

    response = client.post("/api/analysis/ingest", json={"raw_text": REPORT, "source_model": "combined frontier research"})
    assert response.status_code == 200

    other_stock = client.get("/api/stocks/UUUU")
    assert other_stock.status_code == 200
    payload = other_stock.json()
    assert payload["needs_attention"] is True
    assert payload["alert_flag"] is True
    assert payload["open_position_flag"] is True
