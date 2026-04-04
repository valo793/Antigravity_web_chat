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
