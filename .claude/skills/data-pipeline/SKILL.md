---
name: data-pipeline
description: >
  Use when building or modifying the MINERVA report parser, extraction
  ingest, state updater, or any pipeline component. Triggers on:
  pipeline, ingest, parse, extraction, state update, MINERVA format.
---

# Data Pipeline Skill

## Pipeline Phases
1. Frontier Research (manual)
2. Ingest (Python parser)
3. State Update (Python logic)

## Ingest Rules
- Input is a MINERVA-formatted markdown document.
- The parser splits on `##` section markers.
- Tables are parsed deterministically in Python.
- Deduplicate records rather than inserting duplicates.
- Store the full raw document every time.
- Store parse failures as research notes with `note_type = 'PARSE_FAILED'`.
- Use Ollama only as a section-level fallback parser.

## State Update Rules
- Update current stock profile fields from the latest analysis run.
- Recalculate `needs_attention`, `alert_flag`, and `open_position_flag` for all stocks.
- Never skip the state update after a successful ingest.

## Section Markers
- `## MINERVA_REPORT`
- `## NARRATIVE`
- `## DECISION`
- `## CATALYSTS`
- `## PRICE_DATA`
- `## EVENTS`
- `## OPTIONS`
- `## TRIPWIRES`
- `## NOTES`

## Error Handling
- Never halt on a parse failure.
- Never lose raw data.
- Log or surface section failures clearly.
- Return a summary of what succeeded and what failed.

## Anti-Patterns
- Do not reintroduce local analytical agent execution.
- Do not change the MINERVA format spec without updating the parser.
- Do not let parse failures drop raw data.
