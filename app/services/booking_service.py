from __future__ import annotations

import secrets
from collections.abc import Sequence
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import (
    Bed,
    Booking,
    BookingStatus,
    Guest,
    Payment,
    PaymentStatus,
    PaymentType,
    Room,
)
from app.schemas.booking import (
    BookingCheckIn,
    BookingCheckOut,
    BookingCreate,
    BookingUpdate,
)


class BookingService:
    @staticmethod
    def _generate_booking_number() -> str:
        code = secrets.token_hex(3).upper()
        return f"HST-{code}"

    @staticmethod
    async def list_bookings(
        session: AsyncSession,
        status_filter: BookingStatus | None = None,
        date_filter: date | None = None,
        check_in_today: bool = False,
        check_out_today: bool = False,
        living_now: bool = False,
        unpaid_only: bool = False,
        limit: int = 200,
        offset: int = 0,
    ) -> Sequence[Booking]:
        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.guest),
                selectinload(Booking.room),
                selectinload(Booking.bed),
                selectinload(Booking.payments),
            )
            .order_by(Booking.check_in_date.desc(), Booking.id.desc())
        )

        today = date.today()

        if status_filter:
            stmt = stmt.where(Booking.status == status_filter)
        if date_filter:
            stmt = stmt.where(
                and_(
                    Booking.check_in_date <= date_filter,
                    Booking.check_out_date >= date_filter,
                )
            )
        if check_in_today:
            stmt = stmt.where(
                and_(
                    Booking.check_in_date == today,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                )
            )
        if check_out_today:
            stmt = stmt.where(
                and_(
                    Booking.check_out_date == today,
                    Booking.status.in_([BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT]),
                )
            )
        if living_now:
            stmt = stmt.where(Booking.status == BookingStatus.CHECKED_IN)
        if unpaid_only:
            stmt = stmt.where(
                and_(
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                    Booking.paid_amount < Booking.total_amount,
                )
            )

        stmt = stmt.limit(limit).offset(offset)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_booking(session: AsyncSession, booking_id: int) -> Booking:
        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.guest),
                selectinload(Booking.room),
                selectinload(Booking.bed),
                selectinload(Booking.payments),
            )
            .where(Booking.id == booking_id)
        )
        result = await session.execute(stmt)
        booking = result.scalar_one_or_none()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Бронирование не найдено"
            )
        return booking

    @staticmethod
    async def check_availability(
        session: AsyncSession,
        room_id: int,
        bed_id: int | None,
        check_in_date: date,
        check_out_date: date,
        exclude_booking_id: int | None = None,
    ) -> bool:
        if check_out_date <= check_in_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата выезда должна быть позже даты заезда",
            )

        # Overlapping condition
        overlap_condition = and_(
            Booking.check_in_date < check_out_date,
            Booking.check_out_date > check_in_date,
            Booking.status != BookingStatus.CANCELLED,
        )

        if bed_id is not None:
            # Bed is booked specifically
            stmt = select(Booking).where(
                overlap_condition,
                Booking.bed_id == bed_id,
            )
        else:
            # Whole room booking check
            stmt = select(Booking).where(
                overlap_condition,
                Booking.room_id == room_id,
            )

        if exclude_booking_id:
            stmt = stmt.where(Booking.id != exclude_booking_id)

        result = await session.execute(stmt)
        conflict = result.scalar_one_or_none()
        return conflict is None

    @staticmethod
    async def create_booking(session: AsyncSession, data: BookingCreate) -> Booking:
        # Validate dates
        if data.check_out_date <= data.check_in_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата выезда должна быть позже даты заезда",
            )

        # Get or create Guest
        guest_id = data.guest_id
        if not guest_id:
            if not data.new_guest:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Необходимо указать существующего гостя или заполнить данные нового",
                )
            new_g = Guest(
                first_name=data.new_guest.first_name.strip(),
                last_name=data.new_guest.last_name.strip(),
                middle_name=data.new_guest.middle_name.strip()
                if data.new_guest.middle_name
                else None,
                phone=data.new_guest.phone.strip(),
                email=data.new_guest.email.strip() if data.new_guest.email else None,
                passport_number=data.new_guest.passport_number.strip()
                if data.new_guest.passport_number
                else None,
                citizenship=data.new_guest.citizenship,
                birth_date=data.new_guest.birth_date,
                notes=data.new_guest.notes,
            )
            session.add(new_g)
            await session.flush()
            guest_id = new_g.id

        # Check room and bed
        res_r = await session.execute(select(Room).where(Room.id == data.room_id))
        room = res_r.scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")

        bed = None
        if data.bed_id:
            res_b = await session.execute(
                select(Bed).where(Bed.id == data.bed_id, Bed.room_id == data.room_id)
            )
            bed = res_b.scalar_one_or_none()
            if not bed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Спальное место не найдено в этой комнате",
                )

        # Check availability
        is_available = await BookingService.check_availability(
            session=session,
            room_id=data.room_id,
            bed_id=data.bed_id,
            check_in_date=data.check_in_date,
            check_out_date=data.check_out_date,
        )
        if not is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Выбранное место/комната уже заняты на эти даты",
            )

        # Calculate nights and total amount
        nights = (data.check_out_date - data.check_in_date).days
        if data.custom_total_amount is not None:
            total_amount = Decimal(data.custom_total_amount)
        else:
            base_rate = Decimal(room.base_price_per_night)
            modifier = Decimal(bed.price_modifier) if bed else Decimal("0.00")
            per_night = max(Decimal("100.00"), base_rate + modifier)
            total_amount = per_night * nights

        booking_number = BookingService._generate_booking_number()

        booking = Booking(
            booking_number=booking_number,
            guest_id=guest_id,
            room_id=data.room_id,
            bed_id=data.bed_id,
            check_in_date=data.check_in_date,
            check_out_date=data.check_out_date,
            status=data.status,
            source=data.source,
            total_amount=total_amount,
            paid_amount=Decimal("0.00"),
            deposit_amount=Decimal(data.deposit_amount or 0),
            special_requests=data.special_requests,
        )
        session.add(booking)
        await session.flush()

        # Handle initial payment if provided
        if data.initial_payment and data.initial_payment > 0:
            ptype = PaymentType.CASH
            if data.initial_payment_type == "card":
                ptype = PaymentType.CARD
            elif data.initial_payment_type == "transfer":
                ptype = PaymentType.TRANSFER

            payment = Payment(
                booking_id=booking.id,
                guest_id=guest_id,
                amount=Decimal(data.initial_payment),
                payment_type=ptype,
                payment_status=PaymentStatus.COMPLETED,
                notes="Предоплата при создании бронирования",
            )
            session.add(payment)
            booking.paid_amount = Decimal(data.initial_payment)

        # Handle initial deposit payment if provided
        if data.deposit_amount and data.deposit_amount > 0:
            dep_payment = Payment(
                booking_id=booking.id,
                guest_id=guest_id,
                amount=Decimal(data.deposit_amount),
                payment_type=PaymentType.DEPOSIT,
                payment_status=PaymentStatus.COMPLETED,
                notes="Залоговый депозит при создании бронирования",
            )
            session.add(dep_payment)

        await session.commit()
        return await BookingService.get_booking(session, booking.id)

    @staticmethod
    async def update_booking(
        session: AsyncSession, booking_id: int, data: BookingUpdate
    ) -> Booking:
        booking = await BookingService.get_booking(session, booking_id)

        room_id = data.room_id or booking.room_id
        bed_id = data.bed_id if data.bed_id is not None else booking.bed_id
        check_in_date = data.check_in_date or booking.check_in_date
        check_out_date = data.check_out_date or booking.check_out_date

        # If dates or room/bed changed, check availability
        if (
            room_id != booking.room_id
            or bed_id != booking.bed_id
            or check_in_date != booking.check_in_date
            or check_out_date != booking.check_out_date
        ):
            is_available = await BookingService.check_availability(
                session=session,
                room_id=room_id,
                bed_id=bed_id,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                exclude_booking_id=booking.id,
            )
            if not is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Выбранное место/комната заняты на указанные даты",
                )

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(booking, key, value)

        await session.commit()
        return await BookingService.get_booking(session, booking.id)

    @staticmethod
    async def check_in_booking(
        session: AsyncSession, booking_id: int, data: BookingCheckIn
    ) -> Booking:
        booking = await BookingService.get_booking(session, booking_id)
        if booking.status == BookingStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя заселить отмененную бронь"
            )

        booking.status = BookingStatus.CHECKED_IN
        booking.actual_check_in_at = data.actual_check_in_at or datetime.now(UTC)

        # Process payment on check-in
        if data.payment_amount and data.payment_amount > 0:
            ptype = (
                PaymentType.CARD
                if data.payment_type == "card"
                else (
                    PaymentType.TRANSFER if data.payment_type == "transfer" else PaymentType.CASH
                )
            )
            payment = Payment(
                booking_id=booking.id,
                guest_id=booking.guest_id,
                amount=Decimal(data.payment_amount),
                payment_type=ptype,
                payment_status=PaymentStatus.COMPLETED,
                notes="Оплата при заселении",
            )
            session.add(payment)
            booking.paid_amount = Decimal(booking.paid_amount or 0) + Decimal(data.payment_amount)

        # Process deposit on check-in
        if data.deposit_amount and data.deposit_amount > 0:
            dep_payment = Payment(
                booking_id=booking.id,
                guest_id=booking.guest_id,
                amount=Decimal(data.deposit_amount),
                payment_type=PaymentType.DEPOSIT,
                payment_status=PaymentStatus.COMPLETED,
                notes="Залоговый депозит при заселении",
            )
            session.add(dep_payment)
            booking.deposit_amount = Decimal(booking.deposit_amount or 0) + Decimal(
                data.deposit_amount
            )

        await session.commit()
        return await BookingService.get_booking(session, booking.id)

    @staticmethod
    async def check_out_booking(
        session: AsyncSession, booking_id: int, data: BookingCheckOut
    ) -> Booking:
        booking = await BookingService.get_booking(session, booking_id)
        booking.status = BookingStatus.CHECKED_OUT
        booking.actual_check_out_at = data.actual_check_out_at or datetime.now(UTC)

        # Refund deposit if requested
        if data.deposit_refund_amount and data.deposit_refund_amount > 0:
            refund = Payment(
                booking_id=booking.id,
                guest_id=booking.guest_id,
                amount=Decimal(data.deposit_refund_amount),
                payment_type=PaymentType.DEPOSIT,
                payment_status=PaymentStatus.REFUNDED,
                notes="Возврат залога при выезде",
            )
            session.add(refund)
            booking.deposit_amount = max(
                Decimal("0.00"),
                Decimal(booking.deposit_amount or 0) - Decimal(data.deposit_refund_amount),
            )

        await session.commit()
        return await BookingService.get_booking(session, booking.id)

    @staticmethod
    async def cancel_booking(session: AsyncSession, booking_id: int) -> Booking:
        booking = await BookingService.get_booking(session, booking_id)
        booking.status = BookingStatus.CANCELLED
        await session.commit()
        return await BookingService.get_booking(session, booking.id)
