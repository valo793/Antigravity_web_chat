import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";
import { getConversationById } from "@/infrastructure/database/repositories/conversation.repository";
import { getMessages } from "@/infrastructure/database/repositories/message.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getConversationById(supabase, id, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  try {
    const messages = await getMessages(supabase, id, limit, offset);
    return NextResponse.json({ data: messages });
  } catch (err) {
    console.error("[API] Failed to get messages:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
