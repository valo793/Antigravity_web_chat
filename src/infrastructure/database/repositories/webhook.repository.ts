import type { SupabaseClient } from "@supabase/supabase-js";

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
