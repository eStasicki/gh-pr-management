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
  currentUser.set(mockCurrentUser);

  prs.set([]);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);

  const currentConfig = get(config);
  const updatedConfig = { ...currentConfig, demoMode: true };
  config.set(updatedConfig);

  try {
    await saveConfigToSupabase(updatedConfig);
  } catch (error) {}
}

export async function disableDemoMode() {
  prs.set([]);
  currentUser.set(null);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);

  resetMockCache();

  const currentConfig = get(config);
  const updatedConfig = { ...currentConfig, demoMode: false };
  config.set(updatedConfig);

  try {
    await saveConfigToSupabase(updatedConfig);
  } catch (error) {}
}

export function isDemoMode(): boolean {
  const user = get(currentUser);
  const currentConfig = get(config);

  // Sprawdź czy mamy przykładowego użytkownika LUB czy demo_mode jest włączone w konfiguracji
  return (
    user?.login === mockCurrentUser.login || currentConfig.demoMode === true
  );
}
