# MINERVA — Critical Minerals Intelligence System

## What This Is
A local web dashboard for tracking critical minerals stocks with multi-agent
analysis, catalyst tracking, and swing-trading decision support. The system
uses a 6-phase pipeline: frontier model extraction -> automated task generation
-> local agent execution (Ollama) -> local review -> frontier final review ->
dashboard storage and display.

## Tech
- Backend: Python 3.12, FastAPI, aiosqlite, uvicorn
- Frontend: React 19 (Vite), Tailwind CSS v4
- Database: SQLite at data/minerva.db
- Local LLM: Ollama HTTP API at localhost:11434 (Qwen 3.5 9B)
- No external API keys. Frontier model interaction is manual (chat UI) or via CLI tools.

## Architecture
- backend/main.py — FastAPI entry, CORS, lifespan
- backend/database.py — Schema, connection, migrations
- backend/models.py — Pydantic models for all entities
- backend/routes/ — API endpoints grouped by domain
- backend/agents/ — 10 agent executors (8 specialist + 2 reviewer)
- backend/pipeline/ — 6-phase pipeline orchestration
- backend/parsers/ — Extraction, agent output, and frontier output parsers
- frontend/src/pages/ — 7 page components
- frontend/src/components/ — 12+ reusable components
- prompts/ — All prompt templates and agent system prompts
- data/ — SQLite DB, extraction files, task files, outputs

## Build and Run
- Backend: cd backend && uvicorn main:app --reload --port 8000
- Frontend: cd frontend && npm run dev
- Both: ./start.sh
- Tests: cd backend && pytest tests/ -v
- Run agents: python scripts/run_agents.py --run [RUN_ID]
- Seed stocks: python scripts/seed_stocks.py

## Key Rules
- All data is local. No external API calls except Ollama at localhost:11434.
- Every agent is a system prompt + task file -> Ollama call -> parsed output.
- Agents process ONE stock per run, sequentially (not parallel).
- Dark mode default. Tailwind for styling. No heavy component libraries.
- SQLite is the single source of truth. File storage is supplementary.
- All prices, shares, and financial figures use REAL (float) in SQLite.
- Dates are TEXT in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).
- Use USD for all monetary values unless explicitly noted otherwise.
