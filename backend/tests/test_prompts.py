from __future__ import annotations


def test_minerva_format_prompt_route_returns_v3_contract(client):
    response = client.get("/api/prompts/minerva-format")
    assert response.status_code == 200
    payload = response.json()
    assert payload["prompt_type"] == "MINERVA_FORMAT"
    assert "prompts/minerva_format_spec.md" in payload["command_text"]
    assert "## MINERVA_REPORT" in payload["spec_text"]


def test_legacy_prompt_routes_are_not_available(client):
    assert client.get("/api/prompts/extraction").status_code == 404
    assert client.post("/api/frontier/ingest").status_code == 404
