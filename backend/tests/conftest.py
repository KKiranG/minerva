from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import init_db
from backend.config import settings


@pytest.fixture(autouse=True)
def reset_database(tmp_path):
    db_path = tmp_path / "test_minerva.db"
    original_paths = {
        "database_path": settings.database_path,
        "tasks_dir": settings.tasks_dir,
        "outputs_dir": settings.outputs_dir,
        "reviews_dir": settings.reviews_dir,
        "extractions_dir": settings.extractions_dir,
        "exports_dir": settings.exports_dir,
    }
    os.environ["MINERVA_DB_PATH"] = str(db_path)
    object.__setattr__(settings, "database_path", db_path)
    object.__setattr__(settings, "tasks_dir", tmp_path / "tasks")
    object.__setattr__(settings, "outputs_dir", tmp_path / "agent_outputs")
    object.__setattr__(settings, "reviews_dir", tmp_path / "reviews")
    object.__setattr__(settings, "extractions_dir", tmp_path / "extractions")
    object.__setattr__(settings, "exports_dir", tmp_path / "exports")
    asyncio.run(init_db(db_path))
    yield
    if db_path.exists():
        db_path.unlink()
    for key, value in original_paths.items():
        object.__setattr__(settings, key, value)
    os.environ.pop("MINERVA_DB_PATH", None)


@pytest.fixture
def client():
    from backend.main import app

    with TestClient(app) as test_client:
        yield test_client
