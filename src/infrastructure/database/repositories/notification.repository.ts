import type { SupabaseClient } from "@supabase/supabase-js";

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("owner_user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

export async function createNotification(
  supabase: SupabaseClient,
  data: {
    owner_user_id: string;
    conversation_id?: string;
    message_id?: string;
    title: string;
    body?: string;
    kind?: string;
  }
) {
  const { error } = await supabase.from("notifications").insert({
    owner_user_id: data.owner_user_id,
    conversation_id: data.conversation_id || null,
    message_id: data.message_id || null,
    title: data.title,
    body: data.body || null,
    kind: data.kind || "new_message",
    is_read: false,
  });

  if (error) throw error;
}

export async function markNotificationsRead(
  supabase: SupabaseClient,
  notificationIds: string[]
) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", notificationIds);

  if (error) throw error;
}
