from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Bed, BedTier, Room, RoomCategory
from app.schemas.room import BedCreate, BedUpdate, RoomCreate, RoomUpdate


class RoomService:
    @staticmethod
    async def list_rooms(session: AsyncSession, active_only: bool = False) -> Sequence[Room]:
        stmt = select(Room).options(selectinload(Room.beds)).order_by(Room.floor, Room.number)
        if active_only:
            stmt = stmt.where(Room.is_active.is_(True))
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_room(session: AsyncSession, room_id: int) -> Room:
        stmt = select(Room).options(selectinload(Room.beds)).where(Room.id == room_id)
        result = await session.execute(stmt)
        room = result.scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")
        return room

    @staticmethod
    async def create_room(session: AsyncSession, data: RoomCreate) -> Room:
        # Check unique room number
        existing = await session.execute(select(Room).where(Room.number == data.number))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Комната с номером '{data.number}' уже существует",
            )

        room = Room(
            number=data.number,
            floor=data.floor,
            category=data.category,
            capacity=data.capacity,
            base_price_per_night=data.base_price_per_night,
            description=data.description,
            is_active=data.is_active,
        )
        session.add(room)
        await session.flush()

        # Auto create beds if requested
        if data.auto_create_beds:
            if data.category in (
                RoomCategory.DORM_MALE,
                RoomCategory.DORM_FEMALE,
                RoomCategory.DORM_MIXED,
            ):
                if data.bunk_beds:
                    # Create pairs of bottom/top beds (1Н, 1В, 2Н, 2В...)
                    pairs = (data.capacity + 1) // 2
                    created_count = 0
                    for p in range(1, pairs + 1):
                        if created_count < data.capacity:
                            bed_bottom = Bed(
                                room_id=room.id,
                                bed_number=f"{p}Н (Нижнее)",
                                tier=BedTier.BOTTOM,
                                price_modifier=Decimal("0.00"),
                                is_active=True,
                            )
                            session.add(bed_bottom)
                            created_count += 1
                        if created_count < data.capacity:
                            bed_top = Bed(
                                room_id=room.id,
                                bed_number=f"{p}В (Верхнее)",
                                tier=BedTier.TOP,
                                price_modifier=Decimal("-100.00"),  # slight discount for top bunk
                                is_active=True,
                            )
                            session.add(bed_top)
                            created_count += 1
                else:
                    for i in range(1, data.capacity + 1):
                        bed = Bed(
                            room_id=room.id,
                            bed_number=f"Место {i}",
                            tier=BedTier.SINGLE,
                            price_modifier=Decimal("0.00"),
                            is_active=True,
                        )
                        session.add(bed)
            else:
                # Private room
                for i in range(1, data.capacity + 1):
                    bed = Bed(
                        room_id=room.id,
                        bed_number=f"Кровать {i}" if data.capacity > 1 else "Основная кровать",
                        tier=BedTier.SINGLE,
                        price_modifier=Decimal("0.00"),
                        is_active=True,
                    )
                    session.add(bed)

        await session.commit()
        return await RoomService.get_room(session, room.id)

    @staticmethod
    async def update_room(session: AsyncSession, room_id: int, data: RoomUpdate) -> Room:
        room = await RoomService.get_room(session, room_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(room, key, value)
        await session.commit()
        return await RoomService.get_room(session, room.id)

    @staticmethod
    async def delete_room(session: AsyncSession, room_id: int) -> None:
        room = await RoomService.get_room(session, room_id)
        await session.delete(room)
        await session.commit()

    @staticmethod
    async def create_bed(session: AsyncSession, room_id: int, data: BedCreate) -> Bed:
        # Check room exists
        await RoomService.get_room(session, room_id)
        bed = Bed(
            room_id=room_id,
            bed_number=data.bed_number,
            tier=data.tier,
            price_modifier=data.price_modifier,
            is_active=data.is_active,
        )
        session.add(bed)
        await session.commit()
        await session.refresh(bed)
        return bed

    @staticmethod
    async def update_bed(session: AsyncSession, bed_id: int, data: BedUpdate) -> Bed:
        stmt = select(Bed).where(Bed.id == bed_id)
        result = await session.execute(stmt)
        bed = result.scalar_one_or_none()
        if not bed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Спальное место не найдено"
            )
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(bed, key, value)
        await session.commit()
        await session.refresh(bed)
        return bed

    @staticmethod
    async def delete_bed(session: AsyncSession, bed_id: int) -> None:
        stmt = select(Bed).where(Bed.id == bed_id)
        result = await session.execute(stmt)
        bed = result.scalar_one_or_none()
        if not bed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Спальное место не найдено"
            )
        await session.delete(bed)
        await session.commit()
