import asyncio
import json
import logging
import os
import urllib.request

logger = logging.getLogger("minerva.webhooks")

def sync_broadcast_catalyst(catalyst: dict):
    webhook_url = os.environ.get("MINERVA_WEBHOOK_URL")
    if not webhook_url:
        logger.info(f"[Webhook] MINERVA_WEBHOOK_URL missing. Skipping Sig 5 alert for {catalyst.get('ticker')}")
        return

    payload = {
        "content": f"🚨 **MINERVA ALERT: SIGNIFICANCE 5 CATALYST** 🚨\n**Ticker:** {catalyst.get('ticker')}\n**Title:** {catalyst.get('title')}\n**Date:** {catalyst.get('date')}\n**Details:** {catalyst.get('description')}"
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status >= 400:
                logger.error(f"[Webhook] Push failed with status {response.status}")
            else:
                logger.info(f"[Webhook] Successfully fired payload for {catalyst.get('ticker')}")
    except Exception as e:
        logger.error(f"[Webhook] Failed to dispatch webhook: {e}")

async def broadcast_sig5_catalysts(catalysts: list):
    """
    Scans the processed catalysts for Significance 5 metrics and dumps them to the async loop threadpool
    preventing the request cycle from blocking on IO operations.
    """
    for cat in catalysts:
        sig = cat.get("significance") or cat.get("significance_1to5")
        try:
            sig_val = int(sig)
        except (ValueError, TypeError):
            continue
        
        if sig_val == 5:
            asyncio.get_event_loop().run_in_executor(None, sync_broadcast_catalyst, cat)
