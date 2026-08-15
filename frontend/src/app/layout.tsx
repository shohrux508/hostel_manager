import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostel PMS — Система управления хостелом",
  description: "Интерактивная шахматка бронирований, учет номеров и спальных мест, база гостей, заселение и касса.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
