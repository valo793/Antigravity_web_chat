import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  // Parallel queries for all stats
  const [
    conversationsRes,
    messagesRes,
    agentsRes,
    notificationsRes,
    webhookEventsRes,
  ] = await Promise.all([
    supabase.from("conversations").select("id, created_at, agent_id, last_message_at", { count: "exact" }).eq("owner_user_id", uid),
    supabase.from("messages").select("id, conversation_id, sender_type, created_at, content", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("agents").select("id, name, slug, is_active, created_at"),
    supabase.from("notifications").select("id, is_read, kind, created_at", { count: "exact" }).eq("owner_user_id", uid),
    supabase.from("webhook_events").select("id, processing_status, created_at", { count: "exact" }),
  ]);

  const conversations = conversationsRes.data || [];
  const messages = messagesRes.data || [];
  const agents = agentsRes.data || [];
  const notifications = notificationsRes.data || [];
  const webhookEvents = webhookEventsRes.data || [];

  // --- Aggregate stats ---
  const totalConversations = conversations.length;
  const totalMessages = messages.length;
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.is_active).length;
  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

  // Messages by sender type
  const userMessages = messages.filter((m) => m.sender_type === "user").length;
  const agentMessages = messages.filter((m) => m.sender_type === "agent").length;
  const systemMessages = messages.filter((m) => m.sender_type === "system").length;

  // Webhook stats
  const webhookSuccess = webhookEvents.filter((e) => e.processing_status === "success").length;
  const webhookFailed = webhookEvents.filter((e) => e.processing_status === "failed").length;
  const webhookPending = webhookEvents.filter((e) => e.processing_status === "pending").length;

  // Messages per day (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const messagesLast30 = messages.filter((m) => new Date(m.created_at) >= thirtyDaysAgo);

  const dailyActivity: Record<string, { user: number; agent: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyActivity[key] = { user: 0, agent: 0 };
  }
  messagesLast30.forEach((m) => {
    const key = new Date(m.created_at).toISOString().split("T")[0];
    if (dailyActivity[key]) {
      if (m.sender_type === "user") dailyActivity[key].user++;
      else dailyActivity[key].agent++;
    }
  });

  // Agent usage ranking (by message count per agent via conversations)
  const convAgentMap: Record<string, string> = {};
  conversations.forEach((c) => {
    if (c.agent_id) convAgentMap[c.id] = c.agent_id;
  });

  const agentMessageCount: Record<string, number> = {};
  messages.forEach((m) => {
    const agentId = convAgentMap[m.conversation_id];
    if (agentId) {
      agentMessageCount[agentId] = (agentMessageCount[agentId] || 0) + 1;
    }
  });

  const agentRanking = agents
    .map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      is_active: a.is_active,
      message_count: agentMessageCount[a.id] || 0,
      conversation_count: conversations.filter((c) => c.agent_id === a.id).length,
    }))
    .sort((a, b) => b.message_count - a.message_count);

  // Hourly distribution (0-23)
  const hourlyDistribution = Array(24).fill(0);
  messages.forEach((m) => {
    const hour = new Date(m.created_at).getHours();
    hourlyDistribution[hour]++;
  });

  // Average messages per conversation
  const avgMessagesPerConv = totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;

  // Average response length
  const agentMsgs = messages.filter((m) => m.sender_type === "agent" && m.content);
  const avgResponseLength = agentMsgs.length > 0
    ? Math.round(agentMsgs.reduce((sum, m) => sum + (m.content?.length || 0), 0) / agentMsgs.length)
    : 0;

  return NextResponse.json({
    summary: {
      total_conversations: totalConversations,
      total_messages: totalMessages,
      total_agents: totalAgents,
      active_agents: activeAgents,
      unread_notifications: unreadNotifications,
      user_messages: userMessages,
      agent_messages: agentMessages,
      system_messages: systemMessages,
      avg_messages_per_conversation: avgMessagesPerConv,
      avg_response_length: avgResponseLength,
    },
    webhook: {
      total: webhookEvents.length,
      success: webhookSuccess,
      failed: webhookFailed,
      pending: webhookPending,
    },
    daily_activity: Object.entries(dailyActivity).map(([date, counts]) => ({
      date,
      user: counts.user,
      agent: counts.agent,
      total: counts.user + counts.agent,
    })),
    agent_ranking: agentRanking,
    hourly_distribution: hourlyDistribution,
  });
}
