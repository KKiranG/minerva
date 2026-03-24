from __future__ import annotations

import re
from typing import Dict, List, Optional


UNICODE_REPLACEMENTS = {
    "\u2014": "-",
    "\u2013": "-",
    "\u2212": "-",
    "\u201c": '"',
    "\u201d": '"',
    "\u2018": "'",
    "\u2019": "'",
    "\u2026": "...",
    "\u00a0": " ",
}

EMPTY_TABLE_TOKENS = {
    "",
    "-",
    "n/a",
    "n_a",
    "na",
    "none",
    "null",
    "no_data_available",
    "no_options_data_available",
}

_UNESCAPED_PIPE = re.compile(r"(?<!\\)\|")
_NORMALIZE_KEY = re.compile(r"[^a-z0-9]+")
_SEPARATOR_CELL = re.compile(r"^\s*:?-{1,}:?\s*$")
_HAS_DIGIT = re.compile(r"\d")
_STRIP_NUMERIC_TOKENS = re.compile(r"[$,%]")


def normalize_unicode(text: str) -> str:
    normalized = str(text or "")
    for char, replacement in UNICODE_REPLACEMENTS.items():
        normalized = normalized.replace(char, replacement)
    return normalized


def normalize_table_key(value: str) -> str:
    return _NORMALIZE_KEY.sub("_", normalize_unicode(str(value or "")).strip().lower()).strip("_")


def split_markdown_row(row: str) -> List[str]:
    cleaned = normalize_unicode(str(row or "")).strip()
    if cleaned.startswith("|"):
        cleaned = cleaned[1:]
    if cleaned.endswith("|"):
        cleaned = cleaned[:-1]
    return [cell.replace(r"\|", "|").strip() for cell in _UNESCAPED_PIPE.split(cleaned)]


def _normalize_cell(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = normalize_unicode(str(value)).strip()
    return cleaned or None


def _is_separator_row(cells: List[str]) -> bool:
    if not cells:
        return False
    return all(_SEPARATOR_CELL.match(cell or "") for cell in cells)


def _normalize_row_length(values: List[str], width: int) -> List[Optional[str]]:
    if len(values) < width:
        values = values + [""] * (width - len(values))
    elif len(values) > width:
        values = values[: width - 1] + [" | ".join(values[width - 1 :])]
    return [_normalize_cell(value) for value in values]


def _is_explicit_placeholder(value: Optional[str]) -> bool:
    if value is None:
        return False
    normalized = normalize_table_key(value)
    return bool(normalized) and normalized in EMPTY_TABLE_TOKENS


def _iter_logical_table_lines(text: str) -> List[str]:
    logical_lines: List[str] = []
    current: Optional[str] = None
    for raw_line in normalize_unicode(text).replace("\r\n", "\n").splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        if stripped.startswith("|"):
            if current is not None:
                logical_lines.append(current)
            current = stripped
            continue
        if current is not None and not stripped.startswith("## "):
            current = f"{current.rstrip('|').rstrip()} {stripped.rstrip('|').strip()} |"
            continue
        if current is not None:
            logical_lines.append(current)
            current = None
    if current is not None:
        logical_lines.append(current)
    return logical_lines


def _strip_numeric_formatting(value: Optional[str]) -> str:
    if value is None:
        return ""
    cleaned = normalize_unicode(value).strip()
    if _HAS_DIGIT.search(cleaned):
        cleaned = _STRIP_NUMERIC_TOKENS.sub("", cleaned).replace(",", "")
        cleaned = re.sub(r"(?<=\d)x$", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def parse_multi_column_table(text: str) -> List[Dict[str, Optional[str]]]:
    logical_lines = _iter_logical_table_lines(text)
    if len(logical_lines) < 2:
        return []

    header_cells = [_normalize_cell(cell) or "" for cell in split_markdown_row(logical_lines[0])]
    if not any(header_cells):
        return []
    header_keys = [normalize_table_key(cell) or f"column_{index + 1}" for index, cell in enumerate(header_cells)]

    data_lines = logical_lines[1:]
    if data_lines and _is_separator_row(split_markdown_row(data_lines[0])):
        data_lines = data_lines[1:]

    rows: List[Dict[str, Optional[str]]] = []
    width = len(header_keys)
    for raw_line in data_lines:
        values = _normalize_row_length(split_markdown_row(raw_line), width)
        if not any(normalize_table_key(value or "") not in EMPTY_TABLE_TOKENS for value in values):
            continue
        row = {header_keys[index]: values[index] for index in range(width)}
        non_anchor_items = [(key, value) for key, value in row.items() if key not in {"ticker", "date"}]
        if non_anchor_items and all(_is_explicit_placeholder(value) for _, value in non_anchor_items):
            continue
        rows.append(row)
    return rows


def parse_key_value_table(text: str) -> Dict[str, str]:
    rows = parse_multi_column_table(text)
    if not rows:
        return {}

    sample = rows[0]
    left_column = next((key for key in ("field", "metric", "key", "name") if key in sample), None)
    right_column = next((key for key in ("value", "description", "details") if key in sample), None)
    if not left_column or not right_column:
        return {}

    parsed: Dict[str, str] = {}
    for row in rows:
        key = _normalize_cell(row.get(left_column))
        value = _strip_numeric_formatting(row.get(right_column))
        if key:
            parsed[key] = value
    return parsed


def parse_markdown_table_block(text: str) -> List[Dict[str, Optional[str]]]:
    return parse_multi_column_table(text)
