from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Mapping, Optional

from ..models import AGENT_ONE_BINDING_MAP
from .markdown_tables import normalize_table_key, parse_key_value_table, parse_markdown_table_block
from .section_splitter import SECTION_MARKERS, SECTION_NAMES, extract_sections, parse_report_header, split_document, split_report_blocks


NULL_TEXT_VALUES = {"", "-", "—", "n/a", "n_a", "na", "none", "null"}
DATE_FORMATS = (
    "%Y-%m-%d",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y/%m/%d",
    "%d/%m/%Y",
    "%m-%d-%Y",
    "%b %d, %Y",
    "%B %d, %Y",
    "%d %b %Y",
    "%d %B %Y",
    "%b %d %Y",
    "%B %d %Y",
)
SUFFIX_MULTIPLIERS = {"k": 1_000, "m": 1_000_000, "b": 1_000_000_000, "t": 1_000_000_000_000}


def normalize_binding_status(value: str) -> str:
    cleaned = str(value or "").strip().upper().replace(" ", "_")
    return AGENT_ONE_BINDING_MAP.get(cleaned, cleaned)


def normalize_key(value: str) -> str:
    return normalize_table_key(value)


def clean_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip()
    return None if normalize_key(cleaned) in NULL_TEXT_VALUES else cleaned


def is_effectively_empty(value: Any) -> bool:
    cleaned = clean_value(value)
    return cleaned is None or cleaned.strip() == ""


def parse_numeric_value(value: Any) -> Optional[float]:
    cleaned = clean_value(value)
    if cleaned is None:
        return None

    candidate = cleaned.strip().lower()
    negative = candidate.startswith("(") and candidate.endswith(")")
    candidate = candidate.strip("()")
    candidate = candidate.replace("$", "").replace(",", "").replace("%", "").replace("x", "")
    candidate = candidate.replace("usd", "").replace("aud", "").replace("cad", "").strip()
    candidate = re.sub(r"\b(to|risk|reward)\b", " ", candidate)

    match = re.search(r"(-?\d+(?:\.\d+)?)(?:\s*([kmbt]))?", candidate)
    if not match:
        return None

    number = float(match.group(1))
    suffix = (match.group(2) or "").lower()
    if suffix:
        number *= SUFFIX_MULTIPLIERS[suffix]
    return -number if negative and number > 0 else number


def parse_float(value: Any) -> Optional[float]:
    return parse_numeric_value(value)


def parse_int(value: Any) -> Optional[int]:
    parsed = parse_numeric_value(value)
    return int(parsed) if parsed is not None else None


def parse_currency(value: Any) -> Optional[float]:
    return parse_numeric_value(value)


def parse_rr_ratio(value: Any) -> Optional[float]:
    cleaned = clean_value(value)
    if cleaned is None:
        return None
    ratio_match = re.search(r"(-?\d+(?:\.\d+)?)\s*[:/]\s*(-?\d+(?:\.\d+)?)", cleaned)
    if ratio_match:
        numerator = float(ratio_match.group(1))
        denominator = float(ratio_match.group(2))
        return numerator / denominator if denominator else None
    to_match = re.search(r"(-?\d+(?:\.\d+)?)\s*(?:to)\s*(-?\d+(?:\.\d+)?)", cleaned.lower())
    if to_match:
        numerator = float(to_match.group(1))
        denominator = float(to_match.group(2))
        return numerator / denominator if denominator else None
    return parse_numeric_value(cleaned)


def parse_iso_date(value: Any) -> Optional[str]:
    cleaned = clean_value(value)
    if cleaned is None:
        return None

    normalized = cleaned.replace(".", "-").replace("/", "-")
    iso_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})(?:[tT ].*)?$", normalized)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}"

    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).date().isoformat()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(cleaned.replace("Z", "+00:00")).astimezone(timezone.utc).date().isoformat()
    except ValueError:
        return None


def split_research_and_appendix(raw_text: str) -> tuple[str, str]:
    cleaned = str(raw_text or "").strip()
    return cleaned, cleaned


def parse_extraction(raw_text: str) -> Dict[str, Any]:
    return {"reports": parse_minerva_document(raw_text)}


def parse_minerva_document(raw_text: str) -> List[Dict[str, Any]]:
    reports: List[Dict[str, Any]] = []
    for document in split_document(raw_text):
        sections = dict(document["sections"])
        header = {
            "ticker": document.get("ticker"),
            "date": parse_iso_date(document.get("date")) or document.get("date"),
            "source": document.get("source"),
        }
        reports.append(
            {
                "raw_text": str(document.get("raw_text") or ""),
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


__all__ = [
    "SECTION_MARKERS",
    "SECTION_NAMES",
    "clean_value",
    "extract_sections",
    "is_effectively_empty",
    "normalize_binding_status",
    "normalize_key",
    "parse_currency",
    "parse_extraction",
    "parse_float",
    "parse_int",
    "parse_iso_date",
    "parse_key_value_table",
    "parse_markdown_table_block",
    "parse_minerva_document",
    "parse_report_header",
    "parse_rr_ratio",
    "split_document",
    "split_report_blocks",
    "split_research_and_appendix",
]
