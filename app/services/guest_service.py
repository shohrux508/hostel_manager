from __future__ import annotations

from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Guest
from app.schemas.guest import GuestCreate, GuestUpdate


class GuestService:
    @staticmethod
    async def list_guests(
        session: AsyncSession,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Guest]:
        stmt = select(Guest).order_by(Guest.last_name, Guest.first_name)
        if search:
            q = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Guest.last_name.ilike(q),
                    Guest.first_name.ilike(q),
                    Guest.phone.ilike(q),
                    Guest.passport_number.ilike(q),
                    Guest.email.ilike(q),
                )
            )
        stmt = stmt.limit(limit).offset(offset)
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_guest(session: AsyncSession, guest_id: int) -> Guest:
        stmt = (
            select(Guest)
            .options(selectinload(Guest.bookings), selectinload(Guest.payments))
            .where(Guest.id == guest_id)
        )
        result = await session.execute(stmt)
        guest = result.scalar_one_or_none()
        if not guest:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Гость не найден")
        return guest

    @staticmethod
    async def create_guest(session: AsyncSession, data: GuestCreate) -> Guest:
        guest = Guest(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            middle_name=data.middle_name.strip() if data.middle_name else None,
            phone=data.phone.strip(),
            email=data.email.strip() if data.email else None,
            passport_number=data.passport_number.strip() if data.passport_number else None,
            citizenship=data.citizenship,
            birth_date=data.birth_date,
            notes=data.notes,
        )
        session.add(guest)
        await session.commit()
        await session.refresh(guest)
        return guest

    @staticmethod
    async def update_guest(session: AsyncSession, guest_id: int, data: GuestUpdate) -> Guest:
        guest = await GuestService.get_guest(session, guest_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(guest, key, value)
        await session.commit()
        await session.refresh(guest)
        return guest

    @staticmethod
    async def delete_guest(session: AsyncSession, guest_id: int) -> None:
        guest = await GuestService.get_guest(session, guest_id)
        await session.delete(guest)
        await session.commit()
