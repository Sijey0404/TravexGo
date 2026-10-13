import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  contactSchema,
  loginSchema,
  registerSchema,
} from "./forms";
import { formatError } from "../lib/data";

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