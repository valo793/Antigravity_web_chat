/* =========================================================
   Database Types — matches Supabase schema
   ========================================================= */

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  source_type: "antigravity" | "manual" | "future_api";
  is_active: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  owner_user_id: string;
  title: string;
  external_thread_id: string | null;
  agent_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // computed
  agent?: Agent;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "user" | "agent" | "system";
  sender_label: string | null;
  content: string;
  content_format: "text" | "markdown" | "json_excerpt";
  external_message_id: string | null;
  status: "received" | "processed" | "failed";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  owner_user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  title: string;
  body: string | null;
  kind: "new_message" | "agent_error" | "system";
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_id: string;
  signature_valid: boolean;
  payload: Record<string, unknown>;
  processing_status: "pending" | "success" | "failed";
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

export interface UserPreferences {
  user_id: string;
  theme: "light" | "dark";
  density: string;
  notification_sound: boolean;
  desktop_toast_enabled: boolean;
  created_at: string;
  updated_at: string;
}
