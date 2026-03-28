import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAgentBySlug,
  getConversationByExternalThreadId,
  createConversation,
  createMessage,
  createNotification,
  createWebhookEvent,
  updateWebhookEventStatus,
  getWebhookEventByEventId,
  updateConversationUnreadCount,
} from "../db";
import { parseWebhookPayload, shouldNotifyUser, getNotificationTitle } from "../lib/webhook/parse-event";

/**
 * Webhooks router for receiving events from Antigravity
 */
export const webhooksRouter = router({
  /**
   * Receive webhook event from Antigravity
   */
  antigravity: publicProcedure
    .input(z.object({
      payload: z.record(z.string(), z.any()),
      signature: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const webhookEventId = await createWebhookEvent({
        source: "antigravity",
        eventId: (input.payload.eventId as string) || "unknown",
        signatureValid: !!input.signature,
        payload: input.payload,
        processingStatus: "pending",
        errorMessage: null,
        processedAt: null,
      });

      try {
        const event = parseWebhookPayload(input.payload);

        const existingEvent = await getWebhookEventByEventId(event.eventId);
        if (existingEvent && existingEvent.processingStatus === "success") {
          await updateWebhookEventStatus(webhookEventId, "success");
          return { success: true, message: "Event already processed" };
        }

        const agent = await getAgentBySlug(event.agentSlug);
        if (!agent) {
          throw new Error(`Agent not found: ${event.agentSlug}`);
        }

        const ownerId = 1;
        let conversation = await getConversationByExternalThreadId(event.externalThreadId, ownerId);

        if (!conversation) {
          const conversationId = await createConversation({
            userId: ownerId,
            title: `Conversa com ${agent.name}`,
            externalThreadId: event.externalThreadId,
            agentId: agent.id,
          });
          conversation = { id: conversationId } as any;

          await createNotification({
            userId: ownerId,
            conversationId: conversationId,
            messageId: null,
            title: `Nova conversa com ${agent.name}`,
            body: "Uma nova conversa foi iniciada",
            kind: "new_conversation",
            isRead: false,
            readAt: null,
          });
        }

        if (event.message && conversation) {
          const messageId = await createMessage({
            conversationId: conversation.id,
            senderType: event.message.senderType,
            senderLabel: event.message.senderLabel,
            content: event.message.content,
            contentFormat: event.message.contentFormat,
            externalMessageId: event.message.externalMessageId,
            status: "received",
            metadata: event.metadata,
          });

          const currentUnread = (conversation as any).unreadCount || 0;
          await updateConversationUnreadCount(conversation.id, currentUnread + 1);

          if (shouldNotifyUser(event.eventType)) {
            const notificationTitle = getNotificationTitle(event.eventType, event.message.senderLabel);
            await createNotification({
              userId: ownerId,
              conversationId: conversation.id,
              messageId: messageId,
              title: notificationTitle,
              body: event.message.content.substring(0, 100),
              kind: event.eventType === "error" ? "agent_error" : "new_message",
              isRead: false,
              readAt: null,
            });
          }
        }

        await updateWebhookEventStatus(webhookEventId, "success");
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await updateWebhookEventStatus(webhookEventId, "failed", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Webhook processing failed: ${errorMessage}`,
        });
      }
    }),
});
