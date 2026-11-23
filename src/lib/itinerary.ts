import type { ItineraryActivity, ItineraryDay, ItineraryLocation, Json } from "../types/database";

const objectValue = (value: Json | undefined): Record<string, Json | undefined> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
const textValue = (value: Json | undefined, fallback = "") => typeof value === "string" ? value : fallback;
const arrayValue = (value: Json | undefined) => Array.isArray(value) ? value : [];
const id = () => crypto.randomUUID();

export function emptyActivity(): ItineraryActivity {
  return { id: id(), activity_name: "", activity_description: "", attraction_name: "", image: "", activity_type: "Sightseeing", estimated_duration: "", is_included: true, notes: "" };
}

export function emptyLocation(): ItineraryLocation {
  return { id: id(), location_name: "", country: "", city: "", description: "", image: "", arrival_time: "", departure_time: "", activities: [] };
}

export function emptyDay(day_number: number): ItineraryDay {
  return { day_number, day_title: "", country: "", city: "", primary_destination: "", description: "", cover_image: "", locations: [], transportation: { transportation_type: "", departure_location: "", arrival_location: "", departure_time: "", arrival_time: "", notes: "" }, accommodation: { hotel_name: "", hotel_location: "", check_in: "", check_out: "", notes: "" }, meals: [] };
}

export function normalizeItinerary(value: Json): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  return value.map((rawDay, index) => {
    const day = objectValue(rawDay);
    // Preserve and adapt the original simple line-based itinerary records.
    const oldActivities = typeof day.activities === "string" ? day.activities : "";
    const locations = arrayValue(day.locations).map((rawLocation, locationIndex) => {
      const location = objectValue(rawLocation);
      const activities = arrayValue(location.activities).map((rawActivity) => {
        const activity = objectValue(rawActivity);
        return { ...emptyActivity(), id: textValue(activity.id, id()), activity_name: textValue(activity.activity_name || activity.name), activity_description: textValue(activity.activity_description || activity.description), attraction_name: textValue(activity.attraction_name), image: textValue(activity.image), activity_type: textValue(activity.activity_type, "Sightseeing"), estimated_duration: textValue(activity.estimated_duration), is_included: activity.is_included !== false, notes: textValue(activity.notes) };
      });
      return { ...emptyLocation(), id: textValue(location.id, `loc-${index}-${locationIndex}`), location_name: textValue(location.location_name || location.name), country: textValue(location.country), city: textValue(location.city), description: textValue(location.description), image: textValue(location.image), arrival_time: textValue(location.arrival_time), departure_time: textValue(location.departure_time), activities };
    });
    if (locations.length === 0 && oldActivities) {
      locations.push({ ...emptyLocation(), id: `legacy-${index}`, location_name: textValue(day.city || day.primary_destination), city: textValue(day.city), country: textValue(day.country), activities: oldActivities.split(/[·,;]/).map((name) => name.trim()).filter(Boolean).map((activity_name) => ({ ...emptyActivity(), activity_name, is_included: true })) });
    }
    const transportation = objectValue(day.transportation);
    const accommodation = objectValue(day.accommodation);
    return {
      ...emptyDay(Number(day.day_number) || Number(day.day) || index + 1),
      day_title: textValue(day.day_title || day.title), country: textValue(day.country), city: textValue(day.city), primary_destination: textValue(day.primary_destination), description: textValue(day.description), cover_image: textValue(day.cover_image), locations,
      transportation: { transportation_type: textValue(transportation.transportation_type), departure_location: textValue(transportation.departure_location), arrival_location: textValue(transportation.arrival_location), departure_time: textValue(transportation.departure_time), arrival_time: textValue(transportation.arrival_time), notes: textValue(transportation.notes) },
      accommodation: { hotel_name: textValue(accommodation.hotel_name || (typeof day.accommodation === "string" ? day.accommodation : undefined)), hotel_location: textValue(accommodation.hotel_location), check_in: textValue(accommodation.check_in), check_out: textValue(accommodation.check_out), notes: textValue(accommodation.notes) },
      meals: arrayValue(day.meals).filter((meal): meal is string => typeof meal === "string"),
    };
  });
}

export function itineraryJson(days: ItineraryDay[]): Json {
  return days.map((day) => ({ ...day, day_number: day.day_number }));
}
