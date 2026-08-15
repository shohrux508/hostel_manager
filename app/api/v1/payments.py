from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.database.models import Payment
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


def _to_payment_read(p: Payment) -> PaymentRead:
    p_read = PaymentRead.model_validate(p)
    if p.guest:
        p_read.guest_name = f"{p.guest.last_name} {p.guest.first_name}"
    if p.booking:
        p_read.booking_number = p.booking.booking_number
    return p_read


@router.get("/", response_model=list[PaymentRead])
async def list_payments(
    booking_id: int | None = Query(None),
    guest_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> list[PaymentRead]:
    payments = await PaymentService.list_payments(
        session, booking_id=booking_id, guest_id=guest_id, limit=limit, offset=offset
    )
    return [_to_payment_read(p) for p in payments]


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: PaymentCreate,
    session: AsyncSession = Depends(get_session),
) -> PaymentRead:
    payment = await PaymentService.create_payment(session, data)
    return _to_payment_read(payment)


@router.post("/{payment_id}/refund", response_model=PaymentRead)
async def refund_payment(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
) -> PaymentRead:
    payment = await PaymentService.refund_payment(session, payment_id)
    return _to_payment_read(payment)
