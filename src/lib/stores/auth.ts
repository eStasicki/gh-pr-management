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
  const { token, owner, repo } = currentConfig;

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

  const currentState = get(auth);
  const timeSinceLastValidation = Date.now() - currentState.lastValidation;

  if (!force && timeSinceLastValidation < 30000) {
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
        if (currentState.isLoggedIn) {
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
      if (currentState.isLoggedIn) {
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

  setInterval(() => {
    const currentState = get(auth);
    if (currentState.isLoggedIn) {
      validateAuth();
    }
  }, 60000);

  window.addEventListener("online", () => {
    validateAuth(true);
  });

  window.addEventListener("offline", () => {
    auth.update((state) => ({
      ...state,
      isLoggedIn: false,
      connectionError: "No internet connection",
      showConnectionLostModal: true,
    }));
  });
}

if (browser) {
  config.subscribe(() => {
    validateAuth();
  });

  setupApiErrorHandling();
  startConnectionMonitoring();
}
