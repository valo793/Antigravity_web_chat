import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";
import { markNotificationsRead } from "@/infrastructure/database/repositories/notification.repository";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notification_ids } = body;

  if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
    return NextResponse.json({ error: "Missing notification_ids" }, { status: 400 });
  }

  try {
    await markNotificationsRead(supabase, notification_ids);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] Failed to mark notifications read:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
