from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import httpx

from ..agents.registry import AgentSpec, load_prompt
from ..config import settings
from ..database import execute, json_dumps
from ..parsers.agent_output import parse_agent_output


class OllamaClient:
    async def chat(self, system_prompt: str, user_prompt: str, timeout: int) -> str:
        payload = {
            "model": settings.ollama_model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {
                "temperature": settings.ollama_temperature,
                "num_predict": settings.ollama_max_tokens,
            },
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(settings.ollama_url, json=payload)
            response.raise_for_status()
            data = response.json()
        if "message" in data and isinstance(data["message"], dict):
            return data["message"].get("content", "")
        return data.get("response", "")


async def execute_agent(
    conn,
    spec: AgentSpec,
    run_id: str,
    ticker: str,
    content: str,
    task_path: Optional[str],
    client: Optional[OllamaClient] = None,
) -> Dict[str, Any]:
    client = client or OllamaClient()
    prompt = load_prompt(spec)
    retries = 0
    raw_output = ""
    error_message = None
    parse_status = "FAILED"
    parsed = {}
    while retries < 2:
        try:
            raw_output = await client.chat(prompt, content, timeout=settings.agent_timeout_seconds)
            parsed = parse_agent_output(spec.number, raw_output)
            parse_status = parsed["parse_status"]
            error_message = None
            break
        except (asyncio.TimeoutError, httpx.HTTPError, ConnectionError) as exc:
            error_message = str(exc)
            retries += 1
            if retries < 2:
                await asyncio.sleep(2 ** retries)
                continue
            raw_output = raw_output or f"ERROR: {error_message}"
            parsed = {"header": "", "sections": {}, "tables": {}, "parse_status": "FAILED"}
            parse_status = "FAILED"
            break

    output_dir = settings.outputs_dir / run_id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{spec.number:02d}_{spec.slug}.md"
    output_path.write_text(raw_output, encoding="utf-8")

    await execute(
        conn,
        """
        INSERT INTO agent_outputs (
            run_id, ticker, agent_number, agent_name, agent_kind, prompt_path, task_path,
            output_path, raw_markdown, parsed_json, parse_status, retry_count, model, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            ticker,
            spec.number,
            spec.name,
            spec.kind,
            str(spec.prompt_path),
            task_path,
            str(output_path),
            raw_output,
            json_dumps(parsed),
            parse_status,
            max(0, retries - 1),
            settings.ollama_model,
            error_message,
        ),
    )
    return {"raw_output": raw_output, "parsed": parsed, "parse_status": parse_status, "output_path": str(output_path)}
