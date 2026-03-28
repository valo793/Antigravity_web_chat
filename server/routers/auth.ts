import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";

/**
 * Authentication router - restricted to owner only
 */
export const authRouter = router({
  /**
   * Get current authenticated user
   * Returns null if not authenticated
   */
  me: publicProcedure.query((opts) => {
    return opts.ctx.user || null;
  }),

  /**
   * Check if user is the owner (admin)
   */
  isOwner: publicProcedure.query((opts) => {
    return opts.ctx.user?.role === 'admin' || false;
  }),

  /**
   * Logout - clear session cookie
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
