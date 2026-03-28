import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getConversations,
  getConversationById,
  getMessages,
  createMessage,
  getAttachmentsByMessageId,
} from "../db";

/**
 * Chat router for conversations and messages
 */
export const chatRouter = router({
  /**
   * Get all conversations for the authenticated user
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getConversations(ctx.user.id);
  }),

  /**
   * Get a specific conversation with all messages
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversa não encontrada" });
      }

      const messages = await getMessages(input.conversationId);
      const messagesWithAttachments = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          attachments: await getAttachmentsByMessageId(msg.id),
        }))
      );

      return {
        conversation,
        messages: messagesWithAttachments,
      };
    }),

  /**
   * Get messages for a conversation with pagination
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const messages = await getMessages(input.conversationId, input.limit, input.offset);
      return messages;
    }),

  /**
   * Send a message from the user
   * Currently just logs the intent; can be extended to send to Antigravity
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const messageId = await createMessage({
        conversationId: input.conversationId,
        senderType: "user",
        senderLabel: ctx.user.name || "Você",
        content: input.content,
        contentFormat: "text",
        status: "received",
        externalMessageId: null,
        metadata: null,
      });

      return { messageId };
    }),
});
