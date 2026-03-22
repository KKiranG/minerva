from __future__ import annotations

import json
from pathlib import Path


def _seed_stock_payloads():
    fixture_path = Path(__file__).resolve().parents[1] / "fixtures" / "seed_stocks.json"
    stocks = json.loads(fixture_path.read_text(encoding="utf-8"))
    return [stock for stock in stocks if stock["ticker"] in {"MP", "UUUU", "USAR"}]


def test_stock_list_get_and_update_via_patch_or_upsert(client):
    payloads = _seed_stock_payloads()

    for payload in payloads:
        response = client.post("/api/stocks", json=payload)
        assert response.status_code == 200
        assert response.json()["ticker"] == payload["ticker"]

    response = client.get("/api/stocks")
    assert response.status_code == 200
    assert [row["ticker"] for row in response.json()] == ["MP", "USAR", "UUUU"]

    response = client.get("/api/stocks/usar")
    assert response.status_code == 200
    assert response.json()["ticker"] == "USAR"

    openapi = client.get("/openapi.json").json()
    patch_path = openapi["paths"].get("/api/stocks/{ticker}", {})

    uuuu_payload = next(payload for payload in payloads if payload["ticker"] == "UUUU")
    updated_payload = {
        **uuuu_payload,
        "current_price": 12.75,
        "current_action": "WATCH",
        "current_verdict": "BULLISH",
        "open_position_flag": True,
    }

    if "patch" in patch_path:
        response = client.patch("/api/stocks/UUUU", json={"current_price": 12.75, "current_action": "WATCH", "current_verdict": "BULLISH"})
        assert response.status_code == 200
        assert response.json()["current_price"] == 12.75
        assert response.json()["current_action"] == "WATCH"
        assert response.json()["current_verdict"] == "BULLISH"
    else:
        response = client.post("/api/stocks", json=updated_payload)
        assert response.status_code == 200

    response = client.get("/api/stocks/UUUU")
    assert response.status_code == 200
    assert response.json()["current_price"] == 12.75
    assert response.json()["current_action"] == "WATCH"
    assert response.json()["current_verdict"] == "BULLISH"
