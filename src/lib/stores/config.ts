import { writable } from "svelte/store";
import { browser } from "$app/environment";
import type { GitHubConfig } from "$lib/types";

const defaultConfig: GitHubConfig = {
  token: "",
  owner: "",
  repo: "",
  enterpriseUrl: "",
};

// Load config from localStorage only
function loadConfig(): GitHubConfig {
  if (browser) {
    const stored = localStorage.getItem("gh_config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored config:", e);
      }
    }
  }

  return defaultConfig;
}

export const config = writable<GitHubConfig>(defaultConfig);

if (browser) {
  // Load config from localStorage on client side
  const stored = localStorage.getItem("gh_config");
  if (stored) {
    try {
      const storedConfig = JSON.parse(stored);
      console.log("Loaded config from localStorage:", storedConfig);
      config.set(storedConfig);
    } catch (e) {
      console.error("Failed to parse stored config:", e);
      config.set(defaultConfig);
    }
  } else {
    console.log("No stored config found, using defaults");
    config.set(defaultConfig);
  }

  // Save config to localStorage when it changes
  config.subscribe((value) => {
    localStorage.setItem("gh_config", JSON.stringify(value));
  });

  // Clear selected PRs when repository changes
  let previousRepo = "";
  config.subscribe((value) => {
    const currentRepo = `${value.owner}/${value.repo}`;
    if (previousRepo && previousRepo !== currentRepo && currentRepo !== "/") {
      // Repository changed, clear selected PRs
      localStorage.removeItem("selectedPRs");
      console.log("Repository changed, cleared selected PRs");
    }
    previousRepo = currentRepo;
  });
}