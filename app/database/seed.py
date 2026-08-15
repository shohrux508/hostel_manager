from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import TypedDict

from sqlalchemy import func, select
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


async def seed_demo_data(session: AsyncSession) -> None:
    """Seed sample hostel data if rooms are empty."""
    res = await session.execute(select(func.count(Room.id)))
    if (res.scalar() or 0) > 0:
        return  # already seeded

    # 1. Rooms & Beds
    rooms_data: list[RoomSeedData] = [
        {
            "number": "101",
            "floor": 1,
            "category": RoomCategory.DORM_MIXED,
            "capacity": 8,
            "base_price": Decimal("850.00"),
            "description": "Просторный 8-местный общий номер с кондиционером и шкафчиками",
            "beds": [
                ("1Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("1В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("2Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("2В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("3Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("3В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("4Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("4В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
            ],
        },
        {
            "number": "102",
            "floor": 1,
            "category": RoomCategory.DORM_FEMALE,
            "capacity": 6,
            "base_price": Decimal("950.00"),
            "description": "Уютный 6-местный женский дормиторий с зеркалами и феном",
            "beds": [
                ("1Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("1В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("2Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("2В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("3Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("3В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
            ],
        },
        {
            "number": "103",
            "floor": 1,
            "category": RoomCategory.DORM_MALE,
            "capacity": 4,
            "base_price": Decimal("900.00"),
            "description": "Мужской 4-местный номер",
            "beds": [
                ("1Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("1В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
                ("2Н (Нижнее)", BedTier.BOTTOM, Decimal("0.00")),
                ("2В (Верхнее)", BedTier.TOP, Decimal("-100.00")),
            ],
        },
        {
            "number": "201",
            "floor": 2,
            "category": RoomCategory.PRIVATE_DOUBLE,
            "capacity": 2,
            "base_price": Decimal("2400.00"),
            "description": "Приватный двухместный номер с большой двуспальной кроватью и TV",
            "beds": [
                ("Двуспальная King Size", BedTier.SINGLE, Decimal("0.00")),
            ],
        },
        {
            "number": "202",
            "floor": 2,
            "category": RoomCategory.PRIVATE_SINGLE,
            "capacity": 1,
            "base_price": Decimal("1800.00"),
            "description": "Одноместный комфорт с рабочим столом для командировок",
            "beds": [
                ("Односпальная кровать", BedTier.SINGLE, Decimal("0.00")),
            ],
        },
    ]

    room_objects: list[Room] = []
    bed_objects: list[Bed] = []

    for r_data in rooms_data:
        r = Room(
            number=r_data["number"],
            floor=r_data["floor"],
            category=r_data["category"],
            capacity=r_data["capacity"],
            base_price_per_night=r_data["base_price"],
            description=r_data["description"],
            is_active=True,
        )
        session.add(r)
        await session.flush()
        room_objects.append(r)

        for b_name, b_tier, b_mod in r_data["beds"]:
            bed = Bed(
                room_id=r.id,
                bed_number=b_name,
                tier=b_tier,
                price_modifier=b_mod,
                is_active=True,
            )
            session.add(bed)
            await session.flush()
            bed_objects.append(bed)

    # 2. Guests
    guests_data = [
        {
            "first_name": "Алексей",
            "last_name": "Смирнов",
            "middle_name": "Сергеевич",
            "phone": "+7 (999) 111-22-33",
            "email": "smirnov.alex@example.com",
            "passport_number": "4512 889900",
            "citizenship": "Россия",
            "birth_date": date(1995, 4, 12),
            "notes": "Постоянный гость, предпочитает нижние полки",
        },
        {
            "first_name": "Елена",
            "last_name": "Иванова",
            "middle_name": "Владимировна",
            "phone": "+7 (916) 222-33-44",
            "email": "ivanova.e@example.com",
            "passport_number": "4518 776655",
            "citizenship": "Россия",
            "birth_date": date(1998, 9, 21),
            "notes": "Приезжает на конференцию",
        },
        {
            "first_name": "Дмитрий",
            "last_name": "Кузнецов",
            "middle_name": "Олегович",
            "phone": "+7 (903) 333-44-55",
            "email": "kuznetsov.d@example.com",
            "passport_number": "4015 334411",
            "citizenship": "Россия",
            "birth_date": date(1991, 1, 15),
            "notes": "Оплата по безналу от организации",
        },
        {
            "first_name": "Анна",
            "last_name": "Попова",
            "middle_name": "Игоревна",
            "phone": "+7 (926) 444-55-66",
            "email": "popova.anna@example.com",
            "passport_number": "4620 998877",
            "citizenship": "Россия",
            "birth_date": date(2000, 7, 30),
            "notes": "",
        },
        {
            "first_name": "Сергей",
            "last_name": "Морозов",
            "middle_name": "Петрович",
            "phone": "+7 (985) 555-66-77",
            "email": "morozov.s@example.com",
            "passport_number": "4509 112233",
            "citizenship": "Россия",
            "birth_date": date(1987, 11, 5),
            "notes": "Ранний заезд в 08:00",
        },
    ]

    guest_objects: list[Guest] = []
    for g_data in guests_data:
        g = Guest(**g_data)
        session.add(g)
        await session.flush()
        guest_objects.append(g)

    # 3. Bookings & Payments across timeline
    today = date.today()

    # Booking 1: Living now in 101, Bed 1Н
    b1_in = today - timedelta(days=2)
    b1_out = today + timedelta(days=3)
    b1_nights = (b1_out - b1_in).days
    b1_total = Decimal("850.00") * b1_nights
    b1 = Booking(
        booking_number="HST-101A1",
        guest_id=guest_objects[0].id,
        room_id=room_objects[0].id,
        bed_id=bed_objects[0].id,
        check_in_date=b1_in,
        check_out_date=b1_out,
        status=BookingStatus.CHECKED_IN,
        source=BookingSource.WEBSITE,
        total_amount=b1_total,
        paid_amount=b1_total,
        deposit_amount=Decimal("1000.00"),
        actual_check_in_at=datetime.now(UTC) - timedelta(days=2),
    )
    session.add(b1)
    await session.flush()
    p1 = Payment(
        booking_id=b1.id,
        guest_id=guest_objects[0].id,
        amount=b1_total,
        payment_type=PaymentType.CARD,
        payment_status=PaymentStatus.COMPLETED,
        notes="Полная оплата картой онлайн",
    )
    p1_dep = Payment(
        booking_id=b1.id,
        guest_id=guest_objects[0].id,
        amount=Decimal("1000.00"),
        payment_type=PaymentType.DEPOSIT,
        payment_status=PaymentStatus.COMPLETED,
        notes="Залог за ключ-карту",
    )
    session.add_all([p1, p1_dep])

    # Booking 2: Living now in 102 (Female dorm), Bed 1Н
    b2_in = today - timedelta(days=1)
    b2_out = today + timedelta(days=4)
    b2_nights = (b2_out - b2_in).days
    b2_total = Decimal("950.00") * b2_nights
    b2 = Booking(
        booking_number="HST-102E2",
        guest_id=guest_objects[1].id,
        room_id=room_objects[1].id,
        bed_id=bed_objects[8].id,  # First bed in room 102
        check_in_date=b2_in,
        check_out_date=b2_out,
        status=BookingStatus.CHECKED_IN,
        source=BookingSource.BOOKING_COM,
        total_amount=b2_total,
        paid_amount=Decimal("1900.00"),  # Partial payment
        deposit_amount=Decimal("500.00"),
        actual_check_in_at=datetime.now(UTC) - timedelta(days=1),
    )
    session.add(b2)
    await session.flush()
    p2 = Payment(
        booking_id=b2.id,
        guest_id=guest_objects[1].id,
        amount=Decimal("1900.00"),
        payment_type=PaymentType.CASH,
        payment_status=PaymentStatus.COMPLETED,
        notes="Частичная предоплата наличными",
    )
    session.add(p2)

    # Booking 3: Check-in TODAY in 201 (Private Double)
    b3_in = today
    b3_out = today + timedelta(days=2)
    b3_nights = (b3_out - b3_in).days
    b3_total = Decimal("2400.00") * b3_nights
    b3 = Booking(
        booking_number="HST-201D3",
        guest_id=guest_objects[2].id,
        room_id=room_objects[3].id,
        bed_id=None,  # entire room
        check_in_date=b3_in,
        check_out_date=b3_out,
        status=BookingStatus.CONFIRMED,
        source=BookingSource.PHONE,
        total_amount=b3_total,
        paid_amount=Decimal("0.00"),
        deposit_amount=Decimal("0.00"),
        special_requests="Потребуются закрывающие документы для бухгалтерии",
    )
    session.add(b3)

    # Booking 4: Future booking in 101, Bed 2Н
    b4_in = today + timedelta(days=1)
    b4_out = today + timedelta(days=6)
    b4_nights = (b4_out - b4_in).days
    b4_total = Decimal("850.00") * b4_nights
    b4 = Booking(
        booking_number="HST-101A4",
        guest_id=guest_objects[3].id,
        room_id=room_objects[0].id,
        bed_id=bed_objects[2].id,
        check_in_date=b4_in,
        check_out_date=b4_out,
        status=BookingStatus.CONFIRMED,
        source=BookingSource.WALK_IN,
        total_amount=b4_total,
        paid_amount=b4_total,
        deposit_amount=Decimal("0.00"),
    )
    session.add(b4)
    await session.flush()
    p4 = Payment(
        booking_id=b4.id,
        guest_id=guest_objects[3].id,
        amount=b4_total,
        payment_type=PaymentType.TRANSFER,
        payment_status=PaymentStatus.COMPLETED,
        notes="Предоплата переводом СБП",
    )
    session.add(p4)

    # Booking 5: Future in 202 (Private Single)
    b5_in = today + timedelta(days=3)
    b5_out = today + timedelta(days=7)
    b5_nights = (b5_out - b5_in).days
    b5_total = Decimal("1800.00") * b5_nights
    b5 = Booking(
        booking_number="HST-202S5",
        guest_id=guest_objects[4].id,
        room_id=room_objects[4].id,
        bed_id=None,
        check_in_date=b5_in,
        check_out_date=b5_out,
        status=BookingStatus.CONFIRMED,
        source=BookingSource.WEBSITE,
        total_amount=b5_total,
        paid_amount=Decimal("1800.00"),  # 1 night deposit
        deposit_amount=Decimal("1000.00"),
    )
    session.add(b5)
    await session.flush()
    p5 = Payment(
        booking_id=b5.id,
        guest_id=guest_objects[4].id,
        amount=Decimal("1800.00"),
        payment_type=PaymentType.CARD,
        payment_status=PaymentStatus.COMPLETED,
        notes="Предоплата первых суток",
    )
    session.add(p5)

    await session.commit()
