"use client";

import React from "react";
import {
  CalendarDays,
  BedDouble,
  ClipboardList,
  Users,
  Wallet,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import { TodayStats } from "@/types";
import { useTelegram } from "@/hooks/useTelegram";

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: TodayStats | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  stats,
}) => {
  const { triggerHaptic } = useTelegram();
  const tabs: { id: NavTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: "chessboard", label: "Шахматка", icon: CalendarDays },
    { id: "rooms", label: "Номера", icon: BedDouble },
    {
      id: "bookings",
      label: "Брони",
      icon: ClipboardList,
      badge: stats?.check_ins_today && stats.check_ins_today > 0 ? stats.check_ins_today : undefined,
    },
    { id: "guests", label: "Гости", icon: Users },
    { id: "finances", label: "Касса", icon: Wallet },
  ];

  return (
    <nav
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "rgba(14, 20, 36, 0.95)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 90,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic("light");
              onSelectTab(tab.id);
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "6px 0",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
              position: "relative",
              transition: "all 0.15s ease",
            }}
          >
            {/* Top Active Indicator Dot */}
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: "0px",
                  width: "20px",
                  height: "3px",
                  borderRadius: "2px",
                  backgroundColor: "var(--accent-primary)",
                  boxShadow: "0 0 8px var(--accent-primary)",
                }}
              />
            )}

            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.badge !== undefined && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-8px",
                    background: "var(--accent-emerald)",
                    color: "#fff",
                    fontSize: "9.5px",
                    fontWeight: "700",
                    padding: "1px 5px",
                    borderRadius: "var(--radius-full)",
                    minWidth: "16px",
                    textAlign: "center",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: "10.5px",
                fontWeight: isActive ? "700" : "500",
                letterSpacing: "-0.01em",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
