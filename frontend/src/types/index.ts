export type RoomCategory =
  | "dorm_male"
  | "dorm_female"
  | "dorm_mixed"
  | "private_single"
  | "private_double"
  | "private_family";

export type BedTier = "bottom" | "top" | "single";

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type BookingSource =
  | "walk_in"
  | "phone"
  | "website"
  | "booking_com"
  | "other";

export type PaymentType = "cash" | "card" | "transfer" | "deposit";
export type PaymentStatus = "completed" | "refunded";

export interface Bed {
  id: number;
  room_id: number;
  bed_number: string;
  tier: BedTier;
  price_modifier: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: number;
  number: string;
  floor: number;
  category: RoomCategory;
  capacity: number;
  base_price_per_night: number;
  description?: string | null;
  is_active: boolean;
  beds: Bed[];
  created_at?: string;
  updated_at?: string;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  phone: string;
  email?: string | null;
  passport_number?: string | null;
  citizenship?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GuestSummary extends Guest {
  total_bookings: number;
  total_spent: number;
}

export interface Payment {
  id: number;
  booking_id: number;
  guest_id: number;
  amount: number;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  notes?: string | null;
  guest_name?: string | null;
  booking_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  guest_id: number;
  room_id: number;
  bed_id?: number | null;
  check_in_date: string;
  check_out_date: string;
  status: BookingStatus;
  source: BookingSource;
  total_amount: number;
  paid_amount: number;
  deposit_amount: number;
  balance_due: number;
  special_requests?: string | null;
  actual_check_in_at?: string | null;
  actual_check_out_at?: string | null;
  created_at?: string;
  updated_at?: string;
  guest?: Guest | null;
  room_number?: string | null;
  room_category?: string | null;
  bed_number?: string | null;
  payments?: Payment[];
}

export interface ChessboardBookingSegment {
  id: number;
  booking_number: string;
  guest_id: number;
  guest_name: string;
  guest_phone: string;
  room_id: number;
  bed_id?: number | null;
  check_in_date: string;
  check_out_date: string;
  status: BookingStatus;
  total_amount: number;
  paid_amount: number;
  deposit_amount: number;
  balance_due: number;
}

export interface ChessboardBed {
  id: number;
  room_id: number;
  bed_number: string;
  tier: BedTier;
  price_modifier: number;
  is_active: boolean;
  bookings: ChessboardBookingSegment[];
}

export interface ChessboardRoom {
  id: number;
  number: string;
  floor: number;
  category: RoomCategory;
  capacity: number;
  base_price_per_night: number;
  is_active: boolean;
  beds: ChessboardBed[];
  room_bookings: ChessboardBookingSegment[];
}

export interface ChessboardResponse {
  start_date: string;
  end_date: string;
  total_rooms: number;
  total_beds: number;
  rooms: ChessboardRoom[];
}

export interface TodayStats {
  total_rooms: number;
  total_beds: number;
  occupied_beds_today: number;
  occupancy_rate_percent: number;
  check_ins_today: number;
  check_outs_today: number;
  living_guests_today: number;
  today_revenue: number;
  total_unpaid_balance: number;
}
