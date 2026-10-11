import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { requireSupabase } from "../lib/data";
import type { Database } from "../types/database";
import { supabase } from "../lib/supabase";

type Notice = Database["public"]["Tables"]["notifications"]["Row"];

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const notices = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Notice[];
    },
  });
  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;
    const channel = client
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["notifications", user.id],
          });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient, user]);
  if (!user) return null;
  const unread = notices.data?.filter((notice) => !notice.read_at).length ?? 0;
  const markRead = async (notice: Notice) => {
    if (notice.read_at) return;
    await requireSupabase().rpc("mark_notification_read", {
      p_notification_id: notice.id,
    });
    void queryClient.invalidateQueries({
      queryKey: ["notifications", user.id],
    });
  };
  const destination =
    profile?.role === "administrator" || profile?.role === "staff"
      ? "/manage"
      : "/account";
  return (
    <div className="notification-wrap">
      <button
        className="icon-button notification-trigger"
        aria-label={`${unread} unread notifications`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="notification-count">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-popover" aria-label="Notifications">
          <div className="notification-head">
            <strong>Notifications</strong>
            {unread > 0 && <span>{unread} new</span>}
          </div>
          {notices.isLoading ? (
            <p className="notification-empty">Loading…</p>
          ) : notices.data?.length ? (
            notices.data.map((notice) => (
              <Link
                to={destination}
                key={notice.id}
                className={`notification-item ${notice.read_at ? "" : "unread"}`}
                onClick={() => {
                  void markRead(notice);
                  setOpen(false);
                }}
              >
                <span className="notification-dot" />
                <span>
                  <strong>{notice.title}</strong>
                  <small>{notice.message}</small>
                  <time>
                    {new Date(notice.created_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </span>
                {notice.read_at ? null : <CheckCheck size={14} />}
              </Link>
            ))
          ) : (
            <p className="notification-empty">You’re all caught up.</p>
          )}
        </section>
      )}
    </div>
  );
}
