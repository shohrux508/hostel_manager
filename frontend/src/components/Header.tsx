"use client";

import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Clock, ArrowDownLeft, ArrowUpRight, Bed, Menu, Building2 } from "lucide-react";
import { TodayStats } from "@/types";

interface HeaderProps {
  onOpenQuickBooking: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  stats: TodayStats | null;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickBooking,
  onRefresh,
  isLoading,
  stats,
  onToggleMobileSidebar,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      };
      setCurrentDateTime(now.toLocaleDateString("ru-RU", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      {/* Left section: Hamburger (Mobile) + Clock/Stats (Desktop) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Hamburger button visible only on mobile */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-secondary btn-icon mobile-only"
          style={{ width: "38px", height: "38px", padding: 0 }}
          title="Открыть боковое меню"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Mini Brand */}
        <div className="mobile-only" style={{ alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--accent-primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#fff" }}>
            Hostel<span style={{ color: "var(--accent-primary)" }}>PMS</span>
          </span>
        </div>

        {/* Desktop Date & Badges */}
        <div className="desktop-only" style={{ alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <Clock size={15} color="var(--accent-primary)" />
          <span style={{ fontWeight: "500" }}>{currentDateTime || "Сегодня"}</span>
        </div>

        {stats && (
          <div className="desktop-only" style={{ alignItems: "center", gap: "10px", marginLeft: "12px" }}>
            <div
              className="badge badge-emerald"
              title="Заезды на сегодня"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <ArrowDownLeft size={13} />
              Заезды: {stats.check_ins_today}
            </div>

            <div
              className="badge badge-amber"
              title="Выезды на сегодня"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <ArrowUpRight size={13} />
              Выезды: {stats.check_outs_today}
            </div>

            <div
              className="badge badge-sky"
              title="Проживают сейчас"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Bed size={13} />
              Проживают: {stats.living_guests_today}
            </div>
          </div>
        )}
      </div>

      {/* Right section: Refresh & Quick Booking Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onRefresh}
          className="btn btn-secondary btn-icon"
          title="Обновить данные"
          disabled={isLoading}
          style={{ width: "38px", height: "38px" }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: isLoading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>

        <button
          onClick={onOpenQuickBooking}
          className="btn btn-primary"
          style={{ padding: "8px 14px", gap: "6px" }}
        >
          <Plus size={18} />
          <span className="desktop-only">Быстрая бронь</span>
          <span className="mobile-only">Бронь</span>
        </button>
      </div>

      <style jsx global>{`
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </header>
  );
};
