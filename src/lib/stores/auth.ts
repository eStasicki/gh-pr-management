import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { config } from "./config";
import { githubAPI } from "$lib/services/github-api";

interface AuthState {
  isLoggedIn: boolean;
  isValidating: boolean;
}

const defaultAuthState: AuthState = {
  isLoggedIn: false,
  isValidating: false,
};

export const auth = writable<AuthState>(defaultAuthState);

async function validateAuth() {
  const currentConfig = get(config);
  const { token, owner, repo } = currentConfig;

  if (!token || !owner || !repo) {
    auth.set({ isLoggedIn: false, isValidating: false });
    return;
  }

  auth.update((state) => ({ ...state, isValidating: true }));

  try {
    const isValid = await githubAPI.validateAuth();
    auth.set({ isLoggedIn: isValid, isValidating: false });
  } catch (error) {
    auth.set({ isLoggedIn: false, isValidating: false });
  }
}

if (browser) {
  config.subscribe(() => {
    validateAuth();
  });
}
