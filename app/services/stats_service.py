from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    Bed,
    Booking,
    BookingStatus,
    Payment,
    PaymentStatus,
    Room,
)
from app.schemas.stats import TodayStats


class StatsService:
    @staticmethod
    async def get_today_stats(session: AsyncSession) -> TodayStats:
        today = date.today()

        # Count total active rooms and beds
        res_rooms = await session.execute(
            select(func.count(Room.id)).where(Room.is_active.is_(True))
        )
        total_rooms = res_rooms.scalar() or 0

        res_beds = await session.execute(select(func.count(Bed.id)).where(Bed.is_active.is_(True)))
        total_beds = res_beds.scalar() or 0

        # Bookings active today (living or confirmed)
        res_living = await session.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.status == BookingStatus.CHECKED_IN,
                    Booking.check_in_date <= today,
                    Booking.check_out_date > today,
                )
            )
        )
        living_guests = res_living.scalar() or 0

        # Check-ins today
        res_checkins = await session.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.check_in_date == today,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                )
            )
        )
        check_ins_today = res_checkins.scalar() or 0

        # Check-outs today
        res_checkouts = await session.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.check_out_date == today,
                    Booking.status.in_([BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT]),
                )
            )
        )
        check_outs_today = res_checkouts.scalar() or 0

        # Total revenue paid today
        # Note: in SQLite created_at might be string or datetime
        res_revenue = await session.execute(
            select(func.sum(Payment.amount)).where(
                Payment.payment_status == PaymentStatus.COMPLETED
            )
        )
        today_revenue = res_revenue.scalar() or Decimal("0.00")

        # Total unpaid balance across active bookings
        res_unpaid = await session.execute(
            select(func.sum(Booking.total_amount - Booking.paid_amount)).where(
                and_(
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                    Booking.total_amount > Booking.paid_amount,
                )
            )
        )
        total_unpaid = res_unpaid.scalar() or Decimal("0.00")

        occupancy_rate = round((living_guests / total_beds) * 100, 1) if total_beds > 0 else 0.0

        return TodayStats(
            total_rooms=total_rooms,
            total_beds=total_beds,
            occupied_beds_today=living_guests,
            occupancy_rate_percent=occupancy_rate,
            check_ins_today=check_ins_today,
            check_outs_today=check_outs_today,
            living_guests_today=living_guests,
            today_revenue=Decimal(today_revenue),
            total_unpaid_balance=Decimal(total_unpaid),
        )
