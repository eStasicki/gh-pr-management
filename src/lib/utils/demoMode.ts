import {
  prs,
  currentUser,
  isLoading,
  currentPage,
  totalPages,
  totalPRs,
} from "$lib/stores/prs";
import { generateMockPRs, mockCurrentUser } from "$lib/mockData";
import { get } from "svelte/store";
import { config, saveConfigToSupabase } from "$lib/stores/config";
import { resetMockCache } from "$lib/utils/apiUtils";

export async function enableDemoMode() {
  console.log("🎭 Enabling demo mode with mock data");

  // Ustaw przykładowego użytkownika
  currentUser.set(mockCurrentUser);

  // Wyczyść dane - funkcje loadPRs i getAllUserPRs obsłużą resztę
  prs.set([]);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);

  // Zapisz stan demo w Supabase
  const currentConfig = get(config);
  const updatedConfig = { ...currentConfig, demoMode: true };
  config.set(updatedConfig);

  try {
    await saveConfigToSupabase(updatedConfig);
    console.log("✅ Demo mode state saved to Supabase");
  } catch (error) {
    console.error("❌ Failed to save demo mode state:", error);
  }
}

export async function disableDemoMode() {
  console.log("🚫 Disabling demo mode");

  // Wyczyść dane
  prs.set([]);
  currentUser.set(null);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);

  // Resetuj cache mock danych
  resetMockCache();

  // Zapisz stan demo w Supabase
  const currentConfig = get(config);
  const updatedConfig = { ...currentConfig, demoMode: false };
  config.set(updatedConfig);

  try {
    await saveConfigToSupabase(updatedConfig);
    console.log("✅ Demo mode disabled in Supabase");
  } catch (error) {
    console.error("❌ Failed to save demo mode state:", error);
  }
}

export function isDemoMode(): boolean {
  const user = get(currentUser);
  const currentConfig = get(config);

  // Sprawdź czy mamy przykładowego użytkownika LUB czy demo_mode jest włączone w konfiguracji
  return (
    user?.login === mockCurrentUser.login || currentConfig.demoMode === true
  );
}
