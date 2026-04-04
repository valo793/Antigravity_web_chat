import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";
import { getConversationById } from "@/infrastructure/database/repositories/conversation.repository";
import { createMessage } from "@/infrastructure/database/repositories/message.repository";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { conversation_id, content } = body;

  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing conversation_id or content" }, { status: 400 });
  }

  const conversation = await getConversationById(supabase, conversation_id, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    const message = await createMessage(supabase, {
      conversation_id,
      sender_type: "user",
      sender_label: user.user_metadata?.display_name || user.email?.split("@")[0] || "Você",
      content: content.trim(),
      content_format: "text",
      status: "received",
    });

    return NextResponse.json({ data: message });
  } catch (err) {
    console.error("[API] Failed to send message:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
