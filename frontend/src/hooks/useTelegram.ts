"use client";

import { useEffect, useState } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      setTg(webApp);

      try {
        webApp.ready();
        webApp.expand();
        if (webApp.enableClosingConfirmation) {
          webApp.enableClosingConfirmation();
        }
        if (webApp.setHeaderColor) {
          webApp.setHeaderColor("#0f172a");
        }
        if (webApp.setBackgroundColor) {
          webApp.setBackgroundColor("#0a0f1d");
        }

        if (webApp.initDataUnsafe?.user) {
          setUser(webApp.initDataUnsafe.user);
          setIsInsideTelegram(true);
        } else if (webApp.platform && webApp.platform !== "unknown") {
          setIsInsideTelegram(true);
        }
      } catch (e) {
        console.warn("Telegram WebApp init error", e);
      }
    }
  }, []);

  const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") => {
    if (!tg?.HapticFeedback) return;
    try {
      if (type === "success" || type === "warning" || type === "error") {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch {
      // ignore
    }
  };

  const closeWebApp = () => {
    tg?.close?.();
  };

  return {
    tg,
    user,
    isInsideTelegram,
    triggerHaptic,
    closeWebApp,
  };
}

// Global declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}
