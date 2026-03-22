from __future__ import annotations

import re
from typing import Dict, List, Tuple

from ..models import AGENT_ONE_BINDING_MAP


APPENDIX_ALIASES = {
    "NEW_CATALYSTS": ["NEW_CATALYSTS", "#### NEW_CATALYSTS", "NEW_CATALYSTS table:", "NEW_CATALYSTS table"],
    "PRICE_SNAPSHOTS": ["PRICE_SNAPSHOTS", "#### PRICE_SNAPSHOTS", "PRICE_SNAPSHOTS table:", "PRICE_SNAPSHOTS table"],
    "UPCOMING_EVENTS": ["UPCOMING_EVENTS", "#### UPCOMING_EVENTS", "UPCOMING_EVENTS table:", "UPCOMING_EVENTS table"],
    "OPTIONS_NOTABLE": ["OPTIONS_NOTABLE", "#### OPTIONS_NOTABLE", "OPTIONS_NOTABLE table:", "OPTIONS_NOTABLE table"],
    "SENTIMENT_SIGNALS": ["SENTIMENT_SIGNALS", "#### SENTIMENT_SIGNALS", "SENTIMENT_SIGNALS table:", "SENTIMENT_SIGNALS table"],
}

FIELD_ALIASES = {
    "amount_usd": "Amount_USD",
    "amount": "Amount_USD",
    "binding_status": "Binding_Status",
    "significance": "Significance_1to5",
    "significance_1to5": "Significance_1to5",
    "change%": "Change_Pct",
    "change_pct": "Change_Pct",
    "vol_vs_avg": "Vol_vs_Avg",
    "expected_date": "Date",
    "type": "Type",
    "call_or_put": "Call_or_Put",
}


def split_research_and_appendix(raw_text: str) -> Tuple[str, str]:
    match = re.search(r"STRUCTURED APPENDIX[:\s]*", raw_text, flags=re.IGNORECASE)
    if not match:
        return raw_text.strip(), ""
    return raw_text[: match.start()].strip(), raw_text[match.start() :].strip()


def parse_extraction(raw_text: str) -> Dict[str, List[Dict[str, str]]]:
    _, appendix = split_research_and_appendix(raw_text)
    canonical = {key: [] for key in APPENDIX_ALIASES}
    if not appendix:
        return canonical
    sections = _extract_sections(appendix)
    for section_name, section_body in sections.items():
        canonical[section_name] = parse_markdown_table_block(section_body)
    return canonical


def _extract_sections(text: str) -> Dict[str, str]:
    lines = text.splitlines()
    sections: Dict[str, List[str]] = {}
    current = None
    for line in lines:
        normalized = line.strip().strip(":")
        matched = None
        for key, aliases in APPENDIX_ALIASES.items():
            if normalized in aliases:
                matched = key
                break
        if matched:
            current = matched
            sections.setdefault(current, [])
            continue
        if current:
            sections[current].append(line)
    return {key: "\n".join(value).strip() for key, value in sections.items()}


def parse_markdown_table_block(block: str) -> List[Dict[str, str]]:
    rows = [line.strip() for line in block.splitlines() if line.strip().startswith("|")]
    if len(rows) < 2:
        return []
    header = [_normalize_field_name(cell) for cell in _split_table_row(rows[0])]
    parsed_rows: List[Dict[str, str]] = []
    for row in rows[2:]:
        values = _split_table_row(row)
        if len(values) != len(header):
            continue
        parsed_rows.append({header[index]: values[index] for index in range(len(header))})
    return parsed_rows


def _split_table_row(row: str) -> List[str]:
    return [cell.strip() for cell in row.strip("|").split("|")]


def _normalize_field_name(name: str) -> str:
    raw = name.strip()
    lowered = raw.lower().replace(" ", "_")
    return FIELD_ALIASES.get(lowered, raw)


def normalize_binding_status(value: str) -> str:
    cleaned = value.strip().upper().replace(" ", "_")
    return AGENT_ONE_BINDING_MAP.get(cleaned, cleaned)

