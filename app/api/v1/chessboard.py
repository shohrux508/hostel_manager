from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.chessboard import ChessboardResponse
from app.services.chessboard_service import ChessboardService

router = APIRouter(prefix="/chessboard", tags=["chessboard"])


@router.get("/", response_model=ChessboardResponse)
async def get_chessboard(
    start_date: date = Query(default_factory=lambda: date.today() - timedelta(days=2)),
    end_date: date = Query(default_factory=lambda: date.today() + timedelta(days=14)),
    session: AsyncSession = Depends(get_session),
) -> ChessboardResponse:
    return await ChessboardService.get_chessboard(
        session=session,
        start_date=start_date,
        end_date=end_date,
    )
