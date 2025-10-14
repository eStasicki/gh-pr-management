import { supabase } from "$lib/supabaseClient";
import {
  encryptGitHubToken,
  decryptGitHubToken,
  encryptSensitiveData,
  decryptSensitiveData,
} from "$lib/utils/tokenEncryption";

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

    const decryptedProjects = await Promise.all(
      data.map(async (project) => {
        try {
          const decryptedToken = await decryptGitHubToken(
            project.github_token,
            user.id
          );
          const decryptedOwner = await decryptSensitiveData(
            project.repo_owner,
            user.id
          );
          const decryptedRepo = await decryptSensitiveData(
            project.repo_name,
            user.id
          );
          const decryptedEnterpriseUrl = project.enterprise_url
            ? await decryptSensitiveData(project.enterprise_url, user.id)
            : "";

          return {
            ...project,
            github_token: decryptedToken,
            repo_owner: decryptedOwner,
            repo_name: decryptedRepo,
            enterprise_url: decryptedEnterpriseUrl,
          };
        } catch (error) {
          return {
            ...project,
            github_token: "",
            repo_owner: "",
            repo_name: "",
            enterprise_url: "",
          };
        }
      })
    );

    return decryptedProjects;
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

    try {
      const decryptedToken = await decryptGitHubToken(
        data.github_token,
        user.id
      );
      const decryptedOwner = await decryptSensitiveData(
        data.repo_owner,
        user.id
      );
      const decryptedRepo = await decryptSensitiveData(data.repo_name, user.id);
      const decryptedEnterpriseUrl = data.enterprise_url
        ? await decryptSensitiveData(data.enterprise_url, user.id)
        : "";

      return {
        ...data,
        github_token: decryptedToken,
        repo_owner: decryptedOwner,
        repo_name: decryptedRepo,
        enterprise_url: decryptedEnterpriseUrl,
      };
    } catch (error) {
      return null;
    }
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

    try {
      const decryptedToken = await decryptGitHubToken(
        data.github_token,
        user.id
      );
      const decryptedOwner = await decryptSensitiveData(
        data.repo_owner,
        user.id
      );
      const decryptedRepo = await decryptSensitiveData(data.repo_name, user.id);
      const decryptedEnterpriseUrl = data.enterprise_url
        ? await decryptSensitiveData(data.enterprise_url, user.id)
        : "";

      return {
        ...data,
        github_token: decryptedToken,
        repo_owner: decryptedOwner,
        repo_name: decryptedRepo,
        enterprise_url: decryptedEnterpriseUrl,
      };
    } catch (error) {
      return null;
    }
  },

  async createProject(
    config: ProjectConfig,
    setAsActive: boolean = false
  ): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    try {
      const encryptedToken = await encryptGitHubToken(
        config.github_token,
        user.id
      );
      const encryptedOwner = await encryptSensitiveData(
        config.repo_owner,
        user.id
      );
      const encryptedRepo = await encryptSensitiveData(
        config.repo_name,
        user.id
      );
      const encryptedEnterpriseUrl = config.enterprise_url
        ? await encryptSensitiveData(config.enterprise_url, user.id)
        : "";

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          project_name: config.project_name,
          github_token: encryptedToken,
          repo_owner: encryptedOwner,
          repo_name: encryptedRepo,
          enterprise_url: encryptedEnterpriseUrl,
          requires_vpn: config.requires_vpn || false,
          demo_mode: config.demo_mode || false,
          is_active: setAsActive,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        github_token: config.github_token,
        repo_owner: config.repo_owner,
        repo_name: config.repo_name,
        enterprise_url: config.enterprise_url || "",
      };
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Project with this name already exists");
      }
      throw new Error("Failed to create project");
    }
  },

  async updateProject(
    projectId: string,
    updates: Partial<ProjectConfig>
  ): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    try {
      const updateData: any = {};

      if (updates.project_name !== undefined) {
        updateData.project_name = updates.project_name;
      }

      if (updates.github_token !== undefined) {
        updateData.github_token = await encryptGitHubToken(
          updates.github_token,
          user.id
        );
      }

      if (updates.repo_owner !== undefined) {
        updateData.repo_owner = await encryptSensitiveData(
          updates.repo_owner,
          user.id
        );
      }

      if (updates.repo_name !== undefined) {
        updateData.repo_name = await encryptSensitiveData(
          updates.repo_name,
          user.id
        );
      }

      if (updates.enterprise_url !== undefined) {
        updateData.enterprise_url = updates.enterprise_url
          ? await encryptSensitiveData(updates.enterprise_url, user.id)
          : "";
      }

      if (updates.requires_vpn !== undefined) {
        updateData.requires_vpn = updates.requires_vpn;
      }

      if (updates.demo_mode !== undefined) {
        updateData.demo_mode = updates.demo_mode;
      }

      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const decryptedToken = await decryptGitHubToken(
        data.github_token,
        user.id
      );
      const decryptedOwner = await decryptSensitiveData(
        data.repo_owner,
        user.id
      );
      const decryptedRepo = await decryptSensitiveData(data.repo_name, user.id);
      const decryptedEnterpriseUrl = data.enterprise_url
        ? await decryptSensitiveData(data.enterprise_url, user.id)
        : "";

      return {
        ...data,
        github_token: decryptedToken,
        repo_owner: decryptedOwner,
        repo_name: decryptedRepo,
        enterprise_url: decryptedEnterpriseUrl,
      };
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Project with this name already exists");
      }
      throw new Error("Failed to update project");
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
  },

  async setActiveProject(projectId: string): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

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

    const decryptedToken = await decryptGitHubToken(data.github_token, user.id);
    const decryptedOwner = await decryptSensitiveData(data.repo_owner, user.id);
    const decryptedRepo = await decryptSensitiveData(data.repo_name, user.id);
    const decryptedEnterpriseUrl = data.enterprise_url
      ? await decryptSensitiveData(data.enterprise_url, user.id)
      : "";

    return {
      ...data,
      github_token: decryptedToken,
      repo_owner: decryptedOwner,
      repo_name: decryptedRepo,
      enterprise_url: decryptedEnterpriseUrl,
    };
  },

  async renameProject(projectId: string, newName: string): Promise<Project> {
    return this.updateProject(projectId, { project_name: newName });
  },

  async migrateFromUserSettings(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const existingProjects = await this.getAllProjects();
    if (existingProjects.length > 0) {
      return false;
    }

    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!userSettings) {
      return false;
    }

    try {
      const decryptedToken = await decryptGitHubToken(
        userSettings.github_token,
        user.id
      );
      const decryptedOwner = await decryptSensitiveData(
        userSettings.repo_owner,
        user.id
      );
      const decryptedRepo = await decryptSensitiveData(
        userSettings.repo_name,
        user.id
      );
      const decryptedEnterpriseUrl = userSettings.enterprise_url
        ? await decryptSensitiveData(userSettings.enterprise_url, user.id)
        : "";

      const projectName = `${decryptedOwner}/${decryptedRepo}`;

      await this.createProject(
        {
          project_name: projectName,
          github_token: decryptedToken,
          repo_owner: decryptedOwner,
          repo_name: decryptedRepo,
          enterprise_url: decryptedEnterpriseUrl,
          requires_vpn: userSettings.requires_vpn || false,
          demo_mode: userSettings.demo_mode || false,
        },
        true
      );

      return true;
    } catch (error) {
      return false;
    }
  },
};
