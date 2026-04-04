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
