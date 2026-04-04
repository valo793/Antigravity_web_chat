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
