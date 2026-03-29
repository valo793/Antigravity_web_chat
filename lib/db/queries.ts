import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message, Notification } from "@/types/database";

/* ============ CONVERSATIONS ============ */

export async function getConversations(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      agents ( name, slug ),
      unread_count:notifications!notifications_conversation_id_fkey(count)
    `)
    .eq("owner_user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((c: any) => ({
    ...c,
    agent: c.agents,
    unread_count: c.unread_count?.[0]?.count || 0,
  }));
}

export async function getConversationById(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, agents ( name, slug )")
    .eq("id", conversationId)
    .eq("owner_user_id", userId)
    .single();

  if (error) return null;
  return { ...data, agent: data.agents };
}

export async function getConversationByExternalThread(
  supabase: SupabaseClient,
  externalThreadId: string
) {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("external_thread_id", externalThreadId)
    .limit(1)
    .single();

  return data;
}

export async function createConversation(
  supabase: SupabaseClient,
  data: {
    owner_user_id: string;
    title: string;
    external_thread_id?: string;
    agent_id?: string;
  }
) {
  const { data: conv, error } = await supabase
    .from("conversations")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return conv;
}

/* ============ MESSAGES ============ */

export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 50,
  offset = 0
) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function createMessage(
  supabase: SupabaseClient,
  data: {
    conversation_id: string;
    sender_type: string;
    sender_label?: string;
    content: string;
    content_format?: string;
    external_message_id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: data.conversation_id,
      sender_type: data.sender_type,
      sender_label: data.sender_label || null,
      content: data.content,
      content_format: data.content_format || "text",
      external_message_id: data.external_message_id || null,
      status: data.status || "received",
      metadata: data.metadata || null,
    })
    .select()
    .single();

  if (error) throw error;
  return msg;
}

/* ============ NOTIFICATIONS ============ */

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

/* ============ WEBHOOK EVENTS ============ */

export async function createWebhookEvent(
  supabase: SupabaseClient,
  data: {
    source: string;
    event_id: string;
    signature_valid: boolean;
    payload: unknown;
  }
) {
  const { data: evt, error } = await supabase
    .from("webhook_events")
    .insert({
      source: data.source,
      event_id: data.event_id,
      signature_valid: data.signature_valid,
      payload: data.payload,
      processing_status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return evt.id;
}

export async function updateWebhookEventStatus(
  supabase: SupabaseClient,
  id: string,
  status: "success" | "failed",
  errorMessage?: string
) {
  await supabase
    .from("webhook_events")
    .update({
      processing_status: status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/* ============ AGENTS ============ */

export async function getAgentBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

/**
 * Get agent by slug, or auto-create if it doesn't exist.
 * This allows the webhook to work without pre-seeding agents.
 */
export async function getOrCreateAgent(supabase: SupabaseClient, slug: string) {
  // Try to find existing agent (active or inactive)
  const { data: existing } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (existing) return existing;

  // Auto-create with a display name derived from slug
  const displayName = slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const { data: created, error } = await supabase
    .from("agents")
    .insert({
      name: displayName,
      slug,
      source_type: "antigravity",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function getAgents(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("agents")
    .select("*")
    .order("name");

  return data || [];
}
