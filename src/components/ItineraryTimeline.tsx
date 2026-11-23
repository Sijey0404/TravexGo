import { Bus, MapPin, Utensils } from "lucide-react";
import type { ItineraryDay } from "../types/database";

export default function ItineraryTimeline({ days, preview = false }: { days: ItineraryDay[]; preview?: boolean }) {
  if (!days.length) return <p>{preview ? "Add itinerary days to preview the travel route." : "A detailed itinerary will be shared soon."}</p>;
  const route = [...new Set(days.map((day) => [day.city, day.country].filter(Boolean).join(", ")).filter(Boolean))];
  return <div className="itinerary-view">
    {route.length > 1 && <div className="itinerary-route"><span>Route</span>{route.map((stop, index) => <span key={`${stop}-${index}`} className="itinerary-route-stop">{index > 0 && <b>→</b>} {stop}</span>)}</div>}
    <ol className="itinerary-timeline">{days.map((day, dayIndex) => <li key={`day-${dayIndex}`}>
      <span className="itinerary-day">Day {dayIndex + 1}</span>
      <details className="itinerary-day-detail">
        <summary><strong>{day.day_title || day.primary_destination || day.city || `Day ${dayIndex + 1}`}</strong><span>{[day.city, day.country].filter(Boolean).join(", ")}</span></summary>
        <div className="itinerary-day-content">
          {day.cover_image && <img className="itinerary-cover" src={day.cover_image} alt={day.day_title || `Day ${dayIndex + 1}`} loading="lazy" />}
          {day.description && <p>{day.description}</p>}
          {day.locations.map((location, locationIndex) => <article className="itinerary-stop-card" key={location.id || locationIndex}>
            {location.image && <img src={location.image} alt={location.location_name} loading="lazy" />}
            <div className="itinerary-stop-copy"><span className="itinerary-location"><MapPin size={14} /> {location.location_name || location.city}{location.country ? `, ${location.country}` : ""}</span>
              {(location.arrival_time || location.departure_time) && <small>{location.arrival_time && `Arrive ${location.arrival_time}`}{location.arrival_time && location.departure_time && " · "}{location.departure_time && `Depart ${location.departure_time}`}</small>}
              {location.description && <p>{location.description}</p>}
              {location.activities.map((activity, activityIndex) => <div className="itinerary-activity-view" key={activity.id || activityIndex}>
                {activity.image && <img src={activity.image} alt={activity.attraction_name || activity.activity_name} loading="lazy" />}
                <div><strong>{activity.activity_name || activity.attraction_name}</strong>{activity.attraction_name && activity.activity_name && <span>{activity.attraction_name}</span>}
                  <small>{activity.activity_type}{activity.estimated_duration ? ` · ${activity.estimated_duration}` : ""}{activity.is_included ? " · Included" : " · Optional"}</small>
                  {activity.activity_description && <p>{activity.activity_description}</p>}{activity.notes && <small>{activity.notes}</small>}
                </div>
              </div>)}
            </div>
          </article>)}
          {day.transportation.transportation_type && <div className="itinerary-extra-view"><Bus size={16} /><span><strong>{day.transportation.transportation_type}</strong>{day.transportation.departure_location && ` · ${day.transportation.departure_location}`}{day.transportation.arrival_location && ` → ${day.transportation.arrival_location}`}{day.transportation.departure_time && ` · ${day.transportation.departure_time}`}{day.transportation.notes && <small>{day.transportation.notes}</small>}</span></div>}
          {day.accommodation.hotel_name && <div className="itinerary-extra-view"><MapPin size={16} /><span><strong>{day.accommodation.hotel_name}</strong>{day.accommodation.hotel_location && ` · ${day.accommodation.hotel_location}`}{day.accommodation.check_in && <small>Check-in {day.accommodation.check_in}{day.accommodation.check_out ? ` · Check-out ${day.accommodation.check_out}` : ""}</small>}{day.accommodation.notes && <small>{day.accommodation.notes}</small>}</span></div>}
          {day.meals.length > 0 && <div className="itinerary-extra-view"><Utensils size={16} /><span>Meals: {day.meals.join(", ")}</span></div>}
        </div>
      </details>
    </li>)}</ol>
  </div>;
}
