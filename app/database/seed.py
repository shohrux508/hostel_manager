from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import TypedDict

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    Bed,
    BedTier,
    Booking,
    BookingSource,
    BookingStatus,
    Guest,
    Payment,
    PaymentStatus,
    PaymentType,
    Room,
    RoomCategory,
)


class RoomSeedData(TypedDict):
    number: str
    floor: int
    category: RoomCategory
    capacity: int
    base_price: Decimal
    description: str
    beds: list[tuple[str, BedTier, Decimal]]


async def seed_demo_data(session: AsyncSession, force: bool = False) -> None:
    """Seed hostel structure: 10 identical 4-bed dorm rooms (total 40 beds)."""
    res = await session.execute(select(func.count(Room.id)))
    count = res.scalar() or 0
    if count > 0 and not force:
        return

    if force:
        # Clear existing data in reverse dependency order
        await session.execute(delete(Payment))
        await session.execute(delete(Booking))
        await session.execute(delete(Bed))
        await session.execute(delete(Room))
        await session.execute(delete(Guest))
        await session.flush()

    # 1. Create 10 Identical 4-bed Rooms (№1 to №10)
    created_rooms: list[Room] = []
    created_beds: list[Bed] = []

    for i in range(1, 11):
        room = Room(
            number=str(i),
            floor=1,
            category=RoomCategory.DORM_MIXED,
            capacity=4,
            base_price_per_night=Decimal("800.00"),
            description=f"4-местная комната №{i} с двумя двухъярусными кроватями",
            is_active=True,
        )
        session.add(room)
        await session.flush()
        created_rooms.append(room)

        # 4 beds per room (2 bunk beds)
        beds_spec = [
            ("1Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
            ("1В (Верхнее)", BedTier.TOP, Decimal("-50.00")),
            ("2Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
            ("2В (Верхнее)", BedTier.TOP, Decimal("-50.00")),
        ]

        for bed_num, tier, price_mod in beds_spec:
            bed = Bed(
                room_id=room.id,
                bed_number=bed_num,
                tier=tier,
                price_modifier=price_mod,
                is_active=True,
            )
            session.add(bed)
            created_beds.append(bed)

    await session.flush()

    # 2. Create Sample Guests
    guests_data = [
        (
            "Алексей",
            "Смирнов",
            "+7 (999) 111-22-33",
            "asmirnov@example.com",
            "4510 123456",
            "Гость",
        ),
        (
            "Дмитрий",
            "Иванов",
            "+7 (999) 222-33-44",
            "divanov@example.com",
            "4511 234567",
            "Нижняя",
        ),
        (
            "Елена",
            "Кузнецова",
            "+7 (999) 333-44-55",
            "ekuznetsova@example.com",
            "4512 345678",
            None,
        ),
        ("Михаил", "Попов", "+7 (999) 444-55-66", "mpopov@example.com", "4513 456789", None),
        ("Анна", "Соколова", "+7 (999) 555-66-77", "asokolova@example.com", "4514 567890", None),
    ]

    created_guests: list[Guest] = []
    for first_name, last_name, phone, email, passport, notes in guests_data:
        g = Guest(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            passport_number=passport,
            notes=notes,
        )
        session.add(g)
        created_guests.append(g)

    await session.flush()

    # 3. Create Sample Active & Upcoming Bookings for Demo
    today = date.today()

    # Booking 1: Living guest in Room 1, Bed 1Н
    b1 = Booking(
        booking_number="HST-1001",
        guest_id=created_guests[0].id,
        room_id=created_rooms[0].id,
        bed_id=created_rooms[0].beds[0].id,
        check_in_date=today - timedelta(days=1),
        check_out_date=today + timedelta(days=3),
        total_amount=Decimal("3200.00"),
        paid_amount=Decimal("3200.00"),
        deposit_amount=Decimal("1000.00"),
        status=BookingStatus.CHECKED_IN,
        source=BookingSource.PHONE,
        notes="Оплачено полностью, залог внесен",
        checked_in_at=datetime.now(UTC) - timedelta(days=1),
    )
    session.add(b1)

    # Booking 2: Living guest in Room 2, Bed 1Н
    b2 = Booking(
        booking_number="HST-1002",
        guest_id=created_guests[1].id,
        room_id=created_rooms[1].id,
        bed_id=created_rooms[1].beds[0].id,
        check_in_date=today,
        check_out_date=today + timedelta(days=5),
        total_amount=Decimal("4000.00"),
        paid_amount=Decimal("2000.00"),
        deposit_amount=Decimal("1000.00"),
        status=BookingStatus.CHECKED_IN,
        source=BookingSource.WALK_IN,
        notes="Частичная оплата при заселении",
        checked_in_at=datetime.now(UTC),
    )
    session.add(b2)

    # Booking 3: Confirmed reservation in Room 1, Bed 2Н
    b3 = Booking(
        booking_number="HST-1003",
        guest_id=created_guests[2].id,
        room_id=created_rooms[0].id,
        bed_id=created_rooms[0].beds[2].id,
        check_in_date=today + timedelta(days=1),
        check_out_date=today + timedelta(days=4),
        total_amount=Decimal("2400.00"),
        paid_amount=Decimal("0.00"),
        deposit_amount=Decimal("0.00"),
        status=BookingStatus.CONFIRMED,
        source=BookingSource.WEBSITE,
        notes="Заезд завтра вечером",
    )
    session.add(b3)

    # Booking 4: Confirmed reservation in Room 3, Bed 1Н
    b4 = Booking(
        booking_number="HST-1004",
        guest_id=created_guests[3].id,
        room_id=created_rooms[2].id,
        bed_id=created_rooms[2].beds[0].id,
        check_in_date=today + timedelta(days=2),
        check_out_date=today + timedelta(days=7),
        total_amount=Decimal("4000.00"),
        paid_amount=Decimal("4000.00"),
        deposit_amount=Decimal("1000.00"),
        status=BookingStatus.CONFIRMED,
        source=BookingSource.BOOKING_COM,
        notes="Оплачено на сайте",
    )
    session.add(b4)

    await session.flush()

    # 4. Create Payments
    p1 = Payment(
        booking_id=b1.id,
        guest_id=created_guests[0].id,
        amount=Decimal("3200.00"),
        payment_type=PaymentType.CARD,
        payment_status=PaymentStatus.COMPLETED,
        notes="Проживание 4 ночи",
    )
    p1_dep = Payment(
        booking_id=b1.id,
        guest_id=created_guests[0].id,
        amount=Decimal("1000.00"),
        payment_type=PaymentType.DEPOSIT,
        payment_status=PaymentStatus.COMPLETED,
        notes="Залог за ключ/постельное",
    )
    p2 = Payment(
        booking_id=b2.id,
        guest_id=created_guests[1].id,
        amount=Decimal("2000.00"),
        payment_type=PaymentType.CASH,
        payment_status=PaymentStatus.COMPLETED,
        notes="Аванс 50%",
    )
    p2_dep = Payment(
        booking_id=b2.id,
        guest_id=created_guests[1].id,
        amount=Decimal("1000.00"),
        payment_type=PaymentType.DEPOSIT,
        payment_status=PaymentStatus.COMPLETED,
        notes="Залог наличными",
    )
    p4 = Payment(
        booking_id=b4.id,
        guest_id=created_guests[3].id,
        amount=Decimal("4000.00"),
        payment_type=PaymentType.TRANSFER,
        payment_status=PaymentStatus.COMPLETED,
        notes="Оплата через сайт",
    )

    session.add_all([p1, p1_dep, p2, p2_dep, p4])
    await session.commit()
