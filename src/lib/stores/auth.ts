import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { config } from "./config";
import { githubAPI } from "$lib/services/github-api";

let originalFetch: typeof fetch;

interface AuthState {
  isLoggedIn: boolean;
  isValidating: boolean;
  lastValidation: number;
  connectionError: string | null;
  showConnectionLostModal: boolean;
}

const defaultAuthState: AuthState = {
  isLoggedIn: false,
  isValidating: false,
  lastValidation: 0,
  connectionError: null,
  showConnectionLostModal: false,
};

export const auth = writable<AuthState>(defaultAuthState);

async function validateAuth(force = false) {
  const currentConfig = get(config);
  const { token, owner, repo, requiresVpn } = currentConfig;

  if (!token || !owner || !repo) {
    auth.set({
      isLoggedIn: false,
      isValidating: false,
      lastValidation: Date.now(),
      connectionError: null,
      showConnectionLostModal: false,
    });
    return;
  }

  // If requiresVpn is false, skip VPN connection validation
  if (!requiresVpn) {
    auth.set({
      isLoggedIn: true,
      isValidating: false,
      lastValidation: Date.now(),
      connectionError: null,
      showConnectionLostModal: false,
    });
    return;
  }

  const currentState = get(auth);
  const timeSinceLastValidation = Date.now() - currentState.lastValidation;

  // Only skip validation if not forced and validation was recent (but allow immediate validation on config change)
  if (!force && timeSinceLastValidation < 5000) {
    return;
  }

  auth.update((state) => ({
    ...state,
    isValidating: true,
    connectionError: null,
    showConnectionLostModal: false,
  }));

  try {
    const isValid = await githubAPI.validateAuth();
    auth.set({
      isLoggedIn: isValid,
      isValidating: false,
      lastValidation: Date.now(),
      connectionError: null,
      showConnectionLostModal: false,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Connection failed";
    auth.set({
      isLoggedIn: false,
      isValidating: false,
      lastValidation: Date.now(),
      connectionError: errorMessage,
      showConnectionLostModal: true,
    });
  }
}

function setupApiErrorHandling() {
  if (!browser) return;

  originalFetch = window.fetch;

  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (response.status === 401 || response.status === 403) {
        const currentState = get(auth);
        const currentConfig = get(config);

        // Check if requiresVpn is enabled before showing modal
        if (currentState.isLoggedIn && currentConfig.requiresVpn) {
          auth.update((state) => ({
            ...state,
            isLoggedIn: false,
            connectionError:
              "Authentication failed - token may be invalid or expired",
            showConnectionLostModal: true,
          }));
        }
      }

      return response;
    } catch (error) {
      const currentState = get(auth);
      const currentConfig = get(config);

      // Check if requiresVpn is enabled before showing modal
      if (currentState.isLoggedIn && currentConfig.requiresVpn) {
        auth.update((state) => ({
          ...state,
          isLoggedIn: false,
          connectionError: "Network error - check your connection",
          showConnectionLostModal: true,
        }));
      }
      throw error;
    }
  };
}

function startConnectionMonitoring() {
  if (!browser) return;

  // Only listen to online/offline events, no periodic validation
  window.addEventListener("online", () => {
    validateAuth(true);
  });

  window.addEventListener("offline", () => {
    const currentConfig = get(config);

    // Check if requiresVpn is enabled before showing modal
    if (currentConfig.requiresVpn) {
      auth.update((state) => ({
        ...state,
        isLoggedIn: false,
        connectionError: "No internet connection",
        showConnectionLostModal: true,
      }));
    }
  });
}

// Export validateAuth function for external use
export { validateAuth };

if (browser) {
  config.subscribe(() => {
    validateAuth(true); // Force validation on config change
  });

  setupApiErrorHandling();
  startConnectionMonitoring();
}
