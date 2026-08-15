"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Bed,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Eye,
  XCircle,
  Plus,
} from "lucide-react";
import { Booking, BookingStatus } from "@/types";

interface BookingsViewProps {
  bookings: Booking[];
  onOpenQuickBooking: () => void;
  onSelectBooking: (bookingId: number) => void;
  onCheckIn: (booking: Booking) => void;
  onCheckOut: (booking: Booking) => void;
  onAddPayment: (booking: Booking) => void;
  onCancel: (bookingId: number) => void;
  isLoading: boolean;
}

type FilterTab = "all" | "check_in_today" | "living" | "check_out_today" | "unpaid";

const STATUS_CONFIG: Record<BookingStatus, { label: string; badgeClass: string; icon: React.ElementType }> = {
  confirmed: { label: "Подтверждено", badgeClass: "badge-purple", icon: Clock },
  checked_in: { label: "Проживает", badgeClass: "badge-emerald", icon: CheckCircle2 },
  checked_out: { label: "Выехал", badgeClass: "badge-neutral", icon: ArrowUpRight },
  cancelled: { label: "Отменено", badgeClass: "badge-rose", icon: XCircle },
};

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  onOpenQuickBooking,
  onSelectBooking,
  onCheckIn,
  onCheckOut,
  onAddPayment,
  onCancel,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((b) => {
    // Tab filtering
    if (activeTab === "check_in_today") {
      if (b.check_in_date !== todayStr || b.status === "cancelled" || b.status === "checked_out") return false;
    } else if (activeTab === "living") {
      if (b.status !== "checked_in") return false;
    } else if (activeTab === "check_out_today") {
      if (b.check_out_date !== todayStr || b.status === "cancelled") return false;
    } else if (activeTab === "unpaid") {
      if (b.balance_due <= 0 || b.status === "cancelled" || b.status === "checked_out") return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = b.booking_number.toLowerCase().includes(q);
      const matchGuest = b.guest
        ? `${b.guest.last_name} ${b.guest.first_name} ${b.guest.phone}`.toLowerCase().includes(q)
        : false;
      const matchRoom = (b.room_number || "").toLowerCase().includes(q);
      if (!matchNum && !matchGuest && !matchRoom) return false;
    }

    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Журнал бронирований и заездов</h2>
          <p>Операционный контроль броней, заселения, выезды и учет задолженностей</p>
        </div>

        <button onClick={onOpenQuickBooking} className="btn btn-primary">
          <Plus size={16} />
          Создать бронь
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Все бронирования" },
            { id: "check_in_today", label: "Заезды сегодня" },
            { id: "living", label: "Проживают сейчас" },
            { id: "check_out_today", label: "Выезды сегодня" },
            { id: "unpaid", label: "С задолженностью" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              style={{
                border: "none",
                background: activeTab === tab.id ? "var(--accent-primary)" : "rgba(255,255,255,0.04)",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", width: "260px" }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Поиск по ФИО, номеру, тел..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "36px", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "11.5px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <th style={{ padding: "14px 18px" }}>Бронь / Гость</th>
              <th style={{ padding: "14px 18px" }}>Размещение</th>
              <th style={{ padding: "14px 18px" }}>Даты проживания</th>
              <th style={{ padding: "14px 18px" }}>Статус</th>
              <th style={{ padding: "14px 18px" }}>Оплата & Баланс</th>
              <th style={{ padding: "14px 18px", textAlign: "right" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px 18px", textAlign: "center", color: "var(--text-muted)" }}>
                  {isLoading ? "Загрузка списка броней..." : "Бронирования не найдены"}
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => {
                const statusCfg = STATUS_CONFIG[b.status] || {
                  label: b.status,
                  badgeClass: "badge-neutral",
                  icon: Clock,
                };
                const StatusIcon = statusCfg.icon;

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBooking(b.id)}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Booking Number & Guest */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "700", color: "#fff", fontSize: "13.5px" }}>
                        {b.guest ? `${b.guest.last_name} ${b.guest.first_name}` : "Гость"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {b.booking_number} • {b.guest?.phone || "Без телефона"}
                      </div>
                    </td>

                    {/* Room and Bed */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                        Комната №{b.room_number || b.room_id}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--accent-sky)" }}>
                        {b.bed_number ? `Место: ${b.bed_number}` : "Номер целиком"}
                      </div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {b.check_in_date} → {b.check_out_date}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {Math.max(
                          1,
                          Math.round(
                            (new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{" "}
                        ноч.
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 18px" }}>
                      <span className={`badge ${statusCfg.badgeClass}`}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Financial balance */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "700", color: "#fff" }}>
                        {b.total_amount} ₽
                      </div>
                      <div style={{ fontSize: "11.5px", display: "flex", gap: "6px", marginTop: "2px" }}>
                        <span style={{ color: "var(--accent-emerald)" }}>Оплачено: {b.paid_amount} ₽</span>
                        {b.balance_due > 0 && (
                          <span style={{ color: "var(--accent-amber)", fontWeight: "700" }}>
                            • Долг: {b.balance_due} ₽
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => onCheckIn(b)}
                            className="btn btn-emerald btn-sm"
                            title="Заселить гостя"
                          >
                            <ArrowDownLeft size={13} />
                            Заселить
                          </button>
                        )}

                        {b.status === "checked_in" && (
                          <button
                            onClick={() => onCheckOut(b)}
                            className="btn btn-secondary btn-sm"
                            title="Выселить гостя"
                          >
                            <ArrowUpRight size={13} />
                            Выселить
                          </button>
                        )}

                        {b.balance_due > 0 && b.status !== "cancelled" && (
                          <button
                            onClick={() => onAddPayment(b)}
                            className="btn btn-secondary btn-sm"
                            title="Принять оплату"
                          >
                            <CreditCard size={13} color="var(--accent-amber)" />
                            Оплата
                          </button>
                        )}

                        <button
                          onClick={() => onSelectBooking(b.id)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Подробности бронирования"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
