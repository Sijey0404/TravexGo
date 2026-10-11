import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  ConnectionNotice,
  ErrorState,
  LoadingState,
} from "../components/DataState";
import { formatError, formatPeso, requireSupabase } from "../lib/data";
import { isSupabaseConfigured } from "../lib/supabase";
import type { DepartureSchedule, TourPackage } from "../types/database";
import { bookingSchema, type BookingFields } from "../validations/forms";

export default function BookingPage() {
  const { scheduleId = "" } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const schedule = useQuery({
    queryKey: ["schedule", scheduleId],
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("departure_schedules")
        .select("*")
        .eq("id", scheduleId)
        .maybeSingle();
      if (error) throw error;
      return data as DepartureSchedule | null;
    },
  });
  const tour = useQuery({
    queryKey: ["package-for-schedule", schedule.data?.package_id],
    enabled: Boolean(schedule.data?.package_id),
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("tour_packages")
        .select("*")
        .eq("id", schedule.data!.package_id)
        .maybeSingle();
      if (error) throw error;
      return data as TourPackage | null;
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFields>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { travelerCount: 1 },
  });
  const travelerCount = watch("travelerCount") || 1;
  const submit = async (values: BookingFields) => {
    setNotice("");
    try {
      const names = values.travelerNames
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean);
      if (names.length !== values.travelerCount) {
        setNotice(
          `Enter one traveler name on each line (${values.travelerCount} names required).`,
        );
        return;
      }
      const { data, error } = await requireSupabase().rpc("create_booking", {
        p_schedule_id: scheduleId,
        p_traveler_count: values.travelerCount,
        p_special_requests: values.specialRequests || null,
        p_traveler_names: names,
      });
      if (error) throw error;
      navigate(`/account?booking=${encodeURIComponent(data)}`);
    } catch (error) {
      setNotice(formatError(error));
    }
  };
  if (!authLoading && !user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(`/book/${scheduleId}`)}`}
        replace
      />
    );
  if (!isSupabaseConfigured)
    return (
      <>
        <ConnectionNotice />
        <div className="editorial-page">
          <h1>
            Booking is <em>offline.</em>
          </h1>
          <p>Connect the Supabase project before requesting a reservation.</p>
        </div>
      </>
    );
  if (schedule.isLoading || (schedule.data && tour.isLoading))
    return <LoadingState label="Checking availability…" />;
  if (schedule.isError || tour.isError)
    return <ErrorState message={formatError(schedule.error ?? tour.error)} />;
  if (!schedule.data || !tour.data)
    return (
      <section className="editorial-page">
        <h1>
          This departure is <em>unavailable.</em>
        </h1>
        <Link className="button button-dark" to="/packages">
          <ArrowLeft size={15} /> Browse trips
        </Link>
      </section>
    );
  const departure = schedule.data;
  const item = tour.data;
  return (
    <>
      <ConnectionNotice />
      <section className="form-page">
        <div className="form-panel" style={{ width: "min(620px,100%)" }}>
          <span className="eyebrow">
            <CalendarDays size={14} /> BOOKING REQUEST
          </span>
          <h1>{item.name}</h1>
          <p>
            {new Date(
              `${departure.departure_date}T12:00:00`,
            ).toLocaleDateString("en-PH", { dateStyle: "full" })}{" "}
            · {departure.meeting_point}
          </p>
          <div className="form-notice success">
            {formatPeso(item.price_per_person)} per person · seats are validated
            again when you submit
          </div>
          {notice && (
            <div className="form-notice" role="alert">
              {notice}
            </div>
          )}
          <form
            className="form-stack"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            <div className="booking-form-grid">
              <label>
                Number of travelers
                <input
                  className="field-control"
                  type="number"
                  min={item.minimum_travelers}
                  max={Math.min(item.maximum_travelers, departure.capacity)}
                  {...register("travelerCount", { valueAsNumber: true })}
                />
                {errors.travelerCount && (
                  <span>{errors.travelerCount.message}</span>
                )}
                <small>
                  Package minimum: {item.minimum_travelers};{" "}
                  {departure.capacity} seats listed for this departure.
                </small>
              </label>
              <label>
                Estimated total
                <strong style={{ display: "block", paddingTop: 12 }}>
                  {formatPeso(item.price_per_person * Number(travelerCount))}
                </strong>
              </label>
              <label className="wide">
                Traveler names{" "}
                <span style={{ fontWeight: 400 }}>one full name per line</span>
                <textarea
                  className="field-control"
                  rows={Math.min(Number(travelerCount) || 1, 5)}
                  placeholder="Lead traveler full name"
                  {...register("travelerNames")}
                />
                {errors.travelerNames && (
                  <span>{errors.travelerNames.message}</span>
                )}
              </label>
              <label className="wide">
                Special requests{" "}
                <span style={{ fontWeight: 400 }}>(optional)</span>
                <textarea
                  className="field-control"
                  rows={3}
                  {...register("specialRequests")}
                />
              </label>
            </div>
            <button
              className="button button-dark"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? "Checking seats…" : "Request this booking"}{" "}
              <ArrowRight size={15} />
            </button>
            <p className="form-alt">
              This sends a reservation request only. Your seats are not
              confirmed until reviewed by TravexGo.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
