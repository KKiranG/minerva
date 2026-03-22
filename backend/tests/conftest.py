from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import init_db
from backend.main import app


@pytest.fixture(autouse=True)
def reset_database():
    db_path = ROOT / "data" / "minerva.db"
    if db_path.exists():
        db_path.unlink()
    asyncio.run(init_db())
    yield
    if db_path.exists():
        db_path.unlink()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
