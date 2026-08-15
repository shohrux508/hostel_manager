"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Users,
  Bed,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  ChessboardBookingSegment,
  ChessboardResponse,
  RoomCategory,
} from "@/types";

interface ChessboardViewProps {
  data: ChessboardResponse | null;
  startDate: string;
  onStartDateChange: (dateStr: string) => void;
  daysCount: number;
  onDaysCountChange: (days: number) => void;
  onSelectBooking: (bookingId: number) => void;
  onCellClick: (roomId: number, bedId: number | null, dateStr: string) => void;
  isLoading: boolean;
}

const CATEGORY_NAMES: Record<RoomCategory, string> = {
  dorm_mixed: "Общий дорм",
  dorm_male: "Мужской дорм",
  dorm_female: "Женский дорм",
  private_single: "Приватный 1-местный",
  private_double: "Приватный 2-местный",
  private_family: "Семейный",
};

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  data,
  startDate,
  onStartDateChange,
  daysCount,
  onDaysCountChange,
  onSelectBooking,
  onCellClick,
  isLoading,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchGuest, setSearchGuest] = useState<string>("");

  // Generate date columns array
  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; dayNumber: number; weekday: string; isToday: boolean; isWeekend: boolean; monthName: string }[] = [];
    const base = new Date(startDate);
    const todayStr = new Date().toISOString().split("T")[0];

    const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();

      dates.push({
        dateStr: iso,
        dayNumber: d.getDate(),
        weekday: weekdays[dayOfWeek],
        isToday: iso === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        monthName: months[d.getMonth()],
      });
    }
    return dates;
  }, [startDate, daysCount]);

  // Navigate dates
  const handleShiftDate = (days: number) => {
    const current = new Date(startDate);
    current.setDate(current.getDate() + days);
    onStartDateChange(current.toISOString().split("T")[0]);
  };

  const handleSetToday = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1); // show from yesterday
    onStartDateChange(today.toISOString().split("T")[0]);
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!data?.rooms) return [];
    return data.rooms.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [data, categoryFilter]);

  // Helper to calculate booking position and span in grid
  const getBookingSegmentStyle = (
    booking: ChessboardBookingSegment,
    gridStartStr: string,
    gridDays: number
  ) => {
    const gridStartDate = new Date(gridStartStr);
    const bCheckIn = new Date(booking.check_in_date);
    const bCheckOut = new Date(booking.check_out_date);

    // Difference from grid start in days
    const diffStartMs = bCheckIn.getTime() - gridStartDate.getTime();
    const startOffsetDays = Math.floor(diffStartMs / (1000 * 60 * 60 * 24));

    const totalNights = Math.max(
      1,
      Math.floor((bCheckOut.getTime() - bCheckIn.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Visible boundaries
    const startIndex = Math.max(0, startOffsetDays);
    const endIndex = Math.min(gridDays, startOffsetDays + totalNights);
    const span = Math.max(1, endIndex - startIndex);

    return {
      startIndex,
      span,
      visible: startOffsetDays < gridDays && startOffsetDays + totalNights > 0,
      isClampedStart: startOffsetDays < 0,
      isClampedEnd: startOffsetDays + totalNights > gridDays,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Left: Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => handleShiftDate(-7)}
            className="btn btn-secondary btn-sm"
            title="Назад на 7 дней"
          >
            <ChevronLeft size={16} />
            7д
          </button>
          <button
            onClick={() => handleShiftDate(-1)}
            className="btn btn-secondary btn-sm btn-icon"
            title="Назад на 1 день"
          >
            <ChevronLeft size={16} />
          </button>

          <button onClick={handleSetToday} className="btn btn-secondary btn-sm" style={{ fontWeight: "700" }}>
            Сегодня
          </button>

          <button
            onClick={() => handleShiftDate(1)}
            className="btn btn-secondary btn-sm btn-icon"
            title="Вперед на 1 день"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => handleShiftDate(7)}
            className="btn btn-secondary btn-sm"
            title="Вперед на 7 дней"
          >
            7д
            <ChevronRight size={16} />
          </button>

          {/* Current Date Picker Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
            <Calendar size={16} color="var(--accent-primary)" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => e.target.value && onStartDateChange(e.target.value)}
              className="form-input"
              style={{ padding: "5px 10px", fontSize: "12.5px", width: "135px" }}
            />
          </div>
        </div>

        {/* Middle: Days Count Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "var(--radius-md)" }}>
          {[7, 14, 21, 30].map((count) => (
            <button
              key={count}
              onClick={() => onDaysCountChange(count)}
              style={{
                border: "none",
                background: daysCount === count ? "var(--accent-primary)" : "transparent",
                color: daysCount === count ? "#fff" : "var(--text-secondary)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {count} дн.
            </button>
          ))}
        </div>

        {/* Right: Category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ padding: "6px 12px", fontSize: "12.5px", width: "160px" }}
          >
            <option value="all">Все категории</option>
            <option value="dorm_mixed">Общие дормы</option>
            <option value="dorm_female">Женские дормы</option>
            <option value="dorm_male">Мужские дормы</option>
            <option value="private_double">Приватные Double</option>
            <option value="private_single">Приватные Single</option>
          </select>
        </div>
      </div>

      {/* Legend / Status Hint */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 4px", fontSize: "12px", color: "var(--text-secondary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10b981", display: "inline-block" }} />
          Проживает (Заселен)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#6366f1", display: "inline-block" }} />
          Подтверждена (Ожидает заезда)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#64748b", display: "inline-block" }} />
          Выехал
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", fontSize: "11.5px", color: "var(--accent-primary)" }}>
          <Sparkles size={14} /> Кликните по пустой ячейке для быстрого бронирования
        </span>
      </div>

      {/* Main Chessboard Table / Grid Container */}
      <div
        className="glass-card"
        style={{
          overflowX: "auto",
          position: "relative",
          border: "1px solid var(--border-card)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div
          style={{
            minWidth: `${240 + daysCount * 56}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Row: Dates */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-subtle)",
              background: "rgba(14, 20, 36, 0.95)",
              position: "sticky",
              top: 0,
              zIndex: 15,
            }}
          >
            {/* Sticky Room/Bed Title Column */}
            <div
              style={{
                width: "240px",
                minWidth: "240px",
                padding: "14px 16px",
                borderRight: "1px solid var(--border-subtle)",
                fontWeight: "700",
                fontSize: "13px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                position: "sticky",
                left: 0,
                background: "var(--bg-sidebar)",
                zIndex: 16,
              }}
            >
              Номер / Койко-место
            </div>

            {/* Date Columns */}
            <div style={{ display: "flex", flex: 1 }}>
              {dateColumns.map((col) => (
                <div
                  key={col.dateStr}
                  style={{
                    width: "56px",
                    minWidth: "56px",
                    padding: "8px 2px",
                    textAlign: "center",
                    borderRight: "1px solid var(--border-subtle)",
                    backgroundColor: col.isToday
                      ? "rgba(99, 102, 241, 0.15)"
                      : col.isWeekend
                      ? "rgba(255, 255, 255, 0.02)"
                      : "transparent",
                    borderTop: col.isToday ? "2px solid var(--accent-primary)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: col.isToday
                        ? "var(--accent-primary)"
                        : col.isWeekend
                        ? "var(--accent-amber)"
                        : "var(--text-muted)",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {col.weekday}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: col.isToday ? "800" : "600",
                      color: col.isToday ? "#fff" : "var(--text-primary)",
                      margin: "2px 0",
                    }}
                  >
                    {col.dayNumber}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {col.monthName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms and Beds Rows */}
          {filteredRooms.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              {isLoading ? "Загрузка шахматки..." : "Номера не найдены"}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <React.Fragment key={room.id}>
                {/* Room Group Header */}
                <div
                  style={{
                    display: "flex",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Sticky Room Group Label */}
                  <div
                    style={{
                      width: "240px",
                      minWidth: "240px",
                      padding: "10px 16px",
                      borderRight: "1px solid var(--border-subtle)",
                      position: "sticky",
                      left: 0,
                      background: "#12182b",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#fff", marginRight: "8px" }}>
                        №{room.number}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {CATEGORY_NAMES[room.category] || room.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--accent-emerald)", fontWeight: "600" }}>
                      {room.base_price_per_night} ₽
                    </span>
                  </div>

                  {/* Empty cells background for Room header */}
                  <div style={{ display: "flex", flex: 1, position: "relative" }}>
                    {dateColumns.map((col) => (
                      <div
                        key={col.dateStr}
                        onClick={() => onCellClick(room.id, null, col.dateStr)}
                        style={{
                          width: "56px",
                          minWidth: "56px",
                          height: "36px",
                          borderRight: "1px solid var(--border-subtle)",
                          backgroundColor: col.isToday
                            ? "rgba(99, 102, 241, 0.04)"
                            : col.isWeekend
                            ? "rgba(255, 255, 255, 0.01)"
                            : "transparent",
                          cursor: "pointer",
                        }}
                      />
                    ))}

                    {/* Render Entire Room Bookings (e.g. Private Rooms) */}
                    {room.room_bookings.map((booking) => {
                      const pos = getBookingSegmentStyle(booking, startDate, daysCount);
                      if (!pos.visible) return null;

                      const isCheckedIn = booking.status === "checked_in";
                      const isCheckedOut = booking.status === "checked_out";

                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(booking.id);
                          }}
                          style={{
                            position: "absolute",
                            left: `${pos.startIndex * 56 + 2}px`,
                            width: `${pos.span * 56 - 4}px`,
                            top: "3px",
                            bottom: "3px",
                            borderRadius: "var(--radius-sm)",
                            background: isCheckedIn
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : isCheckedOut
                              ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            color: "#fff",
                            padding: "3px 8px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            boxShadow: "var(--shadow-sm)",
                            zIndex: 8,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            transition: "transform 0.1s, filter 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                          title={`${booking.guest_name} • ${booking.booking_number} • ${booking.total_amount} ₽`}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {booking.guest_name}
                          </span>
                          <span style={{ fontSize: "10px", opacity: 0.85, marginLeft: "4px" }}>
                            {booking.paid_amount >= booking.total_amount ? "✓" : "₽"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bed Rows (for Dorms and multi-bed rooms) */}
                {room.beds.map((bed) => (
                  <div
                    key={bed.id}
                    style={{
                      display: "flex",
                      borderBottom: "1px solid var(--border-subtle)",
                      minHeight: "42px",
                    }}
                  >
                    {/* Sticky Bed Label */}
                    <div
                      style={{
                        width: "240px",
                        minWidth: "240px",
                        padding: "8px 16px 8px 28px",
                        borderRight: "1px solid var(--border-subtle)",
                        position: "sticky",
                        left: 0,
                        background: "var(--bg-app)",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Bed size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: "12.5px", fontWeight: "500", color: "var(--text-primary)" }}>
                          {bed.bed_number}
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          bed.tier === "bottom"
                            ? "badge-purple"
                            : bed.tier === "top"
                            ? "badge-sky"
                            : "badge-neutral"
                        }`}
                        style={{ fontSize: "10px", padding: "1px 5px" }}
                      >
                        {bed.tier === "bottom" ? "Н" : bed.tier === "top" ? "В" : "О"}
                      </span>
                    </div>

                    {/* Bed Date Cells */}
                    <div style={{ display: "flex", flex: 1, position: "relative" }}>
                      {dateColumns.map((col) => (
                        <div
                          key={col.dateStr}
                          onClick={() => onCellClick(room.id, bed.id, col.dateStr)}
                          style={{
                            width: "56px",
                            minWidth: "56px",
                            height: "42px",
                            borderRight: "1px solid var(--border-subtle)",
                            backgroundColor: col.isToday
                              ? "rgba(99, 102, 241, 0.05)"
                              : col.isWeekend
                              ? "rgba(255, 255, 255, 0.015)"
                              : "transparent",
                            cursor: "pointer",
                            transition: "background-color 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.12)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = col.isToday
                              ? "rgba(99, 102, 241, 0.05)"
                              : col.isWeekend
                              ? "rgba(255, 255, 255, 0.015)"
                              : "transparent")
                          }
                        />
                      ))}

                      {/* Bed Bookings */}
                      {bed.bookings.map((booking) => {
                        const pos = getBookingSegmentStyle(booking, startDate, daysCount);
                        if (!pos.visible) return null;

                        const isCheckedIn = booking.status === "checked_in";
                        const isCheckedOut = booking.status === "checked_out";
                        const hasDebt = booking.balance_due > 0;

                        return (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBooking(booking.id);
                            }}
                            style={{
                              position: "absolute",
                              left: `${pos.startIndex * 56 + 2}px`,
                              width: `${pos.span * 56 - 4}px`,
                              top: "4px",
                              bottom: "4px",
                              borderRadius: "var(--radius-sm)",
                              background: isCheckedIn
                                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                : isCheckedOut
                                ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                              color: "#fff",
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              boxShadow: "var(--shadow-sm)",
                              zIndex: 8,
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              borderLeft: hasDebt && !isCheckedOut ? "3px solid #f59e0b" : "none",
                              transition: "transform 0.1s, filter 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.18)")}
                            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                            title={`${booking.guest_name} (${booking.guest_phone})\nБронь: ${booking.booking_number}\nСумма: ${booking.total_amount} ₽ (Оплачено: ${booking.paid_amount} ₽)`}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                              {booking.guest_name}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "4px" }}>
                              {hasDebt && (
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: "#f59e0b",
                                  }}
                                  title={`Долг: ${booking.balance_due} ₽`}
                                />
                              )}
                              <span style={{ fontSize: "10px", opacity: 0.85 }}>
                                {booking.paid_amount >= booking.total_amount ? "✓" : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
