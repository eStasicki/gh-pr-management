import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export function getRedirectUrl(): string {
  if (!browser) return "/auth/callback";
  
  // Check if we're running in Electron
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;
  
  if (isElectron) {
    // In Electron, use the current window.location.origin (should be http://127.0.0.1:5174)
    return `${window.location.origin}/auth/callback`;
  }
  
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
