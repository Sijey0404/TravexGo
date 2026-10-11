import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import PackageCard from "../components/PackageCard";
import {
  ConnectionNotice,
  ErrorState,
  LoadingState,
} from "../components/DataState";
import { formatError, getAllPublicDepartures, getPublishedPackages } from "../lib/data";

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("destination") ?? params.get("q") ?? "");
  const date = params.get("date") ?? "";
  const travelers = Math.max(1, Number(params.get("travelers") ?? 1));
  const packages = useQuery({
    queryKey: ["packages", "published"],
    queryFn: getPublishedPackages,
  });
  const departures = useQuery({
    queryKey: ["public-departures", "all"],
    queryFn: getAllPublicDepartures,
  });
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (packages.data ?? []).filter(
      (item) => {
        const matchesDestination = !needle || `${item.name} ${item.destination} ${item.short_description}`.toLocaleLowerCase().includes(needle);
        if (!matchesDestination || (!date && travelers === 1)) return matchesDestination;
        return (departures.data ?? []).some((itemDeparture) => itemDeparture.package_id === item.id && itemDeparture.departure_date >= date && itemDeparture.remaining_seats >= travelers);
      },
    );
  }, [packages.data, departures.data, search, date, travelers]);
  const searchPackages = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("destination", search.trim());
    else next.delete("destination");
    setParams(next);
  };
  return (
    <>
      <ConnectionNotice />
      <section className="catalog-head">
        <span className="eyebrow">A GOOD PLACE TO START</span>
        <h1>Trips worth taking.</h1>
        <p>
          Real journeys, ready when you are. Pick a place and we’ll take care of
          the details.
        </p>
        <form className="catalog-tools" onSubmit={searchPackages}>
          <input
            aria-label="Search destinations and tours"
            className="field-control"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by destination or trip"
          />
          <button className="button button-dark" type="submit" aria-label="Search packages">
            <Search size={16} /> Search
          </button>
        </form>
      </section>
      <section className="catalog-body">
        {packages.isLoading || (date && departures.isLoading) ? (
          <LoadingState label="Loading published journeys…" />
        ) : packages.isError || departures.isError ? (
          <ErrorState message={formatError(packages.error ?? departures.error)} />
        ) : filtered.length ? (
          <div className="package-grid">
            {filtered.map((tour, index) => (
              <PackageCard key={tour.id} tour={tour} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {search
              ? `No published trips match this destination and availability search${date ? ` for ${date}` : ""}.`
              : "No published trips are available right now."}
          </div>
        )}
      </section>
    </>
  );
}
