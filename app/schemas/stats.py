from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class TodayStats(BaseModel):
    total_rooms: int = 0
    total_beds: int = 0
    occupied_beds_today: int = 0
    occupancy_rate_percent: float = 0.0
    check_ins_today: int = 0
    check_outs_today: int = 0
    living_guests_today: int = 0
    today_revenue: Decimal = Decimal("0.00")
    total_unpaid_balance: Decimal = Decimal("0.00")
