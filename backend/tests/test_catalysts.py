from __future__ import annotations


def test_catalyst_create_patch_and_filter(client):
    stock_payload = {
        "ticker": "MP",
        "company_name": "MP Materials",
        "primary_mineral": "Rare Earths",
        "value_chain_stage": "integrated",
        "country": "United States",
    }
    assert client.post("/api/stocks", json=stock_payload).status_code == 200

    catalyst_payload = {
        "ticker": "MP",
        "date": "2026-03-22",
        "category": "GOV_FUNDING",
        "title": "DOE separation award update",
        "description": "Conditional support for the separation expansion.",
        "amount_ceiling": 58000000,
        "binding_status": "CONDITIONAL",
        "verification_grade": "B",
        "significance": 4,
        "priced_in": "PARTIALLY",
        "priced_in_evidence": "Stock rose 5.2%",
        "timeline_to_next_effect": "2-4 weeks",
        "next_decision_point": "Final award confirmation",
        "reversal_risk": "MEDIUM",
        "affected_tickers": ["MP", "UUUU"],
        "probability_materialising": "HIGH",
        "source": "DOE release",
        "notes": "Initial filing",
    }

    response = client.post("/api/catalysts", json=catalyst_payload)
    assert response.status_code == 200
    created = response.json()
    assert created["ticker"] == "MP"
    assert created["affected_tickers"] == ["MP", "UUUU"]

    response = client.get("/api/catalysts?ticker=mp")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "DOE separation award update"

    response = client.patch(
        f"/api/catalysts/{created['id']}",
        json={
            "significance": 5,
            "notes": "Updated after confirmation",
            "affected_tickers": ["MP", "USAR"],
        },
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["significance"] == 5
    assert updated["notes"] == "Updated after confirmation"
    assert updated["affected_tickers"] == ["MP", "USAR"]
    assert updated["binding_status"] == "CONDITIONAL"
