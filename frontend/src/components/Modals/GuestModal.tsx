"use client";

import React, { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import { GuestSummary } from "@/types";

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  guest?: GuestSummary | null;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  guest,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [citizenship, setCitizenship] = useState("Россия");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      if (guest) {
        setFirstName(guest.first_name);
        setLastName(guest.last_name);
        setMiddleName(guest.middle_name || "");
        setPhone(guest.phone);
        setEmail(guest.email || "");
        setPassportNumber(guest.passport_number || "");
        setCitizenship(guest.citizenship || "Россия");
        setNotes(guest.notes || "");
      } else {
        setFirstName("");
        setLastName("");
        setMiddleName("");
        setPhone("");
        setEmail("");
        setPassportNumber("");
        setCitizenship("Россия");
        setNotes("");
      }
    }
  }, [isOpen, guest]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMsg("Заполните Фамилию, Имя и Телефон гостя");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        passport_number: passportNumber.trim() || undefined,
        citizenship: citizenship.trim() || "Россия",
        notes: notes.trim() || undefined,
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
              <User size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "700" }}>
              {guest ? `Карточка гостя: ${guest.last_name} ${guest.first_name}` : "Добавление гостя в реестр"}
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
              <label className="form-label">Отчество</label>
              <input
                type="text"
                placeholder="Иванович"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
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
                placeholder="ivanov@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Паспорт (серия и номер)</label>
            <input
              type="text"
              placeholder="4518 998877"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Заметки / Особенности</label>
            <textarea
              rows={2}
              placeholder="Предпочтения по комнатам, постоянный клиент..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : guest ? "Сохранить профиль" : "Создать гостя"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
