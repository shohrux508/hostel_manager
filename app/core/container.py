from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.api.v1 import bookings, chessboard, guests, health, payments, rooms, stats
from app.core.config import settings
from app.database.engine import build_engine, build_session_factory
from app.database.models import Base
from app.database.seed import seed_demo_data
from app.logger import setup_logging


class AppContainer:
    """Manages the lifecycle of application-level resources."""

    __slots__ = ("engine", "session_factory", "http_client")

    engine: AsyncEngine
    session_factory: async_sessionmaker[AsyncSession]
    http_client: httpx.AsyncClient

    async def start(self) -> None:
        """Initialize all resources."""
        self.engine = build_engine(settings.database_url)
        self.session_factory = build_session_factory(self.engine)
        self.http_client = httpx.AsyncClient(timeout=30.0)

        # Create tables automatically
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed sample data for dev/demo
        async with self.session_factory() as session:
            await seed_demo_data(session)

    async def stop(self) -> None:
        """Gracefully shut down all resources."""
        await self.http_client.aclose()
        await self.engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown."""
    setup_logging()
    container = AppContainer()
    await container.start()
    app.state.container = container
    yield
    await container.stop()


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="Hostel Manager API",
        description="Property Management System (PMS) for Hostels and Guesthouses",
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API v1 routers
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(rooms.router, prefix="/api/v1")
    app.include_router(guests.router, prefix="/api/v1")
    app.include_router(bookings.router, prefix="/api/v1")
    app.include_router(payments.router, prefix="/api/v1")
    app.include_router(chessboard.router, prefix="/api/v1")
    app.include_router(stats.router, prefix="/api/v1")

    return app
