from __future__ import annotations

from fastapi import APIRouter

from ..config import ROOT_DIR, PROMPTS_DIR

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("/minerva-format")
async def get_minerva_format():
    command_path = ROOT_DIR / ".claude" / "commands" / "minerva-format.md"
    spec_path = PROMPTS_DIR / "minerva_format_spec.md"
    return {
        "prompt_type": "MINERVA_FORMAT",
        "command_name": "minerva-format",
        "command_text": command_path.read_text(encoding="utf-8"),
        "spec_text": spec_path.read_text(encoding="utf-8"),
    }
