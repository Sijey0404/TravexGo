import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ConnectionNotice,
  ErrorState,
  LoadingState,
} from "../components/DataState";
import {
  formatError,
  formatPeso,
  getPackageBySlug,
  getPackageDepartures,
  listValue,
} from "../lib/data";

export default function PackagePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const tour = useQuery({
    queryKey: ["package", slug],
    queryFn: () => getPackageBySlug(slug),
  });
  const departures = useQuery({
    queryKey: ["departures", tour.data?.id],
    queryFn: () => getPackageDepartures(tour.data!.id),
    enabled: Boolean(tour.data?.id),
  });
  if (tour.isLoading)
    return (
      <>
        <ConnectionNotice />
        <LoadingState label="Loading trip details…" />
      </>
    );
  if (tour.isError)
    return (
      <>
        <ConnectionNotice />
        <ErrorState message={formatError(tour.error)} />
      </>
    );
  if (!tour.data)
    return (
      <section className="editorial-page">
        <span className="eyebrow">TRIP NOT FOUND</span>
        <h1>
          This journey has <em>moved on.</em>
        </h1>
        <Link className="button button-dark" to="/packages">
          <ArrowLeft size={16} /> Back to trips
        </Link>
      </section>
    );
  const item = tour.data;
  const inclusions = listValue(item.inclusions);
  const exclusions = listValue(item.exclusions);
  return (
    <>
      <ConnectionNotice />
      <section className="detail-hero">
        <div className="detail-copy">
          <Link className="text-link" to="/packages">
            <ArrowLeft size={14} /> All trips
          </Link>
          <span className="eyebrow" style={{ marginTop: 26 }}>
            {item.destination}
          </span>
          <h1>{item.name}</h1>
          <p>{item.short_description}</p>
          <div className="detail-facts">
            <span>
              <Clock3 size={15} /> {item.duration_days} days,{" "}
              {item.duration_nights} nights
            </span>
            <span>
              <Users size={15} /> {item.minimum_travelers}–
              {item.maximum_travelers} travelers
            </span>
          </div>
        </div>
        {item.featured_image_url && (
          <img
            className="detail-image"
            src={item.featured_image_url}
            alt={item.name}
          />
        )}
      </section>
      <div className="detail-content">
        <div>
          <section>
            <h2>The journey</h2>
            <p>{item.description}</p>
          </section>
          <section>
            <h2>Included in your trip</h2>
            {inclusions.length ? (
              <ul className="detail-list">
                {inclusions.map((value) => (
                  <li key={value}>
                    <Check size={16} />
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Inclusions will be confirmed with your booking.</p>
            )}
          </section>
          <section>
            <h2>Not included</h2>
            {exclusions.length ? (
              <ul className="detail-list">
                {exclusions.map((value) => (
                  <li key={value}>
                    <span>–</span>
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Please contact us for details.</p>
            )}
          </section>
          <section>
            <h2>Cancellation policy</h2>
            <p>
              {item.cancellation_policy ||
                "Contact TravexGo before booking for cancellation details."}
            </p>
          </section>
        </div>
        <aside className="booking-box">
          <span className="eyebrow">MAKE IT YOURS</span>
          <h2>
            {formatPeso(item.price_per_person)}{" "}
            <small
              style={{
                font: '400 12px "DM Sans",sans-serif',
                color: "#66736d",
              }}
            >
              {" "}
              / person
            </small>
          </h2>
          <p>Choose a departure date to request your booking.</p>
          {departures.isLoading ? (
            <LoadingState label="Checking departures…" />
          ) : departures.isError ? (
            <ErrorState message={formatError(departures.error)} />
          ) : departures.data?.length ? (
            <div className="form-stack">
              <label>
                Available departure
                <select
                  className="field-control"
                  aria-label="Available departure"
                  value={selectedSchedule}
                  onChange={(event) => setSelectedSchedule(event.target.value)}
                >
                  <option value="">Select a date</option>
                  {departures.data.map((departure) => (
                    <option value={departure.id} key={departure.id}>
                      {new Date(
                        `${departure.departure_date}T12:00:00`,
                      ).toLocaleDateString("en-PH", {
                        dateStyle: "medium",
                      })}{" "}
                      · {departure.remaining_seats} seats
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button button-dark"
                disabled={!selectedSchedule}
                onClick={() => navigate(`/book/${selectedSchedule}`)}
              >
                Continue to booking <ArrowRight size={15} />
              </button>
              <p>
                Booking requests are reviewed by our team. Payment is not
                processed online.
              </p>
            </div>
          ) : (
            <p>
              No upcoming departures are published for this trip yet.{" "}
              <Link className="text-link" to="/contact">
                Ask about dates <MapPin size={14} />
              </Link>
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
