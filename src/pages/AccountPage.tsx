import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowRight, LogOut, Upload } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { ErrorState, LoadingState } from "../components/DataState";
import {
  formatError,
  formatPeso,
  getMyBookings,
  getMyPayments,
  requireSupabase,
} from "../lib/data";
import { supabase } from "../lib/supabase";
import type { Booking, Payment } from "../types/database";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
function downloadCsv(bookings: Booking[]) {
  const rows = [
    [
      "Reference",
      "Travelers",
      "Total PHP",
      "Paid PHP",
      "Balance PHP",
      "Status",
      "Created at",
    ],
    ...bookings.map((item) => [
      item.booking_reference,
      item.traveler_count,
      item.total_amount,
      item.amount_paid,
      item.balance_due,
      item.status,
      item.created_at,
    ]),
  ];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "travexgo-my-bookings.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReceiptForm({
  booking,
  onDone,
}: {
  booking: Booking;
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    const method = String(form.get("method"));
    const reference = String(form.get("reference") ?? "").trim() || null;
    const file = form.get("receipt");
    if (!(file instanceof File) || !file.size) {
      setError("Choose an image or PDF receipt to upload.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Receipt files must be 8 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: userError } = await requireSupabase().auth.getUser();
      if (userError) throw userError;
      if (!data.user) throw new Error("Sign in to upload payment evidence.");
      const path = `${data.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await requireSupabase()
        .storage.from("payment-receipts")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: rpcError } = await requireSupabase().rpc(
        "submit_payment",
        {
          p_booking_id: booking.id,
          p_amount: amount,
          p_payment_method: method,
          p_payment_reference: reference,
          p_receipt_path: path,
        },
      );
      if (rpcError) {
        await requireSupabase().storage.from("payment-receipts").remove([path]);
        throw rpcError;
      }
      onDone();
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="form-stack payment-form" onSubmit={submit}>
      <label>
        Amount paid
        <input
          className="field-control"
          name="amount"
          type="number"
          min="1"
          max={booking.balance_due}
          step="0.01"
          required
        />
      </label>
      <label>
        Payment method
        <select className="field-control" name="method" required>
          <option value="gcash">GCash</option>
          <option value="maya">Maya</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
        </select>
      </label>
      <label>
        Payment reference <span style={{ fontWeight: 400 }}>(optional)</span>
        <input className="field-control" name="reference" maxLength={120} />
      </label>
      <label>
        Receipt (JPG, PNG, WebP, PDF; max 8 MB)
        <input
          className="field-control"
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
        />
      </label>
      {error && (
        <div className="form-notice" role="alert">
          {error}
        </div>
      )}
      <button className="button button-dark" disabled={busy}>
        {busy ? "Uploading evidence…" : "Submit for verification"}{" "}
        <Upload size={14} />
      </button>
      <p className="form-alt">
        Uploaded evidence is not verification of funds. A staff member reviews
        it separately.
      </p>
    </form>
  );
}

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [accountNotice, setAccountNotice] = useState<{ message: string; error: boolean } | null>(null);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const queryClient = useQueryClient();
  const bookings = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
    enabled: Boolean(user),
  });
  const payments = useQuery({
    queryKey: ["my-payments"],
    queryFn: getMyPayments,
    enabled: Boolean(user),
  });
  if (loading) return <LoadingState label="Loading your account…" />;
  if (!user) return <Navigate to="/login" replace />;
  const focusBooking = params.get("booking");
  const signOut = async () => {
    setSignOutBusy(true);
    await supabase?.auth.signOut();
    setSignOutBusy(false);
  };
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    setUploadFor(null);
  };
  const cancelBooking = async (booking: Booking) => {
    const reason = window.prompt("Why do you need to cancel this booking?");
    if (!reason?.trim()) return;
    try {
      const { error } = await requireSupabase().rpc("cancel_my_booking", {
        p_booking_id: booking.id,
        p_reason: reason,
      });
      if (error) throw error;
      setAccountNotice({ message: "Booking cancelled.", error: false });
      refresh();
    } catch (error) {
      setAccountNotice({ message: formatError(error), error: true });
    }
  };
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const fullName = String(values.get("full_name") ?? "").trim();
    const phone = String(values.get("phone") ?? "").trim();
    if (fullName.length < 2) {
      setAccountNotice({ message: "Enter your full name.", error: true });
      return;
    }
    const { error } = await requireSupabase()
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", user.id);
    if (error) setAccountNotice({ message: formatError(error), error: true });
    else {
      setAccountNotice({ message: "Profile updated.", error: false });
      setProfileFormOpen(false);
      await refreshProfile();
    }
  };

  return (
    <section className="account-page">
      <div className="account-head">
        <div>
          <span className="eyebrow">YOUR TRAVEL DESK</span>
          <h1>
            Hello
            {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </h1>
          <p>Bookings, payment updates, all in one place.</p>
        </div>
        <div className="account-toolbar">
          <button
            className="button button-quiet"
            onClick={() => setProfileFormOpen(!profileFormOpen)}
          >
            {profileFormOpen ? "Close profile" : "Edit profile"}
          </button>
          <button
            className="button button-quiet"
            onClick={() => bookings.data && downloadCsv(bookings.data)}
            disabled={!bookings.data?.length}
          >
            <ArrowDownToLine size={15} /> Export bookings
          </button>
          <button
            className="button button-quiet"
            onClick={signOut}
            disabled={signOutBusy}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
      {focusBooking && (
        <div className="toast">
          Your booking request has been submitted. Its reference appears below.
        </div>
      )}
      {accountNotice && (
        <div className={`toast ${accountNotice.error ? "error" : ""}`} role="status">
          {accountNotice.message}
        </div>
      )}
      {profileFormOpen && (
        <form className="profile-edit form-stack" onSubmit={saveProfile}>
          <h2>Contact details</h2>
          <label>
            Full name
            <input
              className="field-control"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              minLength={2}
              required
            />
          </label>
          <label>
            Phone number
            <input
              className="field-control"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ""}
            />
          </label>
          <button className="button button-dark" type="submit">
            Save contact details
          </button>
        </form>
      )}
      {bookings.isLoading ? (
        <LoadingState />
      ) : bookings.isError ? (
        <ErrorState message={formatError(bookings.error)} />
      ) : bookings.data?.length ? (
        <>
          <div className="split-section">
            <h2>Your bookings</h2>
            <Link className="text-link" to="/packages">
              Find another trip <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Travelers</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {bookings.data.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.booking_reference}</strong>
                      <br />
                      <small>
                        {new Date(booking.created_at).toLocaleDateString(
                          "en-PH",
                        )}
                      </small>
                    </td>
                    <td>{booking.traveler_count}</td>
                    <td>{formatPeso(booking.total_amount)}</td>
                    <td>{formatPeso(booking.amount_paid)}</td>
                    <td>{formatPeso(booking.balance_due)}</td>
                    <td>
                      <span className={`status-pill status-${booking.status}`}>
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {booking.balance_due > 0 &&
                        !["cancelled", "rejected", "completed"].includes(
                          booking.status,
                        ) && (
                          <button
                            className="inline-button"
                            onClick={() =>
                              setUploadFor(
                                uploadFor === booking.id ? null : booking.id,
                              )
                            }
                          >
                            {uploadFor === booking.id ? "Close" : "Upload proof"}
                          </button>
                        )}
                      {["pending", "awaiting_payment"].includes(
                        booking.status,
                      ) ||
                      (booking.status === "confirmed" &&
                        booking.amount_paid === 0) ? (
                        <button
                          className="inline-button"
                          onClick={() => void cancelBooking(booking)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uploadFor && bookings.data.find((item) => item.id === uploadFor) && (
            <div className="receipt-panel">
              <div className="split-section">
                <h2>Payment evidence</h2>
                <span className="status-pill">Manual verification</span>
              </div>
              <ReceiptForm
                booking={bookings.data.find((item) => item.id === uploadFor)!}
                onDone={refresh}
              />
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          No bookings yet.{" "}
          <Link className="text-link" to="/packages">
            Find a trip <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <div className="split-section">
        <h2>Payment history</h2>
      </div>
      {payments.isLoading ? (
        <LoadingState />
      ) : payments.isError ? (
        <ErrorState message={formatError(payments.error)} />
      ) : payments.data?.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Review status</th>
              </tr>
            </thead>
            <tbody>
              {(payments.data as Payment[]).map((payment) => (
                <tr key={payment.id}>
                  <td>
                    {new Date(
                      `${payment.payment_date}T12:00:00`,
                    ).toLocaleDateString("en-PH")}
                  </td>
                  <td>{formatPeso(payment.amount)}</td>
                  <td>{payment.payment_method.replaceAll("_", " ")}</td>
                  <td>{payment.payment_reference || "—"}</td>
                  <td>
                    <span
                      className={`status-pill status-${payment.verification_status}`}
                    >
                      {payment.verification_status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No payment records yet.</div>
      )}
    </section>
  );
}
