from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


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
    "SIGNED": "LOI_SIGNED",
    "ANNOUNCED": "ANNOUNCED",
    "PROPOSED": "PROPOSED",
    "CONDITIONAL": "CONDITIONAL",
    "PENDING": "PROPOSED",
    "IN_PROGRESS": "DISBURSING",
    "ACTIVE": "DISBURSING",
    "DONE": "COMPLETED",
    "WITHDRAWN": "CANCELLED",
    "EXPIRED": "CANCELLED",
    "CANCELLED": "CANCELLED",
}

VERDICTS = {"BULLISH", "BEARISH", "NEUTRAL"}
ACTIONS = {"BUY", "SELL", "HOLD", "WATCH", "AVOID"}
REVENUE_STATUSES = {"GENERATING", "PRE_REVENUE", "EARLY_REVENUE", "DECLINING"}
DILUTION_RISKS = {"HIGH", "MEDIUM", "LOW", "MINIMAL"}
EVENT_DATE_PRECISIONS = {"EXACT", "WEEK", "MONTH", "QUARTER", "UNKNOWN"}
EVENT_STATUSES = {"UPCOMING", "COMPLETE", "CANCELLED"}
EXIT_REASONS = {"TARGET_HIT", "STOP_HIT", "THESIS_INVALIDATED", "TIME_EXPIRED", "PARTIAL_TAKE", "UPGRADED", "DOWNGRADED", "FORCED"}
INGEST_MODES = {"FULL_SCAN", "DELTA"}


def _validate_choice(value: Optional[str], allowed: set[str], field_name: str) -> Optional[str]:
    if value in (None, ""):
        return None
    normalized = str(value).upper()
    if normalized not in allowed:
        raise ValueError(f"{field_name} must be one of: {', '.join(sorted(allowed))}")
    return normalized


class APIMessage(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    database_status: str
    database_path: str
    table_count: int
    stocks_tracked: int
    last_ingest: Optional[str] = None
    ollama_available: bool
    version: str
    utc_time: str


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

    @field_validator("current_verdict")
    @classmethod
    def validate_verdict(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, VERDICTS, "current_verdict")

    @field_validator("current_action")
    @classmethod
    def validate_action(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, ACTIONS, "current_action")

    @field_validator("revenue_status")
    @classmethod
    def validate_revenue_status(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, REVENUE_STATUSES, "revenue_status")

    @field_validator("dilution_risk")
    @classmethod
    def validate_dilution_risk(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, DILUTION_RISKS, "dilution_risk")


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

    @field_validator("current_verdict")
    @classmethod
    def validate_verdict(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, VERDICTS, "current_verdict")

    @field_validator("current_action")
    @classmethod
    def validate_action(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, ACTIONS, "current_action")

    @field_validator("revenue_status")
    @classmethod
    def validate_revenue_status(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, REVENUE_STATUSES, "revenue_status")

    @field_validator("dilution_risk")
    @classmethod
    def validate_dilution_risk(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, DILUTION_RISKS, "dilution_risk")


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

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return _validate_choice(value, set(CATALYST_CATEGORIES), "category") or "OTHER"

    @field_validator("binding_status")
    @classmethod
    def validate_binding_status(cls, value: str) -> str:
        normalized = _validate_choice(value, set(CANONICAL_BINDING_STATUSES) | {"FINAL", "LOI"}, "binding_status")
        return AGENT_ONE_BINDING_MAP.get(normalized or "", normalized)


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

    @field_validator("binding_status")
    @classmethod
    def validate_binding_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = _validate_choice(value, set(CANONICAL_BINDING_STATUSES) | {"FINAL", "LOI"}, "binding_status")
        return AGENT_ONE_BINDING_MAP.get(normalized or "", normalized)


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

    @field_validator("date_precision")
    @classmethod
    def validate_precision(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, EVENT_DATE_PRECISIONS, "date_precision")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _validate_choice(value, EVENT_STATUSES, "status") or "UPCOMING"


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

    @field_validator("exit_reason")
    @classmethod
    def validate_exit_reason(cls, value: Optional[str]) -> Optional[str]:
        return _validate_choice(value, EXIT_REASONS, "exit_reason")


class TradingJournalResponse(TradingJournalCreate):
    id: int
    created_at: Optional[str] = None


class ExtractionIngestRequest(BaseModel):
    date: Optional[str] = None
    scope: Optional[str] = None
    mode: str = "DELTA"
    source_model: str = "manual-frontier"
    raw_text: str
    time_window_start: Optional[str] = None
    time_window_end: Optional[str] = None
    custom_focus: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        return _validate_choice(value, INGEST_MODES, "mode") or "DELTA"

    @field_validator("raw_text")
    @classmethod
    def validate_raw_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("raw_text must not be empty")
        return cleaned


class ExtractionIngestResponse(BaseModel):
    extraction_id: int
    parse_status: str
    scope: str
    reports: List[Dict[str, Any]]


class AnalysisRunCreate(BaseModel):
    ticker: str
    extraction_id: Optional[int] = None
    mode: str = "DELTA"
    notes: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        return _validate_choice(value, INGEST_MODES, "mode") or "DELTA"


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


class AnalysisRunIngestRequest(BaseModel):
    raw_text: str

    @field_validator("raw_text")
    @classmethod
    def validate_raw_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("raw_text must not be empty")
        return cleaned


class MinervaIngestRequest(BaseModel):
    raw_text: str
    mode: str = "DELTA"
    source_model: str = "manual-frontier"
    custom_focus: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        return _validate_choice(value, INGEST_MODES, "mode") or "DELTA"

    @field_validator("raw_text")
    @classmethod
    def validate_raw_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("raw_text must not be empty")
        return cleaned


class MinervaRunResult(BaseModel):
    run_id: str
    ticker: str
    parse_status: str
    catalysts_stored: int = 0
    catalysts_inserted: int = 0
    catalysts_updated: int = 0
    events_stored: int = 0
    events_inserted: int = 0
    events_updated: int = 0
    price_snapshot_stored: bool = False
    decision_stored: bool = False
    notes_stored: int = 0
    failed_sections: List[str] = Field(default_factory=list)


class MinervaIngestResponse(BaseModel):
    extraction_id: int
    parse_status: str
    scope: List[str]
    reports: List[MinervaRunResult]
    tickers_processed: List[str] = Field(default_factory=list)
    overall_status: Optional[str] = None
    total_time_ms: Optional[int] = None
    results: Dict[str, MinervaRunResult] = Field(default_factory=dict)


class MinervaValidationReport(BaseModel):
    ticker: Optional[str] = None
    date: Optional[str] = None
    source: Optional[str] = None
    parse_status: str
    section_names: List[str] = Field(default_factory=list)
    empty_sections: List[str] = Field(default_factory=list)
    missing_sections: List[str] = Field(default_factory=list)
    has_decision: bool = False
    catalysts_rows: int = 0
    events_rows: int = 0
    options_rows: int = 0
    tripwires_rows: int = 0
    price_metrics: int = 0


class MinervaValidationResponse(BaseModel):
    valid: bool
    parse_status: str
    report_count: int
    scope: List[str] = Field(default_factory=list)
    reports: List[MinervaValidationReport] = Field(default_factory=list)


class ExtractionDetailResponse(BaseModel):
    id: int
    date: str
    scope: List[str]
    mode: str
    source_model: str
    content_hash: Optional[str] = None
    raw_text: str
    custom_focus: Optional[str] = None
    catalysts_extracted: int = 0
    events_extracted: int = 0
    prices_extracted: int = 0
    notes_created: int = 0
    parse_status: str
    created_at: Optional[str] = None
    reports: List[Dict[str, Any]] = Field(default_factory=list)


class ReportDetailResponse(BaseModel):
    run_id: str
    ticker: str
    extraction_id: Optional[int] = None
    status: str
    parse_status: Optional[str] = None
    source_model: Optional[str] = None
    content_hash: Optional[str] = None
    raw_report: Optional[str] = None
    failed_sections: List[str] = Field(default_factory=list)
    section_names: List[str] = Field(default_factory=list)
    header: Dict[str, Any] = Field(default_factory=dict)
    sections: Dict[str, str] = Field(default_factory=dict)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class PromptTemplateResponse(BaseModel):
    slug: str
    prompt_type: str
    title: str
    source_path: str
    content: str
    content_hash: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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
