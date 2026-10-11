import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, MapPin, Phone } from "lucide-react";
import { createContactMessage, formatError } from "../lib/data";
import { isSupabaseConfigured } from "../lib/supabase";
import { contactSchema, type ContactFields } from "../validations/forms";

export default function ContactPage() {
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFields>({ resolver: zodResolver(contactSchema) });
  const submit = async (input: ContactFields) => {
    try {
      await createContactMessage(input);
      reset();
      setNotice({
        text: "Your message has been received. Our team will be in touch.",
        error: false,
      });
    } catch (error) {
      setNotice({ text: formatError(error), error: true });
    }
  };
  return (
    <>
      <section className="catalog-head">
        <span className="eyebrow">A REAL PERSON, RIGHT HERE</span>
        <h1>Let’s talk travel.</h1>
        <p>Have a question about a journey? Tell us what you’re thinking.</p>
      </section>
      <section className="section contact-layout">
        <form className="form-stack" onSubmit={handleSubmit(submit)} noValidate>
          {!isSupabaseConfigured && (
            <div className="form-notice">
              Contact submissions will work once Supabase is connected.
            </div>
          )}
          {notice && (
            <div
              className={`form-notice ${notice.error ? "" : "success"}`}
              role="status"
            >
              {notice.text}
            </div>
          )}
          <label>
            Your name
            <input
              className="field-control"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <span className="form-error">{errors.name.message}</span>
            )}
          </label>
          <label>
            Email address
            <input
              className="field-control"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <span className="form-error">{errors.email.message}</span>
            )}
          </label>
          <label>
            Subject
            <input className="field-control" {...register("subject")} />
            {errors.subject && (
              <span className="form-error">{errors.subject.message}</span>
            )}
          </label>
          <label>
            Your message
            <textarea
              className="field-control"
              rows={5}
              {...register("message")}
            />
            {errors.message && (
              <span className="form-error">{errors.message.message}</span>
            )}
          </label>
          <button
            className="button button-dark"
            disabled={isSubmitting || !isSupabaseConfigured}
          >
            {isSubmitting ? "Sending…" : "Send your message"}
          </button>
        </form>
        <aside>
          <h2 style={{ font: "700 22px var(--serif)" }}>TravexGo</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
            San Carlos City
            <br />
            Pangasinan, Philippines
          </p>
          <ul className="detail-list">
            <li>
              <MapPin size={16} /> San Carlos City, Pangasinan
            </li>
            <li>
              <Phone size={16} /> Contact details available on inquiry
            </li>
            <li>
              <Clock3 size={16} /> Operating hours vary by season
            </li>
          </ul>
        </aside>
      </section>
    </>
  );
}
