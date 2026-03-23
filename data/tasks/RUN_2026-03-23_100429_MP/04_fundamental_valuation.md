ROLE:
You are generating a self-contained work order for the Fundamental & Valuation analyst in MINERVA.

CONTEXT:
Date: 2026-03-23
Ticker: MP
Run ID: RUN_2026-03-23_100429_MP
### Stock Profile
```json
{
  "ticker": "MP",
  "company_name": "MP Materials",
  "primary_mineral": "Rare Earths (NdPr, HRE)",
  "secondary_minerals": null,
  "value_chain_stage": "integrated",
  "country": "United States",
  "exchange": "NYSE",
  "market_cap": null,
  "enterprise_value": null,
  "shares_outstanding": null,
  "china_dependency_exposure": null,
  "revenue_status": "GENERATING",
  "cash_position_approx": null,
  "debt_position_approx": null,
  "dilution_risk": "LOW",
  "dilution_notes": null,
  "short_interest_approx": null,
  "government_funding_received": null,
  "government_funding_pending": null,
  "government_contracts": null,
  "regulatory_status": null,
  "competitive_position": "Only domestic integrated rare earth mine-to-magnet chain",
  "key_risk": "Execution timing on downstream magnetics scale-up",
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
  "created_at": "2026-03-23 10:00:14",
  "updated_at": "2026-03-23 10:00:14"
}
```

### Recent Catalysts
```json
[]
```

### Recent Price Snapshots
```json
[]
```

### Upcoming Events
```json
[]
```

### Open Positions
```json
[]
```

### Recent Research Notes
```json
[]
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

FORMAT:
- The model must return the exact top-level heading ## FUNDAMENTAL_ANALYSIS
- Include all required sections from the system prompt.
- Prefer explicit numbers and brief reasoning over vague commentary.

CONSTRAINTS:
- One stock only.
- Do not invent missing data.
- Do not omit mandatory fields even if they must be marked as unknown.
- Keep the analysis concise enough for a local 9B model.
