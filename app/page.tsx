import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infrastructure/database/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/chat");
  } else {
    redirect("/login");
  }
}
