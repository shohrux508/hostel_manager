"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ChessboardView } from "@/components/Chessboard/ChessboardView";
import { RoomsView } from "@/components/Rooms/RoomsView";
import { BookingsView } from "@/components/Bookings/BookingsView";
import { GuestsView } from "@/components/Guests/GuestsView";
import { FinancesView } from "@/components/Finances/FinancesView";
import { QuickBookingModal } from "@/components/Modals/QuickBookingModal";
import { BookingDetailsModal } from "@/components/Modals/BookingDetailsModal";
import { RoomModal } from "@/components/Modals/RoomModal";
import { GuestModal } from "@/components/Modals/GuestModal";
import { PaymentModal } from "@/components/Modals/PaymentModal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { api } from "@/lib/api";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Booking,
  ChessboardResponse,
  GuestSummary,
  Payment,
  Room,
  TodayStats,
} from "@/types";

export default function HostelDashboard() {
  const [currentTab, setCurrentTab] = useState<NavTab>("chessboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Global Data State
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [chessboardData, setChessboardData] = useState<ChessboardResponse | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Chessboard timeline state
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [daysCount, setDaysCount] = useState<number>(14);

  // Loading & Toasts
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals state
  const [quickBookingOpen, setQuickBookingOpen] = useState(false);
  const [quickBookingPrefill, setQuickBookingPrefill] = useState<{
    roomId?: number;
    bedId?: number | null;
    date?: string;
  }>({});

  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestSummary | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  // Fetch all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate end date for chessboard
      const s = new Date(startDate);
      const e = new Date(s);
      e.setDate(s.getDate() + daysCount);
      const endDate = e.toISOString().split("T")[0];

      const [statsRes, cbRes, roomsRes, guestsRes, bookingsRes, paymentsRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getChessboard(startDate, endDate).catch(() => null),
        api.getRooms().catch(() => []),
        api.getGuests().catch(() => []),
        api.getBookings().catch(() => []),
        api.getPayments().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (cbRes) setChessboardData(cbRes);
      setRooms(roomsRes);
      setGuests(guestsRes);
      setBookings(bookingsRes);
      setPayments(paymentsRes);
    } catch (err: any) {
      addToast("error", err.message || "Ошибка загрузки данных с сервера");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, daysCount]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Chessboard actions
  const handleCellClick = (roomId: number, bedId: number | null, dateStr: string) => {
    setQuickBookingPrefill({ roomId, bedId, date: dateStr });
    setQuickBookingOpen(true);
  };

  const handleSelectBooking = async (bookingId: number) => {
    try {
      const b = await api.getBooking(bookingId);
      setSelectedBooking(b);
      setBookingDetailsOpen(true);
    } catch (err: any) {
      addToast("error", "Не удалось загрузить данные бронирования");
    }
  };

  // Quick booking submit
  const handleQuickBookingSubmit = async (data: any) => {
    await api.createBooking(data);
    addToast("success", "Бронирование успешно создано!");
    loadAllData();
  };

  // Check-in
  const handleCheckIn = async (bookingId: number, paymentAmount?: number, depositAmount?: number) => {
    try {
      await api.checkInBooking(bookingId, { payment_amount: paymentAmount, deposit_amount: depositAmount });
      addToast("success", "Гость успешно заселен!");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка заселения");
    }
  };

  // Check-out
  const handleCheckOut = async (bookingId: number, refundDeposit?: number) => {
    try {
      await api.checkOutBooking(bookingId, { deposit_refund_amount: refundDeposit });
      addToast("success", "Гость успешно выселен!");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка выселения");
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Вы действительно хотите отменить эту бронь?")) return;
    try {
      await api.cancelBooking(bookingId);
      addToast("info", "Бронирование отменено");
      setBookingDetailsOpen(false);
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка отмены");
    }
  };

  // Room CRUD
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomModalOpen(true);
  };
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomModalOpen(true);
  };
  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Удалить эту комнату и все её места?")) return;
    try {
      await api.deleteRoom(roomId);
      addToast("success", "Комната удалена");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка удаления");
    }
  };
  const handleAddBed = async (roomId: number) => {
    const bedName = prompt("Введите номер или название спального места (например '5Н' или 'Место 3'):");
    if (!bedName) return;
    try {
      await api.createBed(roomId, {
        bed_number: bedName.trim(),
        tier: "single",
        price_modifier: 0,
      });
      addToast("success", "Спальное место добавлено");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка добавления места");
    }
  };
  const handleDeleteBed = async (bedId: number) => {
    if (!confirm("Удалить это спальное место?")) return;
    try {
      await api.deleteBed(bedId);
      addToast("success", "Спальное место удалено");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка удаления");
    }
  };
  const handleRoomModalSubmit = async (data: any) => {
    if (editingRoom) {
      await api.updateRoom(editingRoom.id, data);
      addToast("success", "Комната обновлена");
    } else {
      await api.createRoom(data);
      addToast("success", "Новая комната создана");
    }
    loadAllData();
  };

  const handleResetHostelData = async () => {
    if (!confirm("Сбросить номерной фонд к 10 комнатам по 4 места (40 коек)? Все текущие бронирования будут обновлены.")) return;
    try {
      await api.resetHostelData();
      addToast("success", "Номерной фонд успешно инициализирован: 10 комнат по 4 спальных места!");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка сброса данных");
    }
  };

  // Guest CRUD
  const handleOpenAddGuest = () => {
    setEditingGuest(null);
    setGuestModalOpen(true);
  };
  const handleEditGuest = (guest: GuestSummary) => {
    setEditingGuest(guest);
    setGuestModalOpen(true);
  };
  const handleDeleteGuest = async (guestId: number) => {
    if (!confirm("Удалить гостя из реестра?")) return;
    try {
      await api.deleteGuest(guestId);
      addToast("success", "Гость удален из базы");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка удаления");
    }
  };
  const handleGuestSearch = async (query: string) => {
    try {
      const res = await api.getGuests(query);
      setGuests(res);
    } catch (err: any) {
      addToast("error", "Ошибка поиска гостей");
    }
  };
  const handleGuestModalSubmit = async (data: any) => {
    if (editingGuest) {
      await api.updateGuest(editingGuest.id, data);
      addToast("success", "Профиль гостя обновлен");
    } else {
      await api.createGuest(data);
      addToast("success", "Гость добавлен в реестр");
    }
    loadAllData();
  };

  // Payments
  const handleOpenNewPayment = (booking?: Booking) => {
    setPaymentBooking(booking || null);
    setPaymentModalOpen(true);
  };
  const handlePaymentModalSubmit = async (data: any) => {
    await api.createPayment(data);
    addToast("success", "Оплата успешно проведена в кассе");
    loadAllData();
    if (bookingDetailsOpen && selectedBooking) {
      const updated = await api.getBooking(selectedBooking.id);
      setSelectedBooking(updated);
    }
  };
  const handleRefundPayment = async (paymentId: number) => {
    if (!confirm("Оформить возврат данного платежа?")) return;
    try {
      await api.refundPayment(paymentId);
      addToast("success", "Возврат платежа оформлен");
      loadAllData();
    } catch (err: any) {
      addToast("error", err.message || "Ошибка возврата");
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={stats}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Screen Layout */}
      <main className="main-content">
        {/* Top Header */}
        <Header
          onOpenQuickBooking={() => {
            setQuickBookingPrefill({});
            setQuickBookingOpen(true);
          }}
          onRefresh={loadAllData}
          isLoading={isLoading}
          stats={stats}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Page Content View */}
        <div className="page-body">
          {currentTab === "chessboard" && (
            <ChessboardView
              data={chessboardData}
              startDate={startDate}
              onStartDateChange={setStartDate}
              daysCount={daysCount}
              onDaysCountChange={setDaysCount}
              onSelectBooking={handleSelectBooking}
              onCellClick={handleCellClick}
              isLoading={isLoading}
            />
          )}

          {currentTab === "rooms" && (
            <RoomsView
              rooms={rooms}
              onOpenAddRoom={handleOpenAddRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              onAddBed={handleAddBed}
              onDeleteBed={handleDeleteBed}
              onResetData={handleResetHostelData}
              isLoading={isLoading}
            />
          )}

          {currentTab === "bookings" && (
            <BookingsView
              bookings={bookings}
              onOpenQuickBooking={() => {
                setQuickBookingPrefill({});
                setQuickBookingOpen(true);
              }}
              onSelectBooking={handleSelectBooking}
              onCheckIn={(b) => {
                setSelectedBooking(b);
                setBookingDetailsOpen(true);
              }}
              onCheckOut={(b) => {
                setSelectedBooking(b);
                setBookingDetailsOpen(true);
              }}
              onAddPayment={(b) => handleOpenNewPayment(b)}
              onCancel={handleCancelBooking}
              isLoading={isLoading}
            />
          )}

          {currentTab === "guests" && (
            <GuestsView
              guests={guests}
              onOpenAddGuest={handleOpenAddGuest}
              onSelectGuest={(id) => {
                const g = guests.find((item) => item.id === id);
                if (g) handleEditGuest(g);
              }}
              onEditGuest={handleEditGuest}
              onDeleteGuest={handleDeleteGuest}
              onSearch={handleGuestSearch}
              isLoading={isLoading}
            />
          )}

          {currentTab === "finances" && (
            <FinancesView
              payments={payments}
              stats={stats}
              onOpenNewPayment={() => handleOpenNewPayment()}
              onRefundPayment={handleRefundPayment}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <QuickBookingModal
        isOpen={quickBookingOpen}
        onClose={() => setQuickBookingOpen(false)}
        onSubmit={handleQuickBookingSubmit}
        rooms={rooms}
        guests={guests}
        initialRoomId={quickBookingPrefill.roomId}
        initialBedId={quickBookingPrefill.bedId}
        initialDate={quickBookingPrefill.date}
      />

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={bookingDetailsOpen}
        onClose={() => setBookingDetailsOpen(false)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onAddPayment={(bId, gId) => {
          if (selectedBooking) handleOpenNewPayment(selectedBooking);
        }}
        onCancel={handleCancelBooking}
      />

      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSubmit={handleRoomModalSubmit}
        room={editingRoom}
      />

      <GuestModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSubmit={handleGuestModalSubmit}
        guest={editingGuest}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentModalSubmit}
        booking={paymentBooking}
        bookings={bookings}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} stats={stats} />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
