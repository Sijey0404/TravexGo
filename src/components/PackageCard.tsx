import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPeso } from "../lib/data";
import type { TourPackage } from "../types/database";
import type { DepartureSchedule } from "../types/database";

export default function PackageCard({
  tour,
  index = 0,
  departures = [],
  title,
  destination,
  offerCount = 1,
  offerIds,
}: {
  tour: TourPackage;
  index?: number;
  departures?: (DepartureSchedule & { remaining_seats: number })[];
  title?: string;
  destination?: string;
  offerCount?: number;
  offerIds?: string[];
}) {
  const dates = departures.filter((departure) => (offerIds ?? [tour.id]).includes(departure.package_id) && departure.status === "open" && departure.remaining_seats > 0);
  const nextDate = dates[0];
  return (
    <article
      className="trip-card"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        to={`/packages/${tour.slug}`}
        className="trip-card-image"
        aria-label={`View ${tour.name}`}
      >
        {tour.featured_image_url ? (
          <img src={tour.featured_image_url} alt={tour.name} loading="lazy" />
        ) : <span className="trip-image-fallback">TravexGo · {tour.destination}</span>}
        <span className="trip-date">
          <CalendarDays size={12} /> {tour.duration_days} days ·{" "}
          {tour.duration_nights} nights
        </span>
      </Link>
      <div className="trip-card-copy">
        <span className="trip-card-location">
          <MapPin size={12} /> {destination || tour.destination}
        </span>
        <h3>{title || tour.name}</h3>
        {offerCount > 1 && <span className="campaign-offer-count">{offerCount} departure offers</span>}
        <p>{tour.short_description}</p>
        <div className={`trip-availability ${dates.length ? "is-available" : "is-full"}`}>
          <span className="availability-dot" />
          {nextDate ? `Next departure ${new Date(`${nextDate.departure_date}T12:00:00`).toLocaleDateString("en-PH", { dateStyle: "medium" })} · ${nextDate.remaining_seats} seats` : "No available departures"}
        </div>
        <div className="trip-card-bottom">
          <strong>
            {formatPeso(tour.price_per_person)}
            <small>per person</small>
          </strong>
          <Link to={`/packages/${tour.slug}`}>
            Explore <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
