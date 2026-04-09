import pytest
from fastapi import HTTPException
from backend.http_utils import (
    validate_stock_patch_fields,
    validate_catalyst_patch_fields,
    validate_journal_fields
)

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
