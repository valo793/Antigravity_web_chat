import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * For Antigravity Chat, only the owner can login.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agents/systems that send messages
 */
export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sourceType: mysqlEnum("sourceType", ["antigravity", "manual", "api"]).default("antigravity").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  webhookSecret: varchar("webhookSecret", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("agents_slug_idx").on(table.slug),
}));

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Conversations/threads
 */
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  externalThreadId: varchar("externalThreadId", { length: 255 }),
  agentId: varchar("agentId", { length: 64 }),
  lastMessageAt: timestamp("lastMessageAt"),
  unreadCount: int("unreadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("conversations_userId_idx").on(table.userId),
  externalThreadIdIdx: index("conversations_externalThreadId_idx").on(table.externalThreadId),
  lastMessageAtIdx: index("conversations_lastMessageAt_idx").on(table.lastMessageAt),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages in conversations
 */
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  senderType: mysqlEnum("senderType", ["user", "agent", "system"]).notNull(),
  senderLabel: varchar("senderLabel", { length: 255 }),
  content: text("content").notNull(),
  contentFormat: mysqlEnum("contentFormat", ["text", "markdown", "json_excerpt"]).default("text").notNull(),
  externalMessageId: varchar("externalMessageId", { length: 255 }),
  status: mysqlEnum("status", ["received", "processed", "failed"]).default("received").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
  createdAtIdx: index("messages_createdAt_idx").on(table.createdAt),
  externalMessageIdIdx: index("messages_externalMessageId_idx").on(table.externalMessageId),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Attachments for messages
 */
export const attachments = mysqlTable("attachments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  messageId: varchar("messageId", { length: 64 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: text("s3Url").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdIdx: index("attachments_messageId_idx").on(table.messageId),
}));

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 64 }),
  messageId: varchar("messageId", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  kind: mysqlEnum("kind", ["new_message", "agent_error", "system", "new_conversation"]).default("new_message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
  isReadIdx: index("notifications_isRead_idx").on(table.isRead),
  createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Webhook events log
 */
export const webhookEvents = mysqlTable("webhookEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  source: varchar("source", { length: 64 }).notNull(),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  signatureValid: boolean("signatureValid").default(false).notNull(),
  payload: json("payload"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "success", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
}, (table) => ({
  eventIdIdx: index("webhookEvents_eventId_idx").on(table.eventId),
  sourceIdx: index("webhookEvents_source_idx").on(table.source),
}));

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * User preferences
 */
export const userPreferences = mysqlTable("userPreferences", {
  userId: int("userId").primaryKey(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light").notNull(),
  notificationSound: boolean("notificationSound").default(true).notNull(),
  desktopToastEnabled: boolean("desktopToastEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;