from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from backend.pipeline.ollama_fallback import OllamaFallbackClient

pytestmark = pytest.mark.asyncio

async def test_extract_json_network_error(mocker: Any):
    mocker.patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Network error"))
    client = OllamaFallbackClient()
    result = await client.extract_json("test_section", "test_text")
    assert result is None

async def test_extract_json_http_error(mocker: Any):
    async def mock_post(*args, **kwargs):
        response = httpx.Response(500, request=httpx.Request("POST", "http://test"))
        return response
    mocker.patch("httpx.AsyncClient.post", side_effect=mock_post)
    client = OllamaFallbackClient()
    result = await client.extract_json("test_section", "test_text")
    assert result is None

async def test_extract_json_invalid_json(mocker: Any):
    async def mock_post(*args, **kwargs):
        return httpx.Response(200, json={"message": {"content": "not valid json"}}, request=httpx.Request("POST", "http://test"))
    mocker.patch("httpx.AsyncClient.post", side_effect=mock_post)
    client = OllamaFallbackClient()
    result = await client.extract_json("test_section", "test_text")
    assert result is None

async def test_extract_json_empty_content(mocker: Any):
    async def mock_post(*args, **kwargs):
        return httpx.Response(200, json={"message": {"content": ""}}, request=httpx.Request("POST", "http://test"))
    mocker.patch("httpx.AsyncClient.post", side_effect=mock_post)
    client = OllamaFallbackClient()
    result = await client.extract_json("test_section", "test_text")
    assert result is None

async def test_extract_json_success(mocker: Any):
    async def mock_post(*args, **kwargs):
        return httpx.Response(200, json={"message": {"content": '{"key": "value"}'}}, request=httpx.Request("POST", "http://test"))
    mocker.patch("httpx.AsyncClient.post", side_effect=mock_post)
    client = OllamaFallbackClient()
    result = await client.extract_json("test_section", "test_text")
    assert result == {"key": "value"}
