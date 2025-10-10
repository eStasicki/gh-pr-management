import { writable } from "svelte/store";
import { supabase } from "$lib/supabaseClient";
import { adminService } from "$lib/services/adminService";
import type { User, Session } from "@supabase/supabase-js";

interface SupabaseAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  bannedMessage: string | null;
}

const initialState: SupabaseAuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  bannedMessage: null,
};

export const supabaseAuth = writable<SupabaseAuthState>(initialState);

async function checkUserBanStatus(userId: string): Promise<boolean> {
  try {
    return await adminService.isUserBanned(userId);
  } catch (error) {
    console.error("Error checking ban status:", error);
    return false;
  }
}

async function handleUserSession(session: Session | null) {
  if (!session?.user) {
    supabaseAuth.update((state) => ({
      ...state,
      user: null,
      session: null,
      loading: false,
      error: null,
      bannedMessage: null,
    }));
    return;
  }

  const isBanned = await checkUserBanStatus(session.user.id);

  if (isBanned) {
    await signOut();
    supabaseAuth.update((state) => ({
      ...state,
      user: null,
      session: null,
      loading: false,
      error: null,
      bannedMessage: "Twoje konto zostało zablokowane",
    }));
    return;
  }

  supabaseAuth.update((state) => ({
    ...state,
    user: session.user,
    session,
    loading: false,
    error: null,
    bannedMessage: null,
  }));
}

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

    await handleUserSession(session);

    supabase.auth.onAuthStateChange(async (event, session) => {
      await handleUserSession(session);
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
