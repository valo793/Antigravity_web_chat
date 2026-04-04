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
import { z } from "zod";

/**
 * Webhook payload schema from Antigravity agents.
 * Matches scope section 11 format.
 */
export const WebhookPayloadSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(["response_ready", "error", "status_update"]),
  agent_slug: z.string().min(1),
  external_thread_id: z.string().min(1),
  timestamp: z.string(),
  user_ref: z.string().optional(),
  message: z
    .object({
      external_message_id: z.string().min(1),
      sender_type: z.enum(["agent", "system"]),
      sender_label: z.string(),
      content: z.string(),
      content_format: z
        .enum(["text", "markdown", "json_excerpt"])
        .default("text"),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export interface WebhookResponse {
  success: boolean;
  message?: string;
  event_id?: string;
}
