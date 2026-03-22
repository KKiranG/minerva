# MINERVA

MINERVA is a local-first intelligence and trading decision system for critical
minerals equities. It combines manual frontier-model research extraction with a
deterministic local pipeline: extraction ingest, task generation, sequential
Ollama agent execution, local review, manual frontier review ingest, and a dark
dashboard for traceable decisions.

## Stack
- Backend: FastAPI, aiosqlite, SQLite
- Frontend: React + Vite
- Local model: Ollama (`qwen3.5:latest` by default)

## Project Layout
- `backend/` API, schema, parsers, pipeline, tests
- `frontend/` dashboard pages and components
- `prompts/` extraction and agent prompt templates
- `data/` SQLite database, task files, raw outputs
- `scripts/` seed, pipeline, and export utilities

## Local Commands
- `cd backend && uvicorn main:app --reload --port 8000`
- `cd frontend && npm run dev`
- `python scripts/seed_stocks.py`
- `python scripts/run_agents.py --ticker MP --generate-tasks --execute`

## Notes
- The repo is intentionally greenfield and local-development focused.
- Ollama execution is sequential and one stock per run by design.
- Frontier review is manual copy/paste ingest in v1.
