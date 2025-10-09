import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { adminService } from "$lib/services/adminService";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  lastChecked: number;
}

const defaultAdminState: AdminState = {
  isAdmin: false,
  isLoading: false,
  lastChecked: 0,
};

export const admin = writable<AdminState>(defaultAdminState);

// Funkcja do sprawdzania statusu administratora
export async function checkAdminStatus(force = false): Promise<boolean> {
  if (!browser) return false;

  const currentState = admin;
  const timeSinceLastCheck = Date.now() - currentState.lastChecked;

  // Sprawdź ponownie tylko jeśli wymuszone lub minęło 5 minut
  if (!force && timeSinceLastCheck < 5 * 60 * 1000) {
    return currentState.isAdmin;
  }

  admin.update((state) => ({
    ...state,
    isLoading: true,
  }));

  try {
    const isAdminStatus = await adminService.isCurrentUserAdmin();

    admin.update((state) => ({
      ...state,
      isAdmin: isAdminStatus,
      isLoading: false,
      lastChecked: Date.now(),
    }));

    return isAdminStatus;
  } catch (error) {
    console.error("Error checking admin status:", error);

    admin.update((state) => ({
      ...state,
      isAdmin: false,
      isLoading: false,
      lastChecked: Date.now(),
    }));

    return false;
  }
}

// Funkcja do odświeżenia statusu administratora
export async function refreshAdminStatus(): Promise<boolean> {
  return await checkAdminStatus(true);
}

// Inicjalizacja przy starcie aplikacji
if (browser) {
  // Sprawdź status administratora po 1 sekundzie (żeby auth się załadował)
  setTimeout(() => {
    checkAdminStatus();
  }, 1000);
}
