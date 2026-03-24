from __future__ import annotations

import sqlite3
from typing import Optional

from fastapi import HTTPException

from .database import fetch_one
from .models import ACTIONS, CANONICAL_BINDING_STATUSES, EXIT_REASONS, VERDICTS


def pagination(limit: int, offset: int, maximum: int = 200) -> tuple[int, int]:
    return max(1, min(limit, maximum)), max(0, offset)


def http_422(detail: str) -> HTTPException:
    return HTTPException(status_code=422, detail=detail)


def handle_integrity_error(error: sqlite3.IntegrityError) -> HTTPException:
    message = str(error)
    if "UNIQUE constraint failed" in message:
        return http_422("Record already exists with the same unique key.")
    if "CHECK constraint failed" in message:
        return http_422(f"Constraint validation failed: {message}")
    if "FOREIGN KEY constraint failed" in message:
        return http_422("Related record does not exist.")
    return http_422(message)


async def ensure_stock_exists(conn, ticker: Optional[str]) -> str:
    cleaned = (ticker or "").strip().upper()
    if not cleaned:
        raise http_422("Ticker is required.")
    row = await fetch_one(conn, "SELECT ticker FROM stocks WHERE ticker = ?", (cleaned,))
    if not row:
        raise http_422(f"Ticker '{cleaned}' does not exist in stocks.")
    return cleaned


def validate_stock_patch_fields(data: dict) -> None:
    verdict = data.get("current_verdict")
    action = data.get("current_action")
    if verdict and verdict not in VERDICTS:
        raise http_422(f"Invalid verdict '{verdict}'.")
    if action and action not in ACTIONS:
        raise http_422(f"Invalid action '{action}'.")


def validate_catalyst_patch_fields(data: dict) -> None:
    binding_status = data.get("binding_status")
    if binding_status and binding_status not in CANONICAL_BINDING_STATUSES:
        raise http_422(f"Invalid binding status '{binding_status}'.")


def validate_journal_fields(data: dict) -> None:
    exit_reason = data.get("exit_reason")
    if exit_reason and exit_reason not in EXIT_REASONS:
        raise http_422(f"Invalid exit_reason '{exit_reason}'.")
