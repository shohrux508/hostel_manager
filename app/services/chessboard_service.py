from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Booking, BookingStatus, Room
from app.schemas.chessboard import (
    ChessboardBed,
    ChessboardBookingSegment,
    ChessboardResponse,
    ChessboardRoom,
)


class ChessboardService:
    @staticmethod
    async def get_chessboard(
        session: AsyncSession, start_date: date, end_date: date
    ) -> ChessboardResponse:
        # Load all active rooms with beds
        stmt_rooms = (
            select(Room)
            .options(selectinload(Room.beds))
            .where(Room.is_active.is_(True))
            .order_by(Room.floor, Room.number)
        )
        res_rooms = await session.execute(stmt_rooms)
        rooms_db = res_rooms.scalars().all()

        # Load all active bookings overlapping with [start_date, end_date]
        stmt_bookings = (
            select(Booking)
            .options(selectinload(Booking.guest))
            .where(
                and_(
                    Booking.check_in_date < end_date,
                    Booking.check_out_date > start_date,
                    Booking.status != BookingStatus.CANCELLED,
                )
            )
        )
        res_bookings = await session.execute(stmt_bookings)
        bookings_db = res_bookings.scalars().all()

        # Group bookings by bed_id and room_id
        bed_bookings_map: dict[int, list[ChessboardBookingSegment]] = {}
        room_bookings_map: dict[int, list[ChessboardBookingSegment]] = {}

        for b in bookings_db:
            guest_name = f"{b.guest.last_name} {b.guest.first_name}" if b.guest else "Гость"
            guest_phone = b.guest.phone if b.guest else ""
            balance_due = max(
                Decimal("0.00"), Decimal(b.total_amount or 0) - Decimal(b.paid_amount or 0)
            )

            segment = ChessboardBookingSegment(
                id=b.id,
                booking_number=b.booking_number,
                guest_id=b.guest_id,
                guest_name=guest_name,
                guest_phone=guest_phone,
                room_id=b.room_id,
                bed_id=b.bed_id,
                check_in_date=b.check_in_date,
                check_out_date=b.check_out_date,
                status=b.status,
                total_amount=b.total_amount,
                paid_amount=b.paid_amount,
                deposit_amount=b.deposit_amount,
                balance_due=balance_due,
            )

            if b.bed_id:
                bed_bookings_map.setdefault(b.bed_id, []).append(segment)
            else:
                room_bookings_map.setdefault(b.room_id, []).append(segment)

        total_beds = 0
        chessboard_rooms: list[ChessboardRoom] = []

        for r in rooms_db:
            beds_list: list[ChessboardBed] = []
            for bed in r.beds:
                if bed.is_active:
                    total_beds += 1
                    beds_list.append(
                        ChessboardBed(
                            id=bed.id,
                            room_id=r.id,
                            bed_number=bed.bed_number,
                            tier=bed.tier,
                            price_modifier=bed.price_modifier,
                            is_active=bed.is_active,
                            bookings=bed_bookings_map.get(bed.id, []),
                        )
                    )

            chessboard_rooms.append(
                ChessboardRoom(
                    id=r.id,
                    number=r.number,
                    floor=r.floor,
                    category=r.category,
                    capacity=r.capacity,
                    base_price_per_night=r.base_price_per_night,
                    is_active=r.is_active,
                    beds=beds_list,
                    room_bookings=room_bookings_map.get(r.id, []),
                )
            )

        return ChessboardResponse(
            start_date=start_date,
            end_date=end_date,
            total_rooms=len(rooms_db),
            total_beds=total_beds,
            rooms=chessboard_rooms,
        )
