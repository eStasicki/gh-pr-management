import { writable } from "svelte/store";
import { browser } from "$app/environment";
import type { GitHubConfig } from "$lib/types";

const defaultConfig: GitHubConfig = {
  token: "",
  owner: "",
  repo: "",
  enterpriseUrl: "",
};

// Load config from environment variables or localStorage
function loadConfig(): GitHubConfig {
  if (browser) {
    // Try to load from localStorage first
    const stored = localStorage.getItem("gh_config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored config:", e);
      }
    }

    // Fallback to environment variables (only in browser)
    return {
      token: import.meta.env.VITE_GITHUB_TOKEN || "",
      owner: import.meta.env.VITE_REPO_OWNER || "",
      repo: import.meta.env.VITE_REPO_NAME || "",
      enterpriseUrl: import.meta.env.VITE_GITHUB_ENTERPRISE_URL || "",
    };
  }

  // Server-side: return empty config
  return defaultConfig;
}

export const config = writable<GitHubConfig>(defaultConfig);

if (browser) {
  // Load config from environment variables or localStorage on client side
  const envConfig = {
    token: import.meta.env.VITE_GITHUB_TOKEN || "",
    owner: import.meta.env.VITE_REPO_OWNER || "",
    repo: import.meta.env.VITE_REPO_NAME || "",
    enterpriseUrl: import.meta.env.VITE_GITHUB_ENTERPRISE_URL || "",
  };

  console.log("All env vars:", import.meta.env);
  console.log("Environment config:", envConfig);

  // Try to load from localStorage first
  const stored = localStorage.getItem("gh_config");
  if (stored) {
    try {
      const storedConfig = JSON.parse(stored);
      console.log("Loaded from localStorage:", storedConfig);
      config.set(storedConfig);
    } catch (e) {
      console.error("Failed to parse stored config:", e);
      config.set(envConfig);
    }
  } else {
    console.log("No stored config, using environment:", envConfig);
    config.set(envConfig);
  }

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
