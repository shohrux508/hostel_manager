"use client";

import React from "react";
import {
  CalendarDays,
  BedDouble,
  ClipboardList,
  Users,
  Wallet,
  Building2,
  X,
} from "lucide-react";
import { TodayStats } from "@/types";

export type NavTab = "chessboard" | "rooms" | "bookings" | "guests" | "finances";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: TodayStats | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  isMobileOpen = false,
  onCloseMobile,
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

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(5, 8, 15, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 140,
          }}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        style={{
          width: "var(--sidebar-width)",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          position: isMobileOpen ? "fixed" : "sticky",
          top: 0,
          left: 0,
          zIndex: 150,
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isMobileOpen ? "var(--shadow-lg)" : "none",
        }}
        className={isMobileOpen ? "mobile-sidebar-open" : "desktop-sidebar"}
      >
        {/* Brand / Logo + Close Button on Mobile */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-primary-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Building2 size={20} color="#fff" />
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

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="btn btn-secondary btn-icon mobile-only"
              style={{ width: "32px", height: "32px", padding: 0 }}
              title="Закрыть меню"
            >
              <X size={18} />
            </button>
          )}
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
                onClick={() => handleItemClick(item.id)}
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

      <style jsx>{`
        @media (max-width: 900px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-sidebar-open {
            display: flex !important;
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};
