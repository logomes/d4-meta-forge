from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .config import settings
from .db import engine, init_db
from .models import Build
from .routers import builds, calc, meta


def _seed_builds() -> None:
    seed_path = Path(__file__).parent / "seed" / "builds_seed.json"
    if not seed_path.exists():
        return
    with Session(engine) as session:
        if session.exec(select(Build)).first():
            return
        for raw in json.loads(seed_path.read_text(encoding="utf-8")):
            session.add(Build(**raw))
        session.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    _seed_builds()
    yield


app = FastAPI(title="D4 Meta Forge", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(builds.router)
app.include_router(calc.router)
app.include_router(meta.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
