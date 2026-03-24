from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from ..config import settings


class OllamaFallbackClient:
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = base_url or settings.ollama_url
        self.model = model or settings.ollama_model

    async def extract_json(self, section_name: str, raw_text: str, timeout: Optional[int] = None) -> Optional[Dict[str, Any]]:
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {
                    "role": "system",
                    "content": "Extract structured key-value pairs from the user content. Return valid JSON only.",
                },
                {
                    "role": "user",
                    "content": f"Section: {section_name}\n\n{raw_text}",
                },
            ],
            "options": {
                "temperature": settings.ollama_temperature,
                "num_predict": min(settings.ollama_max_tokens, 1024),
            },
        }
        try:
            async with httpx.AsyncClient(timeout=timeout or settings.fallback_timeout_seconds) as client:
                response = await client.post(self.base_url, json=payload)
                response.raise_for_status()
                data = response.json()
        except Exception:
            return None
        content = ((data.get("message") or {}).get("content") or "").strip()
        if not content:
            return None
        try:
            import json

            return json.loads(content)
        except Exception:
            return None
