import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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
  const [maxPrice, setMaxPrice] = useState("");
  const [destination, setDestination] = useState("");
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
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof packages.data>();
    for (const tour of packages.data ?? []) {
      const key = tour.campaign_name?.trim().toLocaleLowerCase() || tour.id;
      grouped.set(key, [...(grouped.get(key) ?? []), tour]);
    }
    return [...grouped.entries()].map(([key, offers]) => {
      const rows = offers ?? [];
      const featured = [...rows].sort((a, b) => a.price_per_person - b.price_per_person)[0];
      return { key, title: rows[0]?.campaign_name?.trim() || featured?.name || "Travel package", offers: rows, featured, destinations: [...new Set(rows.flatMap((offer) => offer.countries?.length ? offer.countries : [offer.destination]))].join(" · ") };
    }).filter((group) => Boolean(group.featured));
  }, [packages.data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return groups.filter((group) => {
      const matchesOffer = group.offers.some((item) => (!needle || `${group.title} ${item.name} ${item.destination} ${(item.countries ?? []).join(" ")} ${item.short_description}`.toLocaleLowerCase().includes(needle)) && (!destination || (item.countries?.length ? item.countries.includes(destination) : item.destination === destination)) && (!maxPrice || item.price_per_person <= Number(maxPrice)));
      if (!matchesOffer || (!date && travelers === 1)) return matchesOffer;
      return group.offers.some((offer) => (departures.data ?? []).some((itemDeparture) => itemDeparture.package_id === offer.id && itemDeparture.departure_date >= date && itemDeparture.remaining_seats >= travelers));
    });
  }, [groups, departures.data, search, date, travelers, destination, maxPrice]);
  const destinations = [...new Set((packages.data ?? []).flatMap((item) => item.countries?.length ? item.countries : [item.destination]))].sort();
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
        <div className="catalog-head-layout">
          <div className="catalog-intro">
            <span className="eyebrow">A GOOD PLACE TO START</span>
            <h1>Trips worth taking.</h1>
            <p>
              Real journeys, ready when you are. Pick a place and we’ll take care of
              the details.
            </p>
          </div>
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
          <span className="filter-caption"><SlidersHorizontal size={15} /> Filter</span>
          <select className="field-control" aria-label="Filter by destination" value={destination} onChange={(event) => setDestination(event.target.value)}>
            <option value="">All destinations</option>{destinations.map((place) => <option key={place}>{place}</option>)}
          </select>
          <select className="field-control" aria-label="Filter by maximum price" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
            <option value="">Any price</option><option value="50000">Up to ₱50,000</option><option value="100000">Up to ₱100,000</option><option value="200000">Up to ₱200,000</option><option value="500000">Up to ₱500,000</option>
          </select>
          </form>
        </div>
      </section>
      <section className="catalog-body">
        {packages.isLoading || (date && departures.isLoading) ? (
          <LoadingState label="Loading published journeys…" />
        ) : packages.isError || departures.isError ? (
          <ErrorState message={formatError(packages.error ?? departures.error)} />
        ) : filtered.length ? (
          <div className="package-catalog-container">
            <div className="package-grid">
              {filtered.map((group, index) => (
                <PackageCard key={group.key} tour={group.featured!} title={group.title} destination={group.destinations} offerCount={group.offers.length} offerIds={group.offers.map((offer) => offer.id)} index={index} departures={departures.data ?? []} />
              ))}
            </div>
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
