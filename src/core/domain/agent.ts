export interface Agent {
  id: string;
  name: string;
  slug: string;
  source_type: "antigravity" | "manual" | "future_api";
  is_active: boolean;
  created_at: string;
}
