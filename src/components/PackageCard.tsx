import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPeso } from "../lib/data";
import type { TourPackage } from "../types/database";

export default function PackageCard({
  tour,
  index = 0,
}: {
  tour: TourPackage;
  index?: number;
}) {
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
        {tour.featured_image_url && (
          <img src={tour.featured_image_url} alt={tour.name} loading="lazy" />
        )}
        <span className="trip-date">
          <CalendarDays size={12} /> {tour.duration_days} days ·{" "}
          {tour.duration_nights} nights
        </span>
      </Link>
      <div className="trip-card-copy">
        <span className="trip-card-location">
          <MapPin size={12} /> {tour.destination}
        </span>
        <h3>{tour.name}</h3>
        <p>{tour.short_description}</p>
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
