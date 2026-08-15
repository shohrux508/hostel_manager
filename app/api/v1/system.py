from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.database.seed import seed_demo_data

router = APIRouter(prefix="/system", tags=["System"])


@router.post("/reset-hostel-data")
async def reset_hostel_data(
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    """Reset and initialize the database to the 10-room (4 beds each = 40 beds) hostel setup."""
    await seed_demo_data(session, force=True)
    return {
        "status": "success",
        "message": "Номерной фонд хостела сброшен на 10 комнат по 4 спальных места",
    }
