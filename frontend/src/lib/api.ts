import {
  Booking,
  ChessboardResponse,
  Guest,
  GuestSummary,
  Payment,
  Room,
  TodayStats,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1");

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = "Произошла ошибка при выполнении запроса";
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Stats
  getStats: () => request<TodayStats>("/stats/today"),

  // Chessboard
  getChessboard: (startDate: string, endDate: string) =>
    request<ChessboardResponse>(`/chessboard/?start_date=${startDate}&end_date=${endDate}`),

  // Rooms
  getRooms: (activeOnly = false) =>
    request<Room[]>(`/rooms/?active_only=${activeOnly}`),
  getRoom: (id: number) => request<Room>(`/rooms/${id}`),
  createRoom: (data: {
    number: string;
    floor: number;
    category: string;
    capacity: number;
    base_price_per_night: number;
    description?: string;
    auto_create_beds?: boolean;
    bunk_beds?: boolean;
  }) => request<Room>("/rooms/", { method: "POST", body: JSON.stringify(data) }),
  updateRoom: (id: number, data: Partial<Room>) =>
    request<Room>(`/rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRoom: (id: number) => request<void>(`/rooms/${id}`, { method: "DELETE" }),

  // Beds
  createBed: (roomId: number, data: { bed_number: string; tier: string; price_modifier: number }) =>
    request<void>(`/rooms/${roomId}/beds`, { method: "POST", body: JSON.stringify(data) }),
  deleteBed: (bedId: number) =>
    request<void>(`/rooms/beds/${bedId}`, { method: "DELETE" }),

  // Guests
  getGuests: (search?: string) =>
    request<GuestSummary[]>(`/guests/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getGuest: (id: number) => request<Guest>(`/guests/${id}`),
  createGuest: (data: Omit<Guest, "id" | "created_at" | "updated_at">) =>
    request<Guest>("/guests/", { method: "POST", body: JSON.stringify(data) }),
  updateGuest: (id: number, data: Partial<Guest>) =>
    request<Guest>(`/guests/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGuest: (id: number) => request<void>(`/guests/${id}`, { method: "DELETE" }),

  // Bookings
  getBookings: (params?: {
    status?: string;
    check_in_today?: boolean;
    check_out_today?: boolean;
    living_now?: boolean;
    unpaid_only?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status_filter", params.status);
    if (params?.check_in_today) query.set("check_in_today", "true");
    if (params?.check_out_today) query.set("check_out_today", "true");
    if (params?.living_now) query.set("living_now", "true");
    if (params?.unpaid_only) query.set("unpaid_only", "true");
    return request<Booking[]>(`/bookings/?${query.toString()}`);
  },
  getBooking: (id: number) => request<Booking>(`/bookings/${id}`),
  createBooking: (data: {
    guest_id?: number;
    new_guest?: {
      first_name: string;
      last_name: string;
      middle_name?: string;
      phone: string;
      email?: string;
      passport_number?: string;
      citizenship?: string;
    };
    room_id: number;
    bed_id?: number | null;
    check_in_date: string;
    check_out_date: string;
    source?: string;
    custom_total_amount?: number;
    initial_payment?: number;
    initial_payment_type?: string;
    deposit_amount?: number;
    special_requests?: string;
  }) => request<Booking>("/bookings/", { method: "POST", body: JSON.stringify(data) }),
  updateBooking: (id: number, data: Partial<Booking>) =>
    request<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  checkInBooking: (id: number, data: { payment_amount?: number; payment_type?: string; deposit_amount?: number }) =>
    request<Booking>(`/bookings/${id}/check-in`, { method: "POST", body: JSON.stringify(data) }),
  checkOutBooking: (id: number, data: { deposit_refund_amount?: number }) =>
    request<Booking>(`/bookings/${id}/check-out`, { method: "POST", body: JSON.stringify(data) }),
  cancelBooking: (id: number) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: "POST" }),

  // Payments
  getPayments: (bookingId?: number, guestId?: number) => {
    const query = new URLSearchParams();
    if (bookingId) query.set("booking_id", bookingId.toString());
    if (guestId) query.set("guest_id", guestId.toString());
    return request<Payment[]>(`/payments/?${query.toString()}`);
  },
  createPayment: (data: {
    booking_id: number;
    guest_id: number;
    amount: number;
    payment_type: string;
    notes?: string;
  }) => request<Payment>("/payments/", { method: "POST", body: JSON.stringify(data) }),
  refundPayment: (id: number) =>
    request<Payment>(`/payments/${id}/refund`, { method: "POST" }),

  // System
  resetHostelData: () =>
    request<{ status: string; message: string }>("/system/reset-hostel-data", { method: "POST" }),
};
