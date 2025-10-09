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
      } catch (e) {}
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
  } catch (error) {}

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
    throw error;
  }
};

if (browser) {
  // Load config from Supabase first, then localStorage as fallback
  loadConfigFromSupabase().then((supabaseConfig) => {
    if (supabaseConfig.token) {
      config.set(supabaseConfig);

      if (supabaseConfig.demoMode) {
        import("$lib/utils/demoMode").then(({ enableDemoMode }) => {
          setTimeout(() => {
            enableDemoMode();
          }, 100);
        });
      }
    } else {
      const stored = localStorage.getItem("gh_config");
      if (stored) {
        try {
          const storedConfig = JSON.parse(stored);
          config.set(storedConfig);
        } catch (e) {
          config.set(defaultConfig);
        }
      } else {
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
  let isInitialLoad = true;
  config.subscribe((value) => {
    const currentRepo = `${value.owner}/${value.repo}`;

    if (isInitialLoad) {
      previousRepo = currentRepo;
      isInitialLoad = false;
      return;
    }

    if (previousRepo && previousRepo !== currentRepo && currentRepo !== "/") {
      localStorage.removeItem("selectedPRs");
      import("./prs").then(({ selectedPRs }) => {
        selectedPRs.set([]);
      });
    }
    previousRepo = currentRepo;
  });
}
