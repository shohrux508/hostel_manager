from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.database.models import Booking, BookingStatus
from app.schemas.booking import (
    BookingCheckIn,
    BookingCheckOut,
    BookingCreate,
    BookingRead,
    BookingUpdate,
)
from app.schemas.guest import GuestRead
from app.schemas.payment import PaymentRead
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _to_booking_read(b: Booking) -> BookingRead:
    b_read = BookingRead.model_validate(b)
    if b.guest:
        b_read.guest = GuestRead.model_validate(b.guest)
    if b.room:
        b_read.room_number = b.room.number
        b_read.room_category = (
            b.room.category.value if hasattr(b.room.category, "value") else str(b.room.category)
        )
    if b.bed:
        b_read.bed_number = b.bed.bed_number
    if b.payments:
        b_read.payments = [PaymentRead.model_validate(p) for p in b.payments]
    b_read.balance_due = max(
        Decimal("0.00"), Decimal(b.total_amount or 0) - Decimal(b.paid_amount or 0)
    )
    return b_read


@router.get("/", response_model=list[BookingRead])
async def list_bookings(
    status_filter: BookingStatus | None = Query(None, description="Фильтр по статусу"),
    date_filter: date | None = Query(None, description="Активные на дату"),
    check_in_today: bool = Query(False, description="Заезды сегодня"),
    check_out_today: bool = Query(False, description="Выезды сегодня"),
    living_now: bool = Query(False, description="Проживают сейчас"),
    unpaid_only: bool = Query(False, description="Только с долгом"),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[BookingRead]:
    bookings = await BookingService.list_bookings(
        session,
        status_filter=status_filter,
        date_filter=date_filter,
        check_in_today=check_in_today,
        check_out_today=check_out_today,
        living_now=living_now,
        unpaid_only=unpaid_only,
        limit=limit,
        offset=offset,
    )
    return [_to_booking_read(b) for b in bookings]


@router.post("/", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.create_booking(session, data)
    return _to_booking_read(booking)


@router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.get_booking(session, booking_id)
    return _to_booking_read(booking)


@router.patch("/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: int,
    data: BookingUpdate,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.update_booking(session, booking_id, data)
    return _to_booking_read(booking)


@router.post("/{booking_id}/check-in", response_model=BookingRead)
async def check_in_booking(
    booking_id: int,
    data: BookingCheckIn,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.check_in_booking(session, booking_id, data)
    return _to_booking_read(booking)


@router.post("/{booking_id}/check-out", response_model=BookingRead)
async def check_out_booking(
    booking_id: int,
    data: BookingCheckOut,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.check_out_booking(session, booking_id, data)
    return _to_booking_read(booking)


@router.post("/{booking_id}/cancel", response_model=BookingRead)
async def cancel_booking(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
) -> BookingRead:
    booking = await BookingService.cancel_booking(session, booking_id)
    return _to_booking_read(booking)
