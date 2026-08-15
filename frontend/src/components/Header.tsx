"use client";

import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Clock, ArrowDownLeft, ArrowUpRight, Bed } from "lucide-react";
import { TodayStats } from "@/types";

interface HeaderProps {
  onOpenQuickBooking: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  stats: TodayStats | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickBooking,
  onRefresh,
  isLoading,
  stats,
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
      {/* Left section: Quick stats summary badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <Clock size={15} color="var(--accent-primary)" />
          <span style={{ fontWeight: "500" }}>{currentDateTime || "Сегодня"}</span>
        </div>

        {stats && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "12px" }}>
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

      {/* Right section: Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
          style={{ padding: "9px 18px", gap: "6px" }}
        >
          <Plus size={18} />
          <span>Быстрая бронь</span>
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
