# MINERVA Project Context

This is a local intelligence system for critical minerals stock analysis.
Backend: Python FastAPI + SQLite. Frontend: React + Tailwind. Local LLM: Ollama.

Key directories:
- backend/ — Python API server
- frontend/ — React dashboard
- prompts/ — Agent system prompts and prompt templates
- data/ — Database and file storage
- scripts/ — CLI utilities

Run backend: cd backend && uvicorn main:app --reload --port 8000
Run frontend: cd frontend && npm run dev
Run tests: cd backend && pytest tests/ -v

Do not modify prompts/agent_systems/ without explicit instruction.
Do not add external API dependencies.
All new routes go in backend/routes/ as separate files.
All new components go in frontend/src/components/.
Use Tailwind utility classes only. No CSS files.
