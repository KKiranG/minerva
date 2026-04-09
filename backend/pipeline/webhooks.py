import asyncio
import json
import logging
import os
import httpx

logger = logging.getLogger("minerva.webhooks")

async def async_broadcast_catalyst(client: httpx.AsyncClient, catalyst: dict, webhook_url: str):
    payload = {
        "content": f"🚨 **MINERVA ALERT: SIGNIFICANCE 5 CATALYST** 🚨\n**Ticker:** {catalyst.get('ticker')}\n**Title:** {catalyst.get('title')}\n**Date:** {catalyst.get('date')}\n**Details:** {catalyst.get('description')}"
    }

    try:
        response = await client.post(webhook_url, json=payload)
        if response.status_code >= 400:
            logger.error(f"[Webhook] Push failed with status {response.status_code}")
        else:
            logger.info(f"[Webhook] Successfully fired payload for {catalyst.get('ticker')}")
    except Exception as e:
        logger.error(f"[Webhook] Failed to dispatch webhook: {e}")

async def broadcast_sig5_catalysts(catalysts: list):
    """
    Scans the processed catalysts for Significance 5 metrics and fires webhooks
    concurrently without blocking the event loop or using threadpool threads.
    """
    webhook_url = os.environ.get("MINERVA_WEBHOOK_URL")

    tasks = []
    for cat in catalysts:
        sig = cat.get("significance") or cat.get("significance_1to5")
        try:
            sig_val = int(sig)
        except (ValueError, TypeError):
            continue
        
        if sig_val == 5:
            if not webhook_url:
                logger.info(f"[Webhook] MINERVA_WEBHOOK_URL missing. Skipping Sig 5 alert for {cat.get('ticker')}")
                continue
            tasks.append(cat)

    if not tasks:
        return

    async with httpx.AsyncClient(timeout=5.0) as client:
        coroutines = [async_broadcast_catalyst(client, cat, webhook_url) for cat in tasks]
        await asyncio.gather(*coroutines)
