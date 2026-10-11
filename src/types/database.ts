export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "administrator" | "staff" | "customer";
  account_status: "active" | "suspended";
  created_at: string;
  updated_at: string;
};

export type TourPackage = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  short_description: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  price_per_person: number;
  minimum_travelers: number;
  maximum_travelers: number;
  inclusions: Json;
  exclusions: Json;
  itinerary: Json;
  featured_image_url: string | null;
  publication_status: "draft" | "published" | "archived";
  cancellation_policy: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type DepartureSchedule = {
  id: string;
  package_id: string;
  departure_date: string;
  return_date: string | null;
  departure_time: string | null;
  meeting_point: string;
  capacity: number;
  booking_deadline: string | null;
  status: "open" | "full" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  booking_reference: string;
  customer_id: string;
  departure_schedule_id: string;
  traveler_count: number;
  unit_price_snapshot: number;
  subtotal: number;
  discount_amount: number;
  additional_fees: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  special_requests: string | null;
  status:
    | "pending"
    | "awaiting_payment"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "rejected";
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  payment_reference: string | null;
  payment_date: string;
  verification_status:
    | "pending_verification"
    | "verified"
    | "rejected"
    | "refunded"
    | "partially_refunded";
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffAssignment = {
  id: string;
  schedule_id: string;
  staff_id: string;
  assignment_role: "coordinator" | "guide";
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      tour_packages: Table<TourPackage>;
      departure_schedules: Table<DepartureSchedule>;
      bookings: Table<Booking>;
      payments: Table<Payment>;
      payment_receipts: Table<{
        id: string;
        payment_id: string;
        storage_path: string;
        uploaded_by: string;
        uploaded_at: string;
      }>;
      notifications: Table<{
        id: string;
        recipient_id: string;
        title: string;
        message: string;
        type: string;
        related_booking_id: string | null;
        read_at: string | null;
        created_at: string;
      }>;
      refunds: Table<{
        id: string;
        payment_id: string;
        amount: number;
        reason: string;
        status: string;
        processed_by: string | null;
        processed_at: string | null;
        created_at: string;
      }>;
      staff_assignments: Table<StaffAssignment>;
      contact_messages: Table<{
        id: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        status: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_booking: {
        Args: {
          p_schedule_id: string;
          p_traveler_count: number;
          p_special_requests?: string | null;
          p_traveler_names: Json;
        };
        Returns: string;
      };
      submit_payment: {
        Args: {
          p_booking_id: string;
          p_amount: number;
          p_payment_method: string;
          p_payment_reference: string | null;
          p_receipt_path: string;
        };
        Returns: string;
      };
      record_manual_payment: {
        Args: {
          p_booking_id: string;
          p_amount: number;
          p_payment_method: string;
          p_payment_reference: string | null;
          p_payment_date: string;
        };
        Returns: string;
      };
      get_public_departures: {
        Args: { p_package_id: string | null };
        Returns: (DepartureSchedule & { remaining_seats: number })[];
      };
      submit_contact_message: {
        Args: {
          p_name: string;
          p_email: string;
          p_subject: string;
          p_message: string;
        };
        Returns: string;
      };
      cancel_my_booking: {
        Args: { p_booking_id: string; p_reason: string };
        Returns: undefined;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      record_refund: {
        Args: { p_payment_id: string; p_amount: number; p_reason: string };
        Returns: string;
      };
      set_profile_access: {
        Args: {
          p_profile_id: string;
          p_role: Profile["role"];
          p_account_status: Profile["account_status"];
        };
        Returns: undefined;
      };
      set_booking_status: {
        Args: {
          p_booking_id: string;
          p_status: Booking["status"];
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      verify_payment: {
        Args: {
          p_payment_id: string;
          p_approved: boolean;
          p_rejection_reason?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
