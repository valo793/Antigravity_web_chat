import { z } from 'zod';

/**
 * Webhook payload schema from Antigravity
 */
export const WebhookPayloadSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(['response_ready', 'error', 'status_update']),
  agentSlug: z.string().min(1),
  externalThreadId: z.string().min(1),
  timestamp: z.string().or(z.number()),
  userRef: z.string().optional(),
  message: z.object({
    externalMessageId: z.string().min(1),
    senderType: z.enum(['agent', 'system']),
    senderLabel: z.string(),
    content: z.string(),
    contentFormat: z.enum(['text', 'markdown', 'json_excerpt']).default('text'),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(data: unknown): WebhookPayload {
  return WebhookPayloadSchema.parse(data);
}

/**
 * Determine if webhook event should trigger a notification
 */
export function shouldNotifyUser(eventType: string): boolean {
  return eventType === 'response_ready' || eventType === 'error';
}

/**
 * Generate notification title based on event type
 */
export function getNotificationTitle(eventType: string, agentLabel: string): string {
  switch (eventType) {
    case 'response_ready':
      return `Resposta de ${agentLabel}`;
    case 'error':
      return `Erro de ${agentLabel}`;
    case 'status_update':
      return `Atualização de ${agentLabel}`;
    default:
      return `Mensagem de ${agentLabel}`;
  }
}
