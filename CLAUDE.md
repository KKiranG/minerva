# MINERVA — Critical Minerals Intelligence System

## What This Is
A local knowledge management dashboard for critical minerals stock analysis.
You do all research and analysis via frontier AI models (Claude, ChatGPT,
Gemini, Perplexity). MINERVA stores, organises, and displays the results.

The system has a 3-phase pipeline:
1. Frontier Research & Analysis (manual, multi-model)
2. Ingest (Python parser, instant — parses MINERVA-formatted documents)
3. State Update (Python logic, instant — updates stock profiles and flags)

There are NO local analytical agents. No Ollama in the critical path.
Ollama exists only as an optional fallback parser for malformed sections.

## Tech
- Backend: Python 3.12, FastAPI, aiosqlite, uvicorn
- Frontend: React 19 (Vite), Tailwind CSS v4
- Database: SQLite at `data/minerva.db`
- No external API keys required. No LLM in the critical path.

## Architecture
- `backend/main.py` — FastAPI entry, CORS, lifespan
- `backend/database.py` — Schema, connection, migrations
- `backend/models.py` — Pydantic models for all entities
- `backend/routes/` — API endpoints grouped by domain
- `backend/pipeline/extraction_ingest.py` — MINERVA format parser (Phase 2)
- `backend/pipeline/state_updater.py` — Stock profile and flag updates (Phase 3)
- `backend/pipeline/orchestrator.py` — Coordinates ingest + state update
- `backend/parsers/` — Markdown table and section parsing utilities
- `frontend/src/pages/` — 7 page components
- `frontend/src/components/` — Reusable UI components
- `prompts/` — MINERVA format spec and research prompt templates
- `data/` — SQLite DB and raw document storage

## Build and Run
- Backend: `cd backend && uvicorn main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev`
- Both: `./start.sh`
- Tests: `cd backend && pytest tests/ -v`
- Seed stocks: `python scripts/seed_stocks.py`

## Key Rules
- All data is local. No external API calls in the pipeline.
- The MINERVA output format (`prompts/minerva_format_spec.md`) is the contract
  between frontier model output and the dashboard.
- Parsing is deterministic Python. Ollama is fallback only.
- Never lose data — if parsing fails, store raw text and flag it.
- Dark mode only. Tailwind for styling.
- SQLite is the single source of truth.
- Dates are TEXT in ISO format. Monetary values in USD as REAL.
