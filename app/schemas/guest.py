from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class GuestBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    phone: str = Field(..., min_length=5, max_length=50)
    email: str | None = None
    passport_number: str | None = Field(default=None, max_length=100)
    citizenship: str | None = Field(default="Россия", max_length=100)
    birth_date: date | None = None
    notes: str | None = None


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    phone: str | None = None
    email: str | None = None
    passport_number: str | None = None
    citizenship: str | None = None
    birth_date: date | None = None
    notes: str | None = None


class GuestRead(GuestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GuestSummary(GuestRead):
    total_bookings: int = 0
    total_spent: float = 0.0
