import { ArrowRight, Compass, HeartHandshake, MapPinned } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PackageCard from "../components/PackageCard";
import {
  ConnectionNotice,
  ErrorState,
  LoadingState,
} from "../components/DataState";
import { formatError, getPublishedPackages } from "../lib/data";

export default function HomePage() {
  const navigate = useNavigate();
  const packages = useQuery({
    queryKey: ["packages", "published"],
    queryFn: getPublishedPackages,
  });
  const featured = packages.data?.slice(0, 3) ?? [];
  const searchTrips = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["destination", "date", "travelers"]) {
      const value = String(values.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    navigate(`/packages?${params.toString()}`);
  };
  return (
    <>
      <ConnectionNotice />
      <section className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=85"
          alt="Island cliffs rising above clear Philippine waters"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow eyebrow-light">
            FROM SAN CARLOS, WITH CURIOSITY
          </span>
          <h1>
            Find your way
            <br />
            to <em>somewhere</em> good.
          </h1>
          <p>
            Small details make a big trip. Discover thoughtfully planned
            journeys across the Philippines, with a local team beside you.
          </p>
          <Link className="button button-lime" to="/packages">
            Find your next trip <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-stamp">
          Made for the moments between here and there
        </div>
      </section>
      <form className="trip-finder" onSubmit={searchTrips}>
        <label>
          <span>WHERE TO?</span>
          <input name="destination" placeholder="Destination or trip" />
        </label>
        <label>
          <span>WHEN?</span>
          <input name="date" type="date" min={new Date().toISOString().slice(0, 10)} />
        </label>
        <label>
          <span>TRAVELERS</span>
          <input name="travelers" type="number" min="1" max="20" defaultValue="2" />
        </label>
        <button className="button button-dark" type="submit">
          Find a trip <ArrowRight size={15} />
        </button>
      </form>
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">THE GOOD PLACES</span>
            <h2>Where are you dreaming of?</h2>
          </div>
          <Link className="text-link" to="/packages">
            See all trips <ArrowRight size={15} />
          </Link>
        </div>
        {packages.isLoading ? (
          <LoadingState label="Finding available journeys…" />
        ) : packages.isError ? (
          <ErrorState message={formatError(packages.error)} />
        ) : featured.length ? (
          <div className="package-grid">
            {featured.map((tour, index) => (
              <PackageCard key={tour.id} tour={tour} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No published trips are available right now. Check back soon or{" "}
            <Link className="text-link" to="/contact">
              ask our team.
            </Link>
          </div>
        )}
      </section>
      <section className="section home-intro">
        <div>
          <span className="eyebrow">A LITTLE CLOSER TO LOCAL</span>
          <h2>Plan less. Be there more.</h2>
          <p>
            Based in San Carlos City, we pair local know-how with the little
            comforts that make a journey feel like yours. Clear itineraries,
            thoughtful pacing, and a real person to reach when plans change.
          </p>
          <Link className="button button-dark" to="/about">
            Meet TravexGo <ArrowRight size={15} />
          </Link>
          <div className="feature-row">
            <div className="feature-item">
              <span>
                <MapPinned size={17} />
              </span>
              <h3>Local perspective</h3>
              <p>Thoughtful routes planned by people who know the region.</p>
            </div>
            <div className="feature-item">
              <span>
                <HeartHandshake size={17} />
              </span>
              <h3>People first</h3>
              <p>Clear details and helpful support from inquiry to home.</p>
            </div>
            <div className="feature-item">
              <span>
                <Compass size={17} />
              </span>
              <h3>Room to explore</h3>
              <p>Well-planned journeys that still leave space for wonder.</p>
            </div>
          </div>
        </div>
        <img
          className="home-image"
          src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1000&q=80"
          alt="A coastal island destination in the Philippines"
          loading="lazy"
        />
      </section>
    </>
  );
}
