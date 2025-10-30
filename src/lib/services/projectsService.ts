import { browser } from "$app/environment";
import { supabase } from "$lib/supabaseClient";
import { encryptToken, decryptToken } from "$lib/utils/encryption";

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  github_token: string;
  repo_owner: string;
  repo_name: string;
  enterprise_url?: string;
  requires_vpn?: boolean;
  demo_mode?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectConfig {
  project_name: string;
  github_token: string;
  repo_owner: string;
  repo_name: string;
  enterprise_url?: string;
  requires_vpn?: boolean;
  demo_mode?: boolean;
}

interface ProjectApiKeys {
  github_token: string;
  repo_owner: string;
  repo_name: string;
  enterprise_url?: string;
}

interface SupabaseProject {
  id: string;
  user_id: string;
  project_name: string;
  requires_vpn: boolean;
  demo_mode: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "gh_project_api_keys";

function loadApiKeys(projectId: string): ProjectApiKeys | null {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allKeys = JSON.parse(stored);
      if (allKeys[projectId]) {
        const encrypted = allKeys[projectId];
        return {
          github_token: decryptToken(encrypted.github_token),
          repo_owner: decryptToken(encrypted.repo_owner),
          repo_name: decryptToken(encrypted.repo_name),
          enterprise_url: encrypted.enterprise_url
            ? decryptToken(encrypted.enterprise_url)
            : undefined,
        };
      }
    }
  } catch (error) {
    console.error("Error loading API keys:", error);
  }

  return null;
}

function saveApiKeys(projectId: string, keys: ProjectApiKeys): void {
  if (!browser) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allKeys = stored ? JSON.parse(stored) : {};

    allKeys[projectId] = {
      github_token: encryptToken(keys.github_token),
      repo_owner: encryptToken(keys.repo_owner),
      repo_name: encryptToken(keys.repo_name),
      enterprise_url: keys.enterprise_url
        ? encryptToken(keys.enterprise_url)
        : undefined,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));
  } catch (error) {
    console.error("Error saving API keys:", error);
    throw new Error("Failed to save API keys");
  }
}

function deleteApiKeys(projectId: string): void {
  if (!browser) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allKeys = JSON.parse(stored);
      delete allKeys[projectId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allKeys));
    }
  } catch (error) {
    console.error("Error deleting API keys:", error);
  }
}

function mergeProjectWithApiKeys(
  supabaseProject: SupabaseProject,
  apiKeys: ProjectApiKeys | null
): Project {
  return {
    ...supabaseProject,
    github_token: apiKeys?.github_token || "",
    repo_owner: apiKeys?.repo_owner || "",
    repo_name: apiKeys?.repo_name || "",
    enterprise_url: apiKeys?.enterprise_url,
  };
}

export const projectsService = {
  async getAllProjects(): Promise<Project[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) return [];

    return data.map((project: SupabaseProject) => {
      const apiKeys = loadApiKeys(project.id);
      return mergeProjectWithApiKeys(project, apiKeys);
    });
  },

  async getActiveProject(): Promise<Project | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) return null;

    const apiKeys = loadApiKeys(data.id);
    return mergeProjectWithApiKeys(data as SupabaseProject, apiKeys);
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) return null;

    const apiKeys = loadApiKeys(data.id);
    return mergeProjectWithApiKeys(data as SupabaseProject, apiKeys);
  },

  async createProject(
    config: ProjectConfig,
    setAsActive: boolean = false
  ): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (setAsActive) {
      const { error: deactivateError } = await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (deactivateError) {
        throw deactivateError;
      }
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        project_name: config.project_name,
        requires_vpn: config.requires_vpn || false,
        demo_mode: config.demo_mode || false,
        is_active: setAsActive,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Project with this name already exists");
      }
      throw error;
    }

    const newProject = data as SupabaseProject;

    saveApiKeys(newProject.id, {
      github_token: config.github_token,
      repo_owner: config.repo_owner,
      repo_name: config.repo_name,
      enterprise_url: config.enterprise_url,
    });

    const apiKeys = loadApiKeys(newProject.id);
    return mergeProjectWithApiKeys(newProject, apiKeys);
  },

  async updateProject(
    projectId: string,
    updates: Partial<ProjectConfig>
  ): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const updateData: Partial<SupabaseProject> = {};

    if (updates.project_name !== undefined) {
      updateData.project_name = updates.project_name;
    }

    if (updates.requires_vpn !== undefined) {
      updateData.requires_vpn = updates.requires_vpn;
    }

    if (updates.demo_mode !== undefined) {
      updateData.demo_mode = updates.demo_mode;
    }

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Project with this name already exists");
        }
        throw error;
      }

      const updatedProject = data as SupabaseProject;

      const apiKeysUpdates: Partial<ProjectApiKeys> = {};
      if (updates.github_token !== undefined) {
        apiKeysUpdates.github_token = updates.github_token;
      }
      if (updates.repo_owner !== undefined) {
        apiKeysUpdates.repo_owner = updates.repo_owner;
      }
      if (updates.repo_name !== undefined) {
        apiKeysUpdates.repo_name = updates.repo_name;
      }
      if (updates.enterprise_url !== undefined) {
        apiKeysUpdates.enterprise_url = updates.enterprise_url;
      }

      if (Object.keys(apiKeysUpdates).length > 0) {
        const existingKeys = loadApiKeys(projectId) || {
          github_token: "",
          repo_owner: "",
          repo_name: "",
        };
        saveApiKeys(projectId, {
          ...existingKeys,
          ...apiKeysUpdates,
        } as ProjectApiKeys);
      }

      const apiKeys = loadApiKeys(projectId);
      return mergeProjectWithApiKeys(updatedProject, apiKeys);
    } else {
      const apiKeysUpdates: Partial<ProjectApiKeys> = {};
      if (updates.github_token !== undefined) {
        apiKeysUpdates.github_token = updates.github_token;
      }
      if (updates.repo_owner !== undefined) {
        apiKeysUpdates.repo_owner = updates.repo_owner;
      }
      if (updates.repo_name !== undefined) {
        apiKeysUpdates.repo_name = updates.repo_name;
      }
      if (updates.enterprise_url !== undefined) {
        apiKeysUpdates.enterprise_url = updates.enterprise_url;
      }

      if (Object.keys(apiKeysUpdates).length > 0) {
        const existingKeys = loadApiKeys(projectId) || {
          github_token: "",
          repo_owner: "",
          repo_name: "",
        };
        saveApiKeys(projectId, {
          ...existingKeys,
          ...apiKeysUpdates,
        } as ProjectApiKeys);
      }

      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const allProjects = await this.getAllProjects();
    if (allProjects.length <= 1) {
      throw new Error("Cannot delete the last project");
    }

    const projectToDelete = allProjects.find((p) => p.id === projectId);
    if (!projectToDelete) {
      throw new Error("Project not found");
    }

    if (projectToDelete.is_active && allProjects.length > 1) {
      const otherProject = allProjects.find((p) => p.id !== projectId);
      if (otherProject) {
        await this.setActiveProject(otherProject.id);
      }
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    deleteApiKeys(projectId);
  },

  async setActiveProject(projectId: string): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error: deactivateError } = await supabase
      .from("projects")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (deactivateError) {
      throw deactivateError;
    }

    const { data, error } = await supabase
      .from("projects")
      .update({ is_active: true })
      .eq("id", projectId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const apiKeys = loadApiKeys(projectId);
    return mergeProjectWithApiKeys(data as SupabaseProject, apiKeys);
  },

  async renameProject(projectId: string, newName: string): Promise<Project> {
    return this.updateProject(projectId, { project_name: newName });
  },

  async migrateFromUserSettings(): Promise<boolean> {
    if (!browser) return false;

    const projects = await this.getAllProjects();
    if (projects.length > 0) {
      return false;
    }

    const storedConfig = localStorage.getItem("gh_config");
    if (!storedConfig) {
      return false;
    }

    try {
      const config = JSON.parse(storedConfig);
      if (!config.token || !config.owner || !config.repo) {
        return false;
      }

      const projectName = `${config.owner}/${config.repo}`;

      await this.createProject(
        {
          project_name: projectName,
          github_token: config.token,
          repo_owner: config.owner,
          repo_name: config.repo,
          enterprise_url: config.enterpriseUrl || "",
          requires_vpn: config.requiresVpn || false,
          demo_mode: config.demoMode || false,
        },
        true
      );

      return true;
    } catch (error) {
      return false;
    }
  },

  async migrateFromSupabase(): Promise<boolean> {
    if (!browser) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { decryptGitHubToken, decryptSensitiveData } = await import(
        "$lib/utils/tokenEncryption"
      );

      const { data: supabaseProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!supabaseProjects || supabaseProjects.length === 0) {
        return false;
      }

      let migratedCount = 0;

      for (const supabaseProject of supabaseProjects) {
        try {
          if (
            !supabaseProject.github_token ||
            !supabaseProject.repo_owner ||
            !supabaseProject.repo_name
          ) {
            continue;
          }

          const existingKeys = loadApiKeys(supabaseProject.id);
          if (
            existingKeys?.github_token &&
            existingKeys?.repo_owner &&
            existingKeys?.repo_name
          ) {
            continue;
          }

          const decryptedToken = await decryptGitHubToken(
            supabaseProject.github_token,
            user.id
          );
          const decryptedOwner = await decryptSensitiveData(
            supabaseProject.repo_owner,
            user.id
          );
          const decryptedRepo = await decryptSensitiveData(
            supabaseProject.repo_name,
            user.id
          );
          const decryptedEnterpriseUrl = supabaseProject.enterprise_url
            ? await decryptSensitiveData(
                supabaseProject.enterprise_url,
                user.id
              )
            : "";

          saveApiKeys(supabaseProject.id, {
            github_token: decryptedToken,
            repo_owner: decryptedOwner,
            repo_name: decryptedRepo,
            enterprise_url: decryptedEnterpriseUrl || undefined,
          });

          migratedCount++;
        } catch (error) {
          console.error("Error migrating project API keys:", error);
        }
      }

      if (migratedCount > 0) {
        await this.clearApiKeysFromSupabase();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  },

  async clearApiKeysFromSupabase(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from("projects")
        .update({
          github_token: null,
          repo_owner: null,
          repo_name: null,
          enterprise_url: null,
        })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error clearing API keys from Supabase:", error);
    }
  },
};
