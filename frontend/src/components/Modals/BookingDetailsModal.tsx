"use client";

import React, { useState } from "react";
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Bed,
  Calendar,
  FileText,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Booking, BookingStatus } from "@/types";

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (bookingId: number, paymentAmount?: number, depositAmount?: number) => Promise<void>;
  onCheckOut: (bookingId: number, refundDeposit?: number) => Promise<void>;
  onAddPayment: (bookingId: number, guestId: number) => void;
  onCancel: (bookingId: number) => Promise<void>;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  isOpen,
  onClose,
  onCheckIn,
  onCheckOut,
  onAddPayment,
  onCancel,
}) => {
  const [checkInPayment, setCheckInPayment] = useState<string>("");
  const [checkInDeposit, setCheckInDeposit] = useState<string>("");
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  const [refundDepositAmount, setRefundDepositAmount] = useState<string>("");
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !booking) return null;

  const handleExecuteCheckIn = async () => {
    setIsProcessing(true);
    try {
      await onCheckIn(
        booking.id,
        checkInPayment ? Number(checkInPayment) : undefined,
        checkInDeposit ? Number(checkInDeposit) : undefined
      );
      setShowCheckInForm(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCheckOut = async () => {
    setIsProcessing(true);
    try {
      await onCheckOut(
        booking.id,
        refundDepositAmount ? Number(refundDepositAmount) : undefined
      );
      setShowCheckOutForm(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "640px" }}>
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#fff" }}>
                Бронь {booking.booking_number}
              </h3>
              <span
                className={`badge ${
                  booking.status === "checked_in"
                    ? "badge-emerald"
                    : booking.status === "confirmed"
                    ? "badge-purple"
                    : booking.status === "checked_out"
                    ? "badge-neutral"
                    : "badge-rose"
                }`}
              >
                {booking.status === "checked_in"
                  ? "Проживает"
                  : booking.status === "confirmed"
                  ? "Подтверждено"
                  : booking.status === "checked_out"
                  ? "Выехал"
                  : "Отменено"}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Источник: {booking.source} • Создано:{" "}
              {booking.created_at ? new Date(booking.created_at).toLocaleDateString("ru-RU") : "Недавно"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePrintReceipt}
              className="btn btn-secondary btn-sm btn-icon"
              title="Печать квитанции"
            >
              <Printer size={15} />
            </button>
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
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Guest Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700" }}>
                Гость
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginTop: "2px" }}>
                {booking.guest ? `${booking.guest.last_name} ${booking.guest.first_name}` : "Гость"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                <span>{booking.guest?.phone || "—"}</span>
                {booking.guest?.email && <span>• {booking.guest.email}</span>}
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)" }}>
              <div>Паспорт: <b style={{ color: "#fff" }}>{booking.guest?.passport_number || "—"}</b></div>
              <div>Гражданство: <b style={{ color: "#fff" }}>{booking.guest?.citizenship || "Россия"}</b></div>
            </div>
          </div>

          {/* Accommodation & Dates Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700" }}>
                Размещение
              </div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                Комната №{booking.room_number || booking.room_id}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--accent-sky)", marginTop: "2px" }}>
                {booking.bed_number ? `Спальное место: ${booking.bed_number}` : "Номер целиком"}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700" }}>
                Даты проживания
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                {booking.check_in_date} → {booking.check_out_date}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {Math.max(
                  1,
                  Math.round(
                    (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{" "}
                ночей
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div
            style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700" }}>
                Финансовый расчет
              </span>
              <button
                onClick={() => onAddPayment(booking.id, booking.guest_id)}
                className="btn btn-secondary btn-sm"
                style={{ padding: "3px 8px", fontSize: "11.5px" }}
              >
                <CreditCard size={13} /> Добавить оплату
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Общая сумма</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#fff", marginTop: "2px" }}>
                  {booking.total_amount} ₽
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Оплачено</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--accent-emerald)", marginTop: "2px" }}>
                  {booking.paid_amount} ₽
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>К доплате (Долг)</div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: booking.balance_due > 0 ? "var(--accent-amber)" : "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {booking.balance_due} ₽
                </div>
              </div>
            </div>

            {Number(booking.deposit_amount) > 0 && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={14} />
                Залог на руках: <b>{booking.deposit_amount} ₽</b>
              </div>
            )}
          </div>

          {/* Special Requests */}
          {booking.special_requests && (
            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "8px" }}>
              <b>Примечание:</b> {booking.special_requests}
            </div>
          )}

          {/* Inline Action Forms */}
          {showCheckInForm && (
            <div
              style={{
                background: "var(--accent-emerald-bg)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>
                Заселение гостя (Check-in)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Принять доплату (₽)</label>
                  <input
                    type="number"
                    placeholder={String(booking.balance_due)}
                    value={checkInPayment}
                    onChange={(e) => setCheckInPayment(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Принять залог (₽)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={checkInDeposit}
                    onChange={(e) => setCheckInDeposit(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowCheckInForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCheckIn}
                  className="btn btn-emerald btn-sm"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Заселение..." : "Подтвердить заезд"}
                </button>
              </div>
            </div>
          )}

          {showCheckOutForm && (
            <div
              style={{
                background: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: "700", color: "#fff", fontSize: "14px" }}>
                Выселение гостя (Check-out)
              </div>
              <div>
                <label className="form-label">Сумма возврата залога (₽)</label>
                <input
                  type="number"
                  placeholder={String(booking.deposit_amount)}
                  value={refundDepositAmount}
                  onChange={(e) => setRefundDepositAmount(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowCheckOutForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCheckOut}
                  className="btn btn-rose btn-sm"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Выселение..." : "Подтвердить выезд"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border-card)",
              paddingTop: "16px",
            }}
          >
            <div>
              {booking.status !== "cancelled" && booking.status !== "checked_out" && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="btn btn-rose btn-sm"
                  disabled={isProcessing}
                >
                  <XCircle size={14} />
                  Отменить бронь
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {booking.status === "confirmed" && !showCheckInForm && (
                <button
                  onClick={() => {
                    setCheckInPayment(String(booking.balance_due));
                    setCheckInDeposit(String(booking.deposit_amount || 500));
                    setShowCheckInForm(true);
                  }}
                  className="btn btn-emerald"
                >
                  <ArrowDownLeft size={16} />
                  Заселить (Check-in)
                </button>
              )}

              {booking.status === "checked_in" && !showCheckOutForm && (
                <button
                  onClick={() => {
                    setRefundDepositAmount(String(booking.deposit_amount || 0));
                    setShowCheckOutForm(true);
                  }}
                  className="btn btn-secondary"
                  style={{ borderColor: "var(--accent-amber)", color: "var(--accent-amber)" }}
                >
                  <ArrowUpRight size={16} />
                  Выселить (Check-out)
                </button>
              )}

              <button type="button" onClick={onClose} className="btn btn-secondary">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
