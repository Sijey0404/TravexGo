import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import ItineraryTimeline from "../components/ItineraryTimeline";
import DestinationDayCarousel from "../components/DestinationDayCarousel";
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
  getCampaignOffers,
  getPackageDepartures,
  listValue,
} from "../lib/data";
import { normalizeItinerary } from "../lib/itinerary";

export default function PackagePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const tour = useQuery({
    queryKey: ["package", slug],
    queryFn: () => getPackageBySlug(slug),
  });
  const offers = useQuery({
    queryKey: ["campaign-offers", tour.data?.campaign_name, tour.data?.id],
    queryFn: () => getCampaignOffers(tour.data!),
    enabled: Boolean(tour.data?.id),
  });
  const offerList = offers.data ?? (tour.data ? [tour.data] : []);
  const activeOffer = offerList.find((offer) => offer.id === selectedOfferId) ?? tour.data;
  const departures = useQuery({
    queryKey: ["departures", activeOffer?.id],
    queryFn: () => getPackageDepartures(activeOffer!.id),
    enabled: Boolean(activeOffer?.id),
  });
  if (tour.isLoading || (tour.data && offers.isLoading))
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
  if (offers.isError)
    return <ErrorState message={formatError(offers.error)} />;
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
  const item = activeOffer ?? tour.data;
  const offerIndex = Math.max(0, offerList.findIndex((offer) => offer.id === item.id));
  const goOffer = (index: number) => {
    const offer = offerList[(index + offerList.length) % offerList.length];
    if (offer) { setSelectedOfferId(offer.id); setSelectedSchedule(""); }
  };
  const selectDay = (dayNumber: number) => {
    const target = document.getElementById(`itinerary-day-${dayNumber}`);
    if (target instanceof HTMLDetailsElement) target.open = true;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const inclusions = listValue(item.inclusions);
  const exclusions = listValue(item.exclusions);
  const itinerary = normalizeItinerary(item.itinerary);
  return (
    <>
      <ConnectionNotice />
      <section className="detail-hero package-detail-hero">
        <div className="detail-copy">
          <Link className="text-link" to="/packages">
            <ArrowLeft size={14} /> All trips
          </Link>
          <span className="eyebrow" style={{ marginTop: 26 }}>
            {tour.data.campaign_name || item.destination}
          </span>
          {offerList.length > 1 && <div className="offer-slider-controls" aria-label="Campaign offers">
            <button className="icon-button" type="button" aria-label="Previous offer" onClick={() => goOffer(offerIndex - 1)}><ChevronLeft size={18} /></button>
            <span>Offer {offerIndex + 1} of {offerList.length}</span>
            <button className="icon-button" type="button" aria-label="Next offer" onClick={() => goOffer(offerIndex + 1)}><ChevronRight size={18} /></button>
          </div>}
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
          {item.countries.length > 0 && <div className="package-country-list"><strong>Countries</strong>{item.countries.map((country) => <span key={country}>{country}</span>)}</div>}
        </div>
        {item.featured_image_url ? (
          <img
            className="detail-image"
            src={item.featured_image_url}
            alt={item.name}
          />
        ) : <div className="detail-image package-image-placeholder"><MapPin size={30} /><span>{item.countries?.join(" · ") || item.destination}</span></div>}
      </section>
      <DestinationDayCarousel days={itinerary} fallbackImage={item.featured_image_url} onSelectDay={selectDay} />
      <div className="detail-content">
        <div>
          <section>
            <h2>The journey</h2>
            <p>{item.description}</p>
          </section>
          {itinerary.length > 0 && <section className="itinerary-section">
            <span className="eyebrow">YOUR ROUTE, DAY BY DAY</span>
            <h2>Itinerary</h2>
            <ItineraryTimeline days={itinerary} />
          </section>}
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
                      {departure.return_date ? `– ${new Date(`${departure.return_date}T12:00:00`).toLocaleDateString("en-PH", { dateStyle: "medium" })} ` : ""}
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
