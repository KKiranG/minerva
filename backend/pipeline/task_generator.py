from __future__ import annotations

import json
from datetime import datetime
from typing import Dict, List

from ..agents.registry import SPECIALIST_AGENTS
from ..config import settings
from ..database import fetch_all, fetch_one


def _trim_words(text: str, limit: int = 1800) -> str:
    words = text.split()
    if len(words) <= limit:
        return text
    return " ".join(words[:limit]) + "\n\n[TRUNCATED FOR TASK SIZE]"


def _json_block(title: str, data) -> str:
    return f"### {title}\n```json\n{json.dumps(data, ensure_ascii=True, indent=2)}\n```"


def _latest(items):
    return items[0] if items else {}


def _agent_specific_instructions(agent, stock, catalysts, prices, events, notes, journal) -> str:
    instructions: List[str] = []
    latest_price = _latest(prices)
    if agent.slug == "catalyst_policy":
        if stock and stock.get("market_cap"):
            for catalyst in catalysts[:5]:
                if catalyst.get("amount_ceiling"):
                    instructions.append(
                        f"Calculate catalyst materiality using amount_ceiling {catalyst['amount_ceiling']} / market_cap {stock['market_cap']}."
                    )
        else:
            instructions.append("Market cap is missing — flag missing data and estimate using current_price * shares_outstanding if possible.")
        instructions.append("Separate confirmed, conditional, and LOI/proposed support in the scorecard.")
    elif agent.slug == "price_action":
        if latest_price:
            instructions.append("Use the latest price snapshot to derive the current price, change_pct, volume_vs_avg, and key levels.")
        instructions.append("Explicitly classify Weinstein stage, momentum, and relative strength from the supplied price data.")
    elif agent.slug == "options_positioning":
        instructions.append("If options data is sparse, say INSUFFICIENT clearly rather than forcing a signal.")
        if notes:
            instructions.append("Use any options-related notes or extraction appendix rows to identify unusual strikes or flow shifts.")
    elif agent.slug == "fundamental_valuation":
        instructions.append("Compute enterprise value from market cap, debt_position_approx, and cash_position_approx when numeric values are available.")
        instructions.append("Discuss dilution risk using dilution_risk, dilution_notes, and shares_outstanding.")
    elif agent.slug == "sector_supply_chain":
        instructions.append("Tie the primary mineral, value chain stage, and china_dependency_exposure to the sector-context verdict.")
        instructions.append("State whether each major catalyst is actually economic or narrative-only.")
    elif agent.slug == "sentiment_narrative":
        instructions.append("Use SENTIMENT research notes first when classifying narrative phase and crowding.")
        instructions.append("If no sentiment notes exist, explicitly say the social/media read is limited.")
    elif agent.slug == "contrarian":
        instructions.append("Attack the strongest bullish arguments from catalysts, price action, and fundamentals with specific failure modes.")
        instructions.append("Do not repeat a generic dilution objection unless the data supports it.")
    elif agent.slug == "risk_sizing":
        instructions.append(
            f"Use portfolio size {getattr(settings, 'default_portfolio_size', 50000)} and max risk "
            f"{getattr(settings, 'default_risk_pct', 0.015) * 100:.1f}% unless the task data says otherwise."
        )
        if latest_price:
            instructions.append("Use the latest support/resistance and ATR-style fields from the price snapshot to size the position.")
        if journal:
            instructions.append("Check current open positions for sector concentration before finalizing the risk verdict.")
    if events:
        instructions.append(f"Consider the nearest upcoming event: {events[0].get('description', 'N/A')} on {events[0].get('date', 'N/A')}.")
    return "\n".join(f"- {item}" for item in instructions)


async def generate_tasks(conn, run_id: str) -> Dict[int, str]:
    run = await fetch_one(conn, "SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
    if not run:
        raise ValueError(f"Run not found: {run_id}")
    ticker = run["ticker"]
    stock = await fetch_one(conn, "SELECT * FROM stocks WHERE ticker = ?", (ticker,))
    catalysts = await fetch_all(conn, "SELECT * FROM catalysts WHERE ticker = ? ORDER BY date DESC LIMIT 20", (ticker,))
    prices = await fetch_all(conn, "SELECT * FROM price_snapshots WHERE ticker = ? ORDER BY date DESC LIMIT 10", (ticker,))
    events = await fetch_all(conn, "SELECT * FROM upcoming_events WHERE ticker = ? ORDER BY date ASC LIMIT 10", (ticker,))
    notes = await fetch_all(conn, "SELECT * FROM research_notes WHERE ticker = ? OR ticker IS NULL ORDER BY created_at DESC LIMIT 5", (ticker,))
    journal = await fetch_all(conn, "SELECT * FROM trading_journal WHERE ticker = ? AND status = 'OPEN' ORDER BY created_at DESC", (ticker,))
    previous_outputs = await fetch_all(conn, "SELECT agent_number, agent_name, raw_markdown FROM agent_outputs WHERE ticker = ? ORDER BY created_at DESC LIMIT 3", (ticker,))

    task_dir = settings.tasks_dir / run_id
    task_dir.mkdir(parents=True, exist_ok=True)
    created: Dict[int, str] = {}
    today = datetime.utcnow().strftime("%Y-%m-%d")
    context_sections = [
        _json_block("Stock Profile", stock or {"ticker": ticker}),
        _json_block("Recent Catalysts", catalysts),
        _json_block("Recent Price Snapshots", prices),
        _json_block("Upcoming Events", events),
        _json_block("Open Positions", journal),
        _json_block("Recent Research Notes", notes),
        _json_block("Previous Outputs", previous_outputs),
    ]
    shared_context = "\n\n".join(context_sections)

    for agent in SPECIALIST_AGENTS:
        body = f"""ROLE:
You are generating a self-contained work order for the {agent.name} analyst in MINERVA.

CONTEXT:
Date: {today}
Ticker: {ticker}
Run ID: {run_id}
{shared_context}

TASK:
1. Analyse only the stock {ticker}.
2. {agent.task_focus}
3. Use the provided data first; if some data is missing, say so explicitly.
4. Perform the calculations required by the system prompt.
5. Keep the final answer faithful to the required markdown headings and tables.
6. Follow these data-specific instructions:
{_agent_specific_instructions(agent, stock or {}, catalysts, prices, events, notes, journal)}

FORMAT:
- The model must return the exact top-level heading {agent.output_header}
- Include all required sections from the system prompt.
- Prefer explicit numbers and brief reasoning over vague commentary.

CONSTRAINTS:
- One stock only.
- Do not invent missing data.
- Do not omit mandatory fields even if they must be marked as unknown.
- Keep the analysis concise enough for a local 9B model.
"""
        final_text = _trim_words(body, 1900)
        task_path = task_dir / f"{agent.number:02d}_{agent.slug}.md"
        task_path.write_text(final_text, encoding="utf-8")
        created[agent.number] = str(task_path)
    return created
