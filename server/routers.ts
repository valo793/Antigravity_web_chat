import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { chatRouter } from "./routers/chat";
import { notificationsRouter } from "./routers/notifications";
import { webhooksRouter } from "./routers/webhooks";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
  webhooks: webhooksRouter,
});

export type AppRouter = typeof appRouter;
