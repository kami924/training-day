from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.api.health import router as health_router
from app.db.session import SessionLocal, create_db_and_tables
from app.models.seed import seed_exercises


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()
    with SessionLocal() as session:
        seed_exercises(session)
    yield


app = FastAPI(title="Minimal Fitness API", version="0.1.0", lifespan=lifespan)


app.include_router(health_router, prefix="/health", tags=["health"])
