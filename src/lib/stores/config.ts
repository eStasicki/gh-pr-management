import { writable } from "svelte/store";
import { browser } from "$app/environment";
import type { GitHubConfig } from "$lib/types";
import { projectsService, type Project } from "$lib/services/projectsService";

const defaultConfig: GitHubConfig = {
  token: "",
  owner: "",
  repo: "",
  enterpriseUrl: "",
  requiresVpn: false,
  demoMode: false,
};

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
export const currentProject = writable<Project | null>(null);
export const allProjects = writable<Project[]>([]);

export const loadConfigFromProjects = async (): Promise<GitHubConfig> => {
  try {
    await projectsService.migrateFromSupabase();
    await projectsService.migrateFromUserSettings();

    const activeProject = await projectsService.getActiveProject();
    if (activeProject) {
      currentProject.set(activeProject);
      return {
        token: activeProject.github_token,
        owner: activeProject.repo_owner,
        repo: activeProject.repo_name,
        enterpriseUrl: activeProject.enterprise_url || "",
        requiresVpn: activeProject.requires_vpn || false,
        demoMode: activeProject.demo_mode || false,
      };
    }
  } catch (error) {
    console.error("Error loading config:", error);
  }

  return loadConfig();
};

export const saveConfigToProjects = async (
  config: GitHubConfig
): Promise<void> => {
  if (!config.token || !config.owner || !config.repo) {
    throw new Error("Token, owner, and repo are required");
  }

  try {
    let activeProject = await projectsService.getActiveProject();

    if (activeProject) {
      await projectsService.updateProject(activeProject.id, {
        github_token: config.token,
        repo_owner: config.owner,
        repo_name: config.repo,
        enterprise_url: config.enterpriseUrl,
        requires_vpn: config.requiresVpn,
        demo_mode: config.demoMode,
      });

      activeProject = await projectsService.getActiveProject();
    } else {
      const projectName = `${config.owner}/${config.repo}`;
      const newProject = await projectsService.createProject(
        {
          project_name: projectName,
          github_token: config.token,
          repo_owner: config.owner,
          repo_name: config.repo,
          enterprise_url: config.enterpriseUrl,
          requires_vpn: config.requiresVpn,
          demo_mode: config.demoMode,
        },
        true
      );

      activeProject = newProject;
    }

    if (activeProject) {
      currentProject.set(activeProject);
    } else {
      throw new Error("Failed to save or create project");
    }
  } catch (error) {
    throw error;
  }
};

export const loadAllProjects = async (): Promise<void> => {
  try {
    const projects = await projectsService.getAllProjects();
    allProjects.set(projects);
  } catch (error) {
    console.error("Error loading projects:", error);
    allProjects.set([]);
  }
};

export const switchProject = async (
  projectId: string,
  reloadData: boolean = false
): Promise<void> => {
  try {
    const project = await projectsService.setActiveProject(projectId);
    currentProject.set(project);

    const newConfig: GitHubConfig = {
      token: project.github_token,
      owner: project.repo_owner,
      repo: project.repo_name,
      enterpriseUrl: project.enterprise_url || "",
      requiresVpn: project.requires_vpn || false,
      demoMode: project.demo_mode || false,
    };

    config.set(newConfig);

    if (reloadData) {
      localStorage.removeItem("selectedPRs");

      const { selectedPRs, prs, totalPRs, totalPages, currentPage } =
        await import("./prs");
      selectedPRs.set([]);
      prs.set([]);
      totalPRs.set(0);
      totalPages.set(0);
      currentPage.set(1);

      const { clearCache } = await import("$lib/utils/apiUtils");
      clearCache();
    }

    await loadAllProjects();
  } catch (error) {
    console.error("Error switching project:", error);
    throw error;
  }
};

if (browser) {
  loadConfigFromProjects().then((projectConfig) => {
    if (projectConfig.token) {
      config.set(projectConfig);

      if (projectConfig.demoMode) {
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
