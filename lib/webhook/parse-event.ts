import { WebhookPayloadSchema, type WebhookPayload } from "@/types/webhook";

/**
 * Parse and validate incoming webhook payload.
 */
export function parseWebhookPayload(data: unknown): WebhookPayload {
  return WebhookPayloadSchema.parse(data);
}

/**
 * Determine if this event type should generate a user notification.
 */
export function shouldNotifyUser(eventType: string): boolean {
  return eventType === "response_ready" || eventType === "error";
}

/**
 * Generate human-readable notification title.
 */
export function getNotificationTitle(
  eventType: string,
  agentLabel: string
): string {
  switch (eventType) {
    case "response_ready":
      return `Resposta de ${agentLabel}`;
    case "error":
      return `Erro de ${agentLabel}`;
    case "status_update":
      return `Atualização de ${agentLabel}`;
    default:
      return `Mensagem de ${agentLabel}`;
  }
}
