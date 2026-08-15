"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";

        return (
          <div
            key={t.id}
            className="toast"
            style={{
              borderColor: isSuccess
                ? "rgba(16, 185, 129, 0.4)"
                : isError
                ? "rgba(244, 63, 94, 0.4)"
                : "var(--border-card)",
            }}
          >
            {isSuccess && <CheckCircle2 size={18} color="var(--accent-emerald)" />}
            {isError && <AlertCircle size={18} color="var(--accent-rose)" />}
            {!isSuccess && !isError && <Info size={18} color="var(--accent-primary)" />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
