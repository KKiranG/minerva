from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from ..config import PROMPTS_DIR


@dataclass(frozen=True)
class AgentSpec:
    number: int
    slug: str
    name: str
    kind: str
    prompt_path: Path
    output_header: str
    task_focus: str


SPECIALIST_AGENTS: List[AgentSpec] = [
    AgentSpec(1, "catalyst_policy", "Catalyst & Policy", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "catalyst_policy.md", "## CATALYST_POLICY_ANALYSIS", "Assess catalyst materiality, binding status, timeline, and policy environment."),
    AgentSpec(2, "price_action", "Price Action & Market Structure", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "price_action.md", "## PRICE_ACTION_ANALYSIS", "Assess trend, volume, key levels, momentum, and volatility."),
    AgentSpec(3, "options_positioning", "Options & Positioning", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "options_positioning.md", "## OPTIONS_ANALYSIS", "Assess options data quality, sentiment shift, unusual activity, and directional lean."),
    AgentSpec(4, "fundamental_valuation", "Fundamental & Valuation", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "fundamental_valuation.md", "## FUNDAMENTAL_ANALYSIS", "Assess business stage, dilution, runway, valuation, and scenarios."),
    AgentSpec(5, "sector_supply_chain", "Sector & Supply Chain", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "sector_supply_chain.md", "## SECTOR_SUPPLY_CHAIN_ANALYSIS", "Assess commodity regime, competitive landscape, and China dependency."),
    AgentSpec(6, "sentiment_narrative", "Sentiment & Narrative", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "sentiment_narrative.md", "## SENTIMENT_ANALYSIS", "Assess narrative phase, crowding, and divergence from fundamentals."),
    AgentSpec(7, "contrarian", "Contrarian / Red-Team", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "contrarian.md", "## CONTRARIAN_ANALYSIS", "Challenge the emerging thesis and identify failure modes."),
    AgentSpec(8, "risk_sizing", "Risk & Position Sizing", "SPECIALIST", PROMPTS_DIR / "agent_systems" / "risk_sizing.md", "## RISK_ANALYSIS", "Assess stop placement, sizing, and reward/risk profile."),
]

REVIEW_AGENTS: List[AgentSpec] = [
    AgentSpec(9, "consistency_checker", "Consistency Checker", "REVIEWER", PROMPTS_DIR / "agent_systems" / "consistency_checker.md", "## CONSISTENCY_CHECK", "Check calculations, contradictions, and missing data."),
    AgentSpec(10, "synthesis", "Synthesis Agent", "REVIEWER", PROMPTS_DIR / "agent_systems" / "synthesis.md", "HEADLINE", "Produce the consolidated decision memo under 800 words."),
]

ALL_AGENTS = SPECIALIST_AGENTS + REVIEW_AGENTS
AGENT_BY_NUMBER: Dict[int, AgentSpec] = {agent.number: agent for agent in ALL_AGENTS}
AGENT_BY_SLUG: Dict[str, AgentSpec] = {agent.slug: agent for agent in ALL_AGENTS}


def load_prompt(agent: AgentSpec) -> str:
    return agent.prompt_path.read_text(encoding="utf-8")
