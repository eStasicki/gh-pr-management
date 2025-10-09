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

export function enableDemoMode() {
  console.log("🎭 Enabling demo mode with mock data");

  // Ustaw przykładowego użytkownika
  currentUser.set(mockCurrentUser);

  // Wyczyść dane - funkcje loadPRs i getAllUserPRs obsłużą resztę
  prs.set([]);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);
}

export function disableDemoMode() {
  console.log("🚫 Disabling demo mode");

  // Wyczyść dane
  prs.set([]);
  currentUser.set(null);
  currentPage.set(1);
  totalPages.set(0);
  totalPRs.set(0);
  isLoading.set(false);
}

export function isDemoMode(): boolean {
  const user = get(currentUser);

  // Sprawdź czy mamy przykładowego użytkownika
  return user?.login === mockCurrentUser.login;
}
