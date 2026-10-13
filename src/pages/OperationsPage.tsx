import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarPlus,
  Check,
  CircleDollarSign,
  ClipboardList,
  PackagePlus,
  Users,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { ErrorState, LoadingState } from "../components/DataState";
import { formatError, formatPeso, requireSupabase } from "../lib/data";
import { supabase } from "../lib/supabase";
import type {
  Booking,
  DepartureSchedule,
  Payment,
  Profile,
  StaffAssignment,
  TourPackage,
} from "../types/database";

type Tab =
  | "overview"
  | "bookings"
  | "payments"
  | "packages"
  | "schedules"
  | "customers"
  | "users"
  | "reports";
const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "bookings", label: "Bookings" },
  { key: "payments", label: "Payments" },
  { key: "packages", label: "Packages" },
  { key: "schedules", label: "Departures" },
  { key: "customers", label: "Customers" },
  { key: "users", label: "Users & roles" },
  { key: "reports", label: "Reports" },
];
const cell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
function exportRows(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function packageSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OperationsPage() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [busyId, setBusyId] = useState("");
  const [paymentReview, setPaymentReview] = useState<{
    id: string;
    approve: boolean;
  } | null>(null);
  const [packageForm, setPackageForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(false);
  const [manualPaymentForm, setManualPaymentForm] = useState(false);
  const [profileDrafts, setProfileDrafts] = useState<Record<string, { role: Profile["role"]; account_status: Profile["account_status"] }>>({});
  const queryClient = useQueryClient();
  const authorized =
    profile?.role === "administrator" || profile?.role === "staff";
  const isAdministrator = profile?.role === "administrator";
  const enabled = Boolean(user && authorized);
  const bookings = useQuery({
    queryKey: ["ops", "bookings"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });
  const payments = useQuery({
    queryKey: ["ops", "payments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });
  const packages = useQuery({
    queryKey: ["ops", "packages"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("tour_packages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TourPackage[];
    },
  });
  const schedules = useQuery({
    queryKey: ["ops", "schedules"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("departure_schedules")
        .select("*")
        .order("departure_date");
      if (error) throw error;
      return data as DepartureSchedule[];
    },
  });
  const customerCount = useQuery({
    queryKey: ["ops", "customer-count"],
    enabled,
    queryFn: async () => {
      const { count, error } = await requireSupabase()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer");
      if (error) throw error;
      return count ?? 0;
    },
  });
  const receipts = useQuery({
    queryKey: ["ops", "receipts"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("payment_receipts")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
  const refunds = useQuery({
    queryKey: ["ops", "refunds"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const staffAssignments = useQuery({
    queryKey: ["ops", "staff-assignments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("staff_assignments")
        .select("*");
      if (error) throw error;
      return data as StaffAssignment[];
    },
  });
  const staffProfiles = useQuery({
    queryKey: ["ops", "staff-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("profiles")
        .select("id,full_name,email,phone,role,account_status,created_at,updated_at")
        .eq("role", "staff")
        .eq("account_status", "active")
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });
  const customers = useQuery({
    queryKey: ["ops", "customers"],
    enabled: enabled && tab === "customers",
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
  const userProfiles = useQuery({
    queryKey: ["ops", "user-profiles"],
    enabled: enabled && isAdministrator && tab === "users",
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["ops"] });
    void queryClient.invalidateQueries({ queryKey: ["packages"] });
    void queryClient.invalidateQueries({ queryKey: ["departures"] });
  };
  const doAction = async (
    id: string,
    action: () => Promise<unknown>,
    message: string,
  ) => {
    setBusyId(id);
    setNotice(null);
    try {
      await action();
      setNotice({ message, error: false });
      refresh();
    } catch (error) {
      setNotice({ message: formatError(error), error: true });
    } finally {
      setBusyId("");
    }
  };

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        month: date.toLocaleDateString("en", { month: "short" }),
        bookings: 0,
        collected: 0,
      };
    });
    for (const booking of bookings.data ?? []) {
      const month = months.find(
        (item) => item.key === booking.created_at.slice(0, 7),
      );
      if (month && !["cancelled", "rejected"].includes(booking.status))
        month.bookings += 1;
    }
    for (const payment of payments.data ?? []) {
      const month = months.find(
        (item) => item.key === payment.payment_date.slice(0, 7),
      );
      if (
        month &&
        ["verified", "partially_refunded", "refunded"].includes(
          payment.verification_status,
        )
      )
        month.collected += Number(payment.amount);
    }
    for (const refund of refunds.data ?? []) {
      if (refund.status !== "processed" || !refund.processed_at) continue;
      const month = months.find(
        (item) => item.key === refund.processed_at!.slice(0, 7),
      );
      if (month) month.collected -= Number(refund.amount);
    }
    return months;
  }, [bookings.data, payments.data, refunds.data]);
  const paidTotal = (bookings.data ?? []).reduce(
    (sum, booking) => sum + Number(booking.amount_paid),
    0,
  );
  const pendingBookings = (bookings.data ?? []).filter((booking) =>
    ["pending", "awaiting_payment"].includes(booking.status),
  ).length;
  const outstanding = (bookings.data ?? [])
    .filter(
      (booking) =>
        !["cancelled", "rejected", "completed"].includes(booking.status),
    )
    .reduce((sum, booking) => sum + Number(booking.balance_due), 0);
  const upcoming = (schedules.data ?? []).filter(
    (schedule) =>
      schedule.departure_date >= new Date().toISOString().slice(0, 10) &&
      schedule.status === "open",
  ).length;

  if (loading) return <LoadingState label="Checking your access…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!authorized)
    return (
      <section className="editorial-page">
        <span className="eyebrow">RESTRICTED WORKSPACE</span>
        <h1>
          This area is <em>staff only.</em>
        </h1>
        <p>Your account does not have permission to view operations data.</p>
        <Link className="button button-dark" to="/account">
          Back to my trips <ArrowRight size={15} />
        </Link>
      </section>
    );
  if (
    bookings.isLoading ||
    payments.isLoading ||
    packages.isLoading ||
    schedules.isLoading ||
    customerCount.isLoading ||
    receipts.isLoading ||
    refunds.isLoading
    || staffAssignments.isLoading
  )
    return <LoadingState label="Loading live operations…" />;
  if (
    bookings.isError ||
    payments.isError ||
    packages.isError ||
    schedules.isError ||
    customerCount.isError ||
    receipts.isError ||
    refunds.isError
    || staffAssignments.isError
  )
    return (
      <ErrorState
        message={formatError(
          bookings.error ??
            payments.error ??
            packages.error ??
            schedules.error ??
            customerCount.error ??
            receipts.error ??
            refunds.error ?? staffAssignments.error,
        )}
      />
    );

  const bookingRows = bookings.data ?? [];
  const paymentRows = payments.data ?? [];
  const packageRows = packages.data ?? [];
  const scheduleRows = schedules.data ?? [];
  const receiptRows = receipts.data ?? [];
  const refundRows = refunds.data ?? [];
  const assignmentRows = staffAssignments.data ?? [];
  const reviewPayment = async (approve: boolean) => {
    if (!paymentReview) return;
    const reason = approve
      ? null
      : window.prompt("Reason for rejecting this payment evidence?");
    if (!approve && !reason?.trim()) {
      setPaymentReview(null);
      return;
    }
    await doAction(
      paymentReview.id,
      async () => {
        const { error } = await requireSupabase().rpc("verify_payment", {
          p_payment_id: paymentReview.id,
          p_approved: approve,
          p_rejection_reason: reason,
        });
        if (error) throw error;
      },
      approve
        ? "Payment verified. Booking status was not changed."
        : "Payment evidence rejected.",
    );
    setPaymentReview(null);
  };
  const openReceipt = async (paymentId: string) => {
    const receipt = receiptRows.find((item) => item.payment_id === paymentId);
    if (!receipt) {
      setNotice({
        message: "No receipt file is attached to this payment.",
        error: true,
      });
      return;
    }
    const { data, error } = await requireSupabase()
      .storage.from("payment-receipts")
      .createSignedUrl(receipt.storage_path, 60);
    if (error) {
      setNotice({ message: formatError(error), error: true });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  const refundPayment = async (payment: Payment) => {
    const amount = Number(
      window.prompt(
        `Amount to record as refunded (maximum ${formatPeso(payment.amount)}):`,
      ),
    );
    if (!Number.isFinite(amount) || amount <= 0) return;
    const reason = window.prompt("Reason for recording this refund:");
    if (!reason?.trim()) return;
    await doAction(
      payment.id,
      async () => {
        const { error } = await requireSupabase().rpc("record_refund", {
          p_payment_id: payment.id,
          p_amount: amount,
          p_reason: reason,
        });
        if (error) throw error;
      },
      "Refund ledger entry saved. This does not send money to the customer.",
    );
  };

  return (
    <section className="account-page">
      <div className="account-head">
        <div>
          <span className="eyebrow">TRAVEXGO OPERATIONS</span>
          <h1>Good work, {profile?.full_name?.split(" ")[0] ?? "team"}.</h1>
          <p>Live booking, payment, and departure activity from Supabase.</p>
        </div>
        <div className="account-toolbar">
          <span className="status-pill">{profile?.role}</span>
          <button
            className="button button-quiet"
            onClick={() => void supabase?.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
      {notice && (
        <div className={`toast ${notice.error ? "error" : ""}`} role="status">
          {notice.message}
        </div>
      )}
      <nav className="ops-tabs" aria-label="Operations sections">
        {tabs
          .filter((item) => isAdministrator || !["packages", "users"].includes(item.key))
          .map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "selected" : ""}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {tab === "overview" && (
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <span>Total bookings</span>
              <strong>{bookingRows.length}</strong>
            </div>
            <div className="stat-box">
              <span>Needs booking review</span>
              <strong>{pendingBookings}</strong>
            </div>
            <div className="stat-box">
              <span>Verified collections</span>
              <strong>{formatPeso(paidTotal)}</strong>
            </div>
            <div className="stat-box">
              <span>Outstanding balances</span>
              <strong>{formatPeso(outstanding)}</strong>
            </div>
            <div className="stat-box">
              <span>Registered customers</span>
              <strong>{customerCount.data ?? "—"}</strong>
            </div>
            <div className="stat-box">
              <span>Upcoming departures</span>
              <strong>{upcoming}</strong>
            </div>
            <div className="stat-box">
              <span>Payment evidence pending</span>
              <strong>
                {
                  paymentRows.filter(
                    (item) =>
                      item.verification_status === "pending_verification",
                  ).length
                }
              </strong>
            </div>
            <div className="stat-box">
              <span>Published packages</span>
              <strong>
                {
                  packageRows.filter(
                    (item) => item.publication_status === "published",
                  ).length
                }
              </strong>
            </div>
          </div>
          <div className="chart-panel">
            <div className="split-section">
              <h2>Bookings & verified collections</h2>
              <span className="status-pill">Last 6 months</span>
            </div>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 12, bottom: 0, left: -15 }}
                >
                  <CartesianGrid stroke="#d7e9ea" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#60797b", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="bookings"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#60797b", fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="cash"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#60797b", fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "collected" ? formatPeso(Number(value)) : value,
                      name === "collected"
                        ? "Verified collections"
                        : "Bookings",
                    ]}
                  />
                  <Bar
                    yAxisId="bookings"
                    dataKey="bookings"
                    fill="#258f96"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    yAxisId="cash"
                    dataKey="collected"
                    fill="#df087b"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="split-section">
            <h2>Recent bookings</h2>
            <button
              className="inline-button"
              onClick={() => setTab("bookings")}
            >
              Review all <ArrowRight size={13} />
            </button>
          </div>
          <BookingTable
            rows={bookingRows.slice(0, 6)}
            busyId={busyId}
            onReview={(booking, status) =>
              doAction(
                booking.id,
                async () => {
                  const { error } = await requireSupabase().rpc(
                    "set_booking_status",
                    {
                      p_booking_id: booking.id,
                      p_status: status,
                      p_reason:
                        status === "rejected" ? "Rejected by operations" : null,
                    },
                  );
                  if (error) throw error;
                },
                `Booking ${booking.booking_reference} ${status}.`,
              )
            }
          />
        </>
      )}
      {tab === "bookings" && (
        <>
          <div className="split-section">
            <h2>Reservation requests</h2>
            <button
              className="button button-quiet"
              onClick={() =>
                exportRows(
                  "travexgo-bookings.csv",
                  [
                    "Reference",
                    "Customer ID",
                    "Travelers",
                    "Total PHP",
                    "Paid PHP",
                    "Balance PHP",
                    "Status",
                    "Created at",
                  ],
                  bookingRows.map((item) => [
                    item.booking_reference,
                    item.customer_id,
                    item.traveler_count,
                    item.total_amount,
                    item.amount_paid,
                    item.balance_due,
                    item.status,
                    item.created_at,
                  ]),
                )
              }
            >
              <ArrowDownToLine size={14} /> Export CSV
            </button>
          </div>
          <BookingTable
            rows={bookingRows}
            busyId={busyId}
            onReview={(booking, status) =>
              doAction(
                booking.id,
                async () => {
                  const { error } = await requireSupabase().rpc(
                    "set_booking_status",
                    {
                      p_booking_id: booking.id,
                      p_status: status,
                      p_reason:
                        status === "rejected" ? "Rejected by operations" : null,
                    },
                  );
                  if (error) throw error;
                },
                `Booking ${booking.booking_reference} ${status}.`,
              )
            }
          />
        </>
      )}
      {tab === "payments" && (
        <>
          <div className="split-section">
            <h2>Payment review</h2>
            <div className="account-toolbar">
              <span className="status-pill">Uploads stay pending</span>
              <button className="button button-dark" onClick={() => setManualPaymentForm(!manualPaymentForm)}>
                <CircleDollarSign size={14} /> {manualPaymentForm ? "Close" : "Record manual payment"}
              </button>
            </div>
          </div>
          {manualPaymentForm && (
            <ManualPaymentForm
              bookings={bookingRows.filter((booking) => booking.balance_due > 0 && !["cancelled", "rejected", "completed"].includes(booking.status))}
              onSaved={() => { setManualPaymentForm(false); refresh(); }}
              onError={(message) => setNotice({ message, error: true })}
            />
          )}
          <PaymentTable
            rows={paymentRows}
            busyId={busyId}
            allowRefund={profile?.role === "administrator"}
            onReview={setPaymentReview}
            onReceipt={openReceipt}
            onRefund={(payment) => void refundPayment(payment)}
          />
        </>
      )}
      {tab === "packages" && isAdministrator && (
        <>
          <div className="split-section">
            <h2>Tour packages</h2>
            <button
              className="button button-dark"
              onClick={() => setPackageForm(!packageForm)}
            >
              <PackagePlus size={15} />{" "}
              {packageForm ? "Close form" : "Add package"}
            </button>
          </div>
          {packageForm && (
            <PackageForm
              onSaved={() => {
                refresh();
                setNotice({ message: "Package saved as a draft. Add another whenever you're ready.", error: false });
              }}
              onError={(message) => setNotice({ message, error: true })}
            />
          )}
          <div className="operations-package-container">
            {packageRows.length === 0 ? (
              <div className="empty-state">No packages yet. Add your first package above.</div>
            ) : (
              <div className="operations-package-grid">
                {packageRows.map((item) => (
                  <article className="operations-package-card" key={item.id}>
                    {item.featured_image_url ? (
                      <img src={item.featured_image_url} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="operations-package-image-placeholder" aria-hidden="true">
                        <PackagePlus size={25} />
                      </div>
                    )}
                    <div className="operations-package-copy">
                      <div className="operations-package-heading">
                        <div>
                          <span className="operations-package-destination">{item.destination}</span>
                          <h3>{item.name}</h3>
                        </div>
                        <span className={`status-pill ${item.publication_status === "published" ? "status-confirmed" : ""}`}>
                          {item.publication_status}
                        </span>
                      </div>
                      <p>{item.short_description}</p>
                      <div className="operations-package-details">
                        <strong>{formatPeso(item.price_per_person)} <small>per person</small></strong>
                        <span>{item.duration_days} days · {item.duration_nights} nights</span>
                      </div>
                      <small className="operations-package-slug">/{item.slug}</small>
                      <div className="operations-package-actions">
                        <button
                          className="inline-button"
                          disabled={busyId === item.id || item.publication_status === "archived"}
                          onClick={() =>
                            void doAction(
                              item.id,
                              async () => {
                                const { error } = await requireSupabase()
                                  .from("tour_packages")
                                  .update({
                                    publication_status:
                                      item.publication_status === "published" ? "draft" : "published",
                                  })
                                  .eq("id", item.id);
                                if (error) throw error;
                              },
                              item.publication_status === "published"
                                ? "Package unpublished."
                                : "Package published.",
                            )
                          }
                        >
                          {item.publication_status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        {item.publication_status !== "archived" && (
                          <button
                            className="inline-button"
                            disabled={busyId === item.id}
                            onClick={() =>
                              void doAction(
                                item.id,
                                async () => {
                                  const { error } = await requireSupabase()
                                    .from("tour_packages")
                                    .update({
                                      publication_status: "archived",
                                      archived_at: new Date().toISOString(),
                                    })
                                    .eq("id", item.id);
                                  if (error) throw error;
                                },
                                "Package archived.",
                              )
                            }
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {tab === "schedules" && (
        <>
          <div className="split-section">
            <h2>Departure schedules</h2>
            {isAdministrator && (
              <button
                className="button button-dark"
                onClick={() => setScheduleForm(!scheduleForm)}
              >
                <CalendarPlus size={15} />{" "}
                {scheduleForm ? "Close form" : "Add departure"}
              </button>
            )}
          </div>
          {scheduleForm && (
            <ScheduleForm
              packages={packageRows}
              onSaved={() => {
                setScheduleForm(false);
                refresh();
              }}
              onError={(message) => setNotice({ message, error: true })}
            />
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Departure</th>
                  <th>Return</th>
                  <th>Capacity</th>
                  <th>Meeting point</th>
                  <th>Coordinator / guide</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {packageRows.find((tour) => tour.id === item.package_id)
                        ?.name ?? "Package removed"}
                    </td>
                    <td>
                      {item.departure_date}
                      {item.departure_time ? ` · ${item.departure_time}` : ""}
                    </td>
                    <td>{item.return_date ?? "—"}</td>
                    <td>{item.capacity}</td>
                    <td>{item.meeting_point}</td>
                    <td>
                      <ScheduleAssignment
                        scheduleId={item.id}
                        assignments={assignmentRows.filter((assignment) => assignment.schedule_id === item.id)}
                        staff={staffProfiles.data ?? []}
                        isAdministrator={isAdministrator}
                        onAssign={(staffId, assignmentRole) =>
                          void doAction(
                            item.id,
                            async () => {
                              const { error } = await requireSupabase()
                                .from("staff_assignments")
                                .insert({ schedule_id: item.id, staff_id: staffId, assignment_role: assignmentRole });
                              if (error) throw error;
                            },
                            "Staff assignment saved.",
                          )
                        }
                        onRemove={(assignment) =>
                          void doAction(
                            item.id,
                            async () => {
                              const { error } = await requireSupabase()
                                .from("staff_assignments")
                                .delete()
                                .eq("id", assignment.id);
                              if (error) throw error;
                            },
                            "Staff assignment removed.",
                          )
                        }
                      />
                    </td>
                    <td>
                      <span className="status-pill">{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === "customers" && (
        <>
          <div className="split-section">
            <h2>Customer directory</h2>
            <button
              className="button button-quiet"
              disabled={!customers.data?.length}
              onClick={() =>
                exportRows(
                  "travexgo-customers.csv",
                  ["Name", "Email", "Phone", "Status", "Joined"],
                  (customers.data ?? []).map((item) => [
                    item.full_name,
                    item.email,
                    item.phone,
                    item.account_status,
                    item.created_at,
                  ]),
                )
              }
            >
              <Users size={14} /> Export CSV
            </button>
          </div>
          {customers.isLoading ? (
            <LoadingState />
          ) : customers.isError ? (
            <ErrorState message={formatError(customers.error)} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Account status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(customers.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}</td>
                      <td>{item.email}</td>
                      <td>{item.phone || "—"}</td>
                      <td>{item.account_status}</td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {tab === "users" && isAdministrator && (
        <>
          <div className="split-section">
            <h2>User roles and account access</h2>
            <span className="status-pill">Administrator only</span>
          </div>
          {userProfiles.isLoading ? (
            <LoadingState />
          ) : userProfiles.isError ? (
            <ErrorState message={formatError(userProfiles.error)} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Account</th><th>Joined</th><th>Save</th></tr></thead>
                <tbody>{(userProfiles.data ?? []).map((profileRow) => {
                  const draft = profileDrafts[profileRow.id] ?? { role: profileRow.role, account_status: profileRow.account_status };
                  const changed = draft.role !== profileRow.role || draft.account_status !== profileRow.account_status;
                  return <tr key={profileRow.id}>
                    <td>{profileRow.full_name}</td><td>{profileRow.email}</td>
                    <td><select className="field-control compact-select" aria-label={`Role for ${profileRow.email}`} value={draft.role} onChange={(event) => setProfileDrafts((current) => ({ ...current, [profileRow.id]: { ...draft, role: event.target.value as Profile["role"] } }))}><option value="customer">Customer</option><option value="staff">Staff</option><option value="administrator">Administrator</option></select></td>
                    <td><select className="field-control compact-select" aria-label={`Account status for ${profileRow.email}`} value={draft.account_status} onChange={(event) => setProfileDrafts((current) => ({ ...current, [profileRow.id]: { ...draft, account_status: event.target.value as Profile["account_status"] } }))}><option value="active">Active</option><option value="suspended">Suspended</option></select></td>
                    <td>{new Date(profileRow.created_at).toLocaleDateString("en-PH")}</td>
                    <td><button className="inline-button" disabled={!changed || busyId === profileRow.id} onClick={() => void doAction(profileRow.id, async () => { const { error } = await requireSupabase().rpc("set_profile_access", { p_profile_id: profileRow.id, p_role: draft.role, p_account_status: draft.account_status }); if (error) throw error; setProfileDrafts((current) => { const next = { ...current }; delete next[profileRow.id]; return next; }); void queryClient.invalidateQueries({ queryKey: ["ops", "user-profiles"] }); }, "Account access updated.")}>Save changes</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </>
      )}
      {tab === "reports" && (
        <>
          <div className="split-section">
            <h2>Business exports</h2>
            <span className="status-pill">
              Based on authorized live records
            </span>
          </div>
          <div className="report-actions">
            <button
              className="button button-quiet"
              onClick={() =>
                exportRows(
                  "travexgo-bookings.csv",
                  [
                    "Reference",
                    "Customer ID",
                    "Schedule ID",
                    "Travelers",
                    "Total PHP",
                    "Paid PHP",
                    "Balance PHP",
                    "Status",
                    "Created at",
                  ],
                  bookingRows.map((item) => [
                    item.booking_reference,
                    item.customer_id,
                    item.departure_schedule_id,
                    item.traveler_count,
                    item.total_amount,
                    item.amount_paid,
                    item.balance_due,
                    item.status,
                    item.created_at,
                  ]),
                )
              }
            >
              <ClipboardList size={15} /> Booking report
            </button>
            <button
              className="button button-quiet"
              onClick={() =>
                exportRows(
                  "travexgo-payments.csv",
                  [
                    "Payment ID",
                    "Booking ID",
                    "Amount PHP",
                    "Method",
                    "Reference",
                    "Date",
                    "Status",
                  ],
                  paymentRows.map((item) => [
                    item.id,
                    item.booking_id,
                    item.amount,
                    item.payment_method,
                    item.payment_reference,
                    item.payment_date,
                    item.verification_status,
                  ]),
                )
              }
            >
              <CircleDollarSign size={15} /> Payment report
            </button>
            <button
              className="button button-quiet"
              onClick={() =>
                exportRows(
                  "travexgo-departures.csv",
                  [
                    "Package ID",
                    "Departure",
                    "Return",
                    "Capacity",
                    "Meeting point",
                    "Status",
                  ],
                  scheduleRows.map((item) => [
                    item.package_id,
                    item.departure_date,
                    item.return_date,
                    item.capacity,
                    item.meeting_point,
                    item.status,
                  ]),
                )
              }
            >
              <CalendarPlus size={15} /> Schedule report
            </button>
            <button
              className="button button-quiet"
              onClick={() =>
                exportRows(
                  "travexgo-refunds.csv",
                  ["Payment ID", "Amount PHP", "Reason", "Status", "Processed", "Created at"],
                  refundRows.map((item) => [
                    item.payment_id,
                    item.amount,
                    item.reason,
                    item.status,
                    item.processed_at,
                    item.created_at,
                  ]),
                )
              }
            >
              <CircleDollarSign size={15} /> Refund report
            </button>
          </div>
          <div className="stat-grid report-summary">
            <div className="stat-box">
              <span>Verified collections</span>
              <strong>{formatPeso(paidTotal)}</strong>
            </div>
            <div className="stat-box">
              <span>Outstanding active balances</span>
              <strong>{formatPeso(outstanding)}</strong>
            </div>
            <div className="stat-box">
              <span>Non-cancelled reservations</span>
              <strong>
                {
                  bookingRows.filter(
                    (item) => !["cancelled", "rejected"].includes(item.status),
                  ).length
                }
              </strong>
            </div>
            <div className="stat-box">
              <span>Verified payment records</span>
              <strong>
                {
                  paymentRows.filter(
                    (item) => item.verification_status === "verified",
                  ).length
                }
              </strong>
            </div>
          </div>
        </>
      )}
      {paymentReview && (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <h2 id="review-title">
              {paymentReview.approve
                ? "Verify this payment?"
                : "Reject this payment?"}
            </h2>
            <p>
              {paymentReview.approve
                ? "This records a verified payment and updates the booking balance. It does not confirm the booking."
                : "The customer can submit corrected payment evidence."}
            </p>
            <div className="account-toolbar">
              <button
                className="button button-quiet"
                onClick={() => setPaymentReview(null)}
              >
                Cancel
              </button>
              <button
                className="button button-dark"
                onClick={() => void reviewPayment(paymentReview.approve)}
              >
                {paymentReview.approve
                  ? "Verify payment"
                  : "Continue to rejection"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function BookingTable({
  rows,
  busyId,
  onReview,
}: {
  rows: Booking[];
  busyId: string;
  onReview: (booking: Booking, status: "confirmed" | "rejected") => void;
}) {
  return (
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
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.booking_reference}</strong>
                <br />
                <small>
                  {new Date(item.created_at).toLocaleDateString("en-PH")}
                </small>
              </td>
              <td>{item.traveler_count}</td>
              <td>{formatPeso(item.total_amount)}</td>
              <td>{formatPeso(item.amount_paid)}</td>
              <td>{formatPeso(item.balance_due)}</td>
              <td>
                <span className={`status-pill status-${item.status}`}>
                  {item.status.replaceAll("_", " ")}
                </span>
              </td>
              <td>
                {item.status === "pending" ||
                item.status === "awaiting_payment" ? (
                  <>
                    <button
                      className="inline-button"
                      disabled={busyId === item.id}
                      onClick={() => onReview(item, "confirmed")}
                    >
                      <Check size={13} /> Confirm
                    </button>
                    <button
                      className="inline-button"
                      disabled={busyId === item.id}
                      onClick={() => onReview(item, "rejected")}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="empty-state">No booking records.</div>
      )}
    </div>
  );
}

function PaymentTable({
  rows,
  busyId,
  allowRefund,
  onReview,
  onReceipt,
  onRefund,
}: {
  rows: Payment[];
  busyId: string;
  allowRefund: boolean;
  onReview: (value: { id: string; approve: boolean }) => void;
  onReceipt: (paymentId: string) => void;
  onRefund: (payment: Payment) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Payment</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>{item.id.slice(0, 8)}</td>
              <td>{formatPeso(item.amount)}</td>
              <td>{item.payment_method.replaceAll("_", " ")}</td>
              <td>{item.payment_reference || "—"}</td>
              <td>
                {new Date(`${item.payment_date}T12:00:00`).toLocaleDateString(
                  "en-PH",
                )}
              </td>

              <td>
                <span
                  className={`status-pill status-${item.verification_status}`}
                >
                  {item.verification_status.replaceAll("_", " ")}
                </span>
              </td>
              <td>
                {item.verification_status === "pending_verification" ? (
                  <>
                    <button
                      className="inline-button"
                      disabled={busyId === item.id}
                      onClick={() => onReceipt(item.id)}
                    >
                      View proof
                    </button>
                    <button
                      className="inline-button"
                      disabled={busyId === item.id}
                      onClick={() => onReview({ id: item.id, approve: true })}
                    >
                      Verify
                    </button>
                    <button
                      className="inline-button"
                      disabled={busyId === item.id}
                      onClick={() => onReview({ id: item.id, approve: false })}
                    >
                      Reject
                    </button>
                  </>
                ) : allowRefund &&
                  ["verified", "partially_refunded"].includes(
                    item.verification_status,
                  ) ? (
                  <button
                    className="inline-button"
                    disabled={busyId === item.id}
                    onClick={() => onRefund(item)}
                  >
                    Record refund
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="empty-state">No payment records.</div>
      )}
    </div>
  );
}

function ScheduleAssignment({
  scheduleId,
  assignments,
  staff,
  isAdministrator,
  onAssign,
  onRemove,
}: {
  scheduleId: string;
  assignments: StaffAssignment[];
  staff: Profile[];
  isAdministrator: boolean;
  onAssign: (staffId: string, role: StaffAssignment["assignment_role"]) => void;
  onRemove: (assignment: StaffAssignment) => void;
}) {
  const [staffId, setStaffId] = useState("");
  const [role, setRole] = useState<StaffAssignment["assignment_role"]>("coordinator");
  const availableStaff = staff.filter(
    (person) =>
      !assignments.some(
        (assignment) =>
          assignment.staff_id === person.id && assignment.assignment_role === role,
      ),
  );
  return (
    <div className="assignment-control">
      {assignments.map((assignment) => (
        <div className="assignment-item" key={assignment.id}>
          <span>
            {staff.find((person) => person.id === assignment.staff_id)?.full_name ??
              assignment.staff_id.slice(0, 8)}{" "}
            · {assignment.assignment_role}
          </span>
          {isAdministrator && (
            <button
              className="inline-button"
              onClick={() => onRemove(assignment)}
              aria-label={`Remove ${assignment.assignment_role} assignment`}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {assignments.length === 0 && (
        <span className="assignment-none">Unassigned</span>
      )}
      {isAdministrator && staff.length > 0 && (
        <div className="assignment-add">
          <select
            className="field-control compact-select"
            aria-label={`Staff for departure ${scheduleId}`}
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            <option value="">Select staff</option>
            {availableStaff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.email}
              </option>
            ))}
          </select>
          <select
            className="field-control compact-select"
            aria-label="Assignment type"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as StaffAssignment["assignment_role"])
            }
          >
            <option value="coordinator">Coordinator</option>
            <option value="guide">Guide</option>
          </select>
          <button
            className="inline-button"
            disabled={!staffId}
            onClick={() => {
              onAssign(staffId, role);
              setStaffId("");
            }}
          >
            Assign
          </button>
        </div>
      )}
    </div>
  );
}

function ManualPaymentForm({
  bookings,
  onSaved,
  onError,
}: {
  bookings: Booking[];
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const { error } = await requireSupabase().rpc("record_manual_payment", {
        p_booking_id: String(form.get("booking_id")),
        p_amount: Number(form.get("amount")),
        p_payment_method: String(form.get("method")),
        p_payment_reference: String(form.get("reference") ?? "").trim() || null,
        p_payment_date: String(form.get("payment_date")),
      });
      if (error) throw error;
      formElement.reset();
      onSaved();
    } catch (error) {
      onError(formatError(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="manager-form form-stack" onSubmit={submit}>
      <h3>Record payment received offline</h3>
      <div className="booking-form-grid">
        <label className="wide">Booking<select className="field-control" name="booking_id" defaultValue="" required><option value="" disabled>Select an active booking</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.booking_reference} · balance {formatPeso(booking.balance_due)}</option>)}</select></label>
        <label>Amount (PHP)<input className="field-control" name="amount" type="number" min="0.01" step="0.01" required /></label>
        <label>Payment method<select className="field-control" name="method" required><option value="cash">Cash</option><option value="gcash">GCash</option><option value="maya">Maya</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label>
        <label>Payment date<input className="field-control" name="payment_date" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label>Reference <span style={{ fontWeight: 400 }}>(optional)</span><input className="field-control" name="reference" maxLength={120} /></label>
      </div>
      <p className="form-alt">This records a payment already received; it does not process a transfer. The entry will be marked verified by the staff member recording it.</p>
      <button className="button button-dark" disabled={busy || bookings.length === 0}>{busy ? "Saving…" : "Record payment"}</button>
    </form>
  );
}

function PackageForm({
  onSaved,
  onError,
}: {
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const name = String(form.get("name")).trim();
      const packageShortDescription = String(form.get("short_description")).trim();
      if (packageShortDescription.length > 300)
        throw new Error("Short description must be 300 characters or fewer.");
      const image = form.get("image");
      let imageUrl: string | null = null;
      if (image instanceof File && image.size) {
        if (image.size > 8 * 1024 * 1024)
          throw new Error("Package images must be 8 MB or smaller.");
        const path = `${user!.id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await requireSupabase()
          .storage.from("package-images")
          .upload(path, image, { contentType: image.type });
        if (error) throw error;
        imageUrl = requireSupabase()
          .storage.from("package-images")
          .getPublicUrl(path).data.publicUrl;
      }
      const { error } = await requireSupabase()
        .from("tour_packages")
        .insert({
          name,
          slug: packageSlug(name),
          destination: String(form.get("destination")).trim(),
          short_description: packageShortDescription,
          description: String(form.get("description")).trim(),
          duration_days: Number(form.get("duration_days")),
          duration_nights: Number(form.get("duration_nights")),
          price_per_person: Number(form.get("price_per_person")),
          minimum_travelers: Number(form.get("minimum_travelers")),
          maximum_travelers: Number(form.get("maximum_travelers")),
          inclusions: String(form.get("inclusions"))
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          exclusions: String(form.get("exclusions"))
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          cancellation_policy: String(form.get("cancellation_policy")).trim(),
          featured_image_url: imageUrl,
          publication_status: "draft",
          created_by: user!.id,
        });
      if (error) throw error;
        formElement.reset();
        setShortDescription("");
      onSaved();
    } catch (error) {
      onError(formatError(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="manager-form form-stack" onSubmit={submit}>
      <h3>Create a package draft</h3>
      <div className="booking-form-grid">
        <label>
          Package name
          <input className="field-control" name="name" minLength={3} required />
        </label>
        <label>
          Destination
          <input className="field-control" name="destination" required />
        </label>
        <label>
          Short description
          <input
            className="field-control"
            name="short_description"
            maxLength={300}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            required
          />
          <small>{shortDescription.length}/300 characters</small>
        </label>
        <label>
          Price per person (PHP)
          <input
            className="field-control"
            name="price_per_person"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </label>
        <label>
          Days
          <input
            className="field-control"
            name="duration_days"
            type="number"
            min="1"
            required
          />
        </label>
        <label>
          Nights
          <input
            className="field-control"
            name="duration_nights"
            type="number"
            min="0"
            required
          />
        </label>
        <label>
          Minimum travelers
          <input
            className="field-control"
            name="minimum_travelers"
            type="number"
            min="1"
            defaultValue="1"
            required
          />
        </label>
        <label>
          Maximum travelers
          <input
            className="field-control"
            name="maximum_travelers"
            type="number"
            min="1"
            defaultValue="20"
            required
          />
        </label>
        <label className="wide">
          Full description
          <textarea
            className="field-control"
            name="description"
            rows={3}
            required
          />
        </label>
        <label>
          Inclusions <span style={{ fontWeight: 400 }}>one per line</span>
          <textarea className="field-control" name="inclusions" rows={3} />
        </label>
        <label>
          Exclusions <span style={{ fontWeight: 400 }}>one per line</span>
          <textarea className="field-control" name="exclusions" rows={3} />
        </label>
        <label className="wide">
          Cancellation policy
          <textarea
            className="field-control"
            name="cancellation_policy"
            rows={2}
            required
          />
        </label>
        <label className="wide">
          Package image (optional)
          <input
            className="field-control"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
      </div>
      <button className="button button-dark" disabled={busy}>
        {busy ? "Saving…" : "Save as draft"} <ArrowRight size={15} />
      </button>
    </form>
  );
}

function ScheduleForm({
  packages,
  onSaved,
  onError,
}: {
  packages: TourPackage[];
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const { error } = await requireSupabase()
        .from("departure_schedules")
        .insert({
          package_id: String(form.get("package_id")),
          departure_date: String(form.get("departure_date")),
          return_date: String(form.get("return_date")) || null,
          departure_time: String(form.get("departure_time")) || null,
          meeting_point: String(form.get("meeting_point")).trim(),
          capacity: Number(form.get("capacity")),
          booking_deadline: String(form.get("booking_deadline")) || null,
          status: "open",
        });
      if (error) throw error;
      onSaved();
    } catch (error) {
      onError(formatError(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="manager-form form-stack" onSubmit={submit}>
      <h3>Set a departure date</h3>
      <div className="booking-form-grid">
        <label className="wide">
          Package
          <select
            className="field-control"
            name="package_id"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select package
            </option>
            {packages
              .filter((item) => item.publication_status !== "archived")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Departure date
          <input
            className="field-control"
            name="departure_date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        <label>
          Return date
          <input className="field-control" name="return_date" type="date" />
        </label>
        <label>
          Departure time
          <input className="field-control" name="departure_time" type="time" />
        </label>
        <label>
          Seat capacity
          <input
            className="field-control"
            name="capacity"
            type="number"
            min="1"
            required
          />
        </label>
        <label className="wide">
          Meeting point
          <input className="field-control" name="meeting_point" required />
        </label>
        <label className="wide">
          Booking deadline
          <input
            className="field-control"
            name="booking_deadline"
            type="date"
          />
        </label>
      </div>
      <button
        className="button button-dark"
        disabled={busy || packages.length === 0}
      >
        {busy ? "Saving…" : "Add departure"}
      </button>
    </form>
  );
}
