from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.guest import GuestCreate, GuestRead, GuestSummary, GuestUpdate
from app.services.guest_service import GuestService

router = APIRouter(prefix="/guests", tags=["guests"])


@router.get("/", response_model=list[GuestSummary])
async def list_guests(
    search: str | None = Query(None, description="Поиск по ФИО, телефону или паспорту"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[GuestSummary]:
    guests = await GuestService.list_guests(session, search=search, limit=limit, offset=offset)
    result: list[GuestSummary] = []
    for g in guests:
        summary = GuestSummary.model_validate(g)
        summary.total_bookings = len(g.bookings) if g.bookings else 0
        summary.total_spent = (
            sum(float(p.amount) for p in g.payments if p.payment_status.value == "completed")
            if g.payments
            else 0.0
        )
        result.append(summary)
    return result


@router.post("/", response_model=GuestRead, status_code=status.HTTP_201_CREATED)
async def create_guest(
    data: GuestCreate,
    session: AsyncSession = Depends(get_session),
) -> GuestRead:
    guest = await GuestService.create_guest(session, data)
    return GuestRead.model_validate(guest)


@router.get("/{guest_id}", response_model=GuestRead)
async def get_guest(
    guest_id: int,
    session: AsyncSession = Depends(get_session),
) -> GuestRead:
    guest = await GuestService.get_guest(session, guest_id)
    return GuestRead.model_validate(guest)


@router.patch("/{guest_id}", response_model=GuestRead)
async def update_guest(
    guest_id: int,
    data: GuestUpdate,
    session: AsyncSession = Depends(get_session),
) -> GuestRead:
    guest = await GuestService.update_guest(session, guest_id, data)
    return GuestRead.model_validate(guest)


@router.delete("/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guest(
    guest_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    await GuestService.delete_guest(session, guest_id)
