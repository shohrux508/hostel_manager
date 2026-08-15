from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_search_guests(client: AsyncClient) -> None:
    # 1. Create a guest
    payload = {
        "first_name": "Иван",
        "last_name": "Тестовый",
        "phone": "+7 (999) 000-11-22",
        "email": "test.ivan@example.com",
        "citizenship": "Россия",
    }
    resp = await client.post("/api/v1/guests/", json=payload)
    assert resp.status_code == 201
    guest_data = resp.json()
    assert guest_data["first_name"] == "Иван"

    # 2. Search guest by phone
    resp_search = await client.get("/api/v1/guests/?search=000-11-22")
    assert resp_search.status_code == 200
    results = resp_search.json()
    assert len(results) >= 1
    assert results[0]["last_name"] == "Тестовый"
