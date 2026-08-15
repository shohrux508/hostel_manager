"use client";

import React, { useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  RotateCcw,
  ShieldCheck,
  Plus,
  Calendar,
} from "lucide-react";
import { Payment, PaymentStatus, PaymentType, TodayStats } from "@/types";

interface FinancesViewProps {
  payments: Payment[];
  stats: TodayStats | null;
  onOpenNewPayment: () => void;
  onRefundPayment: (paymentId: number) => void;
  isLoading: boolean;
}

const TYPE_CONFIG: Record<PaymentType, { label: string; badgeClass: string; icon: React.ElementType }> = {
  cash: { label: "Наличные", badgeClass: "badge-emerald", icon: Banknote },
  card: { label: "Банковская карта", badgeClass: "badge-sky", icon: CreditCard },
  transfer: { label: "Безнал / СБП", badgeClass: "badge-purple", icon: Wallet },
  deposit: { label: "Залоговый депозит", badgeClass: "badge-amber", icon: ShieldCheck },
};

export const FinancesView: React.FC<FinancesViewProps> = ({
  payments,
  stats,
  onOpenNewPayment,
  onRefundPayment,
  isLoading,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredPayments = payments.filter((p) => {
    if (typeFilter !== "all" && p.payment_type !== typeFilter) return false;
    return true;
  });

  const totalCollected = payments
    .filter((p) => p.payment_status === "completed" && p.payment_type !== "deposit")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalDeposits = payments
    .filter((p) => p.payment_status === "completed" && p.payment_type === "deposit")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Касса, платежи и финансовый учет</h2>
          <p>Прием оплат, учет залогов, история транзакций и возвратов</p>
        </div>

        <button onClick={onOpenNewPayment} className="btn btn-primary">
          <Plus size={16} />
          Принять оплату
        </button>
      </div>

      {/* Financial KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Today's Revenue */}
        <div className="glass-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Выручка сегодня
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "var(--accent-emerald-bg)", color: "var(--accent-emerald)" }}>
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#fff", marginTop: "10px" }}>
            {stats?.today_revenue ?? 0} ₽
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Все завершенные платежи
          </div>
        </div>

        {/* Total Collected */}
        <div className="glass-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Собрано всего
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "var(--accent-sky-bg)", color: "var(--accent-sky)" }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#fff", marginTop: "10px" }}>
            {totalCollected} ₽
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            За вычетом залогов
          </div>
        </div>

        {/* Deposits on hand */}
        <div className="glass-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Залоги на руках
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "var(--accent-amber-bg)", color: "var(--accent-amber)" }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--accent-amber)", marginTop: "10px" }}>
            {totalDeposits} ₽
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            К возврату при выезде
          </div>
        </div>

        {/* Unpaid Balance */}
        <div className="glass-card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
              Дебиторка (Неоплачено)
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", background: "var(--accent-rose-bg)", color: "var(--accent-rose)" }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--accent-rose)", marginTop: "10px" }}>
            {stats?.total_unpaid_balance ?? 0} ₽
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Ожидает погашения
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Все платежи" },
            { id: "cash", label: "Наличные" },
            { id: "card", label: "Банковские карты" },
            { id: "transfer", label: "СБП / Переводы" },
            { id: "deposit", label: "Залоги" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              style={{
                border: "none",
                background: typeFilter === tab.id ? "var(--accent-primary)" : "rgba(255,255,255,0.04)",
                color: typeFilter === tab.id ? "#fff" : "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12.5px",
                fontWeight: typeFilter === tab.id ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
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
              <th style={{ padding: "14px 18px" }}>Дата и время</th>
              <th style={{ padding: "14px 18px" }}>Гость / Бронь</th>
              <th style={{ padding: "14px 18px" }}>Способ оплаты</th>
              <th style={{ padding: "14px 18px" }}>Сумма</th>
              <th style={{ padding: "14px 18px" }}>Статус</th>
              <th style={{ padding: "14px 18px" }}>Примечание</th>
              <th style={{ padding: "14px 18px", textAlign: "right" }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px 18px", textAlign: "center", color: "var(--text-muted)" }}>
                  {isLoading ? "Загрузка транзакций..." : "Платежи не найдены"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => {
                const typeCfg = TYPE_CONFIG[p.payment_type] || {
                  label: p.payment_type,
                  badgeClass: "badge-neutral",
                  icon: Wallet,
                };
                const TypeIcon = typeCfg.icon;
                const isRefunded = p.payment_status === "refunded";

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      opacity: isRefunded ? 0.6 : 1,
                    }}
                  >
                    {/* Date */}
                    <td style={{ padding: "14px 18px", color: "var(--text-secondary)", fontSize: "12.5px" }}>
                      {p.created_at ? new Date(p.created_at).toLocaleString("ru-RU") : "Недавно"}
                    </td>

                    {/* Guest / Booking */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "700", color: "#fff" }}>
                        {p.guest_name || `Гость #${p.guest_id}`}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--accent-primary)", marginTop: "2px" }}>
                        Бронь: {p.booking_number || `#${p.booking_id}`}
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 18px" }}>
                      <span className={`badge ${typeCfg.badgeClass}`}>
                        <TypeIcon size={12} />
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: "14px 18px" }}>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "14px",
                          color: isRefunded ? "var(--text-muted)" : "var(--accent-emerald)",
                          textDecoration: isRefunded ? "line-through" : "none",
                        }}
                      >
                        {p.amount} ₽
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 18px" }}>
                      <span className={`badge ${isRefunded ? "badge-rose" : "badge-emerald"}`}>
                        {isRefunded ? "Возвращено" : "Проведено"}
                      </span>
                    </td>

                    {/* Notes */}
                    <td style={{ padding: "14px 18px", color: "var(--text-secondary)", fontSize: "12px", maxWidth: "200px" }}>
                      {p.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      {!isRefunded && (
                        <button
                          onClick={() => onRefundPayment(p.id)}
                          className="btn btn-rose btn-sm"
                          title="Оформить возврат"
                        >
                          <RotateCcw size={12} />
                          Возврат
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
