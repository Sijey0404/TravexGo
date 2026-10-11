import { supabase } from "./supabase";
import type {
  Booking,
  DepartureSchedule,
  Payment,
  Profile,
  TourPackage,
} from "../types/database";

export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local.",
    );
  return supabase;
}

export async function getPublishedPackages() {
  const { data, error } = await requireSupabase()
    .from("tour_packages")
    .select("*")
    .eq("publication_status", "published")
    .order("featured_image_url", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data as TourPackage[];
}

export async function getPackageBySlug(slug: string) {
  const { data, error } = await requireSupabase()
    .from("tour_packages")
    .select("*")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as TourPackage | null;
}

export async function getPackageDepartures(packageId: string) {
  const { data, error } = await requireSupabase().rpc("get_public_departures", {
    p_package_id: packageId,
  });
  if (error) throw error;
  return data as (DepartureSchedule & { remaining_seats: number })[];
}

export async function getAllPublicDepartures() {
  const { data, error } = await requireSupabase().rpc("get_public_departures", {
    p_package_id: null,
  });
  if (error) throw error;
  return data as (DepartureSchedule & { remaining_seats: number })[];
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { error } = await requireSupabase().rpc("submit_contact_message", {
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
  });
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getMyBookings() {
  const { data, error } = await requireSupabase()
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getMyPayments() {
  const { data, error } = await requireSupabase()
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

export function formatPeso(amount: number | string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function listValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
