from __future__ import annotations

from datetime import date, timedelta

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chessboard_and_stats(client: AsyncClient) -> None:
    # 1. Test chessboard endpoint
    today = date.today()
    start = today - timedelta(days=1)
    end = today + timedelta(days=7)

    cb_resp = await client.get(
        f"/api/v1/chessboard/?start_date={start.isoformat()}&end_date={end.isoformat()}"
    )
    assert cb_resp.status_code == 200, cb_resp.text
    cb_data = cb_resp.json()
    assert "rooms" in cb_data
    assert "total_rooms" in cb_data

    # 2. Test stats endpoint
    stats_resp = await client.get("/api/v1/stats/today")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "occupancy_rate_percent" in stats
    assert "occupied_beds_today" in stats
