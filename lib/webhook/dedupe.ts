import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a webhook event has already been processed (deduplication by event_id).
 * Returns true if event already exists with status "success".
 */
export async function isDuplicateEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id, processing_status")
    .eq("event_id", eventId)
    .eq("processing_status", "success")
    .limit(1)
    .single();

  return !!data;
}
