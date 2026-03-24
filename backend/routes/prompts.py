from __future__ import annotations

from pathlib import Path
from typing import List

from fastapi import APIRouter

from ..config import ROOT_DIR, PROMPTS_DIR
from ..database import connect, execute, fetch_all, fetch_one, sha256_text, utc_now
from ..models import PromptTemplateResponse

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


def _template_specs():
    return [
        {
            "slug": "minerva-format-command",
            "prompt_type": "MINERVA_FORMAT_COMMAND",
            "title": "MINERVA Format Command",
            "source_path": str(ROOT_DIR / ".claude" / "commands" / "minerva-format.md"),
        },
        {
            "slug": "minerva-format-spec",
            "prompt_type": "MINERVA_FORMAT_SPEC",
            "title": "MINERVA Format Spec",
            "source_path": str(PROMPTS_DIR / "minerva_format_spec.md"),
        },
    ]


async def _sync_template(conn, *, slug: str, prompt_type: str, title: str, source_path: str) -> PromptTemplateResponse:
    content = Path(source_path).read_text(encoding="utf-8")
    content_hash = sha256_text(content)
    existing = await fetch_one(conn, "SELECT slug FROM prompt_templates WHERE slug = ?", (slug,))
    if existing:
        await execute(
            conn,
            """
            UPDATE prompt_templates
            SET prompt_type = ?, title = ?, source_path = ?, content = ?, content_hash = ?, updated_at = ?
            WHERE slug = ?
            """,
            (prompt_type, title, source_path, content, content_hash, utc_now(), slug),
        )
    else:
        await execute(
            conn,
            """
            INSERT INTO prompt_templates (
                slug, prompt_type, title, source_path, content, content_hash, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (slug, prompt_type, title, source_path, content, content_hash, utc_now(), utc_now()),
        )
    row = await fetch_one(conn, "SELECT * FROM prompt_templates WHERE slug = ?", (slug,))
    return PromptTemplateResponse(**row)


@router.get("/templates", response_model=List[PromptTemplateResponse])
async def list_prompt_templates():
    conn = await connect()
    try:
        items = []
        for spec in _template_specs():
            items.append(await _sync_template(conn, **spec))
        return items
    finally:
        await conn.close()


@router.get("/minerva-format")
async def get_minerva_format():
    conn = await connect()
    try:
        command = await _sync_template(conn, **_template_specs()[0])
        spec = await _sync_template(conn, **_template_specs()[1])
        return {
            "prompt_type": "MINERVA_FORMAT",
            "command_name": "minerva-format",
            "command_text": command.content,
            "command_hash": command.content_hash,
            "spec_text": spec.content,
            "spec_hash": spec.content_hash,
        }
    finally:
        await conn.close()
