"use client";

import React, { useState } from "react";
import {
  BedDouble,
  Plus,
  Trash2,
  Edit2,
  Users,
  Layers,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Room, RoomCategory } from "@/types";

interface RoomsViewProps {
  rooms: Room[];
  onOpenAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: number) => void;
  onAddBed: (roomId: number) => void;
  onDeleteBed: (bedId: number) => void;
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<RoomCategory, string> = {
  dorm_mixed: "Общий дормиторий",
  dorm_male: "Мужской дормиторий",
  dorm_female: "Женский дормиторий",
  private_single: "Приватный Single (1 чел)",
  private_double: "Приватный Double (2 чел)",
  private_family: "Семейный номер",
};

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  onOpenAddRoom,
  onEditRoom,
  onDeleteRoom,
  onAddBed,
  onDeleteBed,
  isLoading,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>("all");

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor !== "all" && r.floor !== Number(selectedFloor)) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Номерной фонд и спальные места</h2>
          <p>Настройка комнат, ярусов коек, тарифов и вместимости</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Floor filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Этаж:</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="form-select"
              style={{ width: "110px", padding: "6px 10px", fontSize: "12.5px" }}
            >
              <option value="all">Все этажи</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f} этаж
                </option>
              ))}
            </select>
          </div>

          <button onClick={onOpenAddRoom} className="btn btn-primary">
            <Plus size={16} />
            Добавить комнату
          </button>
        </div>
      </div>

      {/* Grid of Rooms */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="glass-card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            {/* Room Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}>
                    №{room.number}
                  </span>
                  <span className="badge badge-sky" style={{ fontSize: "11px" }}>
                    {room.floor} этаж
                  </span>
                  {!room.is_active && (
                    <span className="badge badge-rose" style={{ fontSize: "11px" }}>
                      Неактивна
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {CATEGORY_LABELS[room.category] || room.category}
                </div>
              </div>

              {/* Price Tag */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "var(--accent-emerald)" }}>
                  {room.base_price_per_night} ₽
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>сутки / место</div>
              </div>
            </div>

            {/* Description if any */}
            {room.description && (
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineClamp: 2 }}>
                {room.description}
              </p>
            )}

            {/* Beds Section */}
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Места ({room.beds.length} / {room.capacity} макс)
                </span>
                <button
                  onClick={() => onAddBed(room.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "3px 8px", fontSize: "11.5px" }}
                >
                  <Plus size={13} /> Место
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {room.beds.map((bed) => (
                  <div
                    key={bed.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {bed.bed_number}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color:
                          bed.tier === "bottom"
                            ? "#c084fc"
                            : bed.tier === "top"
                            ? "#38bdf8"
                            : "var(--text-muted)",
                      }}
                    >
                      ({bed.tier === "bottom" ? "Нижнее" : bed.tier === "top" ? "Верхнее" : "Обычное"})
                    </span>
                    {Number(bed.price_modifier) !== 0 && (
                      <span style={{ fontSize: "10.5px", color: "var(--accent-amber)" }}>
                        {Number(bed.price_modifier) > 0 ? `+${bed.price_modifier}` : bed.price_modifier} ₽
                      </span>
                    )}
                    <button
                      onClick={() => onDeleteBed(bed.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0 2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Удалить спальное место"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "12px",
              }}
            >
              <button
                onClick={() => onEditRoom(room)}
                className="btn btn-secondary btn-sm"
              >
                <Edit2 size={13} />
                Редактировать
              </button>
              <button
                onClick={() => onDeleteRoom(room.id)}
                className="btn btn-rose btn-sm"
              >
                <Trash2 size={13} />
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
