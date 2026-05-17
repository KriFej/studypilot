import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Pendant le prerender/build sans env vars, évite de crasher.
  // Les hooks ignorent toute requête tant que ces valeurs sont absentes.
  if (!url || !key) {
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key",
    );
  }
  return createBrowserClient(url, key);
}
