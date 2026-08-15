"use client";

import React, { useState } from "react";
import { X, CreditCard, Banknote, ShieldCheck, Wallet } from "lucide-react";
import { Booking, PaymentType } from "@/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { booking_id: number; guest_id: number; amount: number; payment_type: string; notes?: string }) => Promise<void>;
  booking?: Booking | null;
  bookings: Booking[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  booking,
  bookings,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<number | "">("");
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      if (booking) {
        setSelectedBookingId(booking.id);
        setAmount(booking.balance_due > 0 ? String(booking.balance_due) : "");
      } else {
        setSelectedBookingId(bookings.length > 0 ? bookings[0].id : "");
        setAmount("");
      }
      setPaymentType("cash");
      setNotes("");
    }
  }, [isOpen, booking, bookings]);

  if (!isOpen) return null;

  const currentBooking = booking || bookings.find((b) => b.id === Number(selectedBookingId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setErrorMsg("Выберите бронирование для проведения платежа");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Укажите корректную сумму оплаты");
      return;
    }

    if (!currentBooking?.guest_id) {
      setErrorMsg("Не удалось определить гостя для брони");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSubmit({
        booking_id: Number(selectedBookingId),
        guest_id: currentBooking.guest_id,
        amount: Number(amount),
        payment_type: paymentType,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при сохранении платежа");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
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
              <CreditCard size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700" }}>Прием платежа в кассу</h3>
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

          {!booking && (
            <div>
              <label className="form-label">Бронирование / Гость *</label>
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  const bId = Number(e.target.value) || "";
                  setSelectedBookingId(bId);
                  const found = bookings.find((b) => b.id === bId);
                  if (found && found.balance_due > 0) {
                    setAmount(String(found.balance_due));
                  }
                }}
                className="form-select"
              >
                <option value="">-- Выберите бронь --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_number} — {b.guest ? `${b.guest.last_name} ${b.guest.first_name}` : "Гость"} (Долг: {b.balance_due} ₽)
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentBooking && (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12.5px",
              }}
            >
              <div>
                <div style={{ color: "var(--text-muted)" }}>Гость:</div>
                <div style={{ fontWeight: "700", color: "#fff" }}>
                  {currentBooking.guest ? `${currentBooking.guest.last_name} ${currentBooking.guest.first_name}` : "Гость"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--text-muted)" }}>К доплате:</div>
                <div style={{ fontWeight: "800", color: currentBooking.balance_due > 0 ? "var(--accent-amber)" : "var(--accent-emerald)" }}>
                  {currentBooking.balance_due} ₽
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label className="form-label">Сумма к оплате (₽) *</label>
              <input
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Способ оплаты</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="form-select"
              >
                <option value="cash">Наличные</option>
                <option value="card">Банковская карта</option>
                <option value="transfer">СБП / Перевод</option>
                <option value="deposit">Залоговый депозит</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Комментарий / Чек</label>
            <input
              type="text"
              placeholder="Доплата за продление, залог за ключи..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Проведение..." : "Провести оплату"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
