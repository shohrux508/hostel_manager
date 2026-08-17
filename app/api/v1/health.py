from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", include_in_schema=True)
@router.get("/", include_in_schema=False)
async def health_check() -> dict[str, str]:
    """Return application health status."""
    return {"status": "ok"}
