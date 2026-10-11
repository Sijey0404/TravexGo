import { isSupabaseConfigured } from "../lib/supabase";

export function ConnectionNotice() {
  return isSupabaseConfigured ? null : (
    <div className="connection-notice" role="status">
      Connect Supabase to load live trips and enable bookings. Copy{" "}
      <strong>.env.example</strong> to <strong>.env.local</strong> and add the
      project URL and publishable key.
    </div>
  );
}

export function LoadingState({
  label = "Loading live information…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-line" role="status">
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      {message}
    </div>
  );
}
