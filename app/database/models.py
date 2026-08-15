from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""


class TimestampMixin:
    """Mixin that adds created_at / updated_at columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class RoomCategory(enum.StrEnum):
    DORM_MALE = "dorm_male"
    DORM_FEMALE = "dorm_female"
    DORM_MIXED = "dorm_mixed"
    PRIVATE_SINGLE = "private_single"
    PRIVATE_DOUBLE = "private_double"
    PRIVATE_FAMILY = "private_family"


class BedTier(enum.StrEnum):
    BOTTOM = "bottom"
    TOP = "top"
    SINGLE = "single"


class BookingStatus(enum.StrEnum):
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"


class BookingSource(enum.StrEnum):
    WALK_IN = "walk_in"
    PHONE = "phone"
    WEBSITE = "website"
    BOOKING_COM = "booking_com"
    OTHER = "other"


class PaymentType(enum.StrEnum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    DEPOSIT = "deposit"


class PaymentStatus(enum.StrEnum):
    COMPLETED = "completed"
    REFUNDED = "refunded"


class Room(Base, TimestampMixin):
    """Hostel room entity."""

    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    floor: Mapped[int] = mapped_column(Integer, default=1)
    category: Mapped[RoomCategory] = mapped_column(
        Enum(RoomCategory, values_callable=lambda obj: [e.value for e in obj]),
        default=RoomCategory.DORM_MIXED,
    )
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    base_price_per_night: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=1000.00)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    beds: Mapped[list[Bed]] = relationship(
        "Bed", back_populates="room", cascade="all, delete-orphan", lazy="selectin"
    )
    bookings: Mapped[list[Booking]] = relationship(
        "Booking", back_populates="room", lazy="selectin"
    )


class Bed(Base, TimestampMixin):
    """Bed / sleeping place in a room."""

    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    bed_number: Mapped[str] = mapped_column(String(50))
    tier: Mapped[BedTier] = mapped_column(
        Enum(BedTier, values_callable=lambda obj: [e.value for e in obj]),
        default=BedTier.SINGLE,
    )
    price_modifier: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    room: Mapped[Room] = relationship("Room", back_populates="beds", lazy="selectin")
    bookings: Mapped[list[Booking]] = relationship(
        "Booking", back_populates="bed", lazy="selectin"
    )


class Guest(Base, TimestampMixin):
    """Guest / client profile."""

    __tablename__ = "guests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), index=True)
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), index=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    passport_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    citizenship: Mapped[str | None] = mapped_column(String(100), default="Россия")
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    bookings: Mapped[list[Booking]] = relationship(
        "Booking", back_populates="guest", lazy="selectin"
    )
    payments: Mapped[list[Payment]] = relationship(
        "Payment", back_populates="guest", lazy="selectin"
    )


class Booking(Base, TimestampMixin):
    """Hostel booking / reservation record."""

    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("guests.id", ondelete="CASCADE"), index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    bed_id: Mapped[int | None] = mapped_column(
        ForeignKey("beds.id", ondelete="SET NULL"), nullable=True, index=True
    )

    check_in_date: Mapped[date] = mapped_column(Date, index=True)
    check_out_date: Mapped[date] = mapped_column(Date, index=True)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=BookingStatus.CONFIRMED,
        index=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.00)

    source: Mapped[BookingSource] = mapped_column(
        Enum(BookingSource, values_callable=lambda obj: [e.value for e in obj]),
        default=BookingSource.WALK_IN,
    )

    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_check_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_check_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    guest: Mapped[Guest] = relationship("Guest", back_populates="bookings", lazy="selectin")
    room: Mapped[Room] = relationship("Room", back_populates="bookings", lazy="selectin")
    bed: Mapped[Bed | None] = relationship("Bed", back_populates="bookings", lazy="selectin")
    payments: Mapped[list[Payment]] = relationship(
        "Payment", back_populates="booking", lazy="selectin", cascade="all, delete-orphan"
    )


class Payment(Base, TimestampMixin):
    """Payment transaction."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True
    )
    guest_id: Mapped[int] = mapped_column(ForeignKey("guests.id", ondelete="CASCADE"), index=True)

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    payment_type: Mapped[PaymentType] = mapped_column(
        Enum(PaymentType, values_callable=lambda obj: [e.value for e in obj]),
        default=PaymentType.CASH,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=PaymentStatus.COMPLETED,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    booking: Mapped[Booking] = relationship("Booking", back_populates="payments", lazy="selectin")
    guest: Mapped[Guest] = relationship("Guest", back_populates="payments", lazy="selectin")
