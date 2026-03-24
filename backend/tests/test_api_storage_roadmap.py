from __future__ import annotations

import asyncio
from pathlib import Path

from backend.database import connect, fetch_all, fetch_one


REPORT = (Path(__file__).resolve().parents[1] / "fixtures" / "sample_minerva_report.md").read_text(encoding="utf-8")
SEED_STOCK = {
    "ticker": "MP",
    "company_name": "MP Materials",
    "primary_mineral": "Rare Earths",
    "value_chain_stage": "Integrated",
    "country": "United States",
}


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


def test_health_route_reports_db_and_utc(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database_status"] == "connected"
    assert payload["database_path"].endswith(".db")
    assert payload["table_count"] >= 1
    assert payload["stocks_tracked"] == 0
    assert payload["last_ingest"] is None
    assert isinstance(payload["ollama_available"], bool)
    assert payload["version"]
    assert payload["utc_time"].endswith("Z")


def test_root_ingest_alias_and_extraction_detail(client):
    assert client.post("/api/stocks", json=SEED_STOCK).status_code == 200

    ingest = client.post("/api/ingest", json={"raw_text": REPORT, "source_model": "claude", "mode": "DELTA"})
    assert ingest.status_code == 200
    payload = ingest.json()
    extraction_id = payload["extraction_id"]
    run_id = payload["reports"][0]["run_id"]

    detail = client.get(f"/api/extractions/{extraction_id}")
    assert detail.status_code == 200
    detail_payload = detail.json()
    assert detail_payload["id"] == extraction_id
    assert detail_payload["scope"] == ["MP"]
    assert detail_payload["content_hash"]
    assert len(detail_payload["content_hash"]) == 64
    assert detail_payload["reports"][0]["header"]["ticker"] == "MP"

    report = client.get(f"/api/reports/{run_id}")
    assert report.status_code == 200
    report_payload = report.json()
    assert report_payload["run_id"] == run_id
    assert report_payload["ticker"] == "MP"
    assert report_payload["raw_report"].startswith("## MINERVA_REPORT")
    assert "DECISION" in report_payload["section_names"]


def test_ingest_validate_alias_returns_summary_without_persisting(client):
    assert client.post("/api/stocks", json=SEED_STOCK).status_code == 200

    response = client.post("/api/ingest/validate", json={"raw_text": REPORT, "source_model": "claude", "mode": "DELTA"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is True
    assert payload["parse_status"] == "COMPLETE"
    assert payload["report_count"] == 1
    assert payload["scope"] == ["MP"]
    assert payload["reports"][0]["ticker"] == "MP"
    assert payload["reports"][0]["has_decision"] is True
    assert payload["reports"][0]["section_names"]
    assert _fetch_one("SELECT COUNT(*) AS count FROM extractions")["count"] == 0


def test_file_ingest_alias_accepts_markdown_upload(client):
    assert client.post("/api/stocks", json=SEED_STOCK).status_code == 200

    response = client.post(
        "/api/ingest/file?filename=report.md&mode=DELTA&source_model=gemini",
        content=REPORT.encode("utf-8"),
        headers={"content-type": "text/markdown; charset=utf-8"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["parse_status"] == "COMPLETE"
    assert payload["reports"][0]["ticker"] == "MP"


def test_file_ingest_alias_rejects_unsupported_extensions(client):
    response = client.post(
        "/api/ingest/file?filename=report.markdown&mode=DELTA&source_model=gemini",
        content=REPORT.encode("utf-8"),
        headers={"content-type": "text/markdown; charset=utf-8"},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Only .md and .txt files are supported."


def test_file_ingest_alias_rejects_files_over_1mb(client):
    oversized = ("A" * (1_048_576 + 1)).encode("utf-8")
    response = client.post(
        "/api/ingest/file?filename=report.md&mode=DELTA&source_model=gemini",
        content=oversized,
        headers={"content-type": "text/markdown; charset=utf-8"},
    )
    assert response.status_code == 413
    assert response.json()["detail"] == "Uploaded file exceeds the 1MB limit."


def test_ingest_populates_conviction_thesis_options_and_prompt_templates(client):
    assert client.post("/api/stocks", json=SEED_STOCK).status_code == 200

    ingest = client.post("/api/analysis/ingest", json={"raw_text": REPORT, "source_model": "chatgpt"})
    assert ingest.status_code == 200
    extraction_id = ingest.json()["extraction_id"]
    run_id = ingest.json()["reports"][0]["run_id"]

    conviction = _fetch_one("SELECT * FROM conviction_history WHERE run_id = ?", (run_id,))
    assert conviction["ticker"] == "MP"
    assert conviction["verdict"] == "BULLISH"
    assert conviction["conviction"] == 4

    thesis = _fetch_one("SELECT * FROM thesis_log WHERE run_id = ?", (run_id,))
    assert thesis["ticker"] == "MP"
    assert thesis["content_hash"]

    options = _fetch_all("SELECT * FROM options_activity WHERE run_id = ?", (run_id,))
    assert len(options) == 1
    assert options[0]["option_type"] == "CALL"
    assert options[0]["open_interest"] == 1200

    extraction = _fetch_one("SELECT content_hash FROM extractions WHERE id = ?", (extraction_id,))
    assert extraction["content_hash"]

    templates = client.get("/api/prompts/templates")
    assert templates.status_code == 200
    template_payload = templates.json()
    assert {item["slug"] for item in template_payload} == {"minerva-format-command", "minerva-format-spec"}
    assert all(item["content_hash"] for item in template_payload)

    health = client.get("/api/health")
    assert health.status_code == 200
    health_payload = health.json()
    assert health_payload["stocks_tracked"] == 1
    assert health_payload["last_ingest"]
