import type { SupabaseClient } from "@supabase/supabase-js";

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
