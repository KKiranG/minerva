from __future__ import annotations

from contextlib import asynccontextmanager
import os
from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from backend.config import settings
    from backend.database import init_db
    from backend.routes import analysis, catalysts, dashboard, events, extractions, health, journal, prices, prompts, reports, research, search, stocks
else:
    from .config import settings
    from .database import init_db
    from .routes import analysis, catalysts, dashboard, events, extractions, health, journal, prices, prompts, reports, research, search, stocks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, version=os.getenv("MINERVA_VERSION", "3.0.0"), lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(catalysts.router)
app.include_router(events.router)
app.include_router(prices.router)
app.include_router(research.router)
app.include_router(journal.router)
app.include_router(extractions.router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(prompts.router)
app.include_router(search.router)
app.include_router(dashboard.router)
app.include_router(health.router)
