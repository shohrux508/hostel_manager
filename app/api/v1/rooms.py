from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.room import BedCreate, BedRead, BedUpdate, RoomCreate, RoomRead, RoomUpdate
from app.services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", response_model=list[RoomRead])
async def list_rooms(
    active_only: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[RoomRead]:
    rooms = await RoomService.list_rooms(session, active_only=active_only)
    return [RoomRead.model_validate(r) for r in rooms]


@router.post("/", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
async def create_room(
    data: RoomCreate,
    session: AsyncSession = Depends(get_session),
) -> RoomRead:
    room = await RoomService.create_room(session, data)
    return RoomRead.model_validate(room)


@router.get("/{room_id}", response_model=RoomRead)
async def get_room(
    room_id: int,
    session: AsyncSession = Depends(get_session),
) -> RoomRead:
    room = await RoomService.get_room(session, room_id)
    return RoomRead.model_validate(room)


@router.patch("/{room_id}", response_model=RoomRead)
async def update_room(
    room_id: int,
    data: RoomUpdate,
    session: AsyncSession = Depends(get_session),
) -> RoomRead:
    room = await RoomService.update_room(session, room_id, data)
    return RoomRead.model_validate(room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    await RoomService.delete_room(session, room_id)


# Beds
@router.post("/{room_id}/beds", response_model=BedRead, status_code=status.HTTP_201_CREATED)
async def create_bed(
    room_id: int,
    data: BedCreate,
    session: AsyncSession = Depends(get_session),
) -> BedRead:
    bed = await RoomService.create_bed(session, room_id, data)
    return BedRead.model_validate(bed)


@router.patch("/beds/{bed_id}", response_model=BedRead)
async def update_bed(
    bed_id: int,
    data: BedUpdate,
    session: AsyncSession = Depends(get_session),
) -> BedRead:
    bed = await RoomService.update_bed(session, bed_id, data)
    return BedRead.model_validate(bed)


@router.delete("/beds/{bed_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bed(
    bed_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    await RoomService.delete_bed(session, bed_id)
