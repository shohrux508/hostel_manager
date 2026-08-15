from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.database.models import BedTier, RoomCategory


class BedBase(BaseModel):
    bed_number: str = Field(..., description="Bed identifier, e.g., '1-A' or 'Top 2'")
    tier: BedTier = BedTier.SINGLE
    price_modifier: Decimal = Decimal("0.00")
    is_active: bool = True


class BedCreate(BedBase):
    pass


class BedUpdate(BaseModel):
    bed_number: str | None = None
    tier: BedTier | None = None
    price_modifier: Decimal | None = None
    is_active: bool | None = None


class BedRead(BedBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RoomBase(BaseModel):
    number: str = Field(..., description="Room number / name, e.g., '101' or 'Dorm A'")
    floor: int = 1
    category: RoomCategory = RoomCategory.DORM_MIXED
    capacity: int = Field(default=1, ge=1)
    base_price_per_night: Decimal = Decimal("1000.00")
    description: str | None = None
    is_active: bool = True


class RoomCreate(RoomBase):
    auto_create_beds: bool = Field(
        default=True,
        description="Automatically generate beds according to capacity and category",
    )
    bunk_beds: bool = Field(
        default=True,
        description="If true, generates pairs of top/bottom beds for dorm rooms",
    )


class RoomUpdate(BaseModel):
    number: str | None = None
    floor: int | None = None
    category: RoomCategory | None = None
    capacity: int | None = None
    base_price_per_night: Decimal | None = None
    description: str | None = None
    is_active: bool | None = None


class RoomRead(RoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    beds: list[BedRead] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
