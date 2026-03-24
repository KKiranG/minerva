from __future__ import annotations

import json
from pathlib import Path


STOCKS = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "seed_stocks.json").read_text(encoding="utf-8"))


def _stock_payload(ticker: str):
    return next(item for item in STOCKS if item["ticker"] == ticker)


def test_list_pagination_and_validation_paths(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200
    assert client.post("/api/stocks", json=_stock_payload("UUUU")).status_code == 200

    stocks = client.get("/api/stocks?limit=1&offset=1")
    assert stocks.status_code == 200
    assert len(stocks.json()) == 1

    invalid_patch = client.patch("/api/stocks/MP", json={"current_verdict": "MAYBE"})
    assert invalid_patch.status_code == 422

    orphan_event = client.post(
        "/api/events",
        json={
            "ticker": "NOPE",
            "date": "2026-03-30",
            "event_type": "FUNDING_DECISION",
            "description": "Bad ticker test",
        },
    )
    assert orphan_event.status_code == 422


def test_price_upsert_boolean_serialization_and_delete_endpoints(client):
    assert client.post("/api/stocks", json=_stock_payload("MP")).status_code == 200

    first = client.post(
        "/api/prices",
        json={
            "ticker": "MP",
            "date": "2026-03-24",
            "close": 24.5,
            "change_pct": 5.2,
            "gap_up": True,
            "new_high_52w": False,
        },
    )
    assert first.status_code == 200
    second = client.post(
        "/api/prices",
        json={
            "ticker": "MP",
            "date": "2026-03-24",
            "close": 25.1,
            "change_pct": 6.4,
            "gap_up": True,
            "new_high_52w": True,
        },
    )
    assert second.status_code == 200

    rows = client.get("/api/prices?ticker=MP")
    assert rows.status_code == 200
    payload = rows.json()
    assert len(payload) == 1
    assert payload[0]["close"] == 25.1
    assert payload[0]["gap_up"] is True
    assert payload[0]["new_high_52w"] is True

    note = client.post("/api/research", json={"ticker": "MP", "title": "Desk note", "note_body": "Body"}).json()
    event = client.post("/api/events", json={"ticker": "MP", "date": "2026-03-30", "event_type": "FUNDING_DECISION", "description": "Decision"}).json()
    journal = client.post("/api/journal", json={"ticker": "MP", "status": "OPEN", "direction": "LONG"}).json()
    catalyst = client.post(
        "/api/catalysts",
        json={"ticker": "MP", "date": "2026-03-24", "category": "GOV_FUNDING", "title": "Test catalyst", "binding_status": "ANNOUNCED"},
    ).json()

    assert client.delete(f"/api/research/{note['id']}").status_code == 200
    assert client.delete(f"/api/events/{event['id']}").status_code == 200
    assert client.delete(f"/api/journal/{journal['id']}").status_code == 200
    assert client.delete(f"/api/catalysts/{catalyst['id']}").status_code == 200
    assert client.delete(f"/api/prices/{payload[0]['id']}").status_code == 200
