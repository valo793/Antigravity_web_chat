import type { SupabaseClient } from "@supabase/supabase-js";

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
