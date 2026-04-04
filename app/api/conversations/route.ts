import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";
import { getConversations } from "@/infrastructure/database/repositories/conversation.repository";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await getConversations(supabase, user.id);
    return NextResponse.json({ data: conversations });
  } catch (err) {
    console.error("[API] Failed to list conversations:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
