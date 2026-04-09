from __future__ import annotations

import sqlite3

import pytest
from fastapi import HTTPException

from backend.http_utils import (
    handle_integrity_error,
    validate_catalyst_patch_fields,
    validate_journal_fields,
    validate_stock_patch_fields,
)


def test_handle_integrity_error_unique_constraint():
    error = sqlite3.IntegrityError("UNIQUE constraint failed: table.column")
    exc = handle_integrity_error(error)
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 422
    assert exc.detail == "Record already exists with the same unique key."


def test_handle_integrity_error_check_constraint():
    error = sqlite3.IntegrityError("CHECK constraint failed: something")
    exc = handle_integrity_error(error)
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 422
    assert exc.detail == "Constraint validation failed: CHECK constraint failed: something"


def test_handle_integrity_error_foreign_key():
    error = sqlite3.IntegrityError("FOREIGN KEY constraint failed")
    exc = handle_integrity_error(error)
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 422
    assert exc.detail == "Related record does not exist."


def test_handle_integrity_error_other():
    error = sqlite3.IntegrityError("Some other integrity error")
    exc = handle_integrity_error(error)
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 422
    assert exc.detail == "Some other integrity error"


def test_validate_stock_patch_fields():
    # Valid cases
    validate_stock_patch_fields({})
    validate_stock_patch_fields({"current_verdict": "BULLISH"})
    validate_stock_patch_fields({"current_action": "BUY"})
    validate_stock_patch_fields({"current_verdict": "BEARISH", "current_action": "SELL"})

    # Invalid cases
    with pytest.raises(HTTPException) as exc_info:
        validate_stock_patch_fields({"current_verdict": "INVALID_VERDICT"})
    assert exc_info.value.status_code == 422
    assert "Invalid verdict 'INVALID_VERDICT'" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        validate_stock_patch_fields({"current_action": "INVALID_ACTION"})
    assert exc_info.value.status_code == 422
    assert "Invalid action 'INVALID_ACTION'" in exc_info.value.detail


def test_validate_catalyst_patch_fields():
    # Valid cases
    validate_catalyst_patch_fields({})
    validate_catalyst_patch_fields({"binding_status": "ANNOUNCED"})

    # Invalid cases
    with pytest.raises(HTTPException) as exc_info:
        validate_catalyst_patch_fields({"binding_status": "INVALID_STATUS"})
    assert exc_info.value.status_code == 422
    assert "Invalid binding status 'INVALID_STATUS'" in exc_info.value.detail


def test_validate_journal_fields():
    # Valid cases
    validate_journal_fields({})
    validate_journal_fields({"exit_reason": "TARGET_HIT"})

    # Invalid cases
    with pytest.raises(HTTPException) as exc_info:
        validate_journal_fields({"exit_reason": "INVALID_REASON"})
    assert exc_info.value.status_code == 422
    assert "Invalid exit_reason 'INVALID_REASON'" in exc_info.value.detail
