from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.database.models import BookingSource, BookingStatus
from app.schemas.guest import GuestCreate, GuestRead
from app.schemas.payment import PaymentRead


class BookingBase(BaseModel):
    guest_id: int
    room_id: int
    bed_id: int | None = None
    check_in_date: date
    check_out_date: date
    status: BookingStatus = BookingStatus.CONFIRMED
    source: BookingSource = BookingSource.WALK_IN
    total_amount: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    deposit_amount: Decimal = Decimal("0.00")
    special_requests: str | None = None


class BookingCreate(BaseModel):
    guest_id: int | None = None
    new_guest: GuestCreate | None = None
    room_id: int
    bed_id: int | None = None
    check_in_date: date
    check_out_date: date
    status: BookingStatus = BookingStatus.CONFIRMED
    source: BookingSource = BookingSource.WALK_IN
    custom_total_amount: Decimal | None = None
    initial_payment: Decimal | None = None
    initial_payment_type: str | None = "cash"
    deposit_amount: Decimal | None = None
    special_requests: str | None = None


class BookingUpdate(BaseModel):
    room_id: int | None = None
    bed_id: int | None = None
    check_in_date: date | None = None
    check_out_date: date | None = None
    status: BookingStatus | None = None
    source: BookingSource | None = None
    total_amount: Decimal | None = None
    deposit_amount: Decimal | None = None
    special_requests: str | None = None


class BookingCheckIn(BaseModel):
    actual_check_in_at: datetime | None = None
    payment_amount: Decimal | None = None
    payment_type: str | None = "cash"
    deposit_amount: Decimal | None = None


class BookingCheckOut(BaseModel):
    actual_check_out_at: datetime | None = None
    deposit_refund_amount: Decimal | None = None


class BookingRead(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_number: str
    actual_check_in_at: datetime | None = None
    actual_check_out_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Nested relations
    guest: GuestRead | None = None
    room_number: str | None = None
    room_category: str | None = None
    bed_number: str | None = None
    payments: list[PaymentRead] = Field(default_factory=list)
    balance_due: Decimal = Decimal("0.00")
