import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().trim().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address."),
  subject: z.string().trim().min(3, "Add a short subject."),
  message: z.string().trim().min(10, "Please add a little more detail."),
});

export const bookingSchema = z.object({
  travelerCount: z.number().int().min(1).max(20),
  travelerNames: z.string().trim().min(2, "Enter the lead traveler name."),
  specialRequests: z.string().max(1000).optional(),
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;
export type ContactFields = z.infer<typeof contactSchema>;
export type BookingFields = z.infer<typeof bookingSchema>;