from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
PROMPTS_DIR = ROOT_DIR / "prompts"


@dataclass(frozen=True)
class Settings:
    app_name: str = "MINERVA"
    debug: bool = os.getenv("MINERVA_DEBUG", "0") == "1"
    database_path: Path = Path(os.getenv("MINERVA_DB_PATH", str(DATA_DIR / "minerva.db")))
    ollama_url: str = os.getenv("MINERVA_OLLAMA_URL", "http://localhost:11434/api/chat")
    ollama_model: str = os.getenv("MINERVA_OLLAMA_MODEL", "qwen3.5:latest")
    ollama_temperature: float = float(os.getenv("MINERVA_OLLAMA_TEMPERATURE", "0.3"))
    ollama_max_tokens: int = int(os.getenv("MINERVA_OLLAMA_MAX_TOKENS", "4096"))
    agent_timeout_seconds: int = int(os.getenv("MINERVA_AGENT_TIMEOUT", "120"))
    default_portfolio_size: float = float(os.getenv("MINERVA_PORTFOLIO_SIZE", "50000"))
    default_risk_pct: float = float(os.getenv("MINERVA_RISK_PCT", "0.015"))
    max_position_pct: float = float(os.getenv("MINERVA_MAX_POSITION_PCT", "0.10"))
    max_sector_pct: float = float(os.getenv("MINERVA_MAX_SECTOR_PCT", "0.30"))
    tasks_dir: Path = DATA_DIR / "tasks"
    outputs_dir: Path = DATA_DIR / "agent_outputs"
    reviews_dir: Path = DATA_DIR / "reviews"
    extractions_dir: Path = DATA_DIR / "extractions"
    exports_dir: Path = DATA_DIR / "exports"


settings = Settings()
