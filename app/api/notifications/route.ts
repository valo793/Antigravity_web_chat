import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";
import { getNotifications, getUnreadCount } from "@/infrastructure/database/repositories/notification.repository";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(supabase, user.id),
      getUnreadCount(supabase, user.id),
    ]);

    return NextResponse.json({ data: notifications, unread_count: unreadCount });
  } catch (err) {
    console.error("[API] Failed to get notifications:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
