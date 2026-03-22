from __future__ import annotations

from typing import Dict, List, Optional

from ..agents.registry import REVIEW_AGENTS
from ..database import fetch_all
from .agent_executor import OllamaClient, execute_agent


async def run_local_review(conn, run_id: str, ticker: str, client: Optional[OllamaClient] = None) -> Dict[str, str]:
    client = client or OllamaClient()
    outputs = await fetch_all(conn, "SELECT agent_number, agent_name, raw_markdown FROM agent_outputs WHERE run_id = ? ORDER BY agent_number ASC", (run_id,))
    specialist_text = "\n\n".join(
        [f"## Agent {row['agent_number']} — {row['agent_name']}\n{row['raw_markdown']}" for row in outputs if row["agent_number"] <= 8]
    )
    review_results: Dict[str, str] = {}
    consistency_content = f"""Review the following specialist outputs for {ticker}.\n\n{specialist_text}\n"""
    result = await execute_agent(conn, REVIEW_AGENTS[0], run_id, ticker, consistency_content, None, client=client)
    review_results["consistency"] = result["raw_output"]

    synthesis_content = f"""Specialist outputs for {ticker}:\n\n{specialist_text}\n\nConsistency report:\n{review_results['consistency']}"""
    result = await execute_agent(conn, REVIEW_AGENTS[1], run_id, ticker, synthesis_content, None, client=client)
    review_results["synthesis"] = result["raw_output"]
    return review_results
