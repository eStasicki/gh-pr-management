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

// Cache dla mock danych w trybie demo
let mockPRsCache: any[] = [];
let mockPRsGenerated = false;

export async function enableDemoMode() {
  currentUser.set(mockCurrentUser);

  // Generuj mock PR-y
  if (!mockPRsGenerated) {
    mockPRsCache = generateMockPRs(50);
    mockPRsGenerated = true;
  }

  // Ustaw pierwsze 10 PR-ów jako wyświetlane
  const perPage = 10;
  const startIndex = 0;
  const endIndex = Math.min(startIndex + perPage, mockPRsCache.length);
  const pagePRs = mockPRsCache.slice(startIndex, endIndex);

  prs.set(pagePRs);
  currentPage.set(1);

  const totalPagesCount = Math.ceil(mockPRsCache.length / perPage);
  totalPages.set(totalPagesCount);
  totalPRs.set(mockPRsCache.length);
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
