import type { Agent } from "./agent";

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
