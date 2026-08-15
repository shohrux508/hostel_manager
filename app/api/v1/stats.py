from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.stats import TodayStats
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/today", response_model=TodayStats)
async def get_today_stats(
    session: AsyncSession = Depends(get_session),
) -> TodayStats:
    return await StatsService.get_today_stats(session)
