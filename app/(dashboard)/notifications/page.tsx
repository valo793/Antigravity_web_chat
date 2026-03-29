"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/dates";
import { Check, CheckCheck, MessageSquare, AlertTriangle, Info } from "lucide-react";
import type { Notification } from "@/types/database";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const json = await res.json();
      setNotifications(json.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchNotifications]);

  const markAsRead = async (ids: string[]) => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_ids: ids }),
    });
    fetchNotifications();
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length) markAsRead(unreadIds);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "agent_error": return <AlertTriangle size={14} style={{ color: "var(--color-ag-error)" }} />;
      case "system": return <Info size={14} style={{ color: "var(--color-ag-text-muted)" }} />;
      default: return <MessageSquare size={14} style={{ color: "var(--color-ag-accent)" }} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-caption ag-cursor-blink">LOADING_ARCHIVE</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-ag-border)" }}
      >
        <div>
          <h2 className="text-label">EVENT LOG</h2>
          <p className="text-caption mt-0.5">
            {unreadCount > 0 ? `${unreadCount} UNREAD` : "ALL READ"} // {notifications.length} TOTAL
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="ag-btn text-xs">
            <CheckCheck size={14} />
            MARK ALL READ
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-caption">NO_EVENTS_LOGGED</p>
              <p className="text-caption mt-1" style={{ color: "var(--color-ag-text-dim)" }}>
                Novas notificações aparecerão aqui automaticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-ag-border)" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-6 py-3 transition-colors cursor-pointer hover:opacity-90"
                style={{
                  background: notif.is_read ? "transparent" : "var(--color-ag-accent-glow)",
                }}
                onClick={() => {
                  if (!notif.is_read) markAsRead([notif.id]);
                  if (notif.conversation_id) {
                    window.location.href = `/chat/${notif.conversation_id}`;
                  }
                }}
              >
                {/* Kind icon */}
                <div className="mt-0.5 shrink-0">
                  {getKindIcon(notif.kind)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate" style={{ color: "var(--color-ag-text)" }}>
                      {notif.title}
                    </h3>
                    <span className="ag-badge" style={{ fontSize: "0.5rem" }}>
                      {notif.kind.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  {notif.body && (
                    <p className="text-caption mt-0.5 truncate" style={{ color: "var(--color-ag-text-secondary)" }}>
                      {notif.body}
                    </p>
                  )}
                  <p className="text-caption mt-1">{timeAgo(notif.created_at)}</p>
                </div>

                {/* Read indicator */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!notif.is_read) markAsRead([notif.id]);
                  }}
                  className="p-1 shrink-0 transition-opacity hover:opacity-80"
                >
                  {notif.is_read ? (
                    <CheckCheck size={16} style={{ color: "var(--color-ag-text-muted)" }} />
                  ) : (
                    <Check size={16} style={{ color: "var(--color-ag-accent)" }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
