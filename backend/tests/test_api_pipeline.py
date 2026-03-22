from __future__ import annotations

from pathlib import Path

import pytest

from backend.pipeline.agent_executor import OllamaClient


SAMPLE_EXTRACTION = (Path(__file__).resolve().parents[1] / "fixtures" / "sample_extraction.md").read_text(encoding="utf-8")


async def fake_chat(self, system_prompt: str, user_prompt: str, timeout: int) -> str:
    if "CATALYST_POLICY_ANALYSIS" in system_prompt:
        return """## CATALYST_POLICY_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Active Catalysts
| Field | Value |
|-------|-------|
| Title | DOE separation award update |
| Date | 2026-03-22 |
| Category | GOV_FUNDING |
| Agency | DOE |
| Instrument | grant |
| Binding Status | CONDITIONAL |
| Amount (ceiling) | $58000000 |
| Amount (obligated) | N/A |
| Financial Materiality | MEDIUM |
| Materiality Calculation | 58000000 / 2200000000 = 2.64% |
| Priced In | PARTIALLY |
| Priced In Evidence | Stock rose 5.2% |
| Timeline to Next Effect | 2-4 weeks |
| Next Decision Point | Final award confirmation |
| Reversal Risk | MEDIUM |
| Affected Tickers | MP |
### Pipeline (Upcoming/Pending)
| Probability of Materialising | HIGH |
### Government Support Scorecard
| Metric | Value |
|--------|-------|
| Total confirmed support | $0 |
| Total conditional support | $58000000 |
| Total LOI/proposed support | $0 |
| Probability-weighted total | $34800000 |
| Prob-weighted / Market Cap | 1.58% |
| Policy environment direction | FAVORABLE |
### Net Catalyst Score: 7
### Catalyst Score Reasoning: Strong policy backdrop with conditional but meaningful support.
"""
    if "PRICE_ACTION_ANALYSIS" in system_prompt:
        return """## PRICE_ACTION_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Price Context
| Metric | Value |
|--------|-------|
| Current Price | $24.50 |
| 50-day MA | $21.87 |
| 200-day MA | $16.90 |
| % vs 50MA | 12% |
| % vs 200MA | 45% |
| Weinstein Stage | 2 — mid |
### Volume Context
| Metric | Value |
|--------|-------|
| 5-day Avg Volume | 1800000 |
| 20-day Avg Volume | 1000000 |
| Relative Volume | 1.8x |
| Volume Signal | CONFIRMING |
### Key Levels
| Level | Price | Distance from Current |
|-------|-------|--------------------|
| Resistance 2 | $28.00 | +14.3% |
| Resistance 1 | $26.80 | +9.4% |
| Current Price | $24.50 | — |
| Support 1 | $22.10 | -9.8% |
| Support 2 | $20.80 | -15.1% |
### Darvas Box: forming
- Box High: $25.30, Box Low: $22.10
### Momentum: ACCELERATING
### Relative Strength: LEADING
### Pattern: Breakout attempt
### ATR / Volatility
| Metric | Value |
|--------|-------|
| Estimated ATR(14) | $1.85 |
| ATR as % of price | 7.5% |
| 1-ATR stop from current | $22.65 |
| 2-ATR stop from current | $20.80 |
### Tape Verdict: BULLISH
### Confidence: 4
### Key Observation: Volume is confirming the move.
"""
    if "OPTIONS_ANALYSIS" in system_prompt:
        return """## OPTIONS_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Data Quality: THIN
### Put/Call Ratio
| Metric | Value |
|--------|-------|
| Today P/C (volume) | 0.62 |
| 5-day avg P/C | 0.74 |
| 20-day avg P/C | 0.88 |
| Shift Direction | TOWARD CALLS |
### Unusual Activity
| Strike | Expiry | Type | Volume | OI | Significance |
|--------|--------|------|--------|----|-------------|
| $25 | 2026-04-17 | CALL | 320 | 1200 | Call buyers active |
### Max Pain: $24.00 (current price $24.50, delta: 2%)
### Implied Move (nearest monthly): 8%
### Net Assessment
| Field | Value |
|-------|-------|
| Directional Lean | BULLISH |
| Confidence | 2 |
| Key Signal | Thin market but calls lead. |
"""
    if "FUNDAMENTAL_ANALYSIS" in system_prompt:
        return """## FUNDAMENTAL_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Business Stage: GENERATING
### Path to Revenue: Existing production with separation expansion milestones.
### Share Structure
| Metric | Value |
|--------|-------|
| Basic shares outstanding | 180M |
| Convertible shares (at $0 trigger) | +0M |
| Warrant shares (at $0 strike) | +0M |
| Options/RSUs | +4M |
| ATM program remaining | +0M |
| Fully diluted total | 184M |
| Dilution impact | 2.2% |
### Financial Position
| Metric | Value |
|--------|-------|
| Cash | $900M |
| Debt (total) | $0M |
| Quarterly burn | $0M |
| Runway | 999 months |
| Needs capital raise <12mo | NO |
### Valuation
| Metric | Value |
|--------|-------|
| Market cap | $2200M |
| Enterprise value | $1300M |
| EV/Revenue (if applicable) | 4.5x |
| Govt funding / market cap | 2.6% |
| Peer comparison | Premium to peers |
### Scenarios
| Scenario | Assumptions | Implied Price | vs Current |
|----------|-------------|---------------|-----------|
| BULL | Margin expansion | $30.00 | +22% |
| BASE | Steady execution | $27.00 | +10% |
| BEAR | Policy delay | $20.00 | -18% |
### Fundamental Quality: STRONG
### Dilution Risk: LOW
### Key Concern: Valuation already assumes execution.
"""
    if "SECTOR_SUPPLY_CHAIN_ANALYSIS" in system_prompt:
        return """## SECTOR_SUPPLY_CHAIN_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Commodity Regime
| Mineral | Current Price | vs 1yr Avg | Trend | Supply/Demand |
|---------|--------------|-----------|-------|--------------|
| NdPr | 62 | +8% | UP | BALANCED |
### Supply Chain Position
| Field | Assessment |
|-------|-----------|
| Value chain stage | integrated |
| Competitors at same stage | Lynas (1) |
| Differentiation | Domestic integrated chain |
| Structural moat | YES — U.S. footprint |
### China Dependency Score: 7
### China Impact: BENEFITS from restrictions
### Reasoning: Domestic chain becomes more valuable if restrictions tighten.
### Catalyst Materiality Check
| Catalyst | Actually Material? | Why/Why Not |
|----------|-------------------|-------------|
| DOE separation award update | YES | Expansion capital is directly relevant. |
### Competitive Landscape
| Competitor | Stage | Scale | Funding | Timeline | vs This Stock |
|-----------|-------|-------|---------|----------|--------------|
| Lynas | integrated | large | mixed | producing | similar |
### Sector Context Verdict: TAILWIND
### Key Insight: Policy tailwinds support the thesis.
"""
    if "SENTIMENT_ANALYSIS" in system_prompt:
        return """## SENTIMENT_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Narrative Phase: MOMENTUM
### Sentiment Scores
| Platform | Score (1-10) | Direction (vs 30d ago) |
|----------|-------------|----------------------|
| Financial Media | 7 | RISING |
| Social Media | 8 | RISING |
| Analyst Community | 6 | STABLE |
| **Composite** | **7** | **RISING** |
### Narrative vs Fundamental Alignment: ALIGNED
### Crowding Risk: MEDIUM
### Sentiment Reversal Trigger: Funding delays.
### Key Observation: Narrative is supportive but not euphoric.
"""
    if "CONTRARIAN_ANALYSIS" in system_prompt:
        return """## CONTRARIAN_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Challenges to Bull Case
| # | Bull Argument | Counter-Argument | Counter-Evidence | Probability Counter is Correct |
|---|--------------|------------------|-----------------|-------------------------------|
| 1 | Policy momentum | Funding could remain conditional | Award not final | 40% |
### Challenges to Bear Case
| # | Bear Argument | Counter-Argument | What Bears May Be Missing |
|---|--------------|------------------|--------------------------|
| 1 | Valuation rich | Domestic scarcity merits premium | Strategic value |
### Single Most Likely Failure Mode
Execution slip on separation expansion.
### Probability of Thesis Failure: 40%
### What Would Change My Mind
Final award cancellation or failed execution milestones.
### Contrarian Verdict: WEAKLY DISAGREES
### Strongest Challenge: Conditional funding is not cash in hand.
"""
    if "RISK_ANALYSIS" in system_prompt:
        return """## RISK_ANALYSIS
### Stock: MP
### Date: 2026-03-23
### Entry Price: $24.50
### Stop-Loss Analysis
| Stop Type | Level | Risk per Share | Risk % |
|-----------|-------|---------------|--------|
| Technical (below support) | $22.10 | $2.40 | 9.8% |
| Volatility (2× ATR) | $20.80 | $3.70 | 15.1% |
| **Selected Stop** | **$20.80** | **$3.70** | **15.1%** |
### Position Sizing (assuming $50000 portfolio, 1.5% max risk)
| Metric | Value |
|--------|-------|
| Max risk $ | $750 |
| Risk per share | $3.70 |
| Position size (shares) | 202 |
| Position size ($) | $4949 |
| Position as % of portfolio | 9.9% |
### Reward/Risk
| Metric | Value |
|--------|-------|
| Target | $30.00 |
| Reward per share | $5.50 |
| Reward % | 22.4% |
| **R:R Ratio** | **1.49:1** |
| Meets 2:1 minimum? | NO |
### Scenario Analysis
| Scenario | Price | P&L ($) | P&L (%) |
|----------|-------|---------|---------|
| BEST (target) | $30.00 | +$1111 | +22.4% |
| BASE (50% target) | $27.25 | +$556 | +11.2% |
| WORST (stop hit) | $20.80 | -$747 | -15.1% |
| BLACK SWAN (2× stop) | $17.10 | -$1494 | -30.2% |
### Portfolio Concentration Check
| Check | Status |
|-------|--------|
| Single position limit (10%) | PASS |
| Sector concentration (30%) | PASS |
### Risk Verdict: MARGINAL
### Key Risk Note: Wait for better R:R or pullback.
"""
    if "quality control — find errors, contradictions, and gaps" in system_prompt:
        return "ALL CHECKS PASSED"
    if "Produce a consolidated analysis" in system_prompt:
        return """HEADLINE: Policy momentum supports MP, but risk/reward is still marginal.
CONSENSUS VIEW: Most agents see constructive policy and price action.
KEY DISAGREEMENTS: Risk sizing is less enthusiastic because R:R is under 2:1.
TOP 3 FINDINGS: Conditional funding is meaningful; volume confirms the move; dilution risk is low.
BIGGEST UNDERWEIGHTED RISK: Conditional support may take longer to finalize than the tape expects.
PRELIMINARY VIEW: BULLISH with caveats on entry quality.
"""
    raise AssertionError("Unhandled prompt")


def test_api_pipeline_end_to_end(client, monkeypatch):
    monkeypatch.setattr(OllamaClient, "chat", fake_chat)

    stock_payload = {
        "ticker": "MP",
        "company_name": "MP Materials",
        "primary_mineral": "Rare Earths",
        "value_chain_stage": "integrated",
        "country": "United States"
    }
    response = client.post("/api/stocks", json=stock_payload)
    assert response.status_code == 200

    ingest_payload = {
        "date": "2026-03-23",
        "scope": "MP",
        "mode": "DELTA",
        "source_model": "chatgpt_deep_search",
        "raw_text": SAMPLE_EXTRACTION
    }
    response = client.post("/api/extractions/ingest", json=ingest_payload)
    assert response.status_code == 200
    extraction_id = response.json()["extraction_id"]

    response = client.post("/api/analysis/runs", json={"ticker": "MP", "extraction_id": extraction_id, "mode": "DELTA"})
    assert response.status_code == 200
    run_id = response.json()["run_id"]

    response = client.post(f"/api/analysis/runs/{run_id}/generate-tasks")
    assert response.status_code == 200
    assert len(response.json()["task_files"]) == 8

    response = client.post(f"/api/analysis/runs/{run_id}/execute")
    assert response.status_code == 200
    assert response.json()["run"]["status"] == "LOCAL_REVIEW_COMPLETE"

    senior_review = """## SENIOR_REVIEW
### Stock: MP
### Date: 2026-03-23
### Quality Assessment
- Calculation Accuracy: PASS
- Logical Consistency: PASS
- Evidence Sufficiency: SUFFICIENT
- Blind Spots: Final award timing
### Current Setup
Constructive setup with policy and price support.
### Evidence Summary
- Catalyst: Conditional DOE support is meaningful.
- Price Action: Tape remains constructive.
- Options: Thin but leaning bullish.
- Fundamentals: Balance sheet is healthy.
- Sector Context: Tailwind.
- Sentiment: Rising.
- Contrarian: Conditionality still matters.
### Net Judgment: BULLISH
### Conviction: 4
### Action: WATCH
### If Actionable:
- Entry Zone: [$22.00 - $23.00]
- Stop Loss: [$20.80] — basis: below 2 ATR stop
- Target: [$30.00] — basis: next resistance extension
- Timeframe: [1-3 weeks]
- Position Size Guidance: [Half size due to conditional catalyst]
### Tripwires
- Would INVALIDATE thesis: Award cancellation
- Would INCREASE conviction: Final funding confirmation
- Must WATCH next: DOE disclosure window
### One Line: Attractive theme, but patience on entry improves the setup.
"""
    response = client.post(
        "/api/frontier/ingest",
        json={"run_id": run_id, "ticker": "MP", "source_model": "claude", "raw_text": senior_review, "merge_with_existing": True},
    )
    assert response.status_code == 200
    assert response.json()["parsed"]["final_verdict"] == "BULLISH"

    response = client.get("/api/dashboard/overview")
    assert response.status_code == 200
    overview = response.json()
    assert overview["stocks"][0]["ticker"] == "MP"
    assert overview["stocks"][0]["active_catalyst_count"] >= 1
