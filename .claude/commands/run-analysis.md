---
name: run-analysis
description: Ingest a MINERVA report for a stock
argument-hint: [TICKER]
---

Steps:
1. Check if there is a recent MINERVA report file in `data/extractions/` for `$ARGUMENTS`
2. If yes, ingest it via `POST /api/analysis/ingest` (`/api/extractions/ingest` remains a compatibility alias)
3. Check the result with `GET /api/stocks/$ARGUMENTS`
4. Verify the decision card fields updated: `current_verdict`, `current_conviction`, `current_stop`, `current_target`
5. Report what was stored and any parse failures
