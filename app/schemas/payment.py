from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.database.models import PaymentStatus, PaymentType


class PaymentBase(BaseModel):
    booking_id: int
    guest_id: int
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Payment amount")
    payment_type: PaymentType = PaymentType.CASH
    payment_status: PaymentStatus = PaymentStatus.COMPLETED
    notes: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    guest_name: str | None = None
    booking_number: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
