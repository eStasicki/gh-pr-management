import { supabase } from "$lib/supabaseClient";
import {
  encryptGitHubToken,
  decryptGitHubToken,
  migrateTokenIfNeeded,
  encryptSensitiveData,
  decryptSensitiveData,
} from "$lib/utils/tokenEncryption";

export interface UserSettings {
  id?: string;
  user_id: string;
  github_token: string;
  repo_owner: string;
  repo_name: string;
  enterprise_url?: string;
  requires_vpn?: boolean;
  demo_mode?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const settingsService = {
  async getSettings(): Promise<UserSettings | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error);
      throw error;
    }

    if (!data) return null;

    try {
      // Deszyfruj wszystkie wrażliwe pola
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

      // Sprawdź czy potrzebna jest migracja (czy któreś z pól nie jest zaszyfrowane)
      const needsMigration =
        !data.github_token.startsWith("encrypted:") ||
        !data.repo_owner.startsWith("encrypted:") ||
        !data.repo_name.startsWith("encrypted:") ||
        (data.enterprise_url && !data.enterprise_url.startsWith("encrypted:"));

      if (needsMigration) {
        // Zaszyfruj wszystkie pola i zaktualizuj bazę
        const encryptedToken = await encryptGitHubToken(
          decryptedToken,
          user.id
        );
        const encryptedOwner = await encryptSensitiveData(
          decryptedOwner,
          user.id
        );
        const encryptedRepo = await encryptSensitiveData(
          decryptedRepo,
          user.id
        );
        const encryptedEnterpriseUrl = decryptedEnterpriseUrl
          ? await encryptSensitiveData(decryptedEnterpriseUrl, user.id)
          : "";

        await supabase
          .from("user_settings")
          .update({
            github_token: encryptedToken,
            repo_owner: encryptedOwner,
            repo_name: encryptedRepo,
            enterprise_url: encryptedEnterpriseUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }

      return {
        ...data,
        github_token: decryptedToken,
        repo_owner: decryptedOwner,
        repo_name: decryptedRepo,
        enterprise_url: decryptedEnterpriseUrl,
      };
    } catch (error) {
      console.error("Error decrypting sensitive data:", error);
      return {
        ...data,
        github_token: "",
        repo_owner: "",
        repo_name: "",
        enterprise_url: "",
      };
    }
  },

  async saveSettings(
    settings: Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<UserSettings> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    try {
      // Zaszyfruj wszystkie wrażliwe pola
      const encryptedToken = await encryptGitHubToken(
        settings.github_token,
        user.id
      );
      const encryptedOwner = await encryptSensitiveData(
        settings.repo_owner,
        user.id
      );
      const encryptedRepo = await encryptSensitiveData(
        settings.repo_name,
        user.id
      );
      const encryptedEnterpriseUrl = settings.enterprise_url
        ? await encryptSensitiveData(settings.enterprise_url, user.id)
        : "";

      const settingsToSave = {
        ...settings,
        github_token: encryptedToken,
        repo_owner: encryptedOwner,
        repo_name: encryptedRepo,
        enterprise_url: encryptedEnterpriseUrl,
      };

      // Najpierw sprawdź czy ustawienia już istnieją (bezpośrednie zapytanie)
      const { data: existingData } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingData) {
        // Aktualizuj istniejące ustawienia
        const { data, error } = await supabase
          .from("user_settings")
          .update({
            github_token: settingsToSave.github_token,
            repo_owner: settingsToSave.repo_owner,
            repo_name: settingsToSave.repo_name,
            enterprise_url: settingsToSave.enterprise_url,
            requires_vpn: settingsToSave.requires_vpn,
            demo_mode: settingsToSave.demo_mode,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating settings:", error);
          throw error;
        }
        return {
          ...data,
          github_token: settings.github_token,
          repo_owner: settings.repo_owner,
          repo_name: settings.repo_name,
          enterprise_url: settings.enterprise_url,
        };
      } else {
        // Utwórz nowe ustawienia
        const { data, error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            github_token: settingsToSave.github_token,
            repo_owner: settingsToSave.repo_owner,
            repo_name: settingsToSave.repo_name,
            enterprise_url: settingsToSave.enterprise_url,
            requires_vpn: settingsToSave.requires_vpn,
            demo_mode: settingsToSave.demo_mode,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating settings:", error);
          throw error;
        }
        return {
          ...data,
          github_token: settings.github_token,
          repo_owner: settings.repo_owner,
          repo_name: settings.repo_name,
          enterprise_url: settings.enterprise_url,
        };
      }
    } catch (error) {
      console.error("Error encrypting token:", error);
      throw new Error("Failed to save settings due to encryption error");
    }
  },

  async deleteSettings(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("user_settings")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting settings:", error);
      throw error;
    }
  },
};
