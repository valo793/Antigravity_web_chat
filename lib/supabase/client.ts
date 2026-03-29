import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client during build/prerender — it won't be called at runtime
    // because the page is "use client" and env vars will be available in the browser.
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient(url, key);
}
