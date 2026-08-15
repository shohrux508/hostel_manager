"use client";

import React, { useState, useEffect } from "react";
import { X, BedDouble } from "lucide-react";
import { Room, RoomCategory } from "@/types";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  room?: Room | null;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  room,
}) => {
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [category, setCategory] = useState<RoomCategory>("dorm_mixed");
  const [capacity, setCapacity] = useState(6);
  const [basePrice, setBasePrice] = useState("900");
  const [description, setDescription] = useState("");
  const [autoCreateBeds, setAutoCreateBeds] = useState(true);
  const [bunkBeds, setBunkBeds] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      if (room) {
        setNumber(room.number);
        setFloor(room.floor);
        setCategory(room.category);
        setCapacity(room.capacity);
        setBasePrice(String(room.base_price_per_night));
        setDescription(room.description || "");
        setAutoCreateBeds(false);
      } else {
        setNumber("");
        setFloor(1);
        setCategory("dorm_mixed");
        setCapacity(6);
        setBasePrice("900");
        setDescription("");
        setAutoCreateBeds(true);
        setBunkBeds(true);
      }
    }
  }, [isOpen, room]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      setErrorMsg("Укажите номер или название комнаты");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSubmit({
        number: number.trim(),
        floor: Number(floor),
        category,
        capacity: Number(capacity),
        base_price_per_night: Number(basePrice),
        description: description.trim() || undefined,
        auto_create_beds: autoCreateBeds,
        bunk_beds: bunkBeds,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-primary-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BedDouble size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700" }}>
              {room ? `Редактирование комнаты №${room.number}` : "Добавление новой комнаты"}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {errorMsg && (
            <div style={{ background: "var(--accent-rose-bg)", color: "#fb7185", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label className="form-label">Номер / Название *</label>
              <input
                type="text"
                placeholder="101"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Этаж</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label className="form-label">Категория номера</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RoomCategory)}
                className="form-select"
              >
                <option value="dorm_mixed">Общий дормиторий</option>
                <option value="dorm_female">Женский дормиторий</option>
                <option value="dorm_male">Мужской дормиторий</option>
                <option value="private_single">Приватный Single (1 мест)</option>
                <option value="private_double">Приватный Double (2 мест)</option>
                <option value="private_family">Семейный номер</option>
              </select>
            </div>

            <div>
              <label className="form-label">Вместимость (чел) *</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Базовая цена за сутки (₽/чел) *</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Описание / Особенности</label>
            <textarea
              rows={2}
              placeholder="Кондиционер, шкафчики, вид на тихий двор..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          {!room && (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreateBeds}
                  onChange={(e) => setAutoCreateBeds(e.target.checked)}
                />
                <span>Автоматически создать спальные места по вместимости</span>
              </label>

              {autoCreateBeds && (
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", marginLeft: "22px" }}>
                  <input
                    type="checkbox"
                    checked={bunkBeds}
                    onChange={(e) => setBunkBeds(e.target.checked)}
                  />
                  <span>Двухъярусные кровати (пары Верхнее / Нижнее)</span>
                </label>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : room ? "Сохранить изменения" : "Создать комнату"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
