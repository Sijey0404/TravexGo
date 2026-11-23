import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  contactSchema,
  loginSchema,
  registerSchema,
} from "./forms";
import { formatError } from "../lib/data";
import { itineraryJson, normalizeItinerary } from "../lib/itinerary";

describe("form validation", () => {
  it("rejects invalid email and short passwords", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "short" }).success).toBe(false);
  });

  it("requires a name for a new customer", () => {
    expect(registerSchema.safeParse({ email: "guest@example.test", password: "safe-pass-123" }).success).toBe(false);
  });

  it("accepts a complete contact message and rejects short messages", () => {
    const valid = { name: "A Traveler", email: "guest@example.test", subject: "Trip details", message: "Could you share the next available dates?" };
    expect(contactSchema.safeParse(valid).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
  });

  it("requires a positive integer traveler count", () => {
    const booking = { travelerCount: 2, travelerNames: "A Traveler\nB Traveler" };
    expect(bookingSchema.safeParse(booking).success).toBe(true);
    expect(bookingSchema.safeParse({ ...booking, travelerCount: 0 }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...booking, travelerCount: 1.5 }).success).toBe(false);
  });
});

describe("error formatting", () => {
  it("shows the message from a plain Supabase error object", () => {
    expect(formatError({ message: "new row violates row-level security policy" })).toBe(
      "new row violates row-level security policy",
    );
  });
});

describe("multi-destination itineraries", () => {
  it("preserves nested locations, activities, transport and meals", () => {
    const days = normalizeItinerary([{ day_number: 1, day_title: "Rome", country: "Italy", city: "Rome", locations: [{ id: "colosseum", location_name: "Colosseum", activities: [{ id: "tour", activity_name: "Guided tour", activity_type: "Historical Tour", is_included: true }] }], transportation: { transportation_type: "Private bus" }, accommodation: { hotel_name: "Hotel Roma" }, meals: ["Dinner"] }]);
    const saved = itineraryJson(days) as Array<{ locations: Array<{ activities: Array<{ activity_name: string }> }> }>;
    expect(days[0].locations[0].location_name).toBe("Colosseum");
    expect(saved[0].locations[0].activities[0].activity_name).toBe("Guided tour");
    expect(days[0].transportation.transportation_type).toBe("Private bus");
    expect(days[0].meals).toEqual(["Dinner"]);
  });

  it("adapts legacy simple itinerary records", () => {
    const days = normalizeItinerary([{ day: 2, title: "City day", city: "Paris", activities: "Louvre · Seine cruise", accommodation: "Hotel Paris" }]);
    expect(days[0].day_number).toBe(2);
    expect(days[0].locations[0].activities.map((activity) => activity.activity_name)).toEqual(["Louvre", "Seine cruise"]);
    expect(days[0].accommodation.hotel_name).toBe("Hotel Paris");
  });
});
