import type { SupabaseClient } from "@supabase/supabase-js";

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
