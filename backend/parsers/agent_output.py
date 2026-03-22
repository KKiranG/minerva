from __future__ import annotations

import re
from typing import Any, Dict, List

from ..agents.registry import AGENT_BY_NUMBER


def parse_agent_output(agent_number: int, raw_text: str) -> Dict[str, Any]:
    spec = AGENT_BY_NUMBER[agent_number]
    legacy_consistency = agent_number == 9 and "ALL CHECKS PASSED" in raw_text
    parse_status = "COMPLETE" if spec.output_header in raw_text or legacy_consistency else "FAILED"
    sections = _split_sections(raw_text)
    tables = {name: _parse_tables(content) for name, content in sections.items() if "|" in content}
    return {
        "header": next((line.strip() for line in raw_text.splitlines() if line.strip().startswith("## ")), ""),
        "sections": sections,
        "tables": tables,
        "parse_status": parse_status,
    }


def _split_sections(raw_text: str) -> Dict[str, str]:
    current = "root"
    sections: Dict[str, List[str]] = {current: []}
    for line in raw_text.splitlines():
        if line.startswith("### "):
            current = line.replace("### ", "").strip()
            sections.setdefault(current, [])
            continue
        sections[current].append(line)
    return {name: "\n".join(lines).strip() for name, lines in sections.items() if "\n".join(lines).strip()}


def _parse_tables(content: str) -> List[List[Dict[str, str]]]:
    blocks: List[List[str]] = []
    current: List[str] = []
    for line in content.splitlines():
        if line.strip().startswith("|"):
            current.append(line.strip())
        elif current:
            blocks.append(current)
            current = []
    if current:
        blocks.append(current)
    parsed: List[List[Dict[str, str]]] = []
    for block in blocks:
        if len(block) < 2:
            continue
        headers = [cell.strip() for cell in block[0].strip("|").split("|")]
        entries: List[Dict[str, str]] = []
        for row in block[2:]:
            values = [cell.strip() for cell in row.strip("|").split("|")]
            if len(values) != len(headers):
                continue
            entries.append({headers[index]: values[index] for index in range(len(headers))})
        parsed.append(entries)
    return parsed


SENIOR_REVIEW_PATTERNS = {
    "final_verdict": re.compile(r"### Net Judgment:\s*\[(.*?)\]|### Net Judgment:\s*(.*)"),
    "final_conviction": re.compile(r"### Conviction:\s*\[(.*?)\]|### Conviction:\s*(.*)"),
    "final_action": re.compile(r"### Action:\s*\[(.*?)\]|### Action:\s*(.*)"),
}


def parse_synthesis_decision(raw_text: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {"one_line_summary": None}
    one_line_match = re.search(r"### One Line:\s*(.*)", raw_text)
    if one_line_match:
        data["one_line_summary"] = one_line_match.group(1).strip()
    for field, pattern in SENIOR_REVIEW_PATTERNS.items():
        match = pattern.search(raw_text)
        if not match:
            continue
        value = match.group(1) or match.group(2)
        data[field] = value.strip().strip("[]")
    entry_match = re.search(r"Entry Zone:\s*\[\$?([0-9.,]+)\s*-\s*\$?([0-9.,]+)\]", raw_text)
    if entry_match:
        data["entry_low"] = float(entry_match.group(1).replace(",", ""))
        data["entry_high"] = float(entry_match.group(2).replace(",", ""))
    stop_match = re.search(r"Stop Loss:\s*\[\$?([0-9.,]+)\]", raw_text)
    target_match = re.search(r"Target:\s*\[\$?([0-9.,]+)\]", raw_text)
    timeframe_match = re.search(r"Timeframe:\s*\[(.*?)\]", raw_text)
    if stop_match:
        data["stop_loss"] = float(stop_match.group(1).replace(",", ""))
    if target_match:
        data["target_price"] = float(target_match.group(1).replace(",", ""))
    if timeframe_match:
        data["timeframe"] = timeframe_match.group(1).strip()
    return data
