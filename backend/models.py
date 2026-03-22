from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


CATALYST_CATEGORIES = [
    "GOV_FUNDING",
    "GOV_EQUITY",
    "GOV_OFFTAKE",
    "GOV_PRICE_FLOOR",
    "GOV_LOI",
    "GOV_PERMIT",
    "GOV_PROCUREMENT",
    "EXPORT_CONTROL",
    "POLICY_STATEMENT",
    "STRATEGIC_RESERVE",
    "EARNINGS",
    "GUIDANCE",
    "CAPITAL_RAISE",
    "DILUTION_EVENT",
    "PARTNERSHIP",
    "MANAGEMENT",
    "OPERATIONAL",
    "COMMODITY_PRICE",
    "TECHNICAL_BREAK",
    "SECTOR_EVENT",
    "LEGAL",
    "OTHER",
]

CANONICAL_BINDING_STATUSES = [
    "PROPOSED",
    "ANNOUNCED",
    "LOI_SIGNED",
    "CONDITIONAL",
    "OBLIGATED",
    "DISBURSING",
    "COMPLETED",
    "CANCELLED",
]

AGENT_ONE_BINDING_MAP = {
    "FINAL": "OBLIGATED",
    "OBLIGATED": "OBLIGATED",
    "DISBURSING": "DISBURSING",
    "COMPLETED": "COMPLETED",
    "LOI": "LOI_SIGNED",
    "LOI_SIGNED": "LOI_SIGNED",
    "ANNOUNCED": "ANNOUNCED",
    "PROPOSED": "PROPOSED",
    "CONDITIONAL": "CONDITIONAL",
}


class APIMessage(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    database_path: str


class StockBase(BaseModel):
    ticker: str
    company_name: str
    primary_mineral: Optional[str] = None
    secondary_minerals: List[str] = Field(default_factory=list)
    value_chain_stage: Optional[str] = None
    country: Optional[str] = None
    exchange: Optional[str] = None
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    shares_outstanding: Optional[float] = None
    china_dependency_exposure: Optional[str] = None
    revenue_status: Optional[str] = None
    cash_position_approx: Optional[str] = None
    debt_position_approx: Optional[str] = None
    dilution_risk: Optional[str] = None
    dilution_notes: Optional[str] = None
    short_interest_approx: Optional[str] = None
    government_funding_received: Dict[str, Any] = Field(default_factory=dict)
    government_funding_pending: Dict[str, Any] = Field(default_factory=dict)
    government_contracts: Dict[str, Any] = Field(default_factory=dict)
    regulatory_status: Optional[str] = None
    competitive_position: Optional[str] = None
    key_risk: Optional[str] = None
    sector_sensitivity: Optional[str] = None
    current_price: Optional[float] = None
    current_verdict: Optional[str] = None
    current_action: Optional[str] = None
    current_conviction: Optional[int] = None
    current_thesis: Optional[str] = None
    current_stop: Optional[float] = None
    current_target: Optional[float] = None
    last_analysis_date: Optional[str] = None
    last_full_analysis: Optional[str] = None
    open_position_flag: bool = False
    needs_attention: bool = False
    alert_flag: bool = False


class StockCreate(StockBase):
    pass


class StockPatch(BaseModel):
    company_name: Optional[str] = None
    primary_mineral: Optional[str] = None
    secondary_minerals: Optional[List[str]] = None
    value_chain_stage: Optional[str] = None
    country: Optional[str] = None
    exchange: Optional[str] = None
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    shares_outstanding: Optional[float] = None
    china_dependency_exposure: Optional[str] = None
    revenue_status: Optional[str] = None
    cash_position_approx: Optional[str] = None
    debt_position_approx: Optional[str] = None
    dilution_risk: Optional[str] = None
    dilution_notes: Optional[str] = None
    short_interest_approx: Optional[str] = None
    government_funding_received: Optional[Dict[str, Any]] = None
    government_funding_pending: Optional[Dict[str, Any]] = None
    government_contracts: Optional[Dict[str, Any]] = None
    regulatory_status: Optional[str] = None
    competitive_position: Optional[str] = None
    key_risk: Optional[str] = None
    sector_sensitivity: Optional[str] = None
    current_price: Optional[float] = None
    current_verdict: Optional[str] = None
    current_action: Optional[str] = None
    current_conviction: Optional[int] = None
    current_thesis: Optional[str] = None
    current_stop: Optional[float] = None
    current_target: Optional[float] = None
    last_analysis_date: Optional[str] = None
    last_full_analysis: Optional[str] = None
    open_position_flag: Optional[bool] = None
    needs_attention: Optional[bool] = None
    alert_flag: Optional[bool] = None


class StockResponse(StockBase):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CatalystBase(BaseModel):
    ticker: str
    date: str
    category: str
    title: str
    description: Optional[str] = None
    amount_ceiling: Optional[float] = None
    amount_obligated: Optional[float] = None
    amount_disbursed: Optional[float] = None
    binding_status: str
    verification_grade: Optional[str] = None
    significance: Optional[int] = None
    priced_in: Optional[str] = None
    priced_in_evidence: Optional[str] = None
    timeline_to_next_effect: Optional[str] = None
    next_decision_point: Optional[str] = None
    reversal_risk: Optional[str] = None
    affected_tickers: List[str] = Field(default_factory=list)
    probability_materialising: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    extraction_id: Optional[int] = None
    analysis_run_id: Optional[str] = None


class CatalystCreate(CatalystBase):
    pass


class CatalystPatch(BaseModel):
    description: Optional[str] = None
    amount_ceiling: Optional[float] = None
    amount_obligated: Optional[float] = None
    amount_disbursed: Optional[float] = None
    binding_status: Optional[str] = None
    verification_grade: Optional[str] = None
    significance: Optional[int] = None
    priced_in: Optional[str] = None
    priced_in_evidence: Optional[str] = None
    timeline_to_next_effect: Optional[str] = None
    next_decision_point: Optional[str] = None
    reversal_risk: Optional[str] = None
    affected_tickers: Optional[List[str]] = None
    probability_materialising: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class CatalystResponse(CatalystBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class EventCreate(BaseModel):
    ticker: str
    date: str
    date_precision: Optional[str] = None
    event_type: str
    description: str
    impact: Optional[str] = None
    source: Optional[str] = None
    affected_tickers: List[str] = Field(default_factory=list)
    bull_case: Optional[str] = None
    bear_case: Optional[str] = None
    outcome: Optional[str] = None
    outcome_date: Optional[str] = None
    status: str = "UPCOMING"
    extraction_id: Optional[int] = None


class EventResponse(EventCreate):
    id: int
    created_at: Optional[str] = None


class ResearchNoteCreate(BaseModel):
    ticker: Optional[str] = None
    extraction_id: Optional[int] = None
    title: str
    note_body: str
    note_type: str = "EXTRACTION"
    category: Optional[str] = None
    key_takeaway: Optional[str] = None
    source_type: Optional[str] = None
    related_catalysts: List[int] = Field(default_factory=list)
    related_stocks: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    source: Optional[str] = None


class ResearchNoteResponse(ResearchNoteCreate):
    id: int
    created_at: Optional[str] = None


class TradingJournalCreate(BaseModel):
    ticker: str
    run_id: Optional[str] = None
    status: str
    direction: str = "LONG"
    entry_date: Optional[str] = None
    exit_date: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None
    quantity: Optional[float] = None
    capital_committed: Optional[float] = None
    pnl_amount: Optional[float] = None
    pnl_percent: Optional[float] = None
    thesis: Optional[str] = None
    outcome: Optional[str] = None
    planned_timeframe: Optional[str] = None
    tripwire_invalidates: Optional[str] = None
    tripwire_confirms: Optional[str] = None
    exit_reason: Optional[str] = None
    what_went_right: Optional[str] = None
    what_went_wrong: Optional[str] = None
    what_to_do_differently: Optional[str] = None
    holding_days: Optional[int] = None
    pattern_tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class TradingJournalResponse(TradingJournalCreate):
    id: int
    created_at: Optional[str] = None


class ExtractionIngestRequest(BaseModel):
    date: str
    scope: str
    mode: str
    source_model: str
    raw_text: str
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None
    custom_focus: Optional[str] = None


class ExtractionIngestResponse(BaseModel):
    extraction_id: int
    parse_status: str
    canonical_appendix: Dict[str, Any]
    counters: Dict[str, int]


class AnalysisRunCreate(BaseModel):
    ticker: str
    extraction_id: Optional[int] = None
    mode: str = "DELTA"
    notes: Optional[str] = None


class AnalysisRunResponse(BaseModel):
    run_id: str
    ticker: str
    status: str
    extraction_id: Optional[int] = None
    final_verdict: Optional[str] = None
    final_action: Optional[str] = None
    final_conviction: Optional[int] = None
    one_line_summary: Optional[str] = None
    synthesis_text: Optional[str] = None
    frontier_review_status: Optional[str] = None


class AnalysisTrailEntry(BaseModel):
    id: str
    run_id: Optional[str] = None
    ticker: str
    agent_number: Optional[int] = None
    agent_name: str
    agent_kind: str
    parse_status: Optional[str] = None
    verdict: Optional[str] = None
    action: Optional[str] = None
    conviction: Optional[int] = None
    headline: str
    summary: Optional[str] = None
    raw_markdown: str
    created_at: Optional[str] = None


class FrontierIngestRequest(BaseModel):
    run_id: str
    ticker: str
    source_model: str
    raw_text: str
    merge_with_existing: bool = False


class PriceSnapshotBase(BaseModel):
    ticker: str
    date: str
    extraction_id: Optional[int] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    vwap: Optional[float] = None
    change_pct: Optional[float] = None
    five_day_change_pct: Optional[float] = None
    twenty_day_change_pct: Optional[float] = None
    volume: Optional[float] = None
    volume_vs_avg: Optional[float] = None
    relative_volume: Optional[float] = None
    above_50ma: Optional[float] = None
    above_200ma: Optional[float] = None
    gap_up: bool = False
    gap_down: bool = False
    new_high_52w: bool = False
    new_low_52w: bool = False
    key_level: Optional[str] = None
    ma50: Optional[float] = None
    ma200: Optional[float] = None
    support1: Optional[float] = None
    support2: Optional[float] = None
    resistance1: Optional[float] = None
    resistance2: Optional[float] = None
    atr14: Optional[float] = None
    notes: Optional[str] = None


class PriceSnapshotCreate(PriceSnapshotBase):
    pass


class PriceSnapshotPatch(BaseModel):
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    vwap: Optional[float] = None
    change_pct: Optional[float] = None
    five_day_change_pct: Optional[float] = None
    twenty_day_change_pct: Optional[float] = None
    volume: Optional[float] = None
    volume_vs_avg: Optional[float] = None
    relative_volume: Optional[float] = None
    above_50ma: Optional[float] = None
    above_200ma: Optional[float] = None
    gap_up: Optional[bool] = None
    gap_down: Optional[bool] = None
    new_high_52w: Optional[bool] = None
    new_low_52w: Optional[bool] = None
    key_level: Optional[str] = None
    ma50: Optional[float] = None
    ma200: Optional[float] = None
    support1: Optional[float] = None
    support2: Optional[float] = None
    resistance1: Optional[float] = None
    resistance2: Optional[float] = None
    atr14: Optional[float] = None
    notes: Optional[str] = None


class PriceSnapshotResponse(PriceSnapshotBase):
    id: int
    created_at: Optional[str] = None


class PromptResponse(BaseModel):
    prompt_type: str
    scope: str
    text: str


class DashboardStockCard(BaseModel):
    ticker: str
    company_name: str
    current_price: Optional[float] = None
    daily_change_pct: Optional[float] = None
    current_verdict: Optional[str] = None
    current_conviction: Optional[int] = None
    current_action: Optional[str] = None
    one_line_summary: Optional[str] = None
    active_catalyst_count: int = 0
    next_event_date: Optional[str] = None
    next_event_type: Optional[str] = None
    next_event_description: Optional[str] = None
    last_analysis_date: Optional[str] = None
    open_position_flag: bool = False
    needs_attention: bool = False
    alert_flag: bool = False
    changed_since_last_analysis: bool = False


class DashboardOverviewResponse(BaseModel):
    generated_at: str
    stocks: List[DashboardStockCard]


class AgentOutputResult(BaseModel):
    header: str
    sections: Dict[str, Any]
    parse_status: str


class ParserFixture(BaseModel):
    name: str
    raw_text: str
    parsed: Dict[str, Any]
