from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.database.models import BedTier, BookingStatus, RoomCategory


class ChessboardBookingSegment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_number: str
    guest_id: int
    guest_name: str
    guest_phone: str
    room_id: int
    bed_id: int | None = None
    check_in_date: date
    check_out_date: date
    status: BookingStatus
    total_amount: Decimal
    paid_amount: Decimal
    deposit_amount: Decimal
    balance_due: Decimal


class ChessboardBed(BaseModel):
    id: int
    room_id: int
    bed_number: str
    tier: BedTier
    price_modifier: Decimal
    is_active: bool
    bookings: list[ChessboardBookingSegment] = []


class ChessboardRoom(BaseModel):
    id: int
    number: str
    floor: int
    category: RoomCategory
    capacity: int
    base_price_per_night: Decimal
    is_active: bool
    beds: list[ChessboardBed] = []
    # If room is booked entirely without specific bed
    room_bookings: list[ChessboardBookingSegment] = []


class ChessboardResponse(BaseModel):
    start_date: date
    end_date: date
    total_rooms: int
    total_beds: int
    rooms: list[ChessboardRoom]
