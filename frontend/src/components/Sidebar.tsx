"use client";

import React from "react";
import {
  CalendarDays,
  BedDouble,
  ClipboardList,
  Users,
  Wallet,
  Building2,
  Sparkles,
} from "lucide-react";
import { TodayStats } from "@/types";

export type NavTab = "chessboard" | "rooms" | "bookings" | "guests" | "finances";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: TodayStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: "chessboard", label: "Шахматка (Сетка)", icon: CalendarDays },
    { id: "rooms", label: "Номера и места", icon: BedDouble, badge: stats?.total_rooms },
    {
      id: "bookings",
      label: "Журнал броней",
      icon: ClipboardList,
      badge: stats ? `${stats.check_ins_today} заезд.` : undefined,
    },
    { id: "guests", label: "База гостей", icon: Users },
    { id: "finances", label: "Касса и финансы", icon: Wallet },
  ];

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Brand / Logo */}
      <div
        style={{
          padding: "24px 20px 20px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-primary-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Building2 size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "800", color: "#fff", letterSpacing: "-0.01em" }}>
            Hostel<span style={{ color: "var(--accent-primary)" }}>PMS</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
            Управление хостелом
          </div>
        </div>
      </div>

      {/* Live Occupancy Status Card */}
      <div style={{ padding: "16px 14px 12px 14px" }}>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Загрузка сегодня
            </span>
            <span className="badge badge-emerald" style={{ fontSize: "11px", padding: "2px 6px" }}>
              {stats ? `${stats.occupancy_rate_percent}%` : "—"}
            </span>
          </div>

          <div
            style={{
              height: "6px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, stats?.occupancy_rate_percent || 0)}%`,
                background: "linear-gradient(90deg, #10b981 0%, #6366f1 100%)",
                borderRadius: "4px",
                transition: "width 0.5s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
            <span>Занято: <b style={{ color: "#fff" }}>{stats?.occupied_beds_today ?? 0}</b> мест</span>
            <span>Всего: <b style={{ color: "#fff" }}>{stats?.total_beds ?? 0}</b></span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", padding: "8px 8px 4px 8px", letterSpacing: "0.05em" }}>
          Главное меню
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive
                  ? "linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.05) 100%)"
                  : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                fontWeight: isActive ? "600" : "500",
                fontSize: "13.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderLeft: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={18} color={isActive ? "var(--accent-primary)" : "var(--text-muted)"} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: "11px",
                    background: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? "#fff" : "var(--text-muted)",
                    padding: "2px 7px",
                    borderRadius: "var(--radius-full)",
                    fontWeight: "600",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.2)",
            color: "var(--accent-emerald)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          АД
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Администратор
          </div>
          <div style={{ fontSize: "11px", color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-emerald)", display: "inline-block" }} />
            Онлайн
          </div>
        </div>
      </div>
    </aside>
  );
};
