from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from ..models import AGENT_ONE_BINDING_MAP


SECTION_MARKERS = [
    "## MINERVA_REPORT",
    "## NARRATIVE",
    "## DECISION",
    "## CATALYSTS",
    "## PRICE_DATA",
    "## EVENTS",
    "## OPTIONS",
    "## TRIPWIRES",
    "## NOTES",
]

SECTION_NAMES = [marker.replace("## ", "") for marker in SECTION_MARKERS]


def normalize_binding_status(value: str) -> str:
    cleaned = str(value or "").strip().upper().replace(" ", "_")
    return AGENT_ONE_BINDING_MAP.get(cleaned, cleaned)


def split_research_and_appendix(raw_text: str) -> tuple[str, str]:
    return raw_text.strip(), raw_text.strip()


def parse_extraction(raw_text: str) -> Dict[str, Any]:
    reports = parse_minerva_document(raw_text)
    return {"reports": reports}


def split_report_blocks(raw_text: str) -> List[str]:
    matches = list(re.finditer(r"^## MINERVA_REPORT\s*$", raw_text, flags=re.MULTILINE))
    if not matches:
        return []
    blocks: List[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(raw_text)
        block = raw_text[start:end].strip()
        if block:
            blocks.append(block)
    return blocks


def parse_minerva_document(raw_text: str) -> List[Dict[str, Any]]:
    reports: List[Dict[str, Any]] = []
    for block in split_report_blocks(raw_text):
        sections = extract_sections(block)
        header = parse_report_header(sections.get("MINERVA_REPORT", ""))
        reports.append(
            {
                "raw_text": block,
                "header": header,
                "sections": sections,
                "decision": parse_key_value_table(sections.get("DECISION", "")),
                "catalysts": parse_markdown_table_block(sections.get("CATALYSTS", "")),
                "price_data": parse_key_value_table(sections.get("PRICE_DATA", "")),
                "events": parse_markdown_table_block(sections.get("EVENTS", "")),
                "options": parse_markdown_table_block(sections.get("OPTIONS", "")),
                "tripwires": parse_markdown_table_block(sections.get("TRIPWIRES", "")),
            }
        )
    return reports


def extract_sections(text: str) -> Dict[str, str]:
    positions = []
    for marker in SECTION_MARKERS:
        for match in re.finditer(rf"^{re.escape(marker)}\s*$", text, flags=re.MULTILINE):
            positions.append((match.start(), marker.replace("## ", "")))
    positions.sort(key=lambda item: item[0])
    sections: Dict[str, str] = {}
    for index, (start, name) in enumerate(positions):
        header_end = text.find("\n", start)
        if header_end == -1:
            header_end = len(text)
        content_start = header_end + 1
        content_end = positions[index + 1][0] if index + 1 < len(positions) else len(text)
        sections[name] = text[content_start:content_end].strip()
    return sections


def parse_report_header(section: str) -> Dict[str, Optional[str]]:
    return {
        "ticker": _header_value(section, "Ticker"),
        "date": _header_value(section, "Date"),
        "source": _header_value(section, "Source"),
    }


def _header_value(section: str, field: str) -> Optional[str]:
    match = re.search(rf"^###\s+{re.escape(field)}:\s*(.+?)\s*$", section, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def parse_key_value_table(block: str) -> Dict[str, str]:
    rows = parse_markdown_table_block(block)
    if not rows:
        return {}
    first = rows[0]
    if "Field" in first and "Value" in first:
        return {row.get("Field", "").strip(): row.get("Value", "").strip() for row in rows if row.get("Field")}
    if "Metric" in first and "Value" in first:
        return {row.get("Metric", "").strip(): row.get("Value", "").strip() for row in rows if row.get("Metric")}
    return {}


def parse_markdown_table_block(block: str) -> List[Dict[str, str]]:
    rows = [line.strip() for line in block.splitlines() if line.strip().startswith("|")]
    if len(rows) < 2:
        return []
    header = _split_table_row(rows[0])
    parsed_rows: List[Dict[str, str]] = []
    for row in rows[2:]:
        values = _split_table_row(row)
        if len(values) != len(header):
            continue
        parsed_rows.append({header[index].strip(): values[index].strip() for index in range(len(header))})
    return parsed_rows


def _split_table_row(row: str) -> List[str]:
    return [cell.strip() for cell in row.strip().strip("|").split("|")]
