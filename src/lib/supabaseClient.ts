import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export function getRedirectUrl(): string {
  if (!browser) return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: browser,
    },
  }
);
