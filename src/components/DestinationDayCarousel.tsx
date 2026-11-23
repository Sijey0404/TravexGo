import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { ItineraryDay } from "../types/database";

function dayImage(day: ItineraryDay, fallback: string | null) {
  return day.cover_image || day.locations.find((location) => location.image)?.image || day.locations.flatMap((location) => location.activities).find((activity) => activity.image)?.image || fallback || "";
}

export default function DestinationDayCarousel({ days, fallbackImage, onSelectDay }: { days: ItineraryDay[]; fallbackImage: string | null; onSelectDay: (dayNumber: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = (index: number, smooth = true) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    const style = getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    track.scrollTo({ left: Math.max(0, index * step), behavior: smooth ? "smooth" : "auto" });
  };

  const move = (direction: -1 | 1) => {
    if (!days.length) return;
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    const style = getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const maxIndex = step > 0 ? Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step)) : 0;
    const current = Math.min(activeIndex, maxIndex);
    const next = direction > 0
      ? (current >= maxIndex ? 0 : current + 1)
      : (current <= 0 ? maxIndex : current - 1);
    scrollToIndex(next);
    setActiveIndex(next);
  };

  useEffect(() => {
    if (paused || days.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => move(1), 4600);
    return () => window.clearInterval(timer);
  }, [paused, activeIndex, days.length]);

  const onScroll = () => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    const style = getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    if (step > 0) setActiveIndex(Math.min(days.length - 1, Math.round(track.scrollLeft / step)));
  };

  return <section className="days-offered" aria-labelledby="days-offered-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div className="days-offered-heading"><div><span className="eyebrow">THE ROUTE</span><h2 id="days-offered-title">Days offered</h2><p>Explore the places and highlights planned for each day.</p></div><div className="days-carousel-actions"><span>Day {Math.min(activeIndex + 1, days.length)} of {days.length}</span><button type="button" className="days-carousel-arrow" aria-label="Previous itinerary day" onClick={() => move(-1)} disabled={days.length < 2}><ChevronLeft size={20} /></button><button type="button" className="days-carousel-arrow" aria-label="Next itinerary day" onClick={() => move(1)} disabled={days.length < 2}><ChevronRight size={20} /></button></div></div>
    {days.length ? <>
      <div className="days-carousel-track" ref={trackRef} onScroll={onScroll}>
        {days.map((day, index) => {
          const image = dayImage(day, fallbackImage);
          const destination = day.primary_destination || day.locations[0]?.location_name || day.city || "Destination highlight";
          const location = [day.city || day.locations[0]?.city, day.country || day.locations[0]?.country].filter(Boolean).join(", ");
          return <button className={`days-carousel-card ${activeIndex === index ? "is-active" : ""}`} type="button" key={`${day.day_number}-${index}`} onClick={() => onSelectDay(index + 1)} aria-label={`View day ${index + 1}: ${destination}`}>
            <div className="days-carousel-image">{image ? <img src={image} alt={destination} loading="lazy" /> : <div className="days-carousel-placeholder"><MapPin size={25} /><span>{location || destination}</span></div>}<span className="days-carousel-day">DAY {index + 1}</span></div>
            <div className="days-carousel-card-copy"><strong>{day.day_title || destination}</strong><span><MapPin size={13} /> {location || destination}</span><small>{day.locations.length} {day.locations.length === 1 ? "stop" : "stops"} · {day.locations.reduce((total, item) => total + item.activities.length, 0)} activities</small></div>
          </button>;
        })}
      </div>
      <div className="days-carousel-progress" role="group" aria-label="Select itinerary day">{days.map((day, index) => <button key={`${day.day_number}-dot`} type="button" aria-label={`Show day ${index + 1}`} aria-current={activeIndex === index ? "true" : undefined} className={activeIndex === index ? "is-active" : ""} onClick={() => { setActiveIndex(index); scrollToIndex(index); }} />)}</div>
    </> : <div className="days-carousel-empty">This offer’s itinerary will be announced soon.</div>}
  </section>;
}
