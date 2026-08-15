import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostel PMS — Система управления хостелом",
  description: "Интерактивная шахматка бронирований, учет номеров и спальных мест, база гостей, заселение и касса.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hostel PMS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090d16",
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
