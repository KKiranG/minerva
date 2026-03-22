ROLE:
You are generating a self-contained work order for the Fundamental & Valuation analyst in MINERVA.

CONTEXT:
Date: 2026-03-22
Ticker: MP
Run ID: RUN_2026-03-22_151652_MP
### Stock Profile
```json
{
  "ticker": "MP",
  "company_name": "MP Materials",
  "primary_mineral": "Rare Earths",
  "secondary_minerals": "[]",
  "value_chain_stage": "integrated",
  "country": "United States",
  "exchange": null,
  "market_cap": null,
  "enterprise_value": null,
  "shares_outstanding": null,
  "china_dependency_exposure": null,
  "revenue_status": null,
  "cash_position_approx": null,
  "debt_position_approx": null,
  "dilution_risk": null,
  "dilution_notes": null,
  "short_interest_approx": null,
  "government_funding_received": "{}",
  "government_funding_pending": "{}",
  "government_contracts": "{}",
  "regulatory_status": null,
  "competitive_position": null,
  "key_risk": null,
  "sector_sensitivity": null,
  "current_price": null,
  "current_verdict": null,
  "current_action": null,
  "current_conviction": null,
  "current_thesis": null,
  "current_stop": null,
  "current_target": null,
  "last_analysis_date": null,
  "last_full_analysis": null,
  "open_position_flag": 0,
  "needs_attention": 0,
  "alert_flag": 0,
  "created_at": "2026-03-22 15:16:52",
  "updated_at": "2026-03-22 15:16:52"
}
```

### Recent Catalysts
```json
[
  {
    "id": 1,
    "ticker": "MP",
    "extraction_id": 1,
    "analysis_run_id": null,
    "date": "2026-03-22",
    "category": "GOV_FUNDING",
    "title": "DOE separation award update",
    "description": null,
    "amount_ceiling": 58000000.0,
    "amount_obligated": null,
    "amount_disbursed": null,
    "binding_status": "CONDITIONAL",
    "verification_grade": null,
    "significance": 4,
    "priced_in": null,
    "priced_in_evidence": null,
    "timeline_to_next_effect": null,
    "next_decision_point": null,
    "reversal_risk": null,
    "affected_tickers": null,
    "probability_materialising": null,
    "source": "DOE release",
    "notes": null,
    "created_at": "2026-03-22 15:16:52",
    "updated_at": "2026-03-22 15:16:52"
  }
]
```

### Recent Price Snapshots
```json
[
  {
    "id": 1,
    "ticker": "MP",
    "extraction_id": 1,
    "date": "2026-03-23",
    "open": null,
    "high": null,
    "low": null,
    "close": 24.5,
    "vwap": null,
    "change_pct": 5.2,
    "five_day_change_pct": null,
    "twenty_day_change_pct": null,
    "volume": null,
    "volume_vs_avg": 1.8,
    "relative_volume": 1.8,
    "above_50ma": 12.0,
    "above_200ma": 45.0,
    "gap_up": 0,
    "gap_down": 0,
    "new_high_52w": 0,
    "new_low_52w": 0,
    "key_level": "Testing 26.80 resistance",
    "ma50": null,
    "ma200": null,
    "support1": null,
    "support2": null,
    "resistance1": null,
    "resistance2": null,
    "atr14": null,
    "notes": null,
    "created_at": "2026-03-22 15:16:52"
  }
]
```

### Upcoming Events
```json
[
  {
    "id": 1,
    "ticker": "MP",
    "extraction_id": 1,
    "date": "2026-04-15",
    "date_precision": "EXACT",
    "event_type": "FUNDING_DECISION",
    "description": "DOE follow-up disclosure window",
    "impact": "High",
    "source": "DOE calendar",
    "affected_tickers": "[\"MP\"]",
    "bull_case": null,
    "bear_case": null,
    "outcome": null,
    "outcome_date": null,
    "status": "UPCOMING",
    "created_at": "2026-03-22 15:16:52"
  }
]
```

### Open Positions
```json
[]
```

### Recent Research Notes
```json
[
  {
    "id": 1,
    "ticker": "MP",
    "extraction_id": 1,
    "title": "Extraction 2026-03-23",
    "note_body": "MP Materials research update.\n\nGovernment support momentum remains constructive, and price action improved on above-average volume.\nUUUU continues to bridge uranium optionality and rare-earth processing, while USAR is moving through a more manufacturing-heavy buildout.",
    "note_type": "EXTRACTION",
    "category": "EXTRACTION",
    "key_takeaway": null,
    "source_type": null,
    "related_catalysts": null,
    "related_stocks": null,
    "tags": null,
    "source": "chatgpt_deep_search",
    "created_at": "2026-03-22 15:16:52"
  },
  {
    "id": 2,
    "ticker": "MP",
    "extraction_id": 1,
    "title": "Sentiment: X \u2014 RISING",
    "note_body": "Platform: X\nDirection: RISING\nIntensity: 7\nNarrative: Domestic supply chain focus",
    "note_type": "SENTIMENT",
    "category": "SENTIMENT",
    "key_takeaway": null,
    "source_type": null,
    "related_catalysts": null,
    "related_stocks": null,
    "tags": null,
    "source": "Extraction 1",
    "created_at": "2026-03-22 15:16:52"
  }
]
```

### Previous Outputs
```json
[]
```

TASK:
1. Analyse only the stock MP.
2. Assess business stage, dilution, runway, valuation, and scenarios.
3. Use the provided data first; if some data is missing, say so explicitly.
4. Perform the calculations required by the system prompt.
5. Keep the final answer faithful to the required markdown headings and tables.
6. Follow these data-specific instructions:
- Compute enterprise value from market cap, debt_position_approx, and cash_position_approx when numeric values are available.
- Discuss dilution risk using dilution_risk, dilution_notes, and shares_outstanding.
- Consider the nearest upcoming event: DOE follow-up disclosure window on 2026-04-15.

FORMAT:
- The model must return the exact top-level heading ## FUNDAMENTAL_ANALYSIS
- Include all required sections from the system prompt.
- Prefer explicit numbers and brief reasoning over vague commentary.

CONSTRAINTS:
- One stock only.
- Do not invent missing data.
- Do not omit mandatory fields even if they must be marked as unknown.
- Keep the analysis concise enough for a local 9B model.
