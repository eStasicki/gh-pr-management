import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (browser) {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key:", supabaseAnonKey ? "Present" : "Missing");
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (browser) {
    console.warn("Missing Supabase environment variables");
  }
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
