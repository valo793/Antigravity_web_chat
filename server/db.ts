import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, notifications, webhookEvents, agents, attachments, userPreferences, Conversation, Message, Notification, Agent, Attachment, WebhookEvent } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CONVERSATION QUERIES ============

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.lastMessageAt));
}

export async function getConversationById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getConversationByExternalThreadId(externalThreadId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(and(eq(conversations.externalThreadId, externalThreadId), eq(conversations.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createConversation(data: { userId: number; title: string; externalThreadId?: string; agentId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(conversations).values({ id, ...data });
  return id;
}

export async function updateConversationUnreadCount(id: string, count: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ unreadCount: count }).where(eq(conversations.id, id));
}

// ============ MESSAGE QUERIES ============

export async function getMessages(conversationId: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)).limit(limit).offset(offset);
}

export async function createMessage(data: Omit<Message, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(messages).values({ id, ...data });
  return id;
}

export async function getMessageByExternalId(externalMessageId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messages).where(eq(messages.externalMessageId, externalMessageId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ NOTIFICATION QUERIES ============

export async function getNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(notifications).values({ id, ...data });
  return id;
}

export async function markNotificationAsRead(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

// ============ WEBHOOK EVENT QUERIES ============

export async function createWebhookEvent(data: Omit<WebhookEvent, 'id' | 'receivedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(webhookEvents).values({ id, ...data });
  return id;
}

export async function getWebhookEventByEventId(eventId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, eventId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWebhookEventStatus(id: string, status: 'success' | 'failed', errorMessage?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEvents).set({ processingStatus: status, errorMessage, processedAt: new Date() }).where(eq(webhookEvents.id, id));
}

// ============ AGENT QUERIES ============

export async function getAgentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.isActive, true));
}

// ============ ATTACHMENT QUERIES ============

export async function createAttachment(data: Omit<Attachment, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(attachments).values({ id, ...data });
  return id;
}

export async function getAttachmentsByMessageId(messageId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attachments).where(eq(attachments.messageId, messageId));
}

// ============ USER PREFERENCES QUERIES ============

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserPreferences(userId: number, data: Partial<typeof userPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userPreferences).values({ userId, ...data }).onDuplicateKeyUpdate({ set: data });
}
