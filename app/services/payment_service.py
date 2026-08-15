from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Booking, Payment, PaymentStatus, PaymentType
from app.schemas.payment import PaymentCreate


class PaymentService:
    @staticmethod
    async def list_payments(
        session: AsyncSession,
        booking_id: int | None = None,
        guest_id: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Payment]:
        stmt = (
            select(Payment)
            .options(selectinload(Payment.guest), selectinload(Payment.booking))
            .order_by(Payment.created_at.desc())
        )
        if booking_id:
            stmt = stmt.where(Payment.booking_id == booking_id)
        if guest_id:
            stmt = stmt.where(Payment.guest_id == guest_id)
        stmt = stmt.limit(limit).offset(offset)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create_payment(session: AsyncSession, data: PaymentCreate) -> Payment:
        # Check booking
        stmt_b = select(Booking).where(Booking.id == data.booking_id)
        res_b = await session.execute(stmt_b)
        booking = res_b.scalar_one_or_none()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Бронирование не найдено"
            )

        payment = Payment(
            booking_id=data.booking_id,
            guest_id=data.guest_id,
            amount=data.amount,
            payment_type=data.payment_type,
            payment_status=data.payment_status,
            notes=data.notes,
        )
        session.add(payment)

        # Update booking paid_amount / deposit_amount
        if data.payment_status == PaymentStatus.COMPLETED:
            if data.payment_type == PaymentType.DEPOSIT:
                booking.deposit_amount = Decimal(booking.deposit_amount or 0) + Decimal(
                    data.amount
                )
            else:
                booking.paid_amount = Decimal(booking.paid_amount or 0) + Decimal(data.amount)

        await session.commit()
        await session.refresh(payment)
        return payment

    @staticmethod
    async def refund_payment(session: AsyncSession, payment_id: int) -> Payment:
        stmt = (
            select(Payment).options(selectinload(Payment.booking)).where(Payment.id == payment_id)
        )
        res = await session.execute(stmt)
        payment = res.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Платеж не найден")

        if payment.payment_status == PaymentStatus.REFUNDED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Платеж уже возвращен"
            )

        payment.payment_status = PaymentStatus.REFUNDED
        if payment.booking:
            if payment.payment_type == PaymentType.DEPOSIT:
                payment.booking.deposit_amount = max(
                    Decimal("0.00"),
                    Decimal(payment.booking.deposit_amount or 0) - Decimal(payment.amount),
                )
            else:
                payment.booking.paid_amount = max(
                    Decimal("0.00"),
                    Decimal(payment.booking.paid_amount or 0) - Decimal(payment.amount),
                )

        await session.commit()
        await session.refresh(payment)
        return payment
