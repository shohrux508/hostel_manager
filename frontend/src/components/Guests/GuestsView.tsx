"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import { GuestSummary } from "@/types";

interface GuestsViewProps {
  guests: GuestSummary[];
  onOpenAddGuest: () => void;
  onSelectGuest: (guestId: number) => void;
  onEditGuest: (guest: GuestSummary) => void;
  onDeleteGuest: (guestId: number) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const GuestsView: React.FC<GuestsViewProps> = ({
  guests,
  onOpenAddGuest,
  onSelectGuest,
  onEditGuest,
  onDeleteGuest,
  onSearch,
  isLoading,
}) => {
  const [searchInput, setSearchInput] = useState<string>("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Реестр гостей и клиентов</h2>
          <p>База постояльцев, паспортные данные, контакты и история визитов</p>
        </div>

        <button onClick={onOpenAddGuest} className="btn btn-primary">
          <Plus size={16} />
          Новый гость
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="glass-card" style={{ padding: "14px 18px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Поиск по ФИО, номеру телефона, паспорту, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Найти
          </button>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                onSearch("");
              }}
              className="btn btn-secondary btn-sm"
            >
              Сбросить
            </button>
          )}
        </form>
      </div>

      {/* Guests Table */}
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
              <th style={{ padding: "14px 18px" }}>ФИО Гостя</th>
              <th style={{ padding: "14px 18px" }}>Контакты</th>
              <th style={{ padding: "14px 18px" }}>Документ</th>
              <th style={{ padding: "14px 18px" }}>Визиты & Расходы</th>
              <th style={{ padding: "14px 18px" }}>Заметки</th>
              <th style={{ padding: "14px 18px", textAlign: "right" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px 18px", textAlign: "center", color: "var(--text-muted)" }}>
                  {isLoading ? "Загрузка списка гостей..." : "Гости не найдены"}
                </td>
              </tr>
            ) : (
              guests.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => onSelectGuest(g.id)}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Name & Citizenship */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>
                      {g.last_name} {g.first_name} {g.middle_name || ""}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--accent-primary)", marginTop: "2px" }}>
                      {g.citizenship || "Гражданство не указано"}
                    </div>
                  </td>

                  {/* Contact info */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                      <Phone size={13} color="var(--text-muted)" />
                      {g.phone}
                    </div>
                    {g.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        <Mail size={12} />
                        {g.email}
                      </div>
                    )}
                  </td>

                  {/* Passport */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ color: "var(--text-primary)" }}>
                      {g.passport_number || "—"}
                    </div>
                    {g.birth_date && (
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        д.р.: {g.birth_date}
                      </div>
                    )}
                  </td>

                  {/* Stats */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: "600", color: "var(--accent-emerald)" }}>
                      {g.total_spent} ₽
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      {g.total_bookings} бронирований
                    </div>
                  </td>

                  {/* Notes */}
                  <td style={{ padding: "14px 18px", maxWidth: "200px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={g.notes || ""}
                    >
                      {g.notes || "—"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 18px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        onClick={() => onEditGuest(g)}
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Редактировать гостя"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteGuest(g.id)}
                        className="btn btn-rose btn-sm btn-icon"
                        title="Удалить гостя"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
