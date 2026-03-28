import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
} from "../db";

/**
 * Notifications router
 */
export const notificationsRouter = router({
  /**
   * Get all notifications for the authenticated user
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getNotifications(ctx.user.id, input.limit);
    }),

  /**
   * Get count of unread notifications
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getUnreadNotificationCount(ctx.user.id);
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await Promise.all(input.notificationIds.map(id => markNotificationAsRead(id)));
      return { success: true };
    }),
});
