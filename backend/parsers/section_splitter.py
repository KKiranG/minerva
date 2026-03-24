from __future__ import annotations

import re
from typing import Dict, List, Optional


SECTION_NAMES = [
    "MINERVA_REPORT",
    "NARRATIVE",
    "DECISION",
    "CATALYSTS",
    "PRICE_DATA",
    "EVENTS",
    "OPTIONS",
    "TRIPWIRES",
    "NOTES",
]

SECTION_MARKERS = [f"## {name}" for name in SECTION_NAMES]
SECTION_NAME_SET = set(SECTION_NAMES)
_REPORT_MARKER = re.compile(r"^\s*##\s+MINERVA_REPORT\s*$", flags=re.MULTILINE | re.IGNORECASE)
_SECTION_MARKER = re.compile(r"^\s*##\s+([A-Z_]+)\s*$", flags=re.MULTILINE | re.IGNORECASE)


def split_report_blocks(raw_text: str) -> List[str]:
    text = str(raw_text or "").replace("\r\n", "\n").strip()
    if not text:
        return []
    matches = list(_REPORT_MARKER.finditer(text))
    if not matches:
        return [text]

    blocks: List[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[start:end].strip()
        if block:
            blocks.append(block)
    return blocks


def extract_sections(text: str) -> Dict[str, str]:
    source = str(text or "").replace("\r\n", "\n")
    matches = list(_SECTION_MARKER.finditer(source))
    positions = [(match.start(), match.end(), match.group(1).upper()) for match in matches if match.group(1).upper() in SECTION_NAME_SET]
    if not positions:
        return {}

    sections: Dict[str, str] = {}
    for index, (_, end, name) in enumerate(positions):
        content_end = positions[index + 1][0] if index + 1 < len(positions) else len(source)
        content = source[end:content_end].strip()
        if name in sections:
            sections[name] = "\n\n".join(part for part in (sections[name], content) if part)
        else:
            sections[name] = content
    return sections


def parse_report_header(section: str) -> Dict[str, Optional[str]]:
    return {
        "ticker": _header_value(section, "Ticker"),
        "date": _header_value(section, "Date"),
        "source": _header_value(section, "Source"),
    }


def _header_value(section: str, field: str) -> Optional[str]:
    match = re.search(rf"^\s*###\s*{re.escape(field)}\s*:\s*(.*?)\s*$", str(section or ""), flags=re.MULTILINE | re.IGNORECASE)
    if not match:
        return None
    value = match.group(1).strip()
    return value or None


def split_document(raw_text: str) -> List[Dict[str, object]]:
    blocks = split_report_blocks(raw_text)
    documents: List[Dict[str, object]] = []
    for block in blocks:
        sections = extract_sections(block)
        header = parse_report_header(sections.get("MINERVA_REPORT", ""))
        if not sections and block.strip():
            sections = {"NARRATIVE": block.strip()}
        documents.append(
            {
                "ticker": header.get("ticker") or "UNKNOWN",
                "date": header.get("date"),
                "source": header.get("source"),
                "sections": sections,
                "raw_text": block.strip(),
            }
        )
    return documents
