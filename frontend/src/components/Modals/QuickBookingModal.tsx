"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, UserPlus, UserCheck, Calendar, Bed, CreditCard, Sparkles } from "lucide-react";
import { GuestSummary, Room } from "@/types";

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  rooms: Room[];
  guests: GuestSummary[];
  initialRoomId?: number;
  initialBedId?: number | null;
  initialDate?: string;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rooms,
  guests,
  initialRoomId,
  initialBedId,
  initialDate,
}) => {
  const [guestMode, setGuestMode] = useState<"existing" | "new">("new");
  const [selectedGuestId, setSelectedGuestId] = useState<number | "">("");

  // New guest fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [citizenship, setCitizenship] = useState("Россия");

  // Booking fields
  const [roomId, setRoomId] = useState<number | "">("");
  const [bedId, setBedId] = useState<number | "" | "none">("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [source, setSource] = useState("walk_in");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [initialPayment, setInitialPayment] = useState<string>("");
  const [initialPaymentType, setInitialPaymentType] = useState("cash");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Setup initial prefill values on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      const today = new Date();
      const todayStr = initialDate || today.toISOString().split("T")[0];
      const tomorrow = new Date(todayStr);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      setCheckInDate(todayStr);
      setCheckOutDate(tomorrowStr);

      if (initialRoomId) {
        setRoomId(initialRoomId);
      } else if (rooms.length > 0) {
        setRoomId(rooms[0].id);
      }

      if (initialBedId !== undefined && initialBedId !== null) {
        setBedId(initialBedId);
      } else {
        setBedId("");
      }
    }
  }, [isOpen, initialRoomId, initialBedId, initialDate, rooms]);

  const selectedRoom = rooms.find((r) => r.id === Number(roomId));

  // Compute nights and estimated total
  const { nights, estimatedTotal } = useMemo(() => {
    if (!checkInDate || !checkOutDate || !selectedRoom) {
      return { nights: 0, estimatedTotal: 0 };
    }
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    const n = Math.max(1, diff);

    let pricePerNight = Number(selectedRoom.base_price_per_night);
    if (bedId && bedId !== "none") {
      const selectedBed = selectedRoom.beds.find((b) => b.id === Number(bedId));
      if (selectedBed) {
        pricePerNight += Number(selectedBed.price_modifier || 0);
      }
    }

    return {
      nights: n,
      estimatedTotal: Math.max(0, pricePerNight * n),
    };
  }, [checkInDate, checkOutDate, selectedRoom, bedId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!roomId) {
      setErrorMsg("Пожалуйста, выберите номер");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setErrorMsg("Укажите даты заезда и выезда");
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setErrorMsg("Дата выезда должна быть позже даты заезда");
      return;
    }

    if (guestMode === "existing" && !selectedGuestId) {
      setErrorMsg("Выберите гостя из базы или переключитесь на создание нового");
      return;
    }

    if (guestMode === "new") {
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        setErrorMsg("Заполните Имя, Фамилию и Телефон гостя");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        room_id: Number(roomId),
        bed_id: bedId && bedId !== "none" ? Number(bedId) : null,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        source,
        special_requests: specialRequests || undefined,
        custom_total_amount: customPrice ? Number(customPrice) : undefined,
        initial_payment: initialPayment ? Number(initialPayment) : undefined,
        initial_payment_type: initialPaymentType,
        deposit_amount: depositAmount ? Number(depositAmount) : undefined,
      };

      if (guestMode === "existing") {
        payload.guest_id = Number(selectedGuestId);
      } else {
        payload.new_guest = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          middle_name: middleName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          passport_number: passportNumber.trim() || undefined,
          citizenship: citizenship || "Россия",
        };
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при сохранении бронирования");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "660px" }}>
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
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700" }}>Новое бронирование</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Быстрое оформление заселения или предварительной брони
              </p>
            </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {errorMsg && (
            <div
              style={{
                background: "var(--accent-rose-bg)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                color: "#fb7185",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Section 1: Guest Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                1. Данные гостя
              </span>
              <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "2px", borderRadius: "6px" }}>
                <button
                  type="button"
                  onClick={() => setGuestMode("new")}
                  style={{
                    border: "none",
                    background: guestMode === "new" ? "var(--accent-primary)" : "transparent",
                    color: guestMode === "new" ? "#fff" : "var(--text-muted)",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Новый гость
                </button>
                <button
                  type="button"
                  onClick={() => setGuestMode("existing")}
                  style={{
                    border: "none",
                    background: guestMode === "existing" ? "var(--accent-primary)" : "transparent",
                    color: guestMode === "existing" ? "#fff" : "var(--text-muted)",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Из базы
                </button>
              </div>
            </div>

            {guestMode === "existing" ? (
              <div>
                <label className="form-label">Выберите гостя из базы</label>
                <select
                  value={selectedGuestId}
                  onChange={(e) => setSelectedGuestId(Number(e.target.value) || "")}
                  className="form-select"
                >
                  <option value="">-- Выберите гостя --</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.last_name} {g.first_name} ({g.phone})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Фамилия *</label>
                    <input
                      type="text"
                      placeholder="Иванов"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Имя *</label>
                    <input
                      type="text"
                      placeholder="Иван"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Телефон *</label>
                    <input
                      type="text"
                      placeholder="+7 (999) 000-00-00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      placeholder="guest@mail.ru"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Паспорт (серия, номер)</label>
                    <input
                      type="text"
                      placeholder="4515 123456"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Гражданство</label>
                    <input
                      type="text"
                      placeholder="Россия"
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Room, Bed & Dates */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-card)", paddingTop: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              2. Номер и спальное место
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label className="form-label">Комната *</label>
                <select
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(Number(e.target.value) || "");
                    setBedId("");
                  }}
                  className="form-select"
                >
                  <option value="">-- Выберите комнату --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      №{r.number} ({r.base_price_per_night} ₽/сут)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Спальное место</label>
                <select
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value === "none" ? "none" : Number(e.target.value) || "")}
                  className="form-select"
                >
                  <option value="none">Весь номер целиком</option>
                  {selectedRoom?.beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bed_number} ({b.tier === "bottom" ? "Нижнее" : b.tier === "top" ? "Верхнее" : "Обычное"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label className="form-label">Дата заезда *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Дата выезда *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Finance & Prepayment */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-card)", paddingTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                3. Расчет стоимости и предоплата
              </span>
              <span style={{ fontSize: "13px", color: "var(--accent-emerald)", fontWeight: "700" }}>
                Итого: {customPrice ? customPrice : estimatedTotal} ₽ ({nights} ноч.)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label className="form-label">Сумма проживания (₽)</label>
                <input
                  type="number"
                  placeholder={String(estimatedTotal)}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Предоплата (₽)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Залог / Депозит (₽)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label className="form-label">Способ оплаты</label>
                <select
                  value={initialPaymentType}
                  onChange={(e) => setInitialPaymentType(e.target.value)}
                  className="form-select"
                >
                  <option value="cash">Наличные</option>
                  <option value="card">Банковская карта</option>
                  <option value="transfer">СБП / Перевод</option>
                </select>
              </div>

              <div>
                <label className="form-label">Источник бронирования</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="form-select"
                >
                  <option value="walk_in">Стойка (от стойки)</option>
                  <option value="phone">Телефонный звонок</option>
                  <option value="website">Сайт хостела</option>
                  <option value="booking_com">Booking.com / OTA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Пожелания / Примечание к брони</label>
              <textarea
                rows={2}
                placeholder="Поздний заезд, тихий номер, отчетные документы..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="form-textarea"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              borderTop: "1px solid var(--border-card)",
              paddingTop: "16px",
              marginTop: "6px",
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Создать бронирование"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
