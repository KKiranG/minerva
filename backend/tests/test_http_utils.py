import sqlite3
from fastapi import HTTPException
from backend.http_utils import handle_integrity_error

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
