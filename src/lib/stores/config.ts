import { writable } from "svelte/store";
import { browser } from "$app/environment";
import type { GitHubConfig } from "$lib/types";
import { settingsService } from "$lib/services/settingsService";

const defaultConfig: GitHubConfig = {
  token: "",
  owner: "",
  repo: "",
  enterpriseUrl: "",
  requiresVpn: false,
  demoMode: false,
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

export const loadConfigFromSupabase = async (): Promise<GitHubConfig> => {
  try {
    const settings = await settingsService.getSettings();
    if (settings) {
      return {
        token: settings.github_token,
        owner: settings.repo_owner,
        repo: settings.repo_name,
        enterpriseUrl: settings.enterprise_url || "",
        requiresVpn: settings.requires_vpn || false,
        demoMode: settings.demo_mode || false,
      };
    }
  } catch (error) {
    console.error("Failed to load settings from Supabase:", error);
  }

  return loadConfig();
};

export const saveConfigToSupabase = async (
  config: GitHubConfig
): Promise<void> => {
  try {
    await settingsService.saveSettings({
      github_token: config.token,
      repo_owner: config.owner,
      repo_name: config.repo,
      enterprise_url: config.enterpriseUrl,
      requires_vpn: config.requiresVpn,
      demo_mode: config.demoMode,
    });
  } catch (error) {
    console.error("Failed to save settings to Supabase:", error);
    throw error;
  }
};

if (browser) {
  // Load config from Supabase first, then localStorage as fallback
  loadConfigFromSupabase().then((supabaseConfig) => {
    if (supabaseConfig.token) {
      console.log("Loaded config from Supabase:", supabaseConfig);
      config.set(supabaseConfig);

      // Jeśli demo_mode jest włączone w Supabase, automatycznie włącz tryb demo
      if (supabaseConfig.demoMode) {
        console.log("🎭 Auto-enabling demo mode from Supabase settings");
        import("$lib/utils/demoMode").then(({ enableDemoMode }) => {
          // Opóźnij włączenie trybu demo, żeby MainSection zdążył się załadować
          setTimeout(() => {
            enableDemoMode();
          }, 100);
        });
      }
    } else {
      // Fallback to localStorage
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
    }
  });

  // Save config to localStorage when it changes (as backup)
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
