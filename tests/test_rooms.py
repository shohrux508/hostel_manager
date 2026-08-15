from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_rooms(client: AsyncClient) -> None:
    # 1. Create a dorm room
    payload = {
        "number": "105",
        "floor": 1,
        "category": "dorm_mixed",
        "capacity": 4,
        "base_price_per_night": 900.0,
        "auto_create_beds": True,
        "bunk_beds": True,
    }
    resp = await client.post("/api/v1/rooms/", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["number"] == "105"
    assert len(data["beds"]) == 4

    # 2. List rooms
    resp_list = await client.get("/api/v1/rooms/")
    assert resp_list.status_code == 200
    rooms = resp_list.json()
    assert any(r["number"] == "105" for r in rooms)
