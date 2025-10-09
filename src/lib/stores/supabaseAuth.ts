import { writable } from "svelte/store";
import { supabase } from "$lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

interface SupabaseAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const initialState: SupabaseAuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
};

export const supabaseAuth = writable<SupabaseAuthState>(initialState);

export const initializeAuth = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      supabaseAuth.update((state) => ({
        ...state,
        error: error.message,
        loading: false,
      }));
      return;
    }

    supabaseAuth.update((state) => ({
      ...state,
      user: session?.user ?? null,
      session,
      loading: false,
      error: null,
    }));

    supabase.auth.onAuthStateChange((event, session) => {
      supabaseAuth.update((state) => ({
        ...state,
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      }));
    });
  } catch (error) {
    supabaseAuth.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Unknown error",
      loading: false,
    }));
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    supabaseAuth.update((state) => ({ ...state, error: error.message }));
  }
};
