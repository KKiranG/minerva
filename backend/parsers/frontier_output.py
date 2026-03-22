from __future__ import annotations

import re
from typing import Any, Dict, List

from .agent_output import parse_synthesis_decision


def parse_frontier_output(raw_text: str) -> Dict[str, Any]:
    data = parse_synthesis_decision(raw_text)
    data["agreements"] = _collect_bullets(raw_text, "### Agreements")
    data["blind_spots"] = _collect_bullets(raw_text, "### Blind Spots")
    return data


def _collect_bullets(raw_text: str, heading: str) -> List[str]:
    if heading not in raw_text:
        return []
    content = raw_text.split(heading, 1)[1]
    stop = re.search(r"\n### ", content)
    if stop:
        content = content[: stop.start()]
    return [line[1:].strip() for line in content.splitlines() if line.strip().startswith("-")]
