# MINERVA Project Context

Local knowledge management dashboard for critical minerals stock analysis.
Backend: Python FastAPI + SQLite. Frontend: React + Tailwind.

The system has NO local analytical agents. All analysis is done by frontier
models (Claude, ChatGPT, Gemini) via manual prompting. The local system
only parses and stores the results.

Key directories:
- backend/ — Python API server
- frontend/ — React dashboard
- prompts/ — MINERVA format spec and research prompt templates
- data/ — Database and file storage
- scripts/ — Seed and export utilities

Run backend: `cd backend && uvicorn main:app --reload --port 8000`
Run frontend: `cd frontend && npm run dev`
Run tests: `cd backend && pytest tests/ -v`

Do not add external API dependencies.
All new routes go in `backend/routes/` as separate files.
Use Tailwind utility classes. No custom CSS files.
The MINERVA output format in `prompts/minerva_format_spec.md` is sacred —
do not change it without understanding the parser dependency.
