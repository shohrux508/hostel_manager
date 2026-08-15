from __future__ import annotations

from datetime import date, timedelta

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_booking_lifecycle(client: AsyncClient) -> None:
    # 1. Create Room & Bed
    room_resp = await client.post(
        "/api/v1/rooms/",
        json={
            "number": "301",
            "floor": 3,
            "category": "private_single",
            "capacity": 1,
            "base_price_per_night": 1500.0,
            "auto_create_beds": True,
        },
    )
    assert room_resp.status_code == 201
    room = room_resp.json()
    bed_id = room["beds"][0]["id"]

    # 2. Create Booking with inline new guest
    today = date.today()
    check_in = today + timedelta(days=5)
    check_out = today + timedelta(days=8)

    booking_payload = {
        "new_guest": {
            "first_name": "Мария",
            "last_name": "Тестова",
            "phone": "+7 (999) 777-88-99",
        },
        "room_id": room["id"],
        "bed_id": bed_id,
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "initial_payment": 1500.0,
    }
    b_resp = await client.post("/api/v1/bookings/", json=booking_payload)
    assert b_resp.status_code == 201, b_resp.text
    booking = b_resp.json()
    assert booking["status"] == "confirmed"
    assert float(booking["paid_amount"]) == 1500.0
    assert float(booking["total_amount"]) == 4500.0  # 3 nights * 1500

    # 3. Check-in
    cin_resp = await client.post(
        f"/api/v1/bookings/{booking['id']}/check-in",
        json={"payment_amount": 3000.0, "deposit_amount": 500.0},
    )
    assert cin_resp.status_code == 200
    cin_data = cin_resp.json()
    assert cin_data["status"] == "checked_in"
    assert float(cin_data["paid_amount"]) == 4500.0
    assert float(cin_data["balance_due"]) == 0.0

    # 4. Check-out
    cout_resp = await client.post(
        f"/api/v1/bookings/{booking['id']}/check-out",
        json={"deposit_refund_amount": 500.0},
    )
    assert cout_resp.status_code == 200
    assert cout_resp.json()["status"] == "checked_out"
